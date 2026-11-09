<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PRINT_TEXT_WIDTH } from '$lib/print-layout';
	import { wideTextSetting } from '$lib/wide-text-setting.svelte';

	/**
	 * The column the page and edit views put their text in: as wide as the
	 * PDF's text by default, so it wraps where the PDF does; in the wide text
	 * mode as wide as the content area allows, leaving room for the panels
	 * beside it (page-toc-aside.svelte) where they show.
	 */
	let { children }: { children: Snippet } = $props();
</script>

{#if wideTextSetting.wide}
	<div class="p-8 @min-[1360px]:mr-[17rem] @min-[1360px]:ml-[16rem]" data-wide-text>
		{@render children()}
	</div>
{:else}
	<div class="mx-auto box-content max-w-[calc(100%-4rem)] p-8" style:width={PRINT_TEXT_WIDTH}>
		{@render children()}
	</div>
{/if}
