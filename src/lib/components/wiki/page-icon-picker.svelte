<!--
	@component
	The icons a page can have (page-icons.ts), to search and pick one, or to
	go back to the default. Saves the choice right away; the tree and the
	page follow (the tree reloads, also in other tabs).
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { searchPageIcons } from '$lib/page-icons';
	import { withBase } from '$lib/base-path';
	import { cn } from '$lib/utils';

	let {
		pageId,
		value,
		onpicked
	}: {
		pageId: string;
		/** The page's icon now, null for the default. */
		value: string | null;
		/** After the choice is saved, e.g. to close the popover. */
		onpicked?: () => void;
	} = $props();

	let query = $state('');
	let saving = $state(false);
	let errorMessage = $state('');
	const icons = $derived(searchPageIcons(query));

	async function pick(icon: string | null) {
		saving = true;
		errorMessage = '';
		try {
			const response = await fetch(withBase('/api/page-icon'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ pageId, icon })
			});
			if (!response.ok) {
				errorMessage = 'Das Icon konnte nicht gespeichert werden.';
				return;
			}
			await invalidateAll();
			onpicked?.();
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<Input bind:value={query} placeholder="Icon suchen …" aria-label="Icon suchen" class="h-8" />
		{#if value}
			<Button variant="ghost" size="sm" disabled={saving} onclick={() => pick(null)}>
				Entfernen
			</Button>
		{/if}
	</div>
	<div class="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto" role="listbox" aria-label="Icons">
		{#each icons as icon (icon.name)}
			<button
				type="button"
				role="option"
				aria-selected={icon.name === value}
				aria-label={icon.label}
				title={icon.label}
				disabled={saving}
				class={cn(
					'flex size-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
					icon.name === value && 'bg-accent text-accent-foreground ring-1 ring-ring'
				)}
				onclick={() => pick(icon.name)}
			>
				<icon.component class="size-4" />
			</button>
		{:else}
			<p class="col-span-8 py-4 text-center text-sm text-muted-foreground">Kein Icon gefunden.</p>
		{/each}
	</div>
	{#if errorMessage}
		<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
	{/if}
</div>
