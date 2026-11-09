<!--
	@component
	The icons a page can have — the built-in ones (page-icons.ts) and those
	uploaded (custom-icons.ts) — to search and pick one, upload another, or
	go back to the default. Saves the choice right away; the tree and the
	page follow (the tree reloads, also in other tabs).
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import PageIconGlyph from './page-icon-glyph.svelte';
	import { searchPageIcons } from '$lib/page-icons';
	import {
		CUSTOM_ICON_TYPES,
		MAX_CUSTOM_ICON_SIZE,
		customIconValue,
		type CustomIcon
	} from '$lib/custom-icons';
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
	let busy = $state(false);
	let errorMessage = $state('');
	let fileInput = $state<HTMLInputElement>();

	const icons = $derived(searchPageIcons(query));
	const customIcons = $derived.by(() => {
		const all = (page.data.customIcons ?? []) as CustomIcon[];
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);
		return all.filter((icon) => words.every((word) => icon.name.toLowerCase().includes(word)));
	});

	const optionClass = (selected: boolean) =>
		cn(
			'flex size-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
			selected && 'bg-accent text-accent-foreground ring-1 ring-ring'
		);

	async function run(task: () => Promise<string | null>) {
		busy = true;
		errorMessage = '';
		try {
			errorMessage = (await task()) ?? '';
		} finally {
			busy = false;
		}
	}

	function pick(icon: string | null) {
		return run(async () => {
			const response = await fetch(withBase('/api/page-icon'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ pageId, icon })
			});
			if (!response.ok) return 'Das Icon konnte nicht gespeichert werden.';
			await invalidateAll();
			onpicked?.();
			return null;
		});
	}

	/** Uploads the chosen file and gives it to this page right away. */
	async function upload(file: File) {
		if (!CUSTOM_ICON_TYPES.includes(file.type)) {
			errorMessage = 'Bitte eine SVG-, PNG- oder WebP-Datei wählen.';
			return;
		}
		if (file.size > MAX_CUSTOM_ICON_SIZE) {
			errorMessage = 'Das Icon ist zu groß (max. 256 KB).';
			return;
		}
		let uploaded: { id: string } | null = null;
		await run(async () => {
			const body = new FormData();
			body.set('file', file);
			const response = await fetch(withBase('/api/icons'), { method: 'POST', body });
			if (!response.ok) return 'Das Icon konnte nicht hochgeladen werden.';
			uploaded = await response.json();
			return null;
		});
		if (uploaded) await pick(customIconValue((uploaded as { id: string }).id));
	}

	function remove(icon: CustomIcon) {
		if (!confirm(`Icon „${icon.name}“ löschen? Seiten damit bekommen wieder das Standard-Icon.`)) {
			return;
		}
		return run(async () => {
			const response = await fetch(withBase(`/api/icons/${icon.id}`), { method: 'DELETE' });
			if (!response.ok) return 'Das Icon konnte nicht gelöscht werden.';
			await invalidateAll();
			return null;
		});
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<Input bind:value={query} placeholder="Icon suchen …" aria-label="Icon suchen" class="h-8" />
		{#if value}
			<Button variant="ghost" size="sm" disabled={busy} onclick={() => pick(null)}>Entfernen</Button
			>
		{/if}
	</div>
	<div class="flex max-h-72 flex-col gap-2 overflow-y-auto" role="listbox" aria-label="Icons">
		<div class="flex items-center justify-between">
			<span class="text-xs font-medium text-muted-foreground">Eigene Icons</span>
			<Button
				variant="ghost"
				size="sm"
				class="h-7 px-2 text-xs"
				disabled={busy}
				onclick={() => fileInput?.click()}
			>
				<UploadIcon class="size-3.5" />
				Hochladen
			</Button>
			<input
				bind:this={fileInput}
				type="file"
				accept={CUSTOM_ICON_TYPES.join(',')}
				class="hidden"
				aria-label="Icon hochladen"
				onchange={(event) => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = '';
					if (file) void upload(file);
				}}
			/>
		</div>
		{#if customIcons.length > 0}
			<div class="grid grid-cols-8 gap-1">
				{#each customIcons as icon (icon.id)}
					{@const iconValue = customIconValue(icon.id)}
					<div class="group/icon relative">
						<button
							type="button"
							role="option"
							aria-selected={iconValue === value}
							aria-label={icon.name}
							title={icon.name}
							disabled={busy}
							class={optionClass(iconValue === value)}
							onclick={() => pick(iconValue)}
						>
							<PageIconGlyph icon={iconValue} />
						</button>
						{#if icon.canDelete}
							<button
								type="button"
								title="Icon löschen"
								aria-label="Icon löschen: {icon.name}"
								disabled={busy}
								class="absolute -top-1 -right-1 hidden size-4 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border group-hover/icon:flex hover:text-destructive focus-visible:flex"
								onclick={() => remove(icon)}
							>
								<XIcon class="size-3" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{:else if !query}
			<p class="text-xs text-muted-foreground">
				Lade eine SVG- oder PNG-Datei hoch, z. B. ein Logo. SVGs passen sich an Hell und Dunkel an.
			</p>
		{/if}
		<span class="text-xs font-medium text-muted-foreground">Icons</span>
		<div class="grid grid-cols-8 gap-1">
			{#each icons as icon (icon.name)}
				<button
					type="button"
					role="option"
					aria-selected={icon.name === value}
					aria-label={icon.label}
					title={icon.label}
					disabled={busy}
					class={optionClass(icon.name === value)}
					onclick={() => pick(icon.name)}
				>
					<icon.component class="size-4" />
				</button>
			{/each}
		</div>
		{#if icons.length === 0 && customIcons.length === 0}
			<p class="py-4 text-center text-sm text-muted-foreground">Kein Icon gefunden.</p>
		{/if}
	</div>
	{#if errorMessage}
		<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
	{/if}
</div>
