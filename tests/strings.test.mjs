import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, capitalize, uncapitalize, escapeRegex } from '../js/strings.mjs';

describe('strings', () => {
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

  describe('capitalize and uncapitalize', () => {
    test('capitalizes first letter', () => {
      assert.equal(capitalize('hello'), 'Hello');
      assert.equal(capitalize('Hello'), 'Hello');
      assert.equal(capitalize(''), '');
      assert.equal(capitalize(null), null);
    });

    test('uncapitalizes first letter', () => {
      assert.equal(uncapitalize('Hello'), 'hello');
      assert.equal(uncapitalize('hello'), 'hello');
      assert.equal(uncapitalize(''), '');
      assert.equal(uncapitalize(null), null);
    });
  });

  describe('escapeRegex', () => {
    test('escapes special regex characters', () => {
      const pattern = 'hello (world) [1-2] {a,b} *+?.^$|\\';
      const escaped = escapeRegex(pattern);
      const regex = new RegExp(`^${escaped}$`);
      assert.ok(regex.test(pattern));
    });
  });
});
