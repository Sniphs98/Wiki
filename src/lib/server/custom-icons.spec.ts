import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/repo/custom-icons', () => ({ listCustomIcons: async () => [] }));
const { canDeleteCustomIcon } = await import('./custom-icons');

const icon = { id: 'i', name: 'Logo', mimeType: 'image/svg+xml', uploadedBy: 'anna' };
const viewer = (
	authMode: 'disabled' | 'read-only' | 'full',
	user: string | null,
	isAdmin = false
) => ({
	authMode,
	user: user ? { id: user } : null,
	access: { isAdmin }
});

describe('canDeleteCustomIcon', () => {
	it('lets whoever uploaded it and admins delete it', () => {
		expect(canDeleteCustomIcon(icon, viewer('full', 'anna'))).toBe(true);
		expect(canDeleteCustomIcon(icon, viewer('full', 'ben', true))).toBe(true);
		expect(canDeleteCustomIcon(icon, viewer('full', 'ben'))).toBe(false);
		expect(canDeleteCustomIcon(icon, viewer('read-only', null))).toBe(false);
	});

	it('lets anyone delete it in a wiki without login', () => {
		expect(canDeleteCustomIcon(icon, viewer('disabled', null))).toBe(true);
	});
});
