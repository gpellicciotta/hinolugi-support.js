import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, isValidPassword, validPasswordDescription } from '../js/utils.mjs';

describe('escapeHtml', () => {
  test('escapes HTML-significant characters', () => {
    assert.equal(escapeHtml(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
  });

  test('returns an empty string for null or undefined', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });

  test('coerces non-string input to a string', () => {
    assert.equal(escapeHtml(42), '42');
  });
});

describe('isValidPassword', () => {
  test('rejects empty or short passwords', () => {
    assert.equal(isValidPassword(''), false);
    assert.equal(isValidPassword(null), false);
    assert.equal(isValidPassword('abcde'), false);
  });

  test('accepts passwords of at least 6 characters', () => {
    assert.equal(isValidPassword('abcdef'), true);
  });
});

describe('validPasswordDescription', () => {
  test('describes the password rule', () => {
    assert.equal(validPasswordDescription(), 'minimally 6 letters');
  });
});
