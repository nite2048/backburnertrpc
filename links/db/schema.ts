import { check, sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { defineRelations, sql } from 'drizzle-orm';

import { ContentType } from '@links/contracts';

//NOTE: sqlite cehck can only contain literal sql, each value must be inlined via sql.raw() with manual quoting, not interpolated
const quoteSqlLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
const contentTypes = Object.values(ContentType) as [ContentType, ...ContentType[]];
 
export const userTable = sqliteTable('user',
     {
     	id: text().primaryKey(),
     	name: text(),
     	createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
     }
);
 
//NOTE: contentType is a typescript only literal union on inferred selects/inserts doesnt enforce anything on db which is why the check() constraint still exists.
export const appEntryTable = sqliteTable('app_entry',
     {
		id: integer().primaryKey({ autoIncrement: true }),
		userId: text()
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		contentType: text({ enum: contentTypes }).notNull(),
		originalImage: text(),
		metaData: text({ mode: 'json' }).notNull(),
		aiMetadata: text({ mode: 'json' }).notNull(),
	},
	(table) => [
		check(
			'content_type_check',
			sql`${table.contentType} IN (${sql.raw(
				contentTypes.map(quoteSqlLiteral).join(', '),
			)})`,
		),
		index('app_entry_user_id_idx').on(table.userId),
	],
 );

const schema = { userTable, appEntryTable };
 
//NOTE: defineRelations keys off the `schema` object's property names, not the DB table names ('user' / 'app_entry').
 export const relations = defineRelations(schema, (r) => ({
	userTable: {
		appEntries: r.many.appEntryTable({
			from: r.userTable.id,
			to: r.appEntryTable.userId,
		}),
	},
	appEntryTable: {
		user: r.one.userTable({
			from: r.appEntryTable.userId,
			to: r.userTable.id,
		}),
	},
 }));