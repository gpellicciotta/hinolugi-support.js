/**
 * Typed exception hierarchy for non-2xx API responses.
 *
 * The server reports "no such resource" as a 400 with a descriptive message rather than
 * a dedicated 404, so NotFoundError is inferred client-side by matching the message
 * against a set of patterns.
 */

/**
 * Base class for every error the server itself reported (as opposed to a network failure).
 * Carries the HTTP status code, the server's message string, and the raw parsed response body.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {*} [body]
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

/** 400 - any bad request that NotFoundError's pattern matching didn't recognize as "not found". */
export class ValidationError extends ApiError {}

/**
 * A 400 response whose message specifically indicates "no such resource by id".
 * Inferred client-side from message pattern matching.
 */
export class NotFoundError extends ValidationError {}

/** 409 - a name collision or conflict on a resource. */
export class ConflictError extends ApiError {}

/**
 * Regexes matched (case-insensitively) against a 400 response's message to decide
 * whether it represents "no such resource by id" rather than some other bad request.
 */
export const NOT_FOUND_PATTERNS = [/invalid.*id/i, /no .* with id/i, /not found/i, /does not exist/i, /is not valid/i];

/**
 * Maps an HTTP status code + parsed error envelope into the right ApiError subclass.
 *
 * @param {number} status
 * @param {string} [message]
 * @param {*} [body]
 * @returns {ApiError}
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
