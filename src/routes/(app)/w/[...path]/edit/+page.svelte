<script lang="ts">
	import PageEditForm from '$lib/components/wiki/page-edit-form.svelte';
	import { PRINT_TEXT_WIDTH } from '$lib/print-layout';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	const hasChildren = $derived(data.pages.some((p) => p.path.startsWith(`${data.path}/`)));
	const conflictVersion = $derived(
		form && 'conflictVersion' in form && typeof form.conflictVersion === 'number'
			? form.conflictVersion
			: undefined
	);

	/** Counts "Neue Version laden": each starts the form afresh on the reloaded data. */
	let reloads = $state(0);

	async function reload() {
		await invalidateAll();
		reloads++;
	}
</script>

<div class="mx-auto box-content max-w-[calc(100%-4rem)] p-8" style:width={PRINT_TEXT_WIDTH}>
	{#key `${data.path}#${reloads}`}
		<PageEditForm
			path={data.path}
			pageId={data.page?.id}
			pageExists={data.page !== null}
			{hasChildren}
			existingTitle={data.prefillTitle}
			existingContent={data.version?.content ?? ''}
			existingTags={data.tags}
			linkPages={data.pages}
			nextVersionNumber={(data.version?.versionNumber ?? 0) + 1}
			attachments={data.attachments}
			errorMessage={form?.message}
			{conflictVersion}
			onreload={reload}
		/>
	{/key}
</div>
