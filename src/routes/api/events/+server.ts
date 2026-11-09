import { bootId, changesSince, cursor, subscribe, visibleChange } from '$lib/server/live-events';
import type { NumberedChange } from '$lib/server/live-events';
import type { RequestHandler } from './$types';

/** A comment line now and then, so proxies don't close a quiet connection. */
const HEARTBEAT_MS = 25_000;

/** `<bootId>:<number>`, as sent with each event (and in the layout's data). */
function parseCursor(value: string | null): number | null {
	if (!value) return null;
	const [boot, id] = value.split(':');
	const number = Number(id);
	return boot === bootId && Number.isInteger(number) ? number : -1;
}

/**
 * Server-Sent Events: the changes to pages the visitor may read, as they
 * happen (live-events.ts). The browser reconnects by itself and then says
 * which change it saw last (Last-Event-ID); the first time, the layout's
 * cursor says where its data is from (?since=).
 */
export const GET: RequestHandler = ({ locals, request, url }) => {
	const { access } = locals;
	const since = parseCursor(request.headers.get('last-event-id') ?? url.searchParams.get('since'));
	const encoder = new TextEncoder();
	let stop = () => {};

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;
			const write = (text: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(text));
				} catch {
					stop();
				}
			};
			const send = ({ id, change }: NumberedChange) => {
				const visible = visibleChange(change, access.canRead);
				// Numbered even when not shown, so a reconnect doesn't ask for it again.
				if (!visible) write(`id: ${bootId}:${id}\n\n`);
				else
					write(
						`id: ${bootId}:${id}\nevent: ${visible.type}\ndata: ${JSON.stringify(visible)}\n\n`
					);
			};

			// Retry after 3 s if the connection drops.
			write('retry: 3000\n\n');
			const unsubscribe = subscribe(send);
			if (since !== null) {
				const missed = since >= 0 ? changesSince(since) : null;
				if (missed) missed.forEach(send);
				// Missed changes we can't name any more: the tab refreshes what it can.
				else write(`id: ${bootId}:${cursor()}\nevent: resync\ndata: {}\n\n`);
			}
			const heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);

			stop = () => {
				if (closed) return;
				closed = true;
				clearInterval(heartbeat);
				unsubscribe();
				try {
					controller.close();
				} catch {
					// Already closed by the other side.
				}
			};
			request.signal.addEventListener('abort', () => stop());
		},
		cancel() {
			stop();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			// nginx: hand each event on at once instead of buffering the response.
			'x-accel-buffering': 'no'
		}
	});
};
