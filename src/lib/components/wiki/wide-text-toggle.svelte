<script lang="ts">
	import UnfoldHorizontalIcon from '@lucide/svelte/icons/unfold-horizontal';
	import { Button } from '$lib/components/ui/button';
	import { wideTextSetting } from '$lib/wide-text-setting.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<Button
	type="button"
	variant={wideTextSetting.wide ? 'secondary' : 'ghost'}
	class={className}
	aria-pressed={wideTextSetting.wide}
	title="Nutzt die ganze Breite des Fensters statt der A4-Breite des PDFs"
	onclick={() => wideTextSetting.toggle()}
>
	<UnfoldHorizontalIcon data-icon="inline-start" />
	Breiter Text
</Button>
