import { describe, expect, it } from 'vitest';
import {
	decodeBase64Image,
	downloadImage,
	ImageError,
	imageFilename,
	imageMarkdown,
	isPublicAddress,
	sniffImageType
} from './images';

// The smallest PNG there is: one transparent pixel.
const PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('sniffImageType', () => {
	it('reads the type from the first bytes', () => {
		expect(sniffImageType(Buffer.from(PNG_BASE64, 'base64'))).toBe('image/png');
		expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe('image/jpeg');
		expect(sniffImageType(Buffer.from('GIF89a......'))).toBe('image/gif');
		expect(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
		expect(sniffImageType(Buffer.from('\0\0\0\x1cftypavif\0\0'))).toBe('image/avif');
	});

	it('refuses what is no image, and SVG', () => {
		expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
		expect(sniffImageType(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
		expect(sniffImageType(Buffer.alloc(0))).toBeNull();
	});
});

describe('decodeBase64Image', () => {
	it('takes plain base64 and data URLs', () => {
		const plain = decodeBase64Image(PNG_BASE64);
		expect(sniffImageType(plain)).toBe('image/png');
		expect(decodeBase64Image(`data:image/png;base64,${PNG_BASE64}`)).toEqual(plain);
		expect(decodeBase64Image(PNG_BASE64.replace(/(.{20})/g, '$1\n'))).toEqual(plain);
	});

	it('refuses what is no base64, and what is too large', () => {
		expect(() => decodeBase64Image('kein base64!')).toThrow(ImageError);
		expect(() => decodeBase64Image('')).toThrow(ImageError);
		expect(() => decodeBase64Image('A'.repeat(15 * 1024 * 1024))).toThrow(/zu groß/);
	});
});

describe('isPublicAddress', () => {
	it('allows addresses on the internet', () => {
		for (const address of ['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111']) {
			expect(isPublicAddress(address), address).toBe(true);
		}
	});

	it('refuses the server itself, private networks and metadata services', () => {
		for (const address of [
			'127.0.0.1',
			'10.1.2.3',
			'172.20.0.5',
			'192.168.178.1',
			'169.254.169.254',
			'100.100.1.1',
			'0.0.0.0',
			'::1',
			'::',
			'fd00::1',
			'fe80::1',
			'::ffff:127.0.0.1',
			'::ffff:7f00:1',
			'localhost',
			''
		]) {
			expect(isPublicAddress(address), address).toBe(false);
		}
	});
});

describe('downloadImage', () => {
	it('never reaches the local network', async () => {
		for (const url of [
			'http://127.0.0.1/bild.png',
			'http://[::1]/bild.png',
			'http://169.254.169.254/latest/meta-data',
			'http://localhost:9/bild.png'
		]) {
			await expect(downloadImage(url), url).rejects.toThrow(/keine öffentliche Adresse/);
		}
	});

	it('only uses http(s)', async () => {
		await expect(downloadImage('file:///etc/passwd')).rejects.toThrow(/http/);
		await expect(downloadImage('kein link')).rejects.toThrow(/keine gültige Adresse/);
	});
});

describe('imageFilename', () => {
	it('ends in the real type', () => {
		expect(imageFilename('image/png', 'Architektur')).toBe('Architektur.png');
		expect(imageFilename('image/jpeg', 'foto.png')).toBe('foto.jpg');
		expect(
			imageFilename('image/png', undefined, new URL('https://x.org/a/Mein%20Bild.png?x=1'))
		).toBe('Mein Bild.png');
		expect(imageFilename('image/gif')).toBe('bild.gif');
		expect(imageFilename('image/png', '../../etc/passwd')).toBe('....etcpasswd.png');
	});
});

describe('imageMarkdown', () => {
	it('keeps the alt text from ending the image early', () => {
		expect(imageMarkdown('Plan', '/api/files/abc')).toBe('![Plan](/api/files/abc)');
		expect(imageMarkdown('a] (b)\nc', '/api/files/abc')).toBe('![a\\] (b) c](/api/files/abc)');
	});
});
