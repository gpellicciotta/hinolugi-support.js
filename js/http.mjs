/**
 * Low-level HTTP plumbing for REST client libraries: URL building, the fetch call itself,
 * response-body parsing, and mapping non-2xx responses onto the ApiError hierarchy.
 *
 * A genuine network or connection failure is a rejected fetch() promise that propagates unwrapped
 * so it is not mistaken for a server-side ApiError.
 */
import { mapError } from './errors.mjs';

/**
 * Builds a target URL from a base URL, path, and optional query parameters.
 * Supports scalar values as well as array values for repeated query keys.
 *
 * @param {string} baseUrl
 * @param {string} path Starts with or without `/`.
 * @param {Record<string, string|number|boolean|Array<string|number>|null|undefined>} [query]
 * @returns {string}
 */
export function buildUrl(baseUrl, path, query) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\//, '');
  const url = new URL(normalizedPath, normalizedBase);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      for (const v of Array.isArray(value) ? value : [value]) {
        url.searchParams.append(key, String(v));
      }
    }
  }
  return url.toString();
}

/**
 * Generates an `Authorization: Basic ...` header value.
 *
 * @param {string} userName
 * @param {string} [password]
 * @returns {string} `Authorization: Basic ...` header value.
 */
export function basicAuthHeader(userName, password) {
  const str = `${userName}:${password ?? ''}`;
  const base64 = typeof btoa === 'function' ? btoa(str) : Buffer.from(str, 'utf8').toString('base64');
  return `Basic ${base64}`;
}

/**
 * Generates an `Authorization: Bearer ...` header value.
 *
 * @param {string} token
 * @returns {string} `Authorization: Bearer ...` header value.
 */
export function bearerAuthHeader(token) {
  return `Bearer ${token}`;
}

/**
 * Issues one HTTP request and returns the parsed result, or throws an ApiError subclass for
 * any non-2xx response.
 *
 * @param {string} baseUrl
 * @param {string} method
 * @param {string} path
 * @param {Object} [options]
 * @param {Record<string, *>} [options.query]
 * @param {*} [options.jsonBody] Serialized as the JSON request body when present.
 * @param {string} [options.authHeader] Full Authorization header value, if any.
 * @param {Record<string, string>} [options.headers] Additional request headers merged over defaults.
 * @param {'follow'|'manual'|'error'} [options.redirect] Redirect handling mode; defaults to 'follow'.
 * @param {RequestCredentials} [options.credentials] Request credentials mode; defaults to 'same-origin'.
 * @returns {Promise<{status: number, data: *, headers: Headers}>}
 */
export async function sendRequest(baseUrl, method, path, options = {}) {
  const {
    query,
    jsonBody,
    authHeader,
    headers: extraHeaders,
    redirect = 'follow',
    credentials = 'same-origin',
  } = options;

  const url = buildUrl(baseUrl, path, query);
  const headers = { Accept: 'application/json', ...(extraHeaders || {}) };

  if (authHeader) {
    headers.Authorization = authHeader;
  }
  let body;
  if (jsonBody !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(jsonBody);
  }

  const fetchOptions = {
    method,
    headers,
    body,
    redirect,
  };
  if (credentials) {
    fetchOptions.credentials = credentials;
  }

  // Network/connection failures reject here unwrapped.
  const response = await fetch(url, fetchOptions);

  if (redirect === 'manual' && response.status >= 300 && response.status < 400) {
    return { status: response.status, data: null, headers: response.headers };
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data && typeof data.message === 'string' ? data.message : response.statusText;
    throw mapError(response.status, message, data);
  }

  return { status: response.status, data, headers: response.headers };
}

/**
 * Formats a Date the way the server's UTC JSON adapter expects:
 * `"yyyy-MM-dd'T'HH:mm:ss'Z'"`, UTC without milliseconds. Returns null/undefined unchanged.
 *
 * @param {Date|null|undefined} value
 * @returns {string|null|undefined}
 */
export function toWireDate(value) {
  if (value === null || value === undefined) {
    return value;
  }
  return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Parses a server UTC date-time string into a real Date. Passing an existing Date,
 * null, or undefined is a safe passthrough.
 *
 * @param {string|number|Date|null|undefined} value
 * @returns {Date|null|undefined}
 */
export function fromWireDate(value) {
  if (value === null || value === undefined || value instanceof Date) {
    return value;
  }
  return new Date(value);
}

/**
 * Alias for fromWireDate for consistency with counters client usage.
 */
export const parseDate = fromWireDate;

export { mapError } from './errors.mjs';
