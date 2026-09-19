/**
 * HTTP client transport, URL building, authorization headers, SSO redirection, and REST error hierarchy.
 */

/**
 * Base class for every error reported by the server.
 */
export class ApiError extends Error {
  /**
   * @param {string} message Human-readable error description.
   * @param {number} status HTTP status code.
   * @param {*} [body=null] Optional parsed response body payload.
   */
  constructor(message, status, body = null) {
    super(message);
    this.name = this.constructor.name;
    /** @type {number} */
    this.status = status;
    /** @type {*} */
    this.body = body;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** 401 - missing, bad, or expired credentials/auth token. */
export class AuthenticationError extends ApiError {}

/** 400 - bad request. */
export class ValidationError extends ApiError {}

/**
 * A 400 response whose message specifically indicates "no such resource by id".
 */
export class NotFoundError extends ValidationError {}

/** 409 - a name collision or conflict on a resource. */
export class ConflictError extends ApiError {}

/**
 * Regex patterns matched against 400 response messages to infer NotFoundError.
 * @type {RegExp[]}
 */
export const NOT_FOUND_PATTERNS = [/invalid.*id/i, /no .* with id/i, /not found/i, /does not exist/i, /is not valid/i];

/**
 * Maps an HTTP status code + parsed error envelope into the appropriate ApiError subclass.
 *
 * @param {number} status HTTP response status code.
 * @param {string} [message] Error message string.
 * @param {*} [body=null] Optional response payload.
 * @returns {ApiError} Instance of ApiError or appropriate subclass.
 */
export function mapError(status, message, body = null) {
  const text = message || '';
  if (status === 401) {
    return new AuthenticationError(text || 'authentication failed', status, body);
  }
  if (status === 409) {
    return new ConflictError(text || 'conflict', status, body);
  }
  if (status === 400) {
    if (NOT_FOUND_PATTERNS.some((re) => re.test(text))) {
      return new NotFoundError(text || 'not found', status, body);
    }
    return new ValidationError(text || 'bad request', status, body);
  }
  return new ApiError(text || `request failed with status ${status}`, status, body);
}

/**
 * Builds a target URL from a base URL, path, and optional query parameters.
 *
 * @param {string} baseUrl Origin or root API URL.
 * @param {string} path Endpoint path relative to base.
 * @param {Record<string, string|number|boolean|Array<string|number>|null|undefined>} [query] Query parameters object.
 * @returns {string} Serialized absolute URL.
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
 * @param {string} userName Username or client ID.
 * @param {string} [password] Password or secret.
 * @returns {string} HTTP Basic authorization header string.
 */
export function basicAuthHeader(userName, password) {
  const str = `${userName}:${password ?? ''}`;
  const base64 = typeof btoa === 'function' ? btoa(str) : Buffer.from(str, 'utf8').toString('base64');
  return `Basic ${base64}`;
}

/**
 * Generates an `Authorization: Bearer ...` header value.
 *
 * @param {string} token Bearer or access token.
 * @returns {string} HTTP Bearer authorization header string.
 */
export function bearerAuthHeader(token) {
  return `Bearer ${token}`;
}

/**
 * Issues one HTTP request and returns the parsed result, throwing an ApiError subclass for non-2xx responses.
 *
 * @param {string} baseUrl Target origin or base URL.
 * @param {string} method HTTP verb ('GET', 'POST', 'PUT', etc.).
 * @param {string} path Path to endpoint.
 * @param {Object} [options] Optional request options.
 * @param {Record<string, *>} [options.query] Query parameters.
 * @param {*} [options.jsonBody] Payload to serialize as JSON body.
 * @param {string} [options.authHeader] Authorization header string.
 * @param {Record<string, string>} [options.headers] Additional headers.
 * @param {'follow'|'manual'|'error'} [options.redirect='follow'] Fetch redirect behavior.
 * @param {RequestCredentials} [options.credentials='same-origin'] Fetch credentials mode.
 * @returns {Promise<{status: number, data: *, headers: Headers}>} Resolved response object.
 * @throws {ApiError} When response status is outside 2xx range.
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
    credentials,
  };

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

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

/**
 * Redirects the browser to hinolugi-auth SSO sign-in.
 *
 * @param {object} options
 * @param {string} options.authServiceBaseUrl Base URL of the auth service
 * @param {string} options.appName Application name registered with auth service
 * @param {string} options.redirectUrl Return callback URL for auth token exchange
 * @param {string} [options.appLogoUrl] Optional URL pointing to application logo
 * @param {string} [options.signInMethod='hinolugi-auth'] Session storage identifier for sign-in method
 * @returns {string} The fully constructed target URL
 */
export function redirectToHinolugiAuth({
  authServiceBaseUrl,
  appName,
  redirectUrl,
  appLogoUrl,
  signInMethod = 'hinolugi-auth',
} = {}) {
  if (!authServiceBaseUrl || !appName || !redirectUrl) {
    throw new Error('authServiceBaseUrl, appName, and redirectUrl are mandatory');
  }

  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage !== null) {
      sessionStorage.setItem('sign-in-method', signInMethod);
    }
  } catch (e) {
    // Non-fatal if storage is unavailable or restricted
  }

  const baseUrl = authServiceBaseUrl.replace(/\/+$/, '');
  let targetUrl =
    `${baseUrl}/sign-in` +
    `?app-name=${encodeURIComponent(appName)}` +
    `&app-redirect-url=${encodeURIComponent(redirectUrl)}`;

  if (appLogoUrl) {
    targetUrl += `&app-logo-url=${encodeURIComponent(appLogoUrl)}`;
  }

  if (typeof window !== 'undefined' && window?.location) {
    window.location.href = targetUrl;
  }

  return targetUrl;
}
