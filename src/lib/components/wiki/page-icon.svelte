<!--
	@component
	A page's icon above its title. Those who may edit the page click it to
	change it, or — without one yet — add one from the button shown there
	(on wide screens while the header, a `group/header`, is hovered).
-->
<script lang="ts">
	import SmilePlusIcon from '@lucide/svelte/icons/smile-plus';
	import * as Popover from '$lib/components/ui/popover';
	import PageIconPicker from './page-icon-picker.svelte';
	import { pageIcon } from '$lib/page-icons';
	import { cn } from '$lib/utils';

	let {
		pageId,
		icon,
		canEdit = false
	}: {
		pageId: string;
		/** A name from page-icons.ts, null for the default. */
		icon: string | null;
		canEdit?: boolean;
	} = $props();

	const current = $derived(pageIcon(icon));
	let open = $state(false);
</script>

{#if canEdit}
	<Popover.Root bind:open>
		<Popover.Trigger
			class={cn(
				'mb-2 inline-flex items-center gap-1.5 rounded-md transition-colors hover:bg-accent',
				current
					? 'p-1'
					: 'px-2 py-1 text-sm text-muted-foreground group-hover/header:opacity-100 hover:text-accent-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 md:opacity-0'
			)}
			title={current ? `Icon ändern (${current.label})` : 'Icon hinzufügen'}
		>
			{#if current}
				<current.component class="size-10" aria-hidden="true" />
				<span class="sr-only">Icon ändern: {current.label}</span>
			{:else}
				<SmilePlusIcon class="size-4" />
				Icon hinzufügen
			{/if}
		</Popover.Trigger>
		<Popover.Content align="start" class="w-80">
			<PageIconPicker {pageId} value={icon} onpicked={() => (open = false)} />
		</Popover.Content>
	</Popover.Root>
{:else if current}
	<div class="mb-2 p-1" data-page-icon={current.name}>
		<current.component class="size-10" role="img" aria-label={current.label} />
	</div>
{/if}
