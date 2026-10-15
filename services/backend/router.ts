import * as zod from "zod";
import { signToken } from "./auth";
import { initTRPC } from "@trpc/server";

import type { AuthenticatedUser, UnauthenticatedUser, User } from '@links/contracts';
import { AuthError, ForbiddenError, NotFoundError, toTRPCError, tryCatch } from "./utils/errors";

import { appEntrySchema } from "@links/contracts";
import { createHttpEntry } from "./actions";

import {
     findEntryById, findEntriesByUserId, updateEntry, deleteEntry,
     createUser, findUserByCredentials, findUserById, updateUser, deleteUser
} from '@links/db';


const trpc = initTRPC.context<User>().create();
export const router = trpc.router;
const base = trpc.procedure.use(async ({ next }) => {
     const result = await next();
     if (!result.ok) throw toTRPCError(result.error);
     return result;
});

export const publicProcedure = base;

const protectedProcedure = base.use(({ ctx, next }) => {
       if (!ctx.isLoggedIn) throw toTRPCError(new AuthError("Unauthorized"));
       return next({ ctx: <AuthenticatedUser>ctx }); 
});

const publicOnlyProcedure = base.use(({ ctx, next }) => {
     if (ctx.isLoggedIn)
     throw toTRPCError(new ForbiddenError("Already signed in, you cannot access this route"));

     return next({ ctx: <UnauthenticatedUser>ctx }); 
});


//No need to manually update context, it updates every fetch request according to user credentials
const authRouter = router({
     auth: router({
          register: publicOnlyProcedure
               .input(
                    zod.object({
                         name: zod.string().trim().min(1).max(100),
                         key: zod.string().min(8).max(128),
                         value: zod.string().min(8).max(128)
                    }),
               )
               .mutation(async ({ input }) => {
                    const user = await createUser({
                         name: input.name,
                         key: input.key,
                         value: input.value
                    })

                    const token = await signToken(user)
                    if (!token.ok)
                         throw toTRPCError(token.error)

                    const {isLoggedIn, ...output} = user
                    return {token: token.data, output}
               }),

		login: publicOnlyProcedure
		     .input(
                    zod.object({
                         name: zod.string().trim().min(1).max(100),
                         key: zod.string().min(8).max(128),
                         value: zod.string().min(8).max(128)
                    }),
               )               
			.mutation(async ({ input }) => {
                    const found = await tryCatch(findUserByCredentials(input));
                    //NotFoundError reaches the client as NOT_FOUND, which tells an attacker whether an account exists. Convert it to AuthError, also such that real DB failures can keep their own code
                    if (!found.ok) throw toTRPCError(found.error instanceof NotFoundError ? new AuthError("Invalid credentials") : found.error);
                                   
                    //FEAT: Find a way to ensure all the other tokens of the user is discarded
                    const token = await signToken(found.data);
                    if (!token.ok) throw toTRPCError(token.error);
               
                    const { isLoggedIn, ...output } = found.data;
                    return { token: token.data, output };
			}),
     }),
});



export const userRouter = router({
     user: router({
          me: protectedProcedure.query(async ({ ctx }) => {
                    const user = await findUserById(ctx.id);
                    return user.name
               }),

          update: protectedProcedure
               .input(
                    zod.object({
                         name: zod.string().trim().min(1).max(100).optional(),
                         key: zod.string().min(8).max(128).optional(),
                         value: zod.string().min(8).max(128).optional(),
                    }).refine(p => Object.keys(p).length > 0, { message: 'Nothing to update' }),
               )
               .mutation(async ({ ctx, input }) => {
                    const user = await updateUser(ctx.id, input);
                    
                    // A new token is issued because the name claim in the old one is now stale
                    const token = await signToken(user);
                    if (!token.ok) throw toTRPCError(token.error);
               
                    const { isLoggedIn, ...output } = user;
                    return { token: token.data, output };
               }),

          delete: protectedProcedure.mutation(async ({ ctx }) => {
                    const user = await deleteUser(ctx.id);
               
                    //revokeTokens(ctx.id);
                    const { isLoggedIn, ...output } = user
                    return output              
               }),

          entries: router({
               list: protectedProcedure.query(async ({ ctx }) => await findEntriesByUserId(ctx.id)),

               get: protectedProcedure
                    .input(zod.number().positive().int())
                    .query(async ({ ctx, input }) => await findEntryById(input, ctx.id)),

               update: protectedProcedure
                    .input(appEntrySchema
                         .omit({ originalImage: true })
                         .partial().required({id: true})
                         .refine(({ id, ...patch }) => Object.values(patch).some(v => v !== undefined),
                              { message: 'Nothing to update' }
                         ))
                    .mutation(async ({ ctx, input }) => {
                         
                         const { id, ...patch } = input;
                         return await updateEntry(id, ctx.id, patch);
                    }),

               delete: protectedProcedure
                    .input(zod.number().positive().int())
                    .mutation(async ({ ctx, input }) => await deleteEntry(input, ctx.id)),
          }),
          
          actions: router({
               find: protectedProcedure
                    .input(zod.object({ image: zod.string(), model: zod.string() }))
                    .mutation(async ({ ctx, input }) => {
                         return await createHttpEntry(input.image, input.model, ctx)
                    }),
          })
     })	
});

const apiRouter = router({
	status: publicProcedure.query(async () => {
		return { status: 'ok' };
     }),
});

export const appRouter = trpc.mergeRouters(userRouter, apiRouter, authRouter);
export type AppRouter = typeof appRouter;