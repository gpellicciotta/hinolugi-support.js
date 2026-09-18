import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const cssDir = path.join(rootDir, 'css');

const EXTRACTED_STYLESHEETS = [
  'dialog.css',
  'menu.css',
  'main-layout.css',
  'collapsible.css',
  'demo-view.css',
  'mail-layout.css',
  'tooltips.css',
  'wait-panel.css',
  'error-view.css',
];

const ALL_EXPECTED_STYLESHEETS = [
  'action-bar.css',
  'catalogue-view.css',
  'collapsible.css',
  'collection-editor.css',
  'colors.css',
  'component.css',
  'demo-view.css',
  'dialog.css',
  'error-view.css',
  'forms.css',
  'mail-layout.css',
  'main-layout.css',
  'menu.css',
  'notification-bar.css',
  'progress.css',
  'reset.css',
  'style.css',
  'tooltips.css',
  'wait-panel.css',
];

test('CSS Stylesheet Inventory', async (t) => {
  await t.test('all 9 extracted stylesheets exist and are non-empty', () => {
    for (const file of EXTRACTED_STYLESHEETS) {
      const fullPath = path.join(cssDir, file);
      assert.ok(fs.existsSync(fullPath), `Stylesheet ${file} should exist in css/`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `Stylesheet ${file} should not be empty`);
    }
  });

  await t.test('all expected stylesheets are present in css directory', () => {
    const presentFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
    for (const file of ALL_EXPECTED_STYLESHEETS) {
      assert.ok(presentFiles.includes(file), `Expected ${file} to be in css/`);
    }
    assert.equal(presentFiles.length, ALL_EXPECTED_STYLESHEETS.length);
  });

  await t.test('package.json exports cover all stylesheets', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.exports, 'package.json should have exports field');
    assert.equal(pkg.exports['./*.css'], './css/*.css');
    assert.equal(pkg.exports['./css/*.css'], './css/*.css');
    assert.ok(pkg.files.includes('css'), 'package.json files should include css');
  });

  await t.test('all @import statements in css files reference existing files', () => {
    const presentFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
    const importRegex = /@import\s+["']([^"']+)["'];/g;

    for (const file of presentFiles) {
      const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importedFile = match[1];
        const importedPath = path.join(cssDir, importedFile);
        assert.ok(fs.existsSync(importedPath), `File ${file} imports '${importedFile}', which should exist in css/`);
      }
    }
  });
});
