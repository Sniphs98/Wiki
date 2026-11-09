<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { useSidebar } from './context.svelte.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> = $props();

	const sidebar = useSidebar();

	/** Moving less than this is still a click (which folds the sidebar in or out). */
	const DRAG_THRESHOLD = 4;

	let drag: { pointerId: number; startX: number; startWidth: number; side: string } | null = null;
	let dragged = false;
	/** The click that follows a drag must not also fold the sidebar. */
	let swallowClick = false;

	function onpointerdown(event: PointerEvent) {
		// Only the open sidebar is resized; a collapsed one opens on click.
		if (event.button !== 0 || !sidebar.open || !ref) return;
		const container = ref.closest<HTMLElement>('[data-slot="sidebar-container"]');
		const root = ref.closest<HTMLElement>('[data-slot="sidebar"]');
		if (!container) return;
		drag = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startWidth: container.getBoundingClientRect().width,
			side: root?.dataset.side ?? 'left'
		};
		dragged = false;
		ref.setPointerCapture(event.pointerId);
	}

	function onpointermove(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		const dx = (event.clientX - drag.startX) * (drag.side === 'right' ? -1 : 1);
		if (!dragged) {
			if (Math.abs(dx) < DRAG_THRESHOLD) return;
			dragged = true;
			sidebar.resizing = true;
			document.body.style.userSelect = 'none';
			document.body.style.cursor = 'col-resize';
		}
		sidebar.setWidth(drag.startWidth + dx, false);
	}

	function endDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		drag = null;
		if (ref?.hasPointerCapture(event.pointerId)) ref.releasePointerCapture(event.pointerId);
		if (!dragged) return;
		dragged = false;
		swallowClick = event.type === 'pointerup';
		sidebar.resizing = false;
		document.body.style.userSelect = '';
		document.body.style.cursor = '';
		sidebar.setWidth(sidebar.width, true);
	}

	function onclick() {
		if (swallowClick) {
			swallowClick = false;
			return;
		}
		sidebar.toggle();
	}
</script>

<button
	bind:this={ref}
	data-sidebar="rail"
	data-slot="sidebar-rail"
	aria-label="Seitenleiste ein- oder ausklappen"
	tabindex={-1}
	{onclick}
	{onpointerdown}
	{onpointermove}
	onpointerup={endDrag}
	onpointercancel={endDrag}
	title={sidebar.open ? 'Ziehen: Breite ändern · Klicken: einklappen' : 'Seitenleiste ausklappen'}
	class={cn(
		'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 touch-none transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex',
		'cursor-col-resize',
		'[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
		'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
		'[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
		'[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</button>
