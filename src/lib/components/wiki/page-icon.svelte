<!--
	@component
	A page's icon above its title. Those who may edit the page click it to
	change it, or — without one yet — add one from the button shown there
	(on wide screens while the header, a `group/header`, is hovered).
-->
<script lang="ts">
	import SmilePlusIcon from '@lucide/svelte/icons/smile-plus';
	import { page } from '$app/state';
	import * as Popover from '$lib/components/ui/popover';
	import PageIconPicker from './page-icon-picker.svelte';
	import PageIconGlyph from './page-icon-glyph.svelte';
	import { pageIcon } from '$lib/page-icons';
	import { customIconId, type CustomIcon } from '$lib/custom-icons';
	import { cn } from '$lib/utils';

	let {
		pageId,
		icon,
		canEdit = false
	}: {
		pageId: string;
		/** The page's icon value, null for the default. */
		icon: string | null;
		canEdit?: boolean;
	} = $props();

	/** The icon's name, if it's one that's (still) there. */
	const label = $derived.by(() => {
		const builtIn = pageIcon(icon);
		if (builtIn) return builtIn.label;
		const id = customIconId(icon);
		const icons = (page.data.customIcons ?? []) as CustomIcon[];
		return icons.find((c) => c.id === id)?.name;
	});
	let open = $state(false);
</script>

{#if canEdit}
	<Popover.Root bind:open>
		<Popover.Trigger
			class={cn(
				'mb-2 inline-flex items-center gap-1.5 rounded-md transition-colors hover:bg-accent',
				label
					? 'p-1'
					: 'px-2 py-1 text-sm text-muted-foreground group-hover/header:opacity-100 hover:text-accent-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 md:opacity-0'
			)}
			title={label ? `Icon ändern (${label})` : 'Icon hinzufügen'}
		>
			{#if label}
				<PageIconGlyph {icon} class="size-10" />
				<span class="sr-only">Icon ändern: {label}</span>
			{:else}
				<SmilePlusIcon class="size-4" />
				Icon hinzufügen
			{/if}
		</Popover.Trigger>
		<Popover.Content align="start" class="w-80">
			<PageIconPicker {pageId} value={icon} onpicked={() => (open = false)} />
		</Popover.Content>
	</Popover.Root>
{:else if label}
	<div class="mb-2 p-1">
		<PageIconGlyph {icon} class="size-10" {label} />
	</div>
{/if}
