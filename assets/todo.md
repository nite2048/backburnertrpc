# Code Report

_Generated 2026-08-30T11:35:08.634Z · 16 files scanned · 15 findings_

## Summary

| Category | Count |
|:---|:---:|
| TODO | 6 |
| FIXME | 3 |
| FEAT | 4 |
| BUG | 1 |
| HACK | 0 |
| NOTE | 0 |
| XXX | 0 |
| Commented-out code | 1 |

## TODO (6)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L85) | 85 | Add safe Parse everywhere |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L96) | 96 | Look into these below later (doesn't work with multi) |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L153) | 153 | Add [countryOfOrigin] and update relevent schemas |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L215) | 215 | Check if this error works as expected |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L241) | 241 | Re consider it's location |
| [services/backend/utils/errors.ts](services/backend/utils/errors.ts#L61) | 61 | Handle errors here? or in code? |

## FIXME (3)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L150) | 150 | Anilist language should default to japanese \| Korean \| Chinese / Infer language by country of origin |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L239) | 239 | Immediate return type reconcilation required |
| [services/backend/utils/errors.ts](services/backend/utils/errors.ts#L97) | 97 | Temporary |

## FEAT (4)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L39) | 39 | Explore using openrouter fusion to improve data responses |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L86) | 86 | Check the package jsonrepair |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L120) | 120 | Implement performance testing for this |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L349) | 349 | Implement description based sorting as well as asking the AI to sort it if all else fails |

## BUG (1)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L110) | 110 | Acutally check what it does |

## Commented-out code (1)

_Heuristic match — please review before trusting; not counted toward exit code._

| File | Line | Comment |
|:---|:---:|:---|
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L350) | 350 | function longFuzzySort(input: string, queries: { content: string; score: number }[]) : {content: string; score: number}[ |

