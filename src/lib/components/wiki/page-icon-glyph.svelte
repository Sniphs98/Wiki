<!--
	@component
	Draws a page's icon: a built-in one (page-icons.ts) or an uploaded one
	(custom-icons.ts), else `fallback`. An uploaded SVG is drawn in the text's
	color, like the built-in icons (in light and dark mode); a PNG or WebP
	as it is.
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import { pageIcon } from '$lib/page-icons';
	import { customIconId, type CustomIcon } from '$lib/custom-icons';
	import { withBase } from '$lib/base-path';
	import { cn } from '$lib/utils';

	let {
		icon,
		fallback,
		class: className = 'size-4',
		label
	}: {
		/** The page's icon value, null for the default. */
		icon: string | null | undefined;
		fallback?: Component;
		class?: string;
		/** Read out instead of hiding it from screen readers. */
		label?: string;
	} = $props();

	const builtIn = $derived(pageIcon(icon));
	const custom = $derived.by(() => {
		const id = customIconId(icon);
		const icons = (page.data.customIcons ?? []) as CustomIcon[];
		return id ? icons.find((c) => c.id === id) : undefined;
	});
	const url = $derived(custom && withBase(`/api/icons/${custom.id}`));
</script>

{#if builtIn}
	<builtIn.component
		class={className}
		data-page-icon={builtIn.name}
		role={label ? 'img' : undefined}
		aria-label={label}
		aria-hidden={label ? undefined : 'true'}
	/>
{:else if custom && custom.mimeType === 'image/svg+xml'}
	<span
		class={cn('inline-block shrink-0 bg-current', className)}
		style:mask="url({url}) center / contain no-repeat"
		style:-webkit-mask="url({url}) center / contain no-repeat"
		data-page-icon="custom"
		role={label ? 'img' : undefined}
		aria-label={label}
		aria-hidden={label ? undefined : 'true'}
	></span>
{:else if custom}
	<img
		src={url}
		alt={label ?? ''}
		class={cn('shrink-0 object-contain', className)}
		data-page-icon="custom"
	/>
{:else if fallback}
	{@const Fallback = fallback}
	<Fallback class={className} aria-hidden="true" />
{/if}
