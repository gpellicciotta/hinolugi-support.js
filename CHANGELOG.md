# Changelog

All notable changes to this project are documented here.

> See [coordinating work guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md)
> for the versioning and changelog conventions used across the HiNoLuGi projects.

## v2.0.0-pre
- Docs: Documented complete API surface across all JavaScript modules and classes.
- BackEnd: Refactored JavaScript modules into domain-centric units, unifying logging, storage, networking, dates, forms, and utilities.

## v1.0.0 [released: 2026-09-19]
- DevEx: Added reusable static dev/test server and Playwright tour recorder in scripts/lib/.
- BackEnd: Added zero-dependency offline storage adapters in js/offline-storage.mjs.
- BackEnd: Added client wire date helpers and uniform pagination helper in js/page.mjs.
- DevEx: Added zero-dependency headless Mock DOM utility in js/mock-dom.mjs for Node unit tests.
- FrontEnd: Extracted 9 shared CSS stylesheets from auth and counters webapps normalized with design tokens.
- FrontEnd: Extended shared UI components with button loading states, formatters, action bars, notifications, and usage tracking.
- FrontEnd: Added visual style guide specification, shared CSS design tokens, and collection editor component.
- DevEx: Added `scripts/extract-release-notes.mjs` and `npm run release-notes` to generate GitHub Release notes from CHANGELOG.md.
- Docs: Fixed Release Process Step 4 to use extracted CHANGELOG.md notes instead of a placeholder `--notes` string.

## v0.83.0 [released: 2026-09-06]
- Docs: Documented release procedures and consumer dependency configuration in devops.md.
- DevEx: Exposed CSS stylesheets and package metadata exports in package.json.
- BackEnd: Added shared REST client HTTP transport and typed error hierarchy modules.
- BackEnd: Added changelog-parser module for parsing repository changelogs into structured release objects.
- FrontEnd: Added app-shell scaffolding modules including AppView, AppInternalsView, AppMenu, HomeView, and Installer.
- Docs: Fixed Release Process to freeze and reopen `-pre` in separate commits, tagging the frozen one.
- BackEnd: Added `component.mjs`'s `Component` base class (SPA DOM lifecycle, overlays, long-running-op
  helper), the missing piece of the `hinolugi-auth`/`hinolugi-counters` framework-core module.
- BackEnd: Added `reset`, `removeValidityMarks`, `validateInputField`, `validateEmailField`,
  `validatePasswordField`, and a `readOnly` toggle to `formutils.mjs`, merging in `hinolugi-auth`'s superset.
- BackEnd: Added `escapeHtml`, `isValidPassword`, and `validPasswordDescription` to `utils.mjs`, completing its
  merge of `hinolugi-auth`/`hinolugi-counters`'s near-duplicate webapp utility functions.
- Docs: Brought `TODO.md`, `CHANGELOG.md`, `docs/`, and `tasks/*.md` in line with the latest dev-guidelines.
- BackEnd: Fixed `log.mjs` logging the raw exception instead of a leveled error event when a handler throws.
- BackEnd: Fixed `fireworks.mjs`'s `stop()` never actually removing its window resize listener.
- BackEnd: Removed dead duplicated code and unused debug/scratch functions across the JS library.
- Docs: Documented previously-undocumented exported functions and classes across the JS library with JSDoc.
- DevEx: Formated all JS source with Prettier; add `npm run format`/`format:check` and enforce it in CI.

## v0.82.0 [released: 2026-09-04]
- JS: Added `js/cli-log.mjs`, a guideline-compliant CLI logging utility API-similar to the `LogLevel`/`Log`
  (Java) and `LogLevel`/`CliLogger` (Python) implementations in the sibling support libraries.
- DevEx: Added an automated publish pipeline (`.github/workflows/publish.yml`) that publishes to GitHub
  Packages on GitHub Release; fix `package.json`'s broken entry point so the package is actually installable.
- Docs: Added missing `LICENSE.md`, `docs/index.md`, `docs/requirements.md`, and `docs/devops.md`; fold the
  stale `docs/dev-notes.md`/`docs/release-notes.md` into the new docs and remove them.
- DevEx: Fixed `package.json`'s `license` field (`ISC` leftover from `npm init`, mismatched the actual MIT
  license) and ship `LICENSE.md` in the published package; ignore `node_modules/` and untrack a stray
  `node_modules/.package-lock.json` file that had been committed by mistake.
