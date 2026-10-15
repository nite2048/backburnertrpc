import { drizzle } from 'drizzle-orm/bun-sqlite';
import { and, eq, sql } from 'drizzle-orm';

import { appEntryTable, userTable, relations } from './schema';
import type { AppEntry, AuthenticatedUser } from '@links/contracts';
import { NotFoundError } from '../../services/backend/utils/errors';

export const db = drizzle({
     connection: { source: `${import.meta.dir}/db.sqlite` },
     relations,
});

type Entry =  Omit<typeof appEntryTable.$inferInsert, 'id'>;
type User = Omit<typeof userTable.$inferInsert, 'id' | 'createdAt'>;

export async function createEntry(input: Entry): Promise<AppEntry>{
	const [entry] = await db
		.insert(appEntryTable)
		.values({
			userId: input.userId,
			name: input.name,
			contentType: input.contentType,
			originalImage: input.originalImage,
			metaData: input.metaData,
			aiMetadata: input.aiMetadata,
		})
		.returning();

	if (!entry) throw new NotFoundError("Insert returned no row");

     const { userId: _userId, ...final } = entry;
     return final;
}

export async function findEntryById(id: number, userId: string): Promise<AppEntry> {
	const [entry] = await db
		.select()
		.from(appEntryTable)
		.where(and(eq(appEntryTable.id, id), eq(appEntryTable.userId, userId)));

	if (!entry) throw new NotFoundError("Entry not found");

	const { userId: _userId, ...final } = entry;
	return final;
}

export async function findEntriesByUserId(userId: string): Promise<AppEntry[]> {
	const entries = await db.select().from(appEntryTable).where(eq(appEntryTable.userId, userId));
	return entries.map(({ userId: _userId, ...final }) => final);
}

export async function updateEntry(id: number, userId: string, patch: Partial<Omit<Entry, 'userId' | 'originalImage'>>): Promise<AppEntry> {
	const [entry] = await db
		.update(appEntryTable)
		.set(patch)
		.where(and(eq(appEntryTable.id, id), eq(appEntryTable.userId, userId)))
		.returning();

	if (!entry) throw new NotFoundError("Entry not found");

	const { userId: _userId, ...final } = entry;
	return final;
}

export async function deleteEntry(id: number, userId: string): Promise<AppEntry> {
	const [entry] = await db
		.delete(appEntryTable)
		.where(and(eq(appEntryTable.id, id), eq(appEntryTable.userId, userId)))
		.returning();

	if (!entry) throw new NotFoundError("Entry not found");

	const { userId: _userId, ...final } = entry;
	return final;
}

// Idempotent create: returns the existing user if these credentials already exist.
// The conflict target is the credential unique constraint (user_credential_unique), and the no-op update makes RETURNING yield the existing row (DoNothing would not).
export async function createUser(input: User): Promise<AuthenticatedUser> {
	const [user] = await db
		.insert(userTable)
		.values({
			name: input.name,
			key: input.key,
			value: input.value,
		})
		.onConflictDoUpdate({
			target: [userTable.name, userTable.key, userTable.value],
			set: {
				name: sql`${userTable.name}`,
			},
		})
		.returning();

	if (!user) throw new NotFoundError("Insert returned no row");

	const { key: _key, value: _value, createdAt: _createdAt, ...final } = user;
	return { ...final, isLoggedIn: true };
}

export async function findUserById(id: string): Promise<AuthenticatedUser> {
	const [user] = await db.select().from(userTable).where(eq(userTable.id, id));

	if (!user) throw new NotFoundError("User not found");

	const { key: _key, value: _value, createdAt: _createdAt, ...final } = user;
	return { ...final, isLoggedIn: true };
}

export async function findUserByCredentials({ name, key, value }: { name: string; key: string; value: string }): Promise<AuthenticatedUser> {
	const [user] = await db
		.select()
		.from(userTable)
		.where(and(eq(userTable.name, name), eq(userTable.key, key), eq(userTable.value, value)));

	if (!user) throw new NotFoundError("User not found");

	const { key: _key, value: _value, createdAt: _createdAt, ...final } = user;
	return { ...final, isLoggedIn: true };
}

export async function updateUser(id: string, patch: Partial<User>): Promise<AuthenticatedUser> {
	const [user] = await db.update(userTable).set(patch).where(eq(userTable.id, id)).returning();

	if (!user) throw new NotFoundError("User not found");

	const { key: _key, value: _value, createdAt: _createdAt, ...final } = user;
	return { ...final, isLoggedIn: true };
}

//appEntryTable.userId has onDelete cascade,this also deletes every entry that user owns
export async function deleteUser(id: string): Promise<AuthenticatedUser> {
	const [user] = await db.delete(userTable).where(eq(userTable.id, id)).returning();

	if (!user) throw new NotFoundError("User not found");

	const { key: _key, value: _value, createdAt: _createdAt, ...final } = user;
	return { ...final, isLoggedIn: true };
}

//FEAT: Implement runtime type checker (if necessary)
//Compile time check to make sure the database schma and the app schema matches
type EntryRow = typeof appEntryTable.$inferSelect;
type UserRow = typeof userTable.$inferSelect;

type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

//UserId is a DB-only column and never leaves this layer, so they are excluded from the check
type _EntryTableMatchesSchema = Assert<Mutual<Omit<EntryRow, 'userId'>, AppEntry>>;

//Key/value (credentials) and createdAt never leave this layer either, so they are excluded from the check as well
type _UserTableMatchesSchema = Assert<
	Mutual<Pick<UserRow, 'id' | 'name'> & { isLoggedIn: true }, AuthenticatedUser>
>;