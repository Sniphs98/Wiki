<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { onPageChange, type PageChange } from '$lib/live-updates';
	import LiveUpdateNotice from './live-update-notice.svelte';

	/**
	 * Offers the newest state of the page being read, once someone else
	 * saved, moved or deleted it (live-updates.ts). Only on request: the
	 * text doesn't change under the reader's eyes.
	 */
	let { pageId, path, version }: { pageId: string; path: string; version: number } = $props();

	let change = $state<PageChange | null>(null);
	let dismissed = $state<PageChange | null>(null);
	let reloading = $state(false);

	$effect(() =>
		onPageChange((next) => {
			if (next.pageId !== pageId) return;
			// A move of this page to here (our own) isn't news; nor is an older version.
			if (next.movedTo === path) return;
			if (change?.deleted || change?.movedTo) return;
			change = next;
		})
	);

	const notice = $derived.by(() => {
		if (!change || change === dismissed) return null;
		if (change.deleted) return 'deleted' as const;
		if (change.movedTo) return 'moved' as const;
		if (change.version !== undefined && change.version > version) return 'version' as const;
		return null;
	});

	async function reload() {
		reloading = true;
		try {
			await invalidateAll();
		} finally {
			reloading = false;
		}
	}
</script>

{#if notice && change}
	<LiveUpdateNotice ondismiss={() => (dismissed = change)}>
		{#if notice === 'deleted'}
			Diese Seite wurde gerade gelöscht.
		{:else if notice === 'moved'}
			Diese Seite wurde nach „{change.movedTo}“ verschoben.
		{:else}
			Diese Seite wurde gerade geändert (jetzt Version {change.version}).
		{/if}
		{#snippet actions()}
			{#if notice === 'deleted'}
				<Button size="sm" href={resolve('/')}>Zur Startseite</Button>
			{:else if notice === 'moved' && change?.movedTo}
				<Button size="sm" href={resolve('/(app)/w/[...path]', { path: change.movedTo })}>
					Zur neuen Adresse
				</Button>
			{:else}
				<Button size="sm" onclick={reload} disabled={reloading}>
					{reloading ? 'Lädt …' : 'Aktualisieren'}
				</Button>
			{/if}
		{/snippet}
	</LiveUpdateNotice>
{/if}
