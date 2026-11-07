import { eq, like, or } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { db } from '$lib/server/db';
import { treePin } from '$lib/server/db/schema/sqlite';
import type * as schema from '$lib/server/db/schema/sqlite';

const sqlite = db as BetterSQLite3Database<typeof schema>;

/** What's pinned in the tree, for everyone. */
export async function pinnedPaths(): Promise<string[]> {
	const rows = await sqlite.select({ path: treePin.path }).from(treePin);
	return rows.map((row) => row.path);
}

export async function pin(path: string, pinnedBy: string): Promise<void> {
	await sqlite.insert(treePin).values({ path, pinnedBy }).onConflictDoNothing();
}

export async function unpin(path: string): Promise<void> {
	await sqlite.delete(treePin).where(eq(treePin.path, path));
}

/** Pins on a moved page or folder, and below it, follow it to its new path. */
export async function movePins(from: string, to: string): Promise<void> {
	const pins = await sqlite
		.select()
		.from(treePin)
		.where(or(eq(treePin.path, from), like(treePin.path, `${from}/%`)));
	// LIKE treats "_" as a wildcard: keep exactly the path and what's below it.
	const moved = pins.filter((pin) => pin.path === from || pin.path.startsWith(`${from}/`));
	for (const pin of moved) {
		await sqlite.delete(treePin).where(eq(treePin.path, pin.path));
		await sqlite
			.insert(treePin)
			.values({ ...pin, path: to + pin.path.slice(from.length) })
			.onConflictDoNothing();
	}
}
