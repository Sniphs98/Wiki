import { asc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { db } from '$lib/server/db';
import { customIcon } from '$lib/server/db/schema/sqlite';
import type * as schema from '$lib/server/db/schema/sqlite';
import type { CustomIconFile, CustomIconMeta, CreateCustomIconInput } from './custom-icons.types';

const sqlite = db as BetterSQLite3Database<typeof schema>;

export async function listCustomIcons(): Promise<CustomIconMeta[]> {
	return sqlite
		.select({
			id: customIcon.id,
			name: customIcon.name,
			mimeType: customIcon.mimeType,
			uploadedBy: customIcon.uploadedBy
		})
		.from(customIcon)
		.orderBy(asc(customIcon.createdAt));
}

export async function getCustomIcon(id: string): Promise<CustomIconFile | null> {
	const [found] = await sqlite.select().from(customIcon).where(eq(customIcon.id, id)).limit(1);
	return found ?? null;
}

export async function createCustomIcon(input: CreateCustomIconInput): Promise<string> {
	const id = crypto.randomUUID();
	await sqlite.insert(customIcon).values({ id, ...input });
	return id;
}

export async function deleteCustomIcon(id: string): Promise<void> {
	await sqlite.delete(customIcon).where(eq(customIcon.id, id));
}
