import { check, sqliteTable, blob, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { defineRelations, sql, type SQL } from 'drizzle-orm';

import { ContentType } from '@links/contracts';

//NOTE: sqlite check can only contain literal sql, each value must be inlined via sql.raw() with manual quoting, not interpolated
const quoteSqlLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;

//NOTE: contentType is a typescript only literal union on inferred selects/inserts
const contentTypes = Object.values(ContentType) as [ContentType, ...ContentType[]];
type Metadata = Record<string, unknown>;

if (!Bun.env.BASE_URL) throw new Error(".env not configured")
const IMAGE_BASE_URL =  `${Bun.env.BASE_URL}/static/images/` as const ;
type ImageUrl = `${typeof IMAGE_BASE_URL}${number}`;

//FEAT: Hashing and encryption for the fields key and value
export const userTable = sqliteTable(
     'user',
     {
          id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
          name: text().notNull(),
          key: text().notNull(),
          value: text().notNull(),
          createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
     },
     (table) => [
          // The (name, key, value) triple is the credential, so it must be unique together, no column is unique on its own.
          unique('user_credential_unique').on(table.name, table.key, table.value),
     ],
);

export const appEntryTable = sqliteTable(
     "app_entry",
     {
          id: integer().notNull().primaryKey({ autoIncrement: true }),
          userId: text().notNull().references(() => userTable.id, { onDelete: "cascade" }),

          name: text().notNull(),
          contentType: text({ enum: contentTypes }).notNull(),
          metaData: text({ mode: "json" }).$type<Metadata>().notNull(),
          aiMetadata: text({ mode: "json" }).$type<Metadata>().notNull(),

          originalImage: text()
               .$type<ImageUrl>()
               .generatedAlwaysAs(
                    sql`${sql.raw(quoteSqlLiteral(IMAGE_BASE_URL))} || "id"`,
                    { mode: "virtual" },
               )
               .notNull(),
     },

     (table) => [
          //ContentTypes does not enforce anything on the database; which is why the check() constraint still exists
          check(
               'content_type_check',
               sql`${table.contentType} IN (${sql.raw(
                    contentTypes.map(quoteSqlLiteral).join(', '),
               )})`,
          ),
          index('app_entry_user_id_idx').on(table.userId),
     ],
);

//Mimetype is always lossy WEBP
export const blobTable = sqliteTable("blobs", {
     data: blob("data", { mode: "buffer" }).notNull(),

     entryId: integer("entry_id")
       .primaryKey()
       .references(() => appEntryTable.id, { onDelete: "cascade" }),

     createdAt: integer("created_at")
          .notNull()
          .$defaultFn(() => Math.floor(Date.now() / 1000)),
});


//NOTE: defineRelations keys off the `schema` object's property names, not the DB table names ('user' / 'app_entry').
const schema = { userTable, appEntryTable, blobTable };
export const relations = defineRelations(schema, (r) => ({
     userTable: {
          entries: r.many.appEntryTable({
               from: r.userTable.id,
               to: r.appEntryTable.userId,
          }),
     },
     appEntryTable: {
          user: r.one.userTable({
               from: r.appEntryTable.userId,
               to: r.userTable.id,
          }),
          image: r.one.blobTable({ from: r.appEntryTable.id, to: r.blobTable.entryId }),
     },

     blobTable: {
       entry: r.one.appEntryTable({ from: r.blobTable.entryId, to: r.appEntryTable.id }),
     }
}));

//Compile time database schema checker, so that no unintenional or accidental changes are made
type EntryRow = Readonly<typeof appEntryTable.$inferSelect>;
type UserRow = typeof userTable.$inferSelect;
type BlobRow = typeof blobTable.$inferSelect;

//Bi directional type checker (~a is subset of b and b is subset of a)
type Mutual<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Assert<T extends true> = T;

type _EntryTableSchemaRestrictions = Assert<Mutual<EntryRow,
     {
          userId: string;
          id: number;
          name: string;
          contentType: (typeof contentTypes)[number];
          metaData: Metadata;
          aiMetadata: Metadata;
          originalImage: ImageUrl;
     }>
>

type _UserTableSchemaRestrictions = Assert<Mutual<UserRow,
    {
      id: string;
      name: string;
      key: string;
      value: string;
      createdAt: Date;
    }>
>;

type _BlobTableSchemaRestrictions = Assert<Mutual<BlobRow,
     {
          data: Buffer;
          entryId: number;
          createdAt: number;
     }>
>;