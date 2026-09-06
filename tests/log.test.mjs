import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import { addLogHandler, removeLogHandler, error, ERROR_LEVEL } from '../js/log.mjs';

describe('fireLogEvent', () => {
  test('routes a failing handler to defaultHandler as an ERROR-level event, not the raw exception', () => {
    const failingHandler = () => {
      throw new Error('boom');
    };
    const errorMock = mock.method(console, 'error', () => {});
    const logMock = mock.method(console, 'log', () => {});
    addLogHandler(failingHandler);
    try {
      error('something happened');
    } finally {
      removeLogHandler(failingHandler);
      errorMock.mock.restore();
      logMock.mock.restore();
    }

    assert.equal(logMock.mock.callCount(), 0);
    assert.equal(errorMock.mock.callCount(), 1);
    const [message, loggedEvent, loggedErr] = errorMock.mock.calls[0].arguments;
    assert.match(message, /^\[error\] Log event handler failed for event/);
    assert.equal(loggedEvent.level, ERROR_LEVEL);
    assert.equal(loggedErr.message, 'boom');
  });
});
