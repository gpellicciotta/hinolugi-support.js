# Changelog

All notable changes to this project are documented here.

> See [coordinating work guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md)
> for the versioning and changelog conventions used across the HiNoLuGi projects.

## v0.83.1-pre

## v0.83.0 [released: 2026-09-06]

- Docs: Document release procedures and consumer dependency configuration in devops.md.
- DevEx: Expose CSS stylesheets and package metadata exports in package.json.
- BackEnd: Add shared REST client HTTP transport and typed error hierarchy modules.
- BackEnd: Add changelog-parser module for parsing repository changelogs into structured release objects.
- FrontEnd: Add app-shell scaffolding modules including AppView, AppInternalsView, AppMenu, HomeView, and Installer.
- Docs: Fix Release Process to freeze and reopen `-pre` in separate commits, tagging the frozen one.
- BackEnd: Add `component.mjs`'s `Component` base class (SPA DOM lifecycle, overlays, long-running-op
  helper), the missing piece of the `hinolugi-auth`/`hinolugi-counters` framework-core module.
- BackEnd: Add `reset`, `removeValidityMarks`, `validateInputField`, `validateEmailField`,
  `validatePasswordField`, and a `readOnly` toggle to `formutils.mjs`, merging in `hinolugi-auth`'s superset.
- BackEnd: Add `escapeHtml`, `isValidPassword`, and `validPasswordDescription` to `utils.mjs`, completing its
  merge of `hinolugi-auth`/`hinolugi-counters`'s near-duplicate webapp utility functions.
- Docs: Bring `TODO.md`, `CHANGELOG.md`, `docs/`, and `tasks/*.md` in line with the latest dev-guidelines.
- BackEnd: Fix `log.mjs` logging the raw exception instead of a leveled error event when a handler throws.
- BackEnd: Fix `fireworks.mjs`'s `stop()` never actually removing its window resize listener.
- BackEnd: Remove dead duplicated code and unused debug/scratch functions across the JS library.
- Docs: Document previously-undocumented exported functions and classes across the JS library with JSDoc.
- DevEx: Format all JS source with Prettier; add `npm run format`/`format:check` and enforce it in CI.

## v0.82.0 [released: 2026-09-04]

- JS: Add `js/cli-log.mjs`, a guideline-compliant CLI logging utility API-similar to the `LogLevel`/`Log`
  (Java) and `LogLevel`/`CliLogger` (Python) implementations in the sibling support libraries.
- DevEx: Add an automated publish pipeline (`.github/workflows/publish.yml`) that publishes to GitHub
  Packages on GitHub Release; fix `package.json`'s broken entry point so the package is actually installable.
- Docs: Add missing `LICENSE.md`, `docs/index.md`, `docs/requirements.md`, and `docs/devops.md`; fold the
  stale `docs/dev-notes.md`/`docs/release-notes.md` into the new docs and remove them.
- DevEx: Fix `package.json`'s `license` field (`ISC` leftover from `npm init`, mismatched the actual MIT
  license) and ship `LICENSE.md` in the published package; ignore `node_modules/` and untrack a stray
  `node_modules/.package-lock.json` file that had been committed by mistake.
