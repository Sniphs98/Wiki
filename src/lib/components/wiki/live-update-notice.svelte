<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';

	/**
	 * A small pop-up at the top of the page: something changed on the
	 * server (live-updates.ts), with what to do about it.
	 */
	let {
		children,
		actions,
		ondismiss
	}: {
		/** What changed. */
		children: Snippet;
		/** The buttons: reload, open, … */
		actions: Snippet;
		ondismiss: () => void;
	} = $props();
</script>

<div
	role="status"
	aria-live="polite"
	data-testid="live-update-notice"
	class="fixed top-16 left-1/2 z-50 flex w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 items-start gap-3 rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg"
	transition:fly={{ y: -12, duration: 150 }}
>
	<RefreshCwIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
	<div class="flex min-w-0 flex-1 flex-col gap-2">
		<p>{@render children()}</p>
		<div class="flex flex-wrap gap-2">{@render actions()}</div>
	</div>
	<Button
		variant="ghost"
		size="icon-sm"
		class="-mt-1 -mr-2"
		title="Schließen"
		aria-label="Hinweis schließen"
		onclick={ondismiss}
	>
		<XIcon />
	</Button>
</div>
