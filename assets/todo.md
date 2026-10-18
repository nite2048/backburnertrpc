# Code Report

_Generated 2026-10-18T12:14:59.152Z · 18 files scanned · 34 findings_

## Summary

| Category | Count |
|:---|:---:|
| TODO | 7 |
| FIXME | 2 |
| FEAT | 8 |
| BUG | 1 |
| HACK | 0 |
| NOTE | 0 |
| XXX | 0 |
| Commented-out code | 16 |

## TODO (7)

| File | Line | Description |
|:---|:---:|:---|
| [links/db/index.ts](links/db/index.ts#L15) | 15 | Check if it actually works and is the correct implementation - run db.$client.query("PRAGMA foreign_keys").get() once. It should return { foreign_keys: 1 } |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L79) | 79 | Add safe Parse everywhere |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L90) | 90 | Look into these below later (doesn't work with multi) |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L147) | 147 | Add [countryOfOrigin] and update relevent schemas |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L209) | 209 | Check if this error works as expected |
| [services/backend/auth.ts](services/backend/auth.ts#L41) | 41 | After this function figure out a storage function |
| [services/backend/auth.ts](services/backend/auth.ts#L135) | 135 | Handle other errors |

## FIXME (2)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L144) | 144 | Anilist language should default to japanese \| Korean \| Chinese / Infer language by country of origin |
| [services/backend/auth.ts](services/backend/auth.ts#L144) | 144 | Remove this later |

## FEAT (8)

| File | Line | Description |
|:---|:---:|:---|
| [links/db/index.ts](links/db/index.ts#L213) | 213 | Implement runtime type checker (if necessary) |
| [links/db/schema.ts](links/db/schema.ts#L16) | 16 | Hashing and encryption for the fields key and value |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L33) | 33 | Explore using openrouter fusion to improve data responses |
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L80) | 80 | Check the package jsonrepair |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L121) | 121 | Implement performance testing for this |
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L357) | 357 | Implement description based sorting as well as asking the AI to sort it if all else fails |
| [services/backend/router.ts](services/backend/router.ts#L83) | 83 | Find a way to ensure all the other tokens of the user is discarded |
| [services/backend/utils/errors.ts](services/backend/utils/errors.ts#L73) | 73 | Exhaustive errors |

## BUG (1)

| File | Line | Description |
|:---|:---:|:---|
| [services/backend/ai/genai.ts](services/backend/ai/genai.ts#L104) | 104 | Acutally check what it does |

## Commented-out code (16)

_Heuristic match — please review before trusting; not counted toward exit code._

| File | Line | Comment |
|:---|:---:|:---|
| [services/backend/ai/match.ts](services/backend/ai/match.ts#L358) | 358 | function longFuzzySort(input: string, queries: { content: string; score: number }[]) : {content: string; score: number}[ |
| [services/backend/auth.ts](services/backend/auth.ts#L30) | 30 | g, '_').replace(/=+$/, ''); |
| [services/backend/router.ts](services/backend/router.ts#L124) | 124 | revokeTokens(ctx.id); |
| [services/backend/router.ts](services/backend/router.ts#L170) | 170 | export const imageRouter = router({ |
| [services/backend/router.ts](services/backend/router.ts#L172) | 172 | upload: protectedProcedure |
| [services/backend/router.ts](services/backend/router.ts#L175) | 175 | (input) => { |
| [services/backend/router.ts](services/backend/router.ts#L176) | 176 | if (!(input instanceof FormData)) return input; |
| [services/backend/router.ts](services/backend/router.ts#L178) | 178 | return { |
| [services/backend/router.ts](services/backend/router.ts#L179) | 179 | id: input.get("id"), |
| [services/backend/router.ts](services/backend/router.ts#L180) | 180 | file: input.get("file"), |
| [services/backend/router.ts](services/backend/router.ts#L183) | 183 | zod.object({ |
| [services/backend/router.ts](services/backend/router.ts#L184) | 184 | id: zod.coerce.number().int().positive(), |
| [services/backend/router.ts](services/backend/router.ts#L185) | 185 | file: zod.instanceof(File), |
| [services/backend/router.ts](services/backend/router.ts#L190) | 190 | .mutation(({ input, ctx }) => { |
| [services/backend/router.ts](services/backend/router.ts#L191) | 191 | if(!input.id \|\| !input.file) throw toTRPCError({ code: "BAD_REQUEST", message: "entryId and file are required" }) |
| [services/backend/router.ts](services/backend/router.ts#L192) | 192 | return storeImage(ctx.id, input.id, input.file); |

