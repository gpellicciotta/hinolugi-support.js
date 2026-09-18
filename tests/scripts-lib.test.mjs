import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { MIME_TYPES, createStaticServer, startStaticServer } from '../scripts/lib/static-server.mjs';
import { TourRecorder } from '../scripts/lib/tour-recorder.mjs';

function createTempDir(prefix = 'hinolugi-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

test('static-server: exports standard web MIME types', () => {
  assert.equal(MIME_TYPES['.html'], 'text/html; charset=utf-8');
  assert.equal(MIME_TYPES['.css'], 'text/css; charset=utf-8');
  assert.equal(MIME_TYPES['.js'], 'text/javascript; charset=utf-8');
  assert.equal(MIME_TYPES['.mjs'], 'text/javascript; charset=utf-8');
  assert.equal(MIME_TYPES['.json'], 'application/json');
  assert.equal(MIME_TYPES['.png'], 'image/png');
  assert.equal(MIME_TYPES['.svg'], 'image/svg+xml');
  assert.equal(MIME_TYPES['.woff2'], 'font/woff2');
});

test('static-server: server lifecycle and ephemeral port binding', async () => {
  const tmpDir = createTempDir();
  fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>Server Lifecycle</h1>');

  try {
    const handle = await startStaticServer({ rootDir: tmpDir, port: 0 });
    assert.ok(handle.port > 0, 'Should bind to a random available port');
    assert.equal(handle.host, '127.0.0.1');
    assert.equal(handle.url, `http://127.0.0.1:${handle.port}`);
    assert.ok(typeof handle.stop === 'function');

    const res = await fetch(`${handle.url}/index.html`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text, '<h1>Server Lifecycle</h1>');

    await handle.stop();

    await assert.rejects(
      async () => {
        await fetch(`${handle.url}/index.html`);
      },
      { name: 'TypeError' },
    );
  } finally {
    removeDir(tmpDir);
  }
});

test('static-server: fetches files, directory index, and handles HEAD requests', async () => {
  const tmpDir = createTempDir();
  fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>Home</h1>');
  fs.writeFileSync(path.join(tmpDir, 'style.css'), 'body { color: blue; }');
  fs.writeFileSync(path.join(tmpDir, 'app.mjs'), 'export const x = 42;');
  fs.writeFileSync(path.join(tmpDir, 'data.json'), JSON.stringify({ ok: true }));

  const subDir = path.join(tmpDir, 'nested');
  fs.mkdirSync(subDir);
  fs.writeFileSync(path.join(subDir, 'index.html'), '<p>Subpage</p>');

  const handle = await startStaticServer({ rootDir: tmpDir });

  try {
    // Direct file fetch
    const cssRes = await fetch(`${handle.url}/style.css`);
    assert.equal(cssRes.status, 200);
    assert.equal(cssRes.headers.get('content-type'), 'text/css; charset=utf-8');
    assert.equal(await cssRes.text(), 'body { color: blue; }');

    // JS module fetch
    const jsRes = await fetch(`${handle.url}/app.mjs`);
    assert.equal(jsRes.status, 200);
    assert.equal(jsRes.headers.get('content-type'), 'text/javascript; charset=utf-8');

    // JSON fetch
    const jsonRes = await fetch(`${handle.url}/data.json`);
    assert.equal(jsonRes.status, 200);
    assert.equal(jsonRes.headers.get('content-type'), 'application/json');
    assert.deepEqual(await jsonRes.json(), { ok: true });

    // Directory index resolution for root
    const rootRes = await fetch(`${handle.url}/`);
    assert.equal(rootRes.status, 200);
    assert.equal(rootRes.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(await rootRes.text(), '<h1>Home</h1>');

    // Directory index resolution for nested directory
    const nestedRes = await fetch(`${handle.url}/nested`);
    assert.equal(nestedRes.status, 200);
    assert.equal(await nestedRes.text(), '<p>Subpage</p>');

    // HEAD request
    const headRes = await fetch(`${handle.url}/index.html`, { method: 'HEAD' });
    assert.equal(headRes.status, 200);
    assert.equal(headRes.headers.get('content-type'), 'text/html; charset=utf-8');
    const headBody = await headRes.text();
    assert.equal(headBody, '');

    // Disallowed method
    const postRes = await fetch(`${handle.url}/index.html`, { method: 'POST' });
    assert.equal(postRes.status, 405);
  } finally {
    await handle.stop();
    removeDir(tmpDir);
  }
});

test('static-server: custom route prefixes, path aliases, and function routes', async () => {
  const rootDir = createTempDir('hinolugi-root-');
  const clientDir = createTempDir('hinolugi-clients-');
  const sharedDir = createTempDir('hinolugi-shared-');

  fs.writeFileSync(path.join(rootDir, 'index.html'), '<h1>Root</h1>');
  fs.writeFileSync(path.join(clientDir, 'client.js'), 'console.log("client");');
  fs.writeFileSync(path.join(sharedDir, 'CHANGELOG.md'), '# Changelog');

  const handle = await startStaticServer({
    rootDir,
    prefixes: {
      '/clients/js/src': clientDir,
    },
    routes: {
      '/CHANGELOG.md': path.join(sharedDir, 'CHANGELOG.md'),
      '/api/health': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy' }));
        return true;
      },
    },
  });

  try {
    // Prefix mapped directory
    const clientRes = await fetch(`${handle.url}/clients/js/src/client.js`);
    assert.equal(clientRes.status, 200);
    assert.equal(clientRes.headers.get('content-type'), 'text/javascript; charset=utf-8');
    assert.equal(await clientRes.text(), 'console.log("client");');

    // Exact mapped file
    const docRes = await fetch(`${handle.url}/CHANGELOG.md`);
    assert.equal(docRes.status, 200);
    assert.equal(docRes.headers.get('content-type'), 'text/markdown; charset=utf-8');
    assert.equal(await docRes.text(), '# Changelog');

    // Custom function route
    const healthRes = await fetch(`${handle.url}/api/health`);
    assert.equal(healthRes.status, 200);
    assert.deepEqual(await healthRes.json(), { status: 'healthy' });

    // Root file
    const rootRes = await fetch(`${handle.url}/index.html`);
    assert.equal(rootRes.status, 200);
    assert.equal(await rootRes.text(), '<h1>Root</h1>');
  } finally {
    await handle.stop();
    removeDir(rootDir);
    removeDir(clientDir);
    removeDir(sharedDir);
  }
});

test('static-server: 404 handling, fallbackToIndex, and path traversal protection', async () => {
  const tmpDir = createTempDir();
  fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>SPA Shell</h1>');

  const server404 = await startStaticServer({ rootDir: tmpDir, fallbackToIndex: false });

  try {
    const missingRes = await fetch(`${server404.url}/missing-page`);
    assert.equal(missingRes.status, 404);
    assert.ok((await missingRes.text()).includes('Not found: /missing-page'));

    const traversalRes = await fetch(`${server404.url}/../../../etc/passwd`);
    assert.ok(traversalRes.status === 403 || traversalRes.status === 404);
  } finally {
    await server404.stop();
  }

  const serverSpa = await startStaticServer({ rootDir: tmpDir, fallbackToIndex: true });
  try {
    const spaRes = await fetch(`${serverSpa.url}/dashboard/settings`);
    assert.equal(spaRes.status, 200);
    assert.equal(await spaRes.text(), '<h1>SPA Shell</h1>');
  } finally {
    await serverSpa.stop();
    removeDir(tmpDir);
  }
});

test('static-server: createStaticServer returns server with clean stop method', async () => {
  const tmpDir = createTempDir();
  fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>Raw Server</h1>');

  const server = createStaticServer({ rootDir: tmpDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/index.html`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '<h1>Raw Server</h1>');

  await server.stop();
  // Safe to call stop multiple times
  await server.stop();

  removeDir(tmpDir);
});

test('TourRecorder: disabled recorder bypasses capture and integrity checks', async () => {
  const recorder = new TourRecorder({ enabled: false });
  assert.equal(recorder.enabled, false);

  let screenshotCalled = false;
  const mockPage = {
    screenshot: async () => {
      screenshotCalled = true;
      return Buffer.alloc(6000, 1);
    },
  };

  const captured = await recorder.capture(mockPage, '01-step', 'Caption');
  assert.equal(captured, null);
  assert.equal(screenshotCalled, false);
  assert.equal(recorder.screenshots.length, 0);

  const integrity = recorder.validateIntegrity();
  assert.deepEqual(integrity, []);

  const reports = recorder.generateReports();
  assert.equal(reports, null);
});

test('TourRecorder: capture lifecycle, file creation, and metadata tracking', async () => {
  const tmpDir = createTempDir('hinolugi-tour-');

  try {
    const recorder = new TourRecorder({
      repoRoot: tmpDir,
      targetUrl: 'https://test.hinolugi.com',
      testUser: 'qa@hinolugi.com',
      targetVersion: '2.0.0',
    });

    const fakeImageBuffer = Buffer.alloc(7000, 0x41);
    let screenshotOptsReceived = null;

    const mockPage = {
      screenshot: async (opts) => {
        screenshotOptsReceived = opts;
        return fakeImageBuffer;
      },
    };

    const entry = await recorder.capture(mockPage, '01-sign-in.png', 'Sign In View', {
      action: 'Enter email and password',
      visualResult: 'Dashboard opens',
    });

    assert.equal(entry.name, '01-sign-in');
    assert.equal(entry.filename, '01-sign-in.png');
    assert.equal(entry.caption, 'Sign In View');
    assert.equal(entry.size, 7000);
    assert.equal(entry.action, 'Enter email and password');
    assert.equal(entry.visualResult, 'Dashboard opens');
    assert.deepEqual(screenshotOptsReceived, { fullPage: false });

    assert.ok(fs.existsSync(entry.fullPath), 'Screenshot should be saved to screenshotsDir');
    assert.ok(fs.existsSync(entry.archivePath), 'Screenshot should be saved to archiveDir');
    assert.equal(fs.readFileSync(entry.fullPath).length, 7000);

    const verified = recorder.validateIntegrity();
    assert.equal(verified.length, 1);
    assert.ok(verified[0].sha256);
    assert.equal(verified[0].sha256, crypto.createHash('sha256').update(fakeImageBuffer).digest('hex'));
  } finally {
    removeDir(tmpDir);
  }
});

test('TourRecorder: guards against blank frame (<5KB screenshot)', async () => {
  const tmpDir = createTempDir('hinolugi-tour-blank-');

  try {
    const recorder = new TourRecorder({ repoRoot: tmpDir, minByteSize: 5000 });

    const smallBuffer = Buffer.alloc(4500, 0x00);
    const mockPage = { screenshot: async () => smallBuffer };

    await recorder.capture(mockPage, '01-blank', 'Blank Screen');

    assert.throws(() => {
      recorder.validateIntegrity();
    }, /Screenshot 01-blank\.png is suspiciously small \(4500 bytes\), possible blank frame!/);
  } finally {
    removeDir(tmpDir);
  }
});

test('TourRecorder: detects visual regression from duplicate screenshot hash', async () => {
  const tmpDir = createTempDir('hinolugi-tour-dup-');

  try {
    const recorder = new TourRecorder({ repoRoot: tmpDir });

    const buffer = Buffer.alloc(6000, 0x55);
    const mockPage = { screenshot: async () => buffer };

    await recorder.capture(mockPage, '01-first-step', 'First Step');
    await recorder.capture(mockPage, '02-second-step', 'Second Step');

    assert.throws(() => {
      recorder.validateIntegrity();
    }, /Visual regression detected: Screenshot #2 \(02-second-step\.png\) is byte-for-byte identical to #1 \(01-first-step\.png\)/);
  } finally {
    removeDir(tmpDir);
  }
});

test('TourRecorder: allows configured duplicate screenshot pairs', async () => {
  const tmpDir = createTempDir('hinolugi-tour-allowed-');

  try {
    const recorder = new TourRecorder({
      repoRoot: tmpDir,
      allowedDuplicates: [['01-first-step', '02-second-step']],
    });

    const buffer = Buffer.alloc(6000, 0x77);
    const mockPage = { screenshot: async () => buffer };

    await recorder.capture(mockPage, '01-first-step', 'First Step');
    await recorder.capture(mockPage, '02-second-step', 'Second Step');

    const validated = recorder.validateIntegrity();
    assert.equal(validated.length, 2);
    assert.equal(validated[0].sha256, validated[1].sha256);
  } finally {
    removeDir(tmpDir);
  }
});

test('TourRecorder: generates walkthrough markdown, summary table, and reports on disk', async () => {
  const tmpDir = createTempDir('hinolugi-tour-reports-');

  try {
    const recorder = new TourRecorder({
      repoRoot: tmpDir,
      targetUrl: 'https://app.hinolugi.com',
      testUser: 'test@hinolugi.com',
      targetVersion: '1.2.3',
      nowIso: '2026-09-19T10:00:00.000Z',
      title: 'HiNoLuGi Test - Visual Tour',
      description: 'Tour description for verification.',
    });

    const buf1 = Buffer.alloc(6000, 0x11);
    const buf2 = Buffer.alloc(8000, 0x22);

    const mockPage1 = { screenshot: async () => buf1 };
    const mockPage2 = { screenshot: async () => buf2 };

    await recorder.capture(mockPage1, '01-welcome', 'Welcome Screen', {
      action: 'Navigate to base URL',
      visualResult: 'Welcome banner displayed',
    });
    await recorder.capture(mockPage2, '02-dashboard', 'Main Dashboard', {
      action: 'Click continue',
      visualResult: 'Dashboard grid rendered',
    });

    recorder.validateIntegrity();

    const table = recorder.generateSummaryTable();
    assert.ok(table.includes('| # | Step Name | File | Size | SHA-256 Checksum |'));
    assert.ok(table.includes('| 1 | Welcome Screen | `01-welcome.png` | 5.9 KB |'));
    assert.ok(table.includes('| 2 | Main Dashboard | `02-dashboard.png` | 7.8 KB |'));

    const markdown = recorder.generateWalkthroughMarkdown();
    assert.ok(markdown.includes('# HiNoLuGi Test - Visual Tour'));
    assert.ok(markdown.includes('**Target Environment**: `https://app.hinolugi.com`'));
    assert.ok(markdown.includes('**Version**: `v1.2.3`'));
    assert.ok(markdown.includes('### Welcome Screen'));
    assert.ok(markdown.includes('* **Action / Navigation**: Navigate to base URL'));
    assert.ok(markdown.includes('* **Visual Feedback**: Welcome banner displayed'));
    assert.ok(markdown.includes('![Welcome Screen](screenshots/01-welcome.png)'));

    const reports = recorder.generateReports();
    assert.ok(reports);
    assert.ok(fs.existsSync(reports.canonicalReportPath));
    assert.ok(fs.existsSync(reports.historicalReportPath));
    assert.ok(fs.existsSync(reports.historyIndexPath));

    const canonicalContent = fs.readFileSync(reports.canonicalReportPath, 'utf8');
    assert.equal(canonicalContent, markdown);

    const historyIndex = fs.readFileSync(reports.historyIndexPath, 'utf8');
    assert.ok(historyIndex.includes('# Visual Tour History Archive'));
    assert.ok(historyIndex.includes('2026-09-19-v1.2.3/ui-tour-report.md'));
  } finally {
    removeDir(tmpDir);
  }
});
