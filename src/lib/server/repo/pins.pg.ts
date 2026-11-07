import { eq, like, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db } from '$lib/server/db';
import { treePin } from '$lib/server/db/schema/pg';
import type * as schema from '$lib/server/db/schema/pg';

const pg = db as PostgresJsDatabase<typeof schema>;

/** What's pinned in the tree, for everyone. */
export async function pinnedPaths(): Promise<string[]> {
	const rows = await pg.select({ path: treePin.path }).from(treePin);
	return rows.map((row) => row.path);
}

export async function pin(path: string, pinnedBy: string): Promise<void> {
	await pg.insert(treePin).values({ path, pinnedBy }).onConflictDoNothing();
}

export async function unpin(path: string): Promise<void> {
	await pg.delete(treePin).where(eq(treePin.path, path));
}

/** Pins on a moved page or folder, and below it, follow it to its new path. */
export async function movePins(from: string, to: string): Promise<void> {
	const pins = await pg
		.select()
		.from(treePin)
		.where(or(eq(treePin.path, from), like(treePin.path, `${from}/%`)));
	// LIKE treats "_" as a wildcard: keep exactly the path and what's below it.
	const moved = pins.filter((pin) => pin.path === from || pin.path.startsWith(`${from}/`));
	for (const pin of moved) {
		await pg.delete(treePin).where(eq(treePin.path, pin.path));
		await pg
			.insert(treePin)
			.values({ ...pin, path: to + pin.path.slice(from.length) })
			.onConflictDoNothing();
	}
}
