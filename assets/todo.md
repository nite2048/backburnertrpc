# Code Report

_Generated 2026-08-08T08:10:02.373Z · 15 files scanned · 22 findings_

## Summary

| Category | Count |
|:---|:---:|
| TODO | 10 |
| FIXME | 9 |
| Commented-out code | 3 |

## TODO (10)

| File | Line | Description |
|:---|:---:|:---|
| [links/db/index.ts](links/db/index.ts#L1) | 1 | Check if exports in db package.json is requrired or even correct |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L15) | 15 | update system instructions to be more deliberate and concise and try to include stuff like these |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L46) | 46 | Explore using openrouter fusion to improve data responses |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L82) | 82 | Change errors with "model ...." to a new type model error. |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L94) | 94 | Add safe Parse everywhere and also jsonrepairs |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L105) | 105 | Look into these below later (doesn't work with multi) |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L159) | 159 | Add [countryOfOrigin] and update relevent schemas |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L108) | 108 | Re-check function implementation |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L336) | 336 | Would have been used for description matching but feature is deprecated for now |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L337) | 337 | Implement description based sorting as well as asking the AI to sort it if all else fails |

## FIXME (9)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L4) | 4 | import {schemas} from '@links/contracts'; |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L97) | 97 | check zod error types and dont return a arbitrary error here, i.e. return err(new InternalError(parsed.error.message) |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L125) | 125 | Add a new error type API error and subsequently each specific api error |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L132) | 132 | Add a new error type null error, or unspported error |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L156) | 156 | - Anilist language should default to japanese \| Korean \| Chinese / Infer language by country of origin |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L207) | 207 | Add a new error type API error and subsequently each specific api error |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L210) | 210 | Add a new error type null error, or unspported error |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L216) | 216 | Return type check and errors |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L37) | 37 | new error type |

## Commented-out code (3)

_Heuristic match — please review before trusting; not counted toward exit code._

| File | Line | Comment |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L14) | 14 | IMPORTANT: countryOfOrigin for both API is in ISO 3166-1 alpha-2 format |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L22) | 22 | const output: Metadata = { |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L338) | 338 | function longFuzzySort(input: string, queries: { content: string; score: number }[]) : {content: string; score: number}[ |

