<script lang="ts">
	import ScissorsLineDashedIcon from '@lucide/svelte/icons/scissors-line-dashed';
	import { Button } from '$lib/components/ui/button';
	import { pageBreakSetting } from '$lib/page-break-setting.svelte';
	import { wideTextSetting } from '$lib/wide-text-setting.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<Button
	type="button"
	variant={pageBreakSetting.visible && !wideTextSetting.wide ? 'secondary' : 'ghost'}
	class={className}
	aria-pressed={pageBreakSetting.visible}
	disabled={wideTextSetting.wide}
	title={wideTextSetting.wide
		? 'Seitenumbrüche gibt es nur in der A4-Breite, nicht im breiten Text'
		: 'Zeigt, wo im PDF eine neue Seite beginnt'}
	onclick={() => pageBreakSetting.toggle()}
>
	<ScissorsLineDashedIcon data-icon="inline-start" />
	Seitenumbrüche
</Button>
