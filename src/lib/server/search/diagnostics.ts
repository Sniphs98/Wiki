import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

type Timings = Map<string, number>;
const requests = new AsyncLocalStorage<Timings>();

/** Timings belong to one request, even when searches run concurrently. */
export async function measureSearchStep<T>(name: string, run: () => T | Promise<T>): Promise<T> {
	const timings = requests.getStore();
	if (!timings) return run();
	const start = performance.now();
	try {
		return await run();
	} finally {
		timings.set(name, (timings.get(name) ?? 0) + performance.now() - start);
	}
}

/** Opt-in at the hook: no query, content, cookies or credentials are logged. */
export function diagnoseSearch(run: () => Response | Promise<Response>): Promise<Response> {
	return requests.run(new Map(), async () => {
		const requestId = randomUUID();
		const timings = requests.getStore()!;
		let status = 500;
		try {
			const response = await measureSearchStep('total', run);
			status = response.status;
			// Clone headers: a redirect or another handler may return immutable headers.
			const headers = new Headers(response.headers);
			headers.append(
				'Server-Timing',
				[...timings].map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`).join(', ')
			);
			headers.set('X-Search-Request-Id', requestId);
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers
			});
		} finally {
			console.info(
				'[search-timing]',
				JSON.stringify({
					requestId,
					status,
					ms: Object.fromEntries([...timings].map(([name, ms]) => [name, Number(ms.toFixed(1))]))
				})
			);
		}
	});
}
