// Extracts one version's section from CHANGELOG.md for use as GitHub Release notes.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Extracts the bullet list under a `## v<version> [...]` heading in CHANGELOG.md.
 * @param {string} changelogText - Raw CHANGELOG.md content
 * @param {string} version - Version to extract, with or without a leading `v` (e.g. `0.83.0` or `v0.83.0`)
 * @returns {string} The section body, trimmed, without the heading line
 */
export function extractReleaseNotes(changelogText, version) {
  const normalized = version.replace(/^v/i, '');
  const lines = changelogText.split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+v${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);

  const startIndex = lines.findIndex((line) => headingPattern.test(line));
  if (startIndex === -1) {
    throw new Error(`No CHANGELOG.md heading found for version v${normalized}`);
  }

  let endIndex = lines.findIndex((line, i) => i > startIndex && /^##\s+/.test(line));
  if (endIndex === -1) endIndex = lines.length;

  return lines
    .slice(startIndex + 1, endIndex)
    .join('\n')
    .trim();
}

function main() {
  const [version, changelogPath = 'CHANGELOG.md'] = process.argv.slice(2);
  if (!version) {
    console.error('Usage: node scripts/extract-release-notes.mjs <version> [changelogPath]');
    process.exit(1);
  }
  const changelogText = readFileSync(changelogPath, 'utf8');
  console.log(extractReleaseNotes(changelogText, version));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
