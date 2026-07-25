import { initTRPC } from "@trpc/server";
import { toTRPCError} from "./utils/errors";
import { acquireMetadata, queryData, themoviedb } from "./ai/genai.ts";
import { findClosestMatch } from "./ai/match.ts";

import fs from "node:fs";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const AppRouter = router({
     hello: publicProcedure.query(async () => {
          const imagePath = './stuff/examples/3dfoids.jpeg';
          const base64Image = await encodeImageToBase64(imagePath);
          const result = await acquireMetadata("google/gemma-4-26b-a4b-it:free", base64Image);

          if (!result.ok) {
               console.log(result.error);
               throw toTRPCError(result.error)
          }

          console.log(result.data);

          const tmdb = await themoviedb(result.data);
          if (!tmdb.ok) {
               console.log(tmdb.error);
               throw toTRPCError(tmdb.error)
          }

          console.log(tmdb.data);

          const closestMatch = findClosestMatch(result.data.name, tmdb.data.map(item => item.title!));
          console.log(closestMatch);
          
          return closestMatch;
     }),
});


// Test only
async function encodeImageToBase64(imagePath: string): Promise<string> {
     const imageBuffer = await fs.promises.readFile(imagePath);
     const base64Image = imageBuffer.toString('base64');
     return `data:image/jpeg;base64,${base64Image}`;
}

export type AppRouter = typeof AppRouter;
