<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_COOKIE_MAX_AGE,
		SIDEBAR_WIDTH_COOKIE_NAME,
		SIDEBAR_WIDTH_ICON,
		clampSidebarWidth
	} from './constants.js';
	import { setSidebar } from './context.svelte.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		open = $bindable(true),
		onOpenChange = () => {},
		width = $bindable(null),
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Dragged width in px (null: the default), e.g. from the sidebar_width cookie. */
		width?: number | null;
	} = $props();

	const sidebar = setSidebar({
		open: () => open,
		setOpen: (value: boolean) => {
			open = value;
			onOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
		width: () => width,
		setWidth: (value: number | null, persist: boolean) => {
			width = value === null ? null : clampSidebarWidth(value);
			if (!persist) return;
			// Read by the app layout on the server, so the page renders at this width.
			document.cookie =
				width === null
					? `${SIDEBAR_WIDTH_COOKIE_NAME}=; path=/; max-age=0`
					: `${SIDEBAR_WIDTH_COOKIE_NAME}=${width}; path=/; max-age=${SIDEBAR_WIDTH_COOKIE_MAX_AGE}`;
		}
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<div
		data-slot="sidebar-wrapper"
		data-resizing={sidebar.resizing ? '' : undefined}
		style="--sidebar-width: {width === null
			? SIDEBAR_WIDTH
			: `${width}px`}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
