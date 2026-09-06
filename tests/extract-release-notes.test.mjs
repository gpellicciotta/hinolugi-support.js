import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractReleaseNotes } from '../scripts/extract-release-notes.mjs';

const sample = `# Changelog

## v0.83.1-pre

## v0.83.0 [released: 2026-09-06]

- Docs: First bullet.
- BackEnd: Second bullet.

## v0.82.0 [released: 2026-09-04]

- JS: Older bullet.
`;

test('extracts the bullet list under a matching version heading', () => {
  const notes = extractReleaseNotes(sample, 'v0.83.0');
  assert.equal(notes, '- Docs: First bullet.\n- BackEnd: Second bullet.');
});

test('accepts a version without a leading v', () => {
  const notes = extractReleaseNotes(sample, '0.82.0');
  assert.equal(notes, '- JS: Older bullet.');
});

test('throws when the version heading is missing', () => {
  assert.throws(() => extractReleaseNotes(sample, '9.9.9'), /No CHANGELOG\.md heading found/);
});

test('returns an empty string for a heading with no body, like an open -pre section', () => {
  assert.equal(extractReleaseNotes(sample, '0.83.1-pre'), '');
});
