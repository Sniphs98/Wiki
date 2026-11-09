import { describe, expect, it } from 'vitest';
import { changesSince, cursor, publish, subscribe, visibleChange } from './live-events';

describe('publish / subscribe', () => {
	it('hands each change to every listener, numbered', () => {
		const heard: number[] = [];
		const stop = subscribe((event) => heard.push(event.id));
		const before = cursor();
		publish({ type: 'tree', paths: ['a'] });
		publish({ type: 'tree', paths: ['b'] });
		stop();
		publish({ type: 'tree', paths: ['c'] });
		expect(heard).toEqual([before + 1, before + 2]);
	});
});

describe('changesSince', () => {
	it('names the changes after a number', () => {
		const start = cursor();
		publish({ type: 'tree', paths: ['x'] });
		publish({ type: 'tree', paths: ['y'] });
		expect(changesSince(start)?.map((e) => e.change)).toEqual([
			{ type: 'tree', paths: ['x'] },
			{ type: 'tree', paths: ['y'] }
		]);
		expect(changesSince(cursor())).toEqual([]);
	});

	it("doesn't know changes too long ago, or from the future (another server)", () => {
		const start = cursor();
		for (let i = 0; i < 250; i++) publish({ type: 'tree', paths: [] });
		expect(changesSince(start)).toBeNull();
		expect(changesSince(cursor() + 5)).toBeNull();
	});
});

describe('visibleChange', () => {
	const canRead = (path: string) => !path.startsWith('geheim');

	it('passes changes to readable pages on, without their path', () => {
		expect(
			visibleChange({ type: 'page', pageId: 'p1', path: 'offen', version: 3 }, canRead)
		).toEqual({ type: 'page', pageId: 'p1', version: 3 });
	});

	it('keeps changes to hidden pages to itself', () => {
		expect(
			visibleChange({ type: 'page', pageId: 'p1', path: 'geheim/x', version: 3 }, canRead)
		).toBeNull();
		expect(visibleChange({ type: 'tree', paths: ['geheim/x'] }, canRead)).toBeNull();
		expect(visibleChange({ type: 'tree', paths: ['geheim/x', 'offen'] }, canRead)).toEqual({
			type: 'tree'
		});
	});

	it('tells of a move only where the visitor may follow', () => {
		expect(
			visibleChange({ type: 'page', pageId: 'p1', path: 'offen', movedTo: 'neu' }, canRead)
		).toEqual({ type: 'page', pageId: 'p1', movedTo: 'neu' });
		expect(
			visibleChange({ type: 'page', pageId: 'p1', path: 'offen', movedTo: 'geheim/y' }, canRead)
		).toEqual({ type: 'page', pageId: 'p1', deleted: true });
	});
});
