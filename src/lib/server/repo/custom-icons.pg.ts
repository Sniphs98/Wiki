import { asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db } from '$lib/server/db';
import { customIcon } from '$lib/server/db/schema/pg';
import type * as schema from '$lib/server/db/schema/pg';
import type { CustomIconFile, CustomIconMeta, CreateCustomIconInput } from './custom-icons.types';

const pg = db as PostgresJsDatabase<typeof schema>;

export async function listCustomIcons(): Promise<CustomIconMeta[]> {
	return pg
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
	const [found] = await pg.select().from(customIcon).where(eq(customIcon.id, id)).limit(1);
	return found ?? null;
}

export async function createCustomIcon(input: CreateCustomIconInput): Promise<string> {
	const id = crypto.randomUUID();
	await pg.insert(customIcon).values({ id, ...input });
	return id;
}

export async function deleteCustomIcon(id: string): Promise<void> {
	await pg.delete(customIcon).where(eq(customIcon.id, id));
}
