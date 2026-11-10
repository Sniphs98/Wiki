import { BlockList, isIP, type LookupFunction } from 'node:net';
import { lookup as dnsLookup } from 'node:dns';
import { request as httpRequest, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { MAX_ATTACHMENT_SIZE } from '$lib/server/attachment-limits';

/** Why an image couldn't be taken — the message is for the assistant, in German. */
export class ImageError extends Error {}

const tooLarge = () =>
	new ImageError(
		`Das Bild ist zu groß (max. ${Math.round(MAX_ATTACHMENT_SIZE / 1024 / 1024)} MB).`
	);

const EXTENSIONS: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/bmp': 'bmp'
};

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
	signature.every((byte, i) => bytes[offset + i] === byte);

const ascii = (bytes: Uint8Array, from: number, to: number) =>
	String.fromCharCode(...bytes.subarray(from, to));

/**
 * The image type, read from the file's first bytes rather than taken from
 * whoever sent it. Only types the wiki shows inline — no SVG, which can
 * carry scripts. null: not an image the wiki takes.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
	if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
	if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') return 'image/gif';
	if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp';
	if (ascii(bytes, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 12))) {
		return 'image/avif';
	}
	if (ascii(bytes, 0, 2) === 'BM' && bytes.length > 14) return 'image/bmp';
	return null;
}

/** Base64, plain or as a data URL (`data:image/png;base64,…`). */
export function decodeBase64Image(data: string): Buffer {
	const body = data
		.trim()
		.replace(/^data:[^,]*;base64,/i, '')
		.replace(/\s+/g, '');
	if (!body || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(body)) {
		throw new ImageError('`data` ist kein gültiges Base64.');
	}
	// Checked before decoding, so a huge string isn't decoded only to be refused.
	if (Math.floor((body.length * 3) / 4) > MAX_ATTACHMENT_SIZE + 2) throw tooLarge();
	return Buffer.from(body, 'base64');
}

// Addresses a wiki server must never be sent to on an assistant's say-so:
// itself, the network it runs in, and the cloud's metadata services.
const blocked = new BlockList();
for (const [net, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['224.0.0.0', 4],
	['240.0.0.0', 4]
] as const) {
	blocked.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
	['::', 128],
	['::1', 128],
	['64:ff9b::', 96],
	['100::', 64],
	['fc00::', 7],
	['fe80::', 10],
	['fec0::', 10],
	['ff00::', 8]
] as const) {
	blocked.addSubnet(net, prefix, 'ipv6');
}

/** Whether an address is on the public internet, not in a private or special range. */
export function isPublicAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) return !blocked.check(address, 'ipv4');
	if (family !== 6) return false;
	// IPv4 inside IPv6 (::ffff:10.0.0.1) counts as that IPv4 address.
	const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
	if (mapped) return isPublicAddress(mapped[1]);
	if (/^::ffff:/i.test(address)) return false;
	return !blocked.check(address, 'ipv6');
}

const notPublic = (host: string) =>
	new ImageError(
		`"${host}" ist keine öffentliche Adresse. Bilder lassen sich nur von öffentlichen ` +
			'Adressen im Internet laden – schicke ein Bild aus dem eigenen Netz als `data` (Base64).'
	);

/**
 * Resolves a host and refuses it if any of its addresses isn't public.
 * Used as the connection's own lookup, so the address checked is the one
 * connected to — a second DNS answer can't slip in between.
 */
const publicLookup: LookupFunction = (hostname, options, callback) => {
	dnsLookup(hostname, { family: options.family ?? 0, all: true }, (err, addresses) => {
		if (err) return callback(err, '');
		if (addresses.length === 0 || addresses.some((a) => !isPublicAddress(a.address))) {
			return callback(notPublic(hostname), '');
		}
		if (options.all) return callback(null, addresses);
		callback(null, addresses[0].address, addresses[0].family);
	});
};

const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

function get(url: URL, signal: AbortSignal): Promise<IncomingMessage> {
	const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
	return new Promise((resolve, reject) => {
		const req = send(url, {
			method: 'GET',
			lookup: publicLookup,
			signal,
			headers: { accept: 'image/*', 'user-agent': 'Wiki-Bildimport' }
		});
		req.on('response', resolve);
		req.on('error', reject);
		req.end();
	});
}

async function readBody(response: IncomingMessage): Promise<Buffer> {
	const declared = Number(response.headers['content-length']);
	if (declared > MAX_ATTACHMENT_SIZE) {
		response.destroy();
		throw tooLarge();
	}
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of response) {
		size += chunk.length;
		if (size > MAX_ATTACHMENT_SIZE) {
			response.destroy();
			throw tooLarge();
		}
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

/**
 * Downloads an image from the internet: only http(s), only public
 * addresses (also after a redirect), at most MAX_ATTACHMENT_SIZE, and not
 * longer than a few seconds.
 */
export async function downloadImage(address: string): Promise<{ data: Buffer; url: URL }> {
	let url: URL;
	try {
		url = new URL(address);
	} catch {
		throw new ImageError(`"${address}" ist keine gültige Adresse.`);
	}
	const signal = AbortSignal.timeout(TIMEOUT_MS);

	for (let redirects = 0; ; redirects++) {
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			throw new ImageError('Bilder lassen sich nur über http(s) laden.');
		}
		if (url.username || url.password) {
			throw new ImageError('Adressen mit Zugangsdaten werden nicht geladen.');
		}
		const host = url.hostname.replace(/^\[|\]$/g, '');
		// An address as the host is connected to directly, without a lookup.
		if (isIP(host) && !isPublicAddress(host)) throw notPublic(host);

		let response: IncomingMessage;
		try {
			response = await get(url, signal);
		} catch (err) {
			if (err instanceof ImageError) throw err;
			if (signal.aborted) throw new ImageError('Das Bild hat zu lange zum Laden gebraucht.');
			throw new ImageError(`Das Bild ließ sich nicht laden (${(err as Error).message}).`);
		}

		const status = response.statusCode ?? 0;
		const location = response.headers.location;
		if ([301, 302, 303, 307, 308].includes(status) && location) {
			response.resume();
			if (redirects >= MAX_REDIRECTS) throw new ImageError('Zu viele Weiterleitungen.');
			url = new URL(location, url);
			continue;
		}
		if (status !== 200) {
			response.resume();
			throw new ImageError(`Das Bild ließ sich nicht laden (HTTP ${status}).`);
		}
		try {
			return { data: await readBody(response), url };
		} catch (err) {
			if (err instanceof ImageError) throw err;
			if (signal.aborted) throw new ImageError('Das Bild hat zu lange zum Laden gebraucht.');
			throw new ImageError(`Das Bild ließ sich nicht laden (${(err as Error).message}).`);
		}
	}
}

/**
 * A filename for the upload, ending in the image's real type: the given
 * name if there is one, else the last part of the address, else "bild".
 */
export function imageFilename(mimeType: string, given?: string, from?: URL): string {
	let name = given?.trim() ?? '';
	if (!name && from) {
		try {
			name = decodeURIComponent(from.pathname.split('/').pop() ?? '');
		} catch {
			name = '';
		}
	}
	// eslint-disable-next-line no-control-regex
	name = name.replace(/[\\/\u0000-\u001f]/g, '').trim();
	const extension = EXTENSIONS[mimeType];
	const stem = name.replace(/\.[A-Za-z0-9]{1,5}$/, '').slice(0, 150) || 'bild';
	return `${stem}.${extension}`;
}

/** Markdown for the image; `]` and `\` in the alt text can't end it early. */
export function imageMarkdown(alt: string, path: string): string {
	const text = alt.replace(/[\r\n]+/g, ' ').replace(/([\\[\]])/g, '\\$1');
	return `![${text}](${path})`;
}
