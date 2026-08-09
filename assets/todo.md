# Code Report

_Generated 2026-08-09T12:43:28.383Z · 15 files scanned · 12 findings_

## Summary

| Category | Count |
|:---|:---:|
| TODO | 5 |
| FIXME | 1 |
| FEAT | 4 |
| BUG | 0 |
| HACK | 0 |
| NOTE | 0 |
| XXX | 0 |
| Commented-out code | 2 |

## TODO (5)

| File | Line | Description |
|:---|:---:|:---|
| [links/db/index.ts](links/db/index.ts#L1) | 1 | Check if exports in db package.json is requrired or even correct |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L91) | 91 | Add safe Parse everywhere |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L102) | 102 | Look into these below later (doesn't work with multi) |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L155) | 155 | Add [countryOfOrigin] and update relevent schemas |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L212) | 212 | Recheck return types |

## FIXME (1)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L152) | 152 | Anilist language should default to japanese \| Korean \| Chinese / Infer language by country of origin |

## FEAT (4)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L44) | 44 | Explore using openrouter fusion to improve data responses |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L92) | 92 | Check the package jsonrepair |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L108) | 108 | Implement performance testing for this |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L337) | 337 | Implement description based sorting as well as asking the AI to sort it if all else fails |

## Commented-out code (2)

_Heuristic match — please review before trusting; not counted toward exit code._

| File | Line | Comment |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L20) | 20 | const output: Metadata = { |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L338) | 338 | function longFuzzySort(input: string, queries: { content: string; score: number }[]) : {content: string; score: number}[ |

