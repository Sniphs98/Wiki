// Production HTTP benchmark with synthetic pages and a controllably slow
// embeddings service. Uses a disposable SQLite DB, never the developer's data.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { chromium } from 'playwright';

const pageCount = Number(process.env.SEARCH_BENCH_PAGES || 200);
assert(Number.isInteger(pageCount) && pageCount > 0 && pageCount <= 100_000);
const scratch = await mkdtemp(join(tmpdir(), 'wiki-search-'));
const children = [];
const runtimeDirs = [];
let embeddingDelay = 0;
const timers = new Set();
const embeddings = createServer(async (request, response) => {
	let body = '';
	for await (const chunk of request) body += chunk;
	const { input } = JSON.parse(body);
	const texts = [input].flat();
	const respond = () => {
		if (response.destroyed) return;
		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(JSON.stringify({ data: texts.map((_, index) => ({ index, embedding: [1, 0] })) }));
	};
	if (texts.length === 1 && texts[0] === 'Suchmessung' && embeddingDelay) {
		const timer = setTimeout(() => {
			timers.delete(timer);
			respond();
		}, embeddingDelay);
		timers.add(timer);
	} else respond();
});

function launch(command, args, extraEnv) {
	const child = spawn(command, args, {
		env: { ...process.env, ...extraEnv },
		stdio: ['ignore', 'pipe', 'pipe']
	});
	children.push(child);
	let output = '';
	child.stdout.on('data', (chunk) => (output = (output + chunk).slice(-20_000)));
	child.stderr.on('data', (chunk) => (output = (output + chunk).slice(-20_000)));
	const done = new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', (code, signal) => {
			if (code === 0 || signal === 'SIGTERM') resolve();
			else reject(new Error(`${command} exited ${code}\n${output}`));
		});
	});
	// A server can fail while we wait for HTTP readiness; report it there.
	void done.catch(() => {});
	return { child, done, output: () => output };
}

async function freePort() {
	const server = createServer();
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return port;
}

async function ready(url, process) {
	let lastFailure = '';
	for (let attempt = 0; attempt < 80; attempt++) {
		if (process.child.exitCode !== null) {
			throw new Error(`Server exited before readiness:\n${process.output()}`);
		}
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
			if (response.ok) return;
			lastFailure = `HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`;
		} catch (error) {
			lastFailure = `${error.message}: ${error.cause?.message ?? ''}`;
		}
		await delay(250);
	}
	throw new Error(`Server did not start (${url}): ${lastFailure}\n${process.output()}`);
}

async function sample(url, label, cookie = '') {
	const start = performance.now();
	const response = await fetch(url, {
		headers: { cookie },
		signal: AbortSignal.timeout(20_000)
	});
	const body = await response.text();
	assert.equal(response.status, 200);
	assert(
		/<ol\b[^>]*>[\s\S]*?Performance Seite[\s\S]*?<\/ol>/.test(body),
		'Expected a full-text result in the results list, not just an HTTP 200 or a sidebar entry'
	);
	const timing = response.headers.get('server-timing');
	assert(timing?.includes('fulltext;dur='), 'Missing diagnostic timings');
	const ms = performance.now() - start;
	console.log(`${label}: HTTP ${ms.toFixed(1)} ms | ${timing}`);
	return { ms, timing };
}

async function browserSample(origin, cookie = '') {
	const browser = await chromium.launch();
	try {
		const context = await browser.newContext();
		if (cookie) {
			await context.addCookies(
				cookie.split('; ').map((entry) => {
					const at = entry.indexOf('=');
					return { name: entry.slice(0, at), value: entry.slice(at + 1), url: origin };
				})
			);
		}
		const page = await context.newPage();
		await page.goto(`${origin}/wiki/suche`);
		await page.getByRole('searchbox', { name: 'Suchbegriff', exact: true }).fill('Suchmessung');
		const response = page.waitForResponse((response) => {
			const url = new URL(response.url());
			return url.pathname.includes('/suche') && url.searchParams.get('q') === 'Suchmessung';
		});
		const start = performance.now();
		await page.getByRole('button', { name: 'Suchen', exact: true }).click();
		await page.locator('ol li a').first().waitFor();
		assert((await page.locator('ol li a').first().textContent()).includes('Performance Seite'));
		const headers = await (await response).allHeaders();
		console.log(
			`Browser / submit to visible results: ${(performance.now() - start).toFixed(1)} ms | ${headers['server-timing']}`
		);
		assert(headers['server-timing']?.includes('fulltext;dur='));
	} finally {
		await browser.close();
	}
}

try {
	const env = {
		DATABASE_DIALECT: 'sqlite',
		DATABASE_URL: join(scratch, 'wiki.db'),
		BETTER_AUTH_SECRET: 'search-benchmark-only-000000000000000000000',
		AUTH_MODE: 'disabled',
		ALLOW_SIGNUP: 'true',
		PASSWORD_LOGIN: 'true',
		MICROSOFT_CLIENT_ID: '',
		MICROSOFT_CLIENT_SECRET: '',
		MICROSOFT_TENANT_ID: '',
		BASE_PATH: '/wiki',
		ORIGIN: 'http://localhost:3000',
		EMBEDDINGS_URL: '',
		EMBEDDINGS_MODEL: '',
		SEARCH_DIAGNOSTICS: 'true'
	};
	console.log(`Building production app; creating ${pageCount} synthetic pages in a temporary DB.`);
	await launch(process.execPath, ['scripts/migrate.js'], env).done;
	const db = new Database(env.DATABASE_URL);
	const insertPage = db.prepare('INSERT INTO page (id, path, title) VALUES (?, ?, ?)');
	const insertVersion = db.prepare(
		'INSERT INTO page_version (id, page_id, version_number, title, content) VALUES (?, ?, 1, ?, ?)'
	);
	db.transaction(() => {
		for (let i = 0; i < pageCount; i++) {
			const id = randomUUID();
			const title = `Performance Seite ${i}`;
			insertPage.run(id, `performance/seite-${i}`, title);
			insertVersion.run(
				randomUUID(),
				id,
				title,
				`# ${title}\n\n${'Suchmessung: Technische Dokumentation und Sicherung im Betrieb. '.repeat(100)}`
			);
		}
	})();
	db.close();
	if (process.env.SEARCH_BENCH_SKIP_BUILD !== 'true') {
		await launch(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], env).done;
	}
	await new Promise((resolve) => embeddings.listen(0, '127.0.0.1', resolve));
	const embeddingPort = embeddings.address().port;

	for (const scenario of [
		{ semantic: false, authenticated: false },
		{ semantic: false, authenticated: true },
		{ semantic: true, authenticated: true }
	]) {
		const { semantic, authenticated } = scenario;
		const port = await freePort();
		const origin = `http://127.0.0.1:${port}`;
		const runtimeDir = join('.runtime', `search-benchmark-${randomUUID()}`);
		runtimeDirs.push(runtimeDir);
		const server = launch(process.execPath, ['scripts/start.js'], {
			...env,
			HOST: '127.0.0.1',
			PORT: String(port),
			ORIGIN: origin,
			AUTH_MODE: authenticated ? 'full' : 'disabled',
			RUNTIME_DIR: runtimeDir,
			EMBEDDINGS_URL: semantic ? `http://127.0.0.1:${embeddingPort}/v1` : '',
			EMBEDDINGS_MODEL: semantic ? 'benchmark' : ''
		});
		await ready(`${origin}/wiki/login`, server);
		let cookie = '';
		if (authenticated) {
			const signup = await fetch(`${origin}/wiki/api/auth/sign-up/email`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', origin },
				body: JSON.stringify({
					email: `benchmark-${randomUUID()}@example.test`,
					password: 'benchmark-only-password-000000',
					name: 'Performance Test'
				})
			});
			assert.equal(signup.status, 200, await signup.text());
			cookie = signup.headers
				.getSetCookie()
				.map((value) => value.split(';')[0])
				.join('; ');
			assert(cookie, 'Signup did not create a session');
		}
		console.log(`Scenario: ${authenticated ? 'authenticated (AUTH_MODE=full)' : 'anonymous'}`);
		const url = `${origin}/wiki/suche?q=Suchmessung`;
		if (!semantic) {
			await sample(url, 'Full-text / first request', cookie);
			const samples = [];
			for (let i = 0; i < 5; i++)
				samples.push((await sample(url, `Full-text / warm ${i + 1}`, cookie)).ms);
			console.log(`Full-text median: ${samples.sort((a, b) => a - b)[2].toFixed(1)} ms`);
			await browserSample(origin, cookie);
		} else {
			embeddingDelay = 1500;
			const slow = await sample(url, 'Embeddings / 1500 ms delay', cookie);
			const duration = (name, timing) =>
				Number(timing.match(new RegExp(`${name};dur=([\\d.]+)`))?.[1]);
			assert(
				duration('embedding', slow.timing) >= 1400,
				'Did not reproduce the slow embedding call'
			);
			embeddingDelay = 6500;
			const timeout = await sample(url, 'Embeddings / 6500 ms delay (5000 ms timeout)', cookie);
			assert(duration('embedding', timeout.timing) >= 4500, 'Did not exercise the timeout');
			assert(duration('embedding', timeout.timing) < 6500, 'Embedding timeout was not enforced');
		}
		server.child.kill('SIGTERM');
		await server.done;
	}
	console.log('PASS: results verified for full-text, delayed embeddings and embedding timeout.');
} finally {
	for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
	for (const timer of timers) clearTimeout(timer);
	embeddings.closeAllConnections();
	await new Promise((resolve) => embeddings.close(resolve));
	await rm(scratch, { recursive: true, force: true });
	for (const dir of runtimeDirs) await rm(dir, { recursive: true, force: true });
}
