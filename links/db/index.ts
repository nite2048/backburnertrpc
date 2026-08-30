import { drizzle } from 'drizzle-orm/bun-sqlite';
import { and, eq } from 'drizzle-orm';

import { appEntryTable, userTable, relations } from './schema';

//IMPORTANT: only works if current working directory while running is set to root
export const db = drizzle({ connection: { source: "db.sqlite" }, relations });

type EntryInsert = typeof appEntryTable.$inferInsert;
type UserInsert = typeof userTable.$inferInsert;
type EntryUpdate = Partial<Pick<EntryInsert, 'name' | 'contentType' | 'originalImage' | 'metaData' | 'aiMetadata'>>;
type UserUpdate = Partial<Pick<UserInsert, 'name'>>;

export async function createEntry(input: EntryInsert) {
	const [entry] = await db
		.insert(appEntryTable)
		.values({
			userId: input.userId,
			name: input.name,
			contentType: input.contentType,
			originalImage: input.originalImage ?? null,
			metaData: input.metaData,
			aiMetadata: input.aiMetadata,
		})
		.returning();

	return entry;
}

export async function findEntryById(id: number, userId: string) {
	const [entry] = await db
		.select()
		.from(appEntryTable)
		.where(and(eq(appEntryTable.id, id), eq(appEntryTable.userId, userId)));

	return entry ?? null;
}

export async function findEntriesByUserId(userId: string) {
	return db.select().from(appEntryTable).where(eq(appEntryTable.userId, userId));
}

//Returns null if not found
export async function updateEntry(id: number, userId: string, patch: EntryUpdate) {
	const [entry] = await db
		.update(appEntryTable)
		.set(patch)
		.where(and(eq(appEntryTable.id, id), eq(appEntryTable.userId, userId)))
		.returning();

	return entry ?? null;
}

//Returns null if not found
export async function deleteEntry(id: number, userId: string) {
	const [entry] = await db
		.delete(appEntryTable)
		.where(and(eq(appEntryTable.id, id), eq(appEntryTable.userId, userId)))
		.returning();

	return entry ?? null;
}


export async function createUser(input: UserInsert) {
	const [user] = await db
		.insert(userTable)
		.values({
			id: input.id,
			name: input.name ?? null,
		})
		.returning();

	return user;
}


// Idempotent create: inserts the user if they don't exist yet, otherwise
export async function upsertUser(input: UserInsert) {
	const [user] = await db
		.insert(userTable)
		.values({
			id: input.id,
			name: input.name ?? null,
		})
		.onConflictDoNothing({ target: userTable.id })
		.returning();

	// onConflictDoNothing() returns [] (not the existing row) on a conflict,
	// so fall back to a read if the insert didn't happen.
	return user ?? (await findUserById(input.id));
}

export async function findUserById(id: string) {
	const [user] = await db.select().from(userTable).where(eq(userTable.id, id));
	return user ?? null;
}

export async function updateUser(id: string, patch: UserUpdate) {
	const [user] = await db.update(userTable).set(patch).where(eq(userTable.id, id)).returning();
	return user ?? null;
}

//appEntryTable.userId has onDelete cascade,this also deletes every entry that user owns
export async function deleteUser(id: string) {
	const [user] = await db.delete(userTable).where(eq(userTable.id, id)).returning();
	return user ?? null;
}