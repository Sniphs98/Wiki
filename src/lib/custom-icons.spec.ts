import { describe, expect, it } from 'vitest';
import { customIconId, customIconName, customIconValue } from './custom-icons';

describe('custom icons', () => {
	it('refers to an uploaded icon as custom:<id>', () => {
		expect(customIconValue('abc')).toBe('custom:abc');
		expect(customIconId('custom:abc')).toBe('abc');
		expect(customIconId('rocket')).toBeNull();
		expect(customIconId(null)).toBeNull();
	});

	it('names an icon after its file', () => {
		expect(customIconName('github-brands.svg')).toBe('github-brands');
		expect(customIconName('.svg')).toBe('Icon');
	});
});
