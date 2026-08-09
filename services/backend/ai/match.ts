import { err, InternalError, NotFoundError } from "../utils/errors.ts";

export const CONFIDENCE_THRESHOLD = 85;
export const THRESHOLD_DECREASE_AMOUNT = 15;
export const AMBIGUITY_THRESHOLD = 8;

const WEIGHT_JARO_WINKLER = 0.3;
const WEIGHT_DICE = 0.15;
const WEIGHT_LEVENSHTEIN = 0.15;
const WEIGHT_WORD_OVERLAP = 0.15;
const WEIGHT_ORDERED_OVERLAP = 0.10;
const WEIGHT_LCS = 0.1;

export const PREFIX_BONUS = 5;
export const METADATA_BONUS = 2;

export function fuzzySort(input: string, queries: string[]) : {content: string; score: number}[] {
    input = normalizeString(input);
    const inputTokens = tokenize(input);
    const inputBigrams = bigrams(input);
    const inputTokensSet = new Set(inputTokens);

    const operateableQueries = queries.map((q) => {
        const normalized = normalizeString(q);
        return {
            content: normalized,
            tokens: tokenize(normalized),
            tokensSet: new Set(tokenize(normalized)),
            bigrams: bigrams(normalized),
            score: 0,
        };
    });

    for (const q of operateableQueries) {
        const maxLength = Math.max(input.length, q.content.length);
        if (maxLength === 0) {
            err(new NotFoundError("Input and query are both empty strings, unrecoverable error")); 
            continue;
        }

        const levenshteinScore = Math.round((1 - levenshteinDistance(input, q.content) / maxLength) * 100);

        const jaroWinklerScore = Math.round(jaroWinklerSimilarity(input, q.content) * 100);
        const diceCoefficientScore = Math.round(diceCoefficient(inputBigrams, q.bigrams) * 100);
        const overlapScore = Math.round(tokenOverlap(inputTokensSet, q.tokensSet) * 100);
        const longestCommonSubsequenceScore = Math.round(
            (longestCommonSubsequenceLength(input, q.content) / Math.max(input.length, q.content.length)) * 100,
        );

        const orderedOverlapScore = inputTokens.length === 0 ? 0 : Math.round((orderedTokenMatchCount(inputTokens, q.tokens) / inputTokens.length) * 100);

        //Explore whether results are improved when more weight is given to token based macthing algorithms
        //Check whether Math.min(100, ...) is required
        q.score = Math.round(
                levenshteinScore * WEIGHT_LEVENSHTEIN +
                jaroWinklerScore * WEIGHT_JARO_WINKLER +
                diceCoefficientScore * WEIGHT_DICE +
                overlapScore * WEIGHT_WORD_OVERLAP +
                longestCommonSubsequenceScore * WEIGHT_LCS +
                orderedOverlapScore * WEIGHT_ORDERED_OVERLAP
         );
    }

    // Sorting moved to findClosestMatch, which needs the pre-sort (original, index-aligned) order to correlate candidates back to `metadata`.
    return operateableQueries.map(({ content, score }) => ({
        content,
        score,
    }));
}

export function externalMetadataMatcher(metadata: { input: string[]; query: string[] }[]): number {
     let bonus = 0;
     for (const { input, query } of metadata) {
          const normalizedInput = new Set(input.map(normalizeString));
          for (const q of query) {
               //See if scoring according to levenstienDistance yeilds better results
               if (normalizedInput.has(normalizeString(q))) {
                    bonus += METADATA_BONUS;
                    break;
               }
          }
     }
     return bonus;
}

export function internalMetadataMatcher(input: string, query: { content: string; score: number }): { content: string; score: number } {
    const normalizedInput = normalizeString(input);
    const normalizedQuery = normalizeString(query.content);

    let bonus = 0;

    if (normalizedQuery.startsWith(normalizedInput) && normalizedInput.length > 2) {
        bonus += PREFIX_BONUS;
    }

    const inputYear = extractYear(input);
    const queryYear = extractYear(query.content);
    if (inputYear && queryYear && inputYear === queryYear) {
        bonus += METADATA_BONUS;
    }

    return {
        content: query.content,
        score: query.score + bonus,
    };
}

//FEAT: Implement performance testing for this
export function findClosestMatch(input: string, queries: string[], metadata: { input: string[]; query: string[] }[] = []): string {
    if (queries.length === 0) {
        err(new InternalError("No queries provided for closest match"));
        return "";
    }

    if (metadata.length > 0 && metadata.length !== queries.length) {
        err(new InternalError("Metadata length does not match queries length"));
    }

     let TEMP_CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD;

     // fuzzySort returns results in the same order as `queries`, so array position doubles as the index into `metadata` before sorting.
     // Sorting happens here, not in fuzzySort, so this is the only place that needs to reconcile "sorted rank" with "original index".
     const fuzzySortedQueries = fuzzySort(input, queries)
        .map((q, index) => ({ ...q, index }))
        .sort((a, b) => b.score - a.score);

    const bestQuery = fuzzySortedQueries[0]!;

    while (TEMP_CONFIDENCE_THRESHOLD > 0) {
        if (bestQuery.score > TEMP_CONFIDENCE_THRESHOLD) {
            // Array is sorted descending, so ambiguous candidates are a contiguous prefix. Stop at the first non-ambiguous score instead of scanning the whole list.
            let ambiguousCount = 0;
            for (const query of fuzzySortedQueries) {
                if (!isWithinPercentage(query.score, bestQuery.score, AMBIGUITY_THRESHOLD)) {
                    break;
                }
                ambiguousCount++;
            }

            if (ambiguousCount === 1) {
                return bestQuery.content;
            }

            // Single pass over the ambiguous prefix handles both scoring and max-tracking (previously bestQuery was scored separately from the loop over the rest).
            let winner: { content: string; score: number } | null = null;
            for (let i = 0; i < ambiguousCount; i++) {
                const candidate = fuzzySortedQueries[i]!;
                const enhanced = internalMetadataMatcher(input, candidate);
                const candidateMetadata = metadata[candidate.index];
                enhanced.score += externalMetadataMatcher(candidateMetadata ? [candidateMetadata] : []);

                if (!winner || enhanced.score > winner.score) {
                    winner = enhanced;
                }
            }
            return winner!.content;
        }

        TEMP_CONFIDENCE_THRESHOLD -= THRESHOLD_DECREASE_AMOUNT;
    }

    return bestQuery.content;
}

function extractYear(text: string): number | undefined {
    const match = text.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0], 10) : undefined;
}

function isWithinPercentage(a: number, b: number, percentage: number) : boolean {
     if (a === 0 && b === 0) return true;
     const reference = Math.max(Math.abs(a), Math.abs(b));
     return Math.abs(a - b) / reference <= percentage / 100;
}

// Lowercase, strip accents, unify quotes/&, drop punctuation, collapse whitespace
export function normalizeString(title: string): string {
    let normalized = title.toLowerCase();
    normalized = normalized.normalize("NFKD");
    normalized = normalized.replace(/[\u0300-\u036f]/g, "");
    normalized = normalized.replace(/[''`]/g, "'");
    normalized = normalized.replace(/'/g, ""); // drop apostrophes: "bar's" -> "bars", not "bar s"
    normalized = normalized.replace(/&/g, " and ");
    normalized = normalized.replace(/[^\w\s]/g, " ");
    normalized = normalized.replace(/\s+/g, " ").trim();
    return normalized;
}

// Split into words
export function tokenize(normalized: string): string[] {
    return normalized.split(" ").filter(Boolean);
}

// Character bigrams of a string
export function bigrams(str: string, stripSpaces = true): string[] {
    if (stripSpaces) {
        str = str.replace(/\s+/g, "");
    }

    const result: string[] = [];
    for (let i = 0; i < str.length - 1; i++) {
        result.push(str.slice(i, i + 2));
    }

    return result;
}

// Single-row DP Levenshtein edit distance. O(min(m,n)) space
export function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    if (a.length > b.length) [a, b] = [b, a];

    const previousRow: number[] = new Array(a.length + 1);
    for (let i = 0; i <= a.length; i++) previousRow[i] = i;

    for (let j = 1; j <= b.length; j++) {
        const currentRow: number[] = new Array(a.length + 1);
        currentRow[0] = j;
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            currentRow[i] = Math.min(
                previousRow[i]! + 1,
                currentRow[i - 1]! + 1,
                previousRow[i - 1]! + cost,
            );
        }
        previousRow.splice(0, previousRow.length, ...currentRow);
    }
    return previousRow[a.length]!;
}

// Jaro-Winkler similarity, 0-1
export function jaroWinklerSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    const lenA = a.length;
    const lenB = b.length;
    if (lenA === 0 || lenB === 0) return 0;

    const matchDistance = Math.floor(Math.max(lenA, lenB) / 2) - 1;
    const aMatches = new Array(lenA).fill(false);
    const bMatches = new Array(lenB).fill(false);
    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < lenA; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, lenB);
        for (let j = start; j < end; j++) {
            if (bMatches[j] || a[i] !== b[j]) continue;
            aMatches[i] = true;
            bMatches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < lenA; i++) {
        if (!aMatches[i]) continue;
        while (!bMatches[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
    }

    transpositions /= 2;
    const jaro = (matches / lenA + matches / lenB + (matches - transpositions) / matches) / 3;

    let prefix = 0;
    const minLen = Math.min(lenA, lenB, 4);
    for (let i = 0; i < minLen; i++) {
        if (a[i] === b[i]) prefix++;
        else break;
    }

    return jaro + 0.1 * prefix * (1 - jaro);
}

// Sorensen-Dice overlap between two bigram lists, 0-1
export function diceCoefficient(bigramsA: string[], bigramsB: string[]): number {
    if (bigramsA.length === 0 && bigramsB.length === 0) return 1;
    const setA = new Set(bigramsA);
    let intersection = 0;
    for (const bg of bigramsB) {
        if (setA.has(bg)) intersection++;
    }
    return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

// Jaccard-style overlap between two token sets: intersection / max(size), 0-1
export function tokenOverlap(tokensA: Set<string>, tokensB: Set<string>): number {
    if (tokensA.size === 0 && tokensB.size === 0) return 1;
    let intersection = 0;
    for (const t of tokensA) {
        if (tokensB.has(t)) intersection++;
    }
    const maxTokens = Math.max(tokensA.size, tokensB.size);
    return maxTokens === 0 ? 0 : intersection / maxTokens;
}

// How many tokens of `a` appear in `b`, in order (not necessarily contiguous)
export function orderedTokenMatchCount(a: string[], b: string[]): number {
    let matched = 0;
    let bIndex = 0;
    for (const token of a) {
        while (bIndex < b.length && b[bIndex] !== token) bIndex++;
        if (bIndex < b.length) {
            matched++;
            bIndex++;
        }
    }
    return matched;
}

// Longest common subsequence length between two strings
export function longestCommonSubsequenceLength(a: string, b: string): number {
    if (a.length === 0 || b.length === 0) return 0;
    const dp: number[] = new Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
        let prev = 0;
        for (let j = 1; j <= b.length; j++) {
            const temp = dp[j]!;
            if (a[i - 1] === b[j - 1]) {
                dp[j] = prev + 1;
            } else {
                dp[j] = Math.max(dp[j]!, dp[j - 1]!);
            }
            prev = temp;
        }
    }
    return dp[b.length]!;
}

//Would have been used for description matching but feature is deprecated for now
//FEAT: Implement description based sorting as well as asking the AI to sort it if all else fails
/*function longFuzzySort(input: string, queries: { content: string; score: number }[]) : {content: string; score: number}[] {
      // Altered fuzzy sort with different weights for description which can vary quite a lot between outputs
      // Weird character sequences like names should have a lotta weight also any matched words should also have a lot of weight
}*/