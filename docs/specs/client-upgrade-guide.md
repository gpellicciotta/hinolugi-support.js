# REST Client Upgrade Guide

Guide for migrating downstream JavaScript REST client libraries (`hinolugi-auth` and `hinolugi-counters`)
to the shared transport and error hierarchy modules in `@gpellicciotta/hinolugi-support.js`.

---

## Overview

The `hinolugi-auth` and `hinolugi-counters` client packages previously maintained independent,
near-identical copies of:
- `http.mjs`: URL construction, authorization header generation, wire date helpers, and `fetch`-based request execution.
- `errors.mjs`: `ApiError` base class, typed subclasses (`AuthenticationError`, `ValidationError`, `NotFoundError`, `ConflictError`), and status-to-exception mapping (`mapError`).

The shared modules in `@gpellicciotta/hinolugi-support.js` combine both feature sets into a unified,
backward-compatible implementation.

---

## Shared Modules Architecture

### `js/errors.mjs`

Exports:
- `ApiError`: base class carrying `message`, `status`, and parsed `body`.
- `AuthenticationError`: status 401.
- `ValidationError`: status 400.
- `NotFoundError`: status 400 where message matches regex patterns indicating missing resource. Inherits from `ValidationError`.
- `ConflictError`: status 409.
- `NOT_FOUND_PATTERNS`: regex patterns matching missing resource identifiers.
- `mapError(status, message, body)`: factory function mapping status code and message to the appropriate class.

### `js/http.mjs`

Exports:
- `buildUrl(baseUrl, path, query)`: constructs query string handling scalar values and arrays.
- `basicAuthHeader(userName, password)`: generates standard `Basic <base64>` header value.
- `bearerAuthHeader(token)`: generates standard `Bearer <token>` header value.
- `sendRequest(baseUrl, method, path, options)`: executes request via `fetch`, preserving auth's `options.headers` merging over default `Accept: application/json`, handling optional `redirect: 'manual'`, and returning `{ status, data, headers }`.
- `toWireDate(value)`: serializes Date objects to UTC ISO strings without milliseconds (`yyyy-MM-ddTHH:mm:ssZ`).
- `fromWireDate(value)`: deserializes server date strings into `Date` instances.
- `parseDate(value)`: alias for `fromWireDate`.
- `mapError`: re-exported from `errors.mjs`.

---

## Upgrading `hinolugi-auth`

### 1. Update Dependencies

In `clients/js/package.json`, add `@gpellicciotta/hinolugi-support.js` under `dependencies`:

```json
{
  "dependencies": {
    "@gpellicciotta/hinolugi-support.js": "^0.83.0"
  }
}
```

### 2. Update `clients/js/src/errors.mjs`

Replace local implementation with re-exports from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/errors.mjs';
```

### 3. Update `clients/js/src/http.mjs`

Replace local implementation with re-exports from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/http.mjs';
```

### 4. Verification

Run the test suite in `clients/js/`:

```bash
npm test
```

All authentication, model conversion, and client request tests must pass without modification.

---

## Upgrading `hinolugi-counters`

### 1. Update Dependencies

In `clients/js/package.json`, add `@gpellicciotta/hinolugi-support.js` under `dependencies`:

```json
{
  "dependencies": {
    "@gpellicciotta/hinolugi-support.js": "^0.83.0"
  }
}
```

### 2. Update `clients/js/src/errors.mjs`

Re-export from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/errors.mjs';
```

### 3. Update `clients/js/src/http.mjs`

Re-export from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/http.mjs';
```

Note: `parseDate` is exported as an alias to `fromWireDate`, ensuring full compatibility with existing counters client code.

### 4. Synchronize Client Files to Webapp

Run the synchronization script to update webapp client copies:

```bash
node clients/js/scripts/sync-client.mjs
```

### 5. Verification

Run the client test suite:

```bash
npm test
```

Verify unit tests (`unit.test.mjs`), mutations matrix tests (`mutations-matrix.test.mjs`), and offline sync tests (`offline-sync.test.mjs`) all pass.
