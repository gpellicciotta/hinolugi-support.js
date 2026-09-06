import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  buildUrl,
  basicAuthHeader,
  bearerAuthHeader,
  sendRequest,
  toWireDate,
  fromWireDate,
  parseDate,
} from '../js/http.mjs';
import { ApiError, AuthenticationError, ValidationError, NotFoundError, ConflictError } from '../js/errors.mjs';

test('buildUrl handles baseUrl slashes and query parameter variants', () => {
  assert.equal(buildUrl('https://api.example.com', '/users'), 'https://api.example.com/users');
  assert.equal(buildUrl('https://api.example.com/', 'users'), 'https://api.example.com/users');
  assert.equal(buildUrl('https://api.example.com/api', '/users/42'), 'https://api.example.com/api/users/42');

  const queryUrl = buildUrl('https://api.example.com', '/search', {
    q: 'hello world',
    page: 2,
    active: true,
    empty: null,
    skipped: undefined,
    tag: ['tag1', 'tag2'],
  });
  const parsed = new URL(queryUrl);
  assert.equal(parsed.searchParams.get('q'), 'hello world');
  assert.equal(parsed.searchParams.get('page'), '2');
  assert.equal(parsed.searchParams.get('active'), 'true');
  assert.equal(parsed.searchParams.has('empty'), false);
  assert.equal(parsed.searchParams.has('skipped'), false);
  assert.deepEqual(parsed.searchParams.getAll('tag'), ['tag1', 'tag2']);
});

test('basicAuthHeader and bearerAuthHeader produce valid Authorization values', () => {
  const basic = basicAuthHeader('alice', 'secret123');
  assert.equal(basic, 'Basic YWxpY2U6c2VjcmV0MTIz');

  const basicEmptyPassword = basicAuthHeader('bob', null);
  assert.equal(basicEmptyPassword, 'Basic Ym9iOg==');

  const bearer = bearerAuthHeader('tok-xyz-999');
  assert.equal(bearer, 'Bearer tok-xyz-999');
});

test('toWireDate and fromWireDate / parseDate handle server date formats safely', () => {
  assert.equal(toWireDate(null), null);
  assert.equal(toWireDate(undefined), undefined);

  const testDate = new Date('2026-09-06T10:15:30.123Z');
  assert.equal(toWireDate(testDate), '2026-09-06T10:15:30Z');

  const parsed = fromWireDate('2026-09-06T10:15:30Z');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.toISOString(), '2026-09-06T10:15:30.000Z');

  assert.equal(fromWireDate(null), null);
  assert.equal(fromWireDate(undefined), undefined);
  assert.equal(fromWireDate(testDate), testDate);

  // parseDate is an alias to fromWireDate
  assert.equal(parseDate, fromWireDate);
});

test('sendRequest performs successful GET request and returns status, data, headers', async () => {
  const server = http.createServer((req, res) => {
    assert.equal(req.method, 'GET');
    assert.equal(req.url, '/api/test?filter=active');
    assert.equal(req.headers.accept, 'application/json');
    res.writeHead(200, { 'Content-Type': 'application/json', 'X-Server-Version': '1.0' });
    res.end(JSON.stringify({ result: 'ok', count: 1 }));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const response = await sendRequest(baseUrl, 'GET', '/api/test', {
      query: { filter: 'active' },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, { result: 'ok', count: 1 });
    assert.equal(response.headers.get('x-server-version'), '1.0');
  } finally {
    server.close();
  }
});

test('sendRequest preserves auth options.headers merging behavior and authHeader', async () => {
  let receivedHeaders = null;
  let receivedBody = null;

  const server = http.createServer(async (req, res) => {
    receivedHeaders = req.headers;
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    receivedBody = Buffer.concat(chunks).toString();
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ created: true }));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const payload = { username: 'testuser', role: 'admin' };
    const response = await sendRequest(baseUrl, 'POST', '/api/users', {
      authHeader: 'Bearer token-123',
      jsonBody: payload,
      headers: {
        'X-Trace-Id': 'trace-987',
        Accept: 'application/vnd.api+json',
      },
    });

    assert.equal(response.status, 201);
    assert.deepEqual(response.data, { created: true });
    assert.equal(receivedHeaders.authorization, 'Bearer token-123');
    assert.equal(receivedHeaders['x-trace-id'], 'trace-987');
    assert.equal(receivedHeaders.accept, 'application/vnd.api+json');
    assert.equal(receivedHeaders['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(receivedBody), payload);
  } finally {
    server.close();
  }
});

test('sendRequest maps error responses into ApiError subclasses', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/err401') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Token expired' }));
    } else if (req.url === '/err400-notfound') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'No counter with id 99' }));
    } else if (req.url === '/err400-val') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Validation failed' }));
    } else if (req.url === '/err409') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Name already taken' }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal crash' }));
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await assert.rejects(
      async () => sendRequest(baseUrl, 'GET', '/err401'),
      (err) => err instanceof AuthenticationError && err.status === 401 && err.message === 'Token expired',
    );

    await assert.rejects(
      async () => sendRequest(baseUrl, 'GET', '/err400-notfound'),
      (err) => err instanceof NotFoundError && err instanceof ValidationError && err.status === 400,
    );

    await assert.rejects(
      async () => sendRequest(baseUrl, 'GET', '/err400-val'),
      (err) => err instanceof ValidationError && !(err instanceof NotFoundError) && err.status === 400,
    );

    await assert.rejects(
      async () => sendRequest(baseUrl, 'GET', '/err409'),
      (err) => err instanceof ConflictError && err.status === 409,
    );

    await assert.rejects(
      async () => sendRequest(baseUrl, 'GET', '/err500'),
      (err) => err instanceof ApiError && err.status === 500,
    );
  } finally {
    server.close();
  }
});

test('sendRequest handles redirect manual without following or erroring on 3xx', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(302, { Location: '/target' });
    res.end();
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await sendRequest(baseUrl, 'GET', '/redirect', {
      redirect: 'manual',
    });
    assert.equal(res.status, 302);
    assert.equal(res.data, null);
    assert.equal(res.headers.get('location'), '/target');
  } finally {
    server.close();
  }
});

test('sendRequest allows network connection errors to propagate unwrapped', async () => {
  // Unused random high port on localhost
  const closedBaseUrl = 'http://127.0.0.1:59999';
  await assert.rejects(
    async () => sendRequest(closedBaseUrl, 'GET', '/test'),
    (err) => {
      // Must NOT be an ApiError
      assert.ok(!(err instanceof ApiError));
      assert.ok(err instanceof TypeError || err.code === 'ECONNREFUSED');
      return true;
    },
  );
});
