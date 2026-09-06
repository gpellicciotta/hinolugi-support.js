import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { parseChangelog } from '../js/changelog-parser.mjs';

describe('Changelog Parser Suite', () => {
  const sampleMarkdown = `
# Changelog

All notable changes are documented here.

## Full Change History

### vNext
- BackEnd: Expose GET and DELETE /api/users/{userId}/credentials
- SPA: Manage social identities on Account and User screens
- Docs: Condense devops.md
- [breaking] SPA: Implement native Context Action Bar feedback with [UNDO] action
- DevOps: Automate schema migration and health checks

### v1.0.2 [in development]
- Build: Fix a missing brace in RepositoryUtils
- FrontEnd: Fix sign-in silently redirecting deep links
- DevEx: Fix ui-tour.mjs
- Clients: Add provider fields to models
- Fix: Format calorie values as whole numbers

### v1.0.1 [2026-08-22] [released: 2026-08-22]
- Test: Add live SPA test suite
- Feature: Add OLED theme support
- Docs: Update requirements document

### v1.0.0 (2026-08-21)
- [breaking] Client: Native ESM exports across all clients
- Test: Expand integration test matrix

### v0.23.0 [2023-08-14] - First Useable Version
- Multi-line entry with continued text
  that wraps across indented lines.
- ADR: Record MySQL architecture decision
`;

  test('1. Parses release versions and tags correctly', () => {
    const releases = parseChangelog(sampleMarkdown);
    assert.equal(releases.length, 5);

    assert.equal(releases[0].version, 'Next');
    assert.equal(releases[0].isLatest, true);
    assert.equal(releases[0].tag, 'in development');

    assert.equal(releases[1].version, '1.0.2');
    assert.equal(releases[1].isLatest, false);
    assert.equal(releases[1].tag, 'in development');

    assert.equal(releases[2].version, '1.0.1');
    assert.equal(releases[2].isLatest, false);
    assert.equal(releases[2].tag, '2026-08-22 • released: 2026-08-22');

    assert.equal(releases[3].version, '1.0.0');
    assert.equal(releases[3].isLatest, false);
    assert.equal(releases[3].tag, '2026-08-21');

    assert.equal(releases[4].version, '0.23.0');
    assert.equal(releases[4].isLatest, false);
    assert.equal(releases[4].tag, '2023-08-14');
  });

  test('2. Correctly categorizes user-facing vs internal developer entries', () => {
    const releases = parseChangelog(sampleMarkdown);
    const vNext = releases[0];

    const internalEntries = vNext.entries.filter((e) => !e.isUserFacing);
    const userFacingEntries = vNext.entries.filter((e) => e.isUserFacing);

    assert.equal(internalEntries.length, 2); // Docs and DevOps
    assert.equal(userFacingEntries.length, 3); // BackEnd, SPA, [breaking] SPA
  });

  test('3. Properly classifies Clients (plural) prefix as client category', () => {
    const releases = parseChangelog(sampleMarkdown);
    const v102 = releases[1];

    const clientEntry = v102.entries.find((e) => e.text === 'Add provider fields to models');
    assert.ok(clientEntry, 'Clients entry should exist');
    assert.equal(clientEntry.category, 'client');
    assert.equal(clientEntry.isUserFacing, true);
  });

  test('4. Detects [breaking] change annotations', () => {
    const releases = parseChangelog(sampleMarkdown);
    const breakingEntries = releases.flatMap((r) => r.entries).filter((e) => e.isBreaking);

    assert.equal(breakingEntries.length, 2);
    assert.ok(!breakingEntries[0].text.includes('[breaking]'), 'Clean text should strip [breaking]');
    assert.ok(breakingEntries[0].isBreaking);
    assert.ok(!breakingEntries[1].text.includes('[breaking]'), 'Clean text should strip [breaking]');
    assert.ok(breakingEntries[1].isBreaking);
  });

  test('5. Appends multi-line continuation text to the previous entry', () => {
    const releases = parseChangelog(sampleMarkdown);
    const v0230 = releases[4];

    assert.equal(v0230.entries.length, 2);
    assert.equal(v0230.entries[0].text, 'Multi-line entry with continued text that wraps across indented lines.');
    assert.equal(v0230.entries[0].category, 'feature');
    assert.equal(v0230.entries[0].isUserFacing, true);
  });

  test('6. Handles maxReleases option', () => {
    const releases = parseChangelog(sampleMarkdown, { maxReleases: 2 });
    assert.equal(releases.length, 2);
    assert.equal(releases[0].version, 'Next');
    assert.equal(releases[1].version, '1.0.2');
  });

  test('7. Handles null, undefined, or empty markdown gracefully', () => {
    assert.deepEqual(parseChangelog(null), []);
    assert.deepEqual(parseChangelog(undefined), []);
    assert.deepEqual(parseChangelog(''), []);
  });

  test('8. Parses real repository CHANGELOG.md without throwing', () => {
    const changelogPath = new URL('../CHANGELOG.md', import.meta.url);
    if (fs.existsSync(changelogPath)) {
      const content = fs.readFileSync(changelogPath, 'utf8');
      const releases = parseChangelog(content);
      assert.ok(releases.length > 0);
      assert.ok(releases[0].version);
      assert.ok(releases[0].tag);
      assert.strictEqual(releases[0].isLatest, true);
      assert.ok(releases.some((r) => r.entries.length > 0));
    }
  });
});
