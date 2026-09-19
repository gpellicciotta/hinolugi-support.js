# REST Client Upgrade Guide

Guide for migrating downstream JavaScript REST client libraries (`hinolugi-auth` and `hinolugi-counters`)
to the shared transport and error hierarchy modules in `@gpellicciotta/hinolugi-support.js`.

---

## Overview

The `hinolugi-auth` and `hinolugi-counters` client packages previously maintained independent,
near-identical copies of transport and error handling.
In v2.0.0, `@gpellicciotta/hinolugi-support.js` consolidates these into:
- `net.mjs`: URL construction, authorization header generation, `fetch`-based request execution, and the complete `ApiError` hierarchy.
- `dates.mjs`: wire date serialization (`toWireDate`, `fromWireDate`, `parseDate`) and relative/human formatting.

---

## Shared Modules Architecture

### `js/net.mjs`

Exports:
- `sendRequest(baseUrl, method, path, options)`: executes request via `fetch`, preserving auth's `options.headers` merging over default `Accept: application/json`, handling optional `redirect: 'manual'`, and returning `{ status, data, headers }`.
- `buildUrl(baseUrl, path, query)`: constructs query string handling scalar values and arrays.
- `basicAuthHeader(userName, password)`: generates standard `Basic <base64>` header value.
- `bearerAuthHeader(token)`: generates standard `Bearer <token>` header value.
- `redirectToHinolugiAuth(loginUrl, returnUrl)`: redirects browser to centralized auth.
- `ApiError`: base class carrying `message`, `status`, and parsed `body`.
- `AuthenticationError`: status 401.
- `ValidationError`: status 400.
- `NotFoundError`: status 400 where message matches regex patterns indicating missing resource. Inherits from `ValidationError`.
- `ConflictError`: status 409.
- `NOT_FOUND_PATTERNS`: regex patterns matching missing resource identifiers.
- `mapError(status, message, body)`: factory function mapping status code and message to the appropriate class.

### `js/dates.mjs`

Exports wire date helpers:
- `toWireDate(value)`: serializes Date objects to UTC ISO strings without milliseconds (`yyyy-MM-ddTHH:mm:ssZ`).
- `fromWireDate(value)`: deserializes server date strings into `Date` instances.
- `parseDate(value)`: alias for `fromWireDate`.

---

## Upgrading `hinolugi-auth`

### Update Dependencies

In `clients/js/package.json`, add `@gpellicciotta/hinolugi-support.js` under `dependencies`:

```json
{
  "dependencies": {
    "@gpellicciotta/hinolugi-support.js": "^0.83.0"
  }
}
```

### Re-export Errors

Replace local implementation with re-exports from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/net.mjs';
```

### Re-export HTTP Transport

Replace local implementation with re-exports from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/net.mjs';
```

### Verify Auth Client

Run the test suite in `clients/js/`:

```bash
npm test
```

All authentication, model conversion, and client request tests must pass without modification.

---

## Upgrading `hinolugi-counters`

### Update Dependencies

In `clients/js/package.json`, add `@gpellicciotta/hinolugi-support.js` under `dependencies`:

```json
{
  "dependencies": {
    "@gpellicciotta/hinolugi-support.js": "^0.83.0"
  }
}
```

### Re-export Errors

Re-export from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/net.mjs';
```

### Re-export HTTP Transport

Re-export from the shared library:

```javascript
export * from '@gpellicciotta/hinolugi-support.js/net.mjs';
```

Note: `parseDate` is exported as an alias to `fromWireDate`, ensuring full compatibility with existing counters client code.

### Synchronize Client Files to Webapp

Run the synchronization script to update webapp client copies:

```bash
node clients/js/scripts/sync-client.mjs
```

### Verify Counters Client

Run the client test suite:

```bash
npm test
```

Verify unit tests (`unit.test.mjs`), mutations matrix tests (`mutations-matrix.test.mjs`), and offline sync tests (`offline-sync.test.mjs`) all pass.
