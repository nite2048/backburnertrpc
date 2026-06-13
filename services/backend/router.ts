import { initTRPC } from "@trpc/server";
import { toTRPCError, tryCatch } from "./utils/errors";
import { acquireMetadata } from "./ai/genai.ts";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const AppRouter = router({
     hello: publicProcedure.query(async () => {
          const result = await tryCatch(acquireMetadata("error"));

          console.log(result)
          if (!result.ok) {
               // throw toTRPCError(result.error);
               throw result.error  
          }

          return result.data;
     }),
});


export type AppRouter = typeof AppRouter;
