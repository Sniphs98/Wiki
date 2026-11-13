import { describe, expect, it, vi } from 'vitest';
import { diagnoseSearch, measureSearchStep } from './diagnostics';

describe('search diagnostics', () => {
	it('keeps parallel requests separate and preserves the response', async () => {
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			const [first, second] = await Promise.all([
				diagnoseSearch(async () => {
					await measureSearchStep('fulltext', async () => {
						await Promise.resolve();
					});
					return new Response('first', { status: 201, headers: { 'X-Existing': 'kept' } });
				}),
				diagnoseSearch(async () => {
					await measureSearchStep('embedding', () => Promise.resolve());
					return new Response('second');
				})
			]);
			expect(first.status).toBe(201);
			expect(first.headers.get('X-Existing')).toBe('kept');
			expect(await first.text()).toBe('first');
			expect(first.headers.get('Server-Timing')).toMatch(/fulltext;dur=\d+\.\d/);
			expect(first.headers.get('Server-Timing')).not.toContain('embedding');
			expect(second.headers.get('Server-Timing')).toContain('embedding;dur=');
			expect(second.headers.get('Server-Timing')).not.toContain('fulltext');
			expect(first.headers.get('X-Search-Request-Id')).not.toBe(
				second.headers.get('X-Search-Request-Id')
			);
			expect(log).toHaveBeenCalledTimes(2);
		} finally {
			log.mockRestore();
		}
	});

	it('records failed steps without swallowing the error or logging its contents', async () => {
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			await expect(
				diagnoseSearch(async () => {
					await measureSearchStep('embedding', () => {
						throw new Error('private search term');
					});
					return new Response();
				})
			).rejects.toThrow('private search term');
			const entry = JSON.parse(log.mock.calls[0][1]);
			expect(entry.status).toBe(500);
			expect(entry.ms.embedding).toBeGreaterThanOrEqual(0);
			expect(entry.ms.total).toBeGreaterThanOrEqual(entry.ms.embedding);
			expect(JSON.stringify(log.mock.calls)).not.toContain('private search term');
		} finally {
			log.mockRestore();
		}
	});

	it('works without a diagnostic request and propagates values and failures', async () => {
		expect(await measureSearchStep('fulltext', () => 42)).toBe(42);
		await expect(
			measureSearchStep('fulltext', () => Promise.reject(new Error('failed')))
		).rejects.toThrow('failed');
	});
});
