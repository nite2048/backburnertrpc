// @ts-nocheck
// ^ This is a standalone dev-tool script executed directly via `bun run`
// (bun strips types at runtime, it never type-checks). It's parked at the
// project root purely for convenience, which means a project-wide `tsc`
// pass can pick it up and hold it to the app's strict compiler settings it
// was never written against. @ts-nocheck keeps it out of that entirely.
// (Cleaner long-term: add this file's path to your tsconfig "exclude".)

/**
 * code-report.ts
 *
 * Self-contained replacement for leasot: scans your source files for
 * TODO/FIXME (and any custom tags you pass) AND for comments that look
 * like commented-out code, then prints one nicely formatted markdown
 * report covering both.
 *
 * With no arguments, it uses sensible defaults for this project: root-level
 * files plus the links/ and services/ workspaces, ignoring node_modules,
 * dist, build, and .git everywhere (including nested workspace
 * node_modules).
 *
 * Usage:
 *   bun run code-report.ts                          # use all defaults
 *   bun run code-report.ts --exit-nicely > TODO.md
 *
 *   # Or override the defaults explicitly:
 *   bun run code-report.ts "{links,services}/**\/*.{ts,tsx,js,jsx,svelte}" \
 *     --ignore "**\/node_modules/**" \
 *     --tags note,hack,review \
 *     --exit-nicely
 *
 * Flags:
 *   --ignore <glob>       exclude matching paths (repeatable, ADDED to the
 *                         built-in defaults, not a replacement for them)
 *   --tags <a,b,c>        extra tags to look for besides TODO/FIXME
 *   --exit-nicely         always exit 0, even if TODO/FIXME items exist
 *                         (the commented-out-code section never affects
 *                         the exit code — it's advisory only)
 */

import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { relative } from "node:path";

interface TagFinding {
  tag: string;
  file: string;
  line: number;
  text: string;
}

interface CodeFinding {
  file: string;
  line: number;
  text: string;
}

// ---------- defaults ----------

const DEFAULT_INCLUDE = [
  "*.{ts,tsx,js,jsx,svelte}", // root-level files (index.ts, etc.)
  "{links,services}/**/*.{ts,tsx,js,jsx,svelte}", // workspace packages
];

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
];

// ---------- path normalization ----------
// Bun's Glob can hand back OS-native separators on Windows, but our ignore
// patterns are always written with forward slashes. If the two sides never
// get normalized to the same form, --ignore silently matches nothing while
// the initial scan still succeeds — which is exactly the bug we chased
// down in leasot. Normalizing every path to posix-style up front removes
// that failure mode entirely, on any OS.
function toPosix(p: string): string {
  return p.split("\\").join("/");
}

// ---------- CLI args ----------

function parseArgs(argv: string[]) {
  const patterns: string[] = [];
  const ignore: string[] = [...DEFAULT_IGNORE];
  const tags = new Set(["TODO", "FIXME"]);
  let exitNicely = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--ignore") {
      ignore.push(toPosix(argv[++i]));
    } else if (arg === "--tags") {
      for (const t of argv[++i].split(",")) {
        if (t.trim()) tags.add(t.trim().toUpperCase());
      }
    } else if (arg === "--exit-nicely") {
      exitNicely = true;
    } else {
      patterns.push(arg);
    }
  }

  return {
    patterns: patterns.length > 0 ? patterns : DEFAULT_INCLUDE,
    ignore,
    tags: [...tags],
    exitNicely,
  };
}

// ---------- comment extraction ----------

function extractComments(source: string): { line: number; text: string }[] {
  const results: { line: number; text: string }[] = [];
  const lineCommentRe = /\/\/(.*)$/gm;
  const blockCommentRe = /\/\*([\s\S]*?)\*\//gm;

  const lineOf = (index: number) => source.slice(0, index).split("\n").length;

  let m: RegExpExecArray | null;
  while ((m = lineCommentRe.exec(source))) {
    const text = m[1].trim();
    if (text) results.push({ line: lineOf(m.index), text });
  }
  while ((m = blockCommentRe.exec(source))) {
    const text = m[1].trim();
    if (text) results.push({ line: lineOf(m.index), text });
  }
  return results.sort((a, b) => a.line - b.line);
}

// ---------- tag matching (TODO/FIXME/custom) ----------

function buildTagRegex(tags: string[]): RegExp {
  const alt = tags.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`^@?(${alt})\\b\\s*(?:\\([^)]*\\))?\\s*:?\\s*(.*)$`, "i");
}

// ---------- commented-out-code heuristic ----------

// URLs and JSDoc annotations are common noise sources — filter these out
// before scoring at all, since they're neither code nor "commented out".
const LINK_SIGNALS: RegExp[] = [
  /https?:\/\//i, // any URL scheme, anywhere in the line (not just at the start)
  /^www\./i, // bare www. prefix
  /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|\?|$)/i, // bare domain + path at line start, e.g. api.themoviedb.org/3/search
  /\b[a-z0-9-]+\.[a-z0-9-]+\.[a-z]{2,6}\b(?!\()/i, // subdomain.domain.tld anywhere, but not a method chain like a.b.trim()
  /\b(localhost|(?:\d{1,3}\.){3}\d{1,3}|[a-z0-9-]+\.[a-z]{2,6}):\d{2,5}\b/i, // host:port, e.g. localhost:3000
];

const JSDOC_SIGNAL =
  /^\*?\s*@(type|param|returns?|see|example|deprecated|throws?|template|typedef|property|prop|method|class|interface|namespace|module|constructor|extends|implements|override|readonly|access|since|version|author|license|augments|memberof|instance|static|summary|description|link)\b/i;

const CODE_SIGNALS: RegExp[] = [
  /[;{}]\s*$/, // ends with code punctuation
  /^(import|export|const|let|var|function|class|if\s*\(|for\s*\(|while\s*\(|switch\s*\(|return\b|await\b|async\b)/,
  /=>/,
  // Anchored to the WHOLE line — a function-call shape only counts if the
  // entire line is just that call, so it stops matching a parenthetical
  // aside buried inside a prose sentence.
  /^\s*[\w$.[\]]*\w\s*\([^)]*\)\s*[;{]?\s*$/,
  // key: value / assignment, but not a URL scheme like "https://..."
  /^[\w$.[\]]+\s*[:=]\s*(?!\/\/).+[,;]?$/,
  /<\/?[A-Za-z][\w-]*(\s|>|\/)/, // JSX / HTML tag
  /^\s*(\.\w+\(|\)\.\w+)/, // chained method call
];

const PROSE_SIGNALS: RegExp[] = [
  /^[A-Z][a-z].*[.!?]$/,
  /\b(should|would|could|we|note|because|however|although|please|explain|purpose|reason|this is|in order to)\b/i,
];

function looksLikeCode(text: string): boolean {
  if (text.length < 8) return false;
  const firstLine = text.split("\n")[0];
  if (LINK_SIGNALS.some((r) => r.test(firstLine))) return false;
  if (JSDOC_SIGNAL.test(firstLine)) return false;
  const codeScore = CODE_SIGNALS.filter((r) => r.test(firstLine)).length;
  const proseScore = PROSE_SIGNALS.filter((r) => r.test(firstLine)).length;
  return codeScore >= 1 && codeScore > proseScore;
}

// ---------- markdown helpers ----------

// Strips ANY newline-like character (\n, \r, and the less common Unicode
// line/paragraph separators U+2028/U+2029), not just \n. Applied at
// capture-time, before text ever gets stored in a finding, as the first
// line of defense against a stray character breaking a table row.
function sanitizeSingleLine(text: string): string {
  return text.replace(/[\r\n\u2028\u2029]+/g, " ").trim();
}

function escapeCell(text: string): string {
  // Second line of defense at render-time, in case anything upstream ever
  // changes and stops pre-sanitizing.
  return text.replace(/\|/g, "\\|").replace(/[\r\n\u2028\u2029]+/g, " ");
}

function table(rows: { file: string; line: number; text: string }[], desc: string): string {
  if (rows.length === 0) return "_None found._\n";
  const lines = [
    `| File | Line | ${desc} |`,
    "|:---|:---:|:---|",
    ...rows.map(
      (r) => `| [${r.file}](${r.file}#L${r.line}) | ${r.line} | ${escapeCell(r.text)} |`
    ),
  ];
  return lines.join("\n") + "\n";
}

// ---------- main ----------

async function main() {
  const { patterns, ignore, tags, exitNicely } = parseArgs(process.argv.slice(2));

  const tagRegex = buildTagRegex(tags);

  const files = new Set<string>();
  for (const pattern of patterns) {
    const glob = new Glob(pattern);
    for await (const file of glob.scan({ cwd: process.cwd(), dot: false })) {
      files.add(toPosix(file));
    }
  }

  // Exclude this script's own file from the scan. It lives at the project
  // root and matches the default root-file include pattern, so without
  // this it ends up scanning its own comments (e.g. this exact comment
  // about URL detection was, ironically, getting flagged as a URL).
  // Resolved dynamically via Bun's entrypoint path rather than a hardcoded
  // filename, so it keeps working no matter what you rename this file to.
  const selfFile = toPosix(relative(process.cwd(), Bun.main));

  const ignoreGlobs = ignore.map((p) => new Glob(p));
  const scannedFiles = [...files]
    .filter((f) => !ignoreGlobs.some((g) => g.match(f)))
    .filter((f) => f !== selfFile)
    .sort();

  const byTag = new Map<string, TagFinding[]>();
  for (const t of tags) byTag.set(t.toUpperCase(), []);
  const codeFindings: CodeFinding[] = [];

  for (const file of scannedFiles) {
    let content: string;
    try {
      content = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    } catch {
      continue;
    }

    for (const { line, text } of extractComments(content)) {
      const tagMatch = tagRegex.exec(text.split("\n")[0]);
      if (tagMatch) {
        const tagName = tagMatch[1].toUpperCase();
        const rest = sanitizeSingleLine(tagMatch[2] || "");
        byTag.get(tagName)!.push({ tag: tagName, file, line, text: rest || "(no description)" });
        continue;
      }
      if (looksLikeCode(text)) {
        codeFindings.push({
          file,
          line,
          text: sanitizeSingleLine(text.split("\n")[0].slice(0, 120)),
        });
      }
    }
  }

  const totalTagged = [...byTag.values()].reduce((sum, arr) => sum + arr.length, 0);
  const totalFindings = totalTagged + codeFindings.length;

  // ---------- render ----------

  const out: string[] = [];
  out.push("# Code Report\n");
  out.push(`_Generated ${new Date().toISOString()} · ${scannedFiles.length} files scanned · ${totalFindings} findings_\n`);

  out.push("## Summary\n");
  out.push("| Category | Count |");
  out.push("|:---|:---:|");
  for (const t of tags) {
    out.push(`| ${t} | ${byTag.get(t.toUpperCase())!.length} |`);
  }
  out.push(`| Commented-out code | ${codeFindings.length} |`);
  out.push("");

  for (const t of tags) {
    const findings = byTag.get(t.toUpperCase())!;
    out.push(`## ${t} (${findings.length})\n`);
    out.push(table(findings, "Description"));
  }

  out.push(`## Commented-out code (${codeFindings.length})\n`);
  out.push("_Heuristic match — please review before trusting; not counted toward exit code._\n");
  out.push(table(codeFindings, "Comment"));

  console.log(out.join("\n"));

  if (!exitNicely && totalTagged > 0) {
    process.exit(1);
  }
}

main();