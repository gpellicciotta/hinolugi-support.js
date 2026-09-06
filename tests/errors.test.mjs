import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  NOT_FOUND_PATTERNS,
  mapError,
} from '../js/errors.mjs';

test('ApiError sets properties and stack trace', () => {
  const err = new ApiError('Something broke', 500, { detail: 'db down' });
  assert.equal(err.name, 'ApiError');
  assert.equal(err.message, 'Something broke');
  assert.equal(err.status, 500);
  assert.deepEqual(err.body, { detail: 'db down' });
  assert.ok(err instanceof Error);
  assert.ok(err.stack);

  const defaultBodyErr = new ApiError('Default body', 400);
  assert.equal(defaultBodyErr.body, null);
});

test('Error hierarchy maintains expected inheritance relationships', () => {
  const authErr = new AuthenticationError('unauthorized', 401);
  assert.ok(authErr instanceof ApiError);
  assert.ok(authErr instanceof Error);

  const valErr = new ValidationError('bad', 400);
  assert.ok(valErr instanceof ApiError);

  const notFoundErr = new NotFoundError('not found', 400);
  assert.ok(notFoundErr instanceof NotFoundError);
  assert.ok(notFoundErr instanceof ValidationError);
  assert.ok(notFoundErr instanceof ApiError);

  const conflictErr = new ConflictError('conflict', 409);
  assert.ok(conflictErr instanceof ApiError);
});

test('NOT_FOUND_PATTERNS matches expected phrases case-insensitively', () => {
  const phrases = [
    'Invalid counter ID',
    'No user with id 123',
    'Resource not found',
    'Item does not exist',
    'Email is not valid',
  ];
  for (const phrase of phrases) {
    const matched = NOT_FOUND_PATTERNS.some((re) => re.test(phrase));
    assert.ok(matched, `Expected phrase "${phrase}" to match NOT_FOUND_PATTERNS`);
  }
});

test('mapError maps status codes and patterns to correct subclasses', () => {
  const err401 = mapError(401, 'Invalid token', { error: 'invalid_token' });
  assert.ok(err401 instanceof AuthenticationError);
  assert.equal(err401.status, 401);
  assert.equal(err401.message, 'Invalid token');
  assert.deepEqual(err401.body, { error: 'invalid_token' });

  const err409 = mapError(409, 'Duplicate name', { field: 'name' });
  assert.ok(err409 instanceof ConflictError);
  assert.equal(err409.status, 409);
  assert.equal(err409.message, 'Duplicate name');

  const errNotFound = mapError(400, 'No counter with id 42', { id: 42 });
  assert.ok(errNotFound instanceof NotFoundError);
  assert.ok(errNotFound instanceof ValidationError);
  assert.ok(errNotFound instanceof ApiError);
  assert.equal(errNotFound.status, 400);
  assert.equal(errNotFound.message, 'No counter with id 42');

  const errValidation = mapError(400, 'Name must not be empty', { field: 'name' });
  assert.ok(errValidation instanceof ValidationError);
  assert.ok(!(errValidation instanceof NotFoundError));
  assert.equal(errValidation.status, 400);
  assert.equal(errValidation.message, 'Name must not be empty');

  const err500 = mapError(500, 'Server crashed', null);
  assert.ok(err500 instanceof ApiError);
  assert.ok(!(err500 instanceof ValidationError));
  assert.equal(err500.status, 500);
});

test('mapError provides expected defaults when message is absent', () => {
  assert.equal(mapError(401, '').message, 'authentication failed');
  assert.equal(mapError(409, null).message, 'conflict');
  assert.equal(mapError(400, '').message, 'bad request');
  assert.equal(mapError(500, '').message, 'request failed with status 500');
});
