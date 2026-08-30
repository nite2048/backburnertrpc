import { initTRPC, TRPCError } from "@trpc/server";
import { identifyImage } from "./ai/genai.ts";

import * as zod from "zod";
import { ContentType } from '@links/contracts';

import {
	createEntry,
	findEntriesByUserId,
	findEntryById,
	updateEntry,
	deleteEntry,
	createUser,
	findUserById,
} from '@links/db';

const trpc = initTRPC.context<Context>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

//Placeholder auth implementation
type Context = { user: { id: string } | null };

export const protectedProcedure = trpc.procedure.use(({ ctx, next }) => {
	if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
	return next({ ctx: { user: ctx.user } });
});

export const userRouter = router({
	entries: router({
		create: protectedProcedure
			.input(
				zod.object({
					name: zod.string(),
					contentType: zod.nativeEnum(ContentType),
					originalImage: zod.string().nullish(),
					metaData: zod.record(zod.string(), zod.unknown()),
					aiMetadata: zod.record(zod.string(), zod.unknown()),
				}),
			)
			.mutation(({ ctx, input }) => createEntry({ userId: ctx.user.id, ...input })),

		getAll: protectedProcedure.query(({ ctx }) => findEntriesByUserId(ctx.user.id)),

		getById: protectedProcedure
			.input(zod.object({ id: zod.number() }))
			.query(({ ctx, input }) => findEntryById(input.id, ctx.user.id)),

		update: protectedProcedure
			.input(zod.object({ id: zod.number(), name: zod.string().optional() }))
			.mutation(({ ctx, input }) => {
				const { id, ...patch } = input;
				return updateEntry(id, ctx.user.id, patch);
			}),

		delete: protectedProcedure
			.input(zod.object({ id: zod.number() }))
			.mutation(({ ctx, input }) => deleteEntry(input.id, ctx.user.id)),
	}),

	users: router({
		me: protectedProcedure.query(({ ctx }) => findUserById(ctx.user.id)),

		create: protectedProcedure
			.input(zod.object({ id: zod.string(), name: zod.string().nullish() }))
			.mutation(({ input }) => createUser(input)),
	}),
});

const apiRouter = router({
	status: publicProcedure.query(async () => {
		return { status: 'ok' };
     }),
	
     api: publicProcedure.query(async () => {
		return await identifyImage('IMAGE_PATH', "dots-studio/dots-3-note-preview:free");;
	}),
});

export const appRouter = trpc.mergeRouters(userRouter, apiRouter);
export type AppRouter = typeof appRouter;