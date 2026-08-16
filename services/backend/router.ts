import { initTRPC } from "@trpc/server";
import { identfyImage } from "./ai/genai.ts";

const t = initTRPC.create();
export const router = t.router;
export const publicProcedure = t.procedure;

export const AppRouter = router({
     hello: publicProcedure.query(async () => {
          const imagePath = '';
          const result = await identfyImage(imagePath, "dots-studio/dots-3-note-preview:free");
          return result;
     }),
});


export type AppRouter = typeof AppRouter;
