# Changelog

All notable changes to this project are documented here.

> See [coordinating work guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md)
> for the versioning and changelog conventions used across the HiNoLuGi projects.

## v0.82.0-pre

- JS: Add `js/cli-log.mjs`, a guideline-compliant CLI logging utility API-similar to the `LogLevel`/`Log`
  (Java) and `LogLevel`/`CliLogger` (Python) implementations in the sibling support libraries.
- DevEx: Add an automated publish pipeline (`.github/workflows/publish.yml`) that publishes to GitHub
  Packages on GitHub Release; fix `package.json`'s broken entry point so the package is actually installable.
- Docs: Add missing `LICENSE.md`, `docs/index.md`, `docs/requirements.md`, and `docs/devops.md`; fold the
  stale `docs/dev-notes.md`/`docs/release-notes.md` into the new docs and remove them.
- DevEx: Fix `package.json`'s `license` field (`ISC` leftover from `npm init`, mismatched the actual MIT
  license) and ship `LICENSE.md` in the published package; ignore `node_modules/` and untrack a stray
  `node_modules/.package-lock.json` file that had been committed by mistake.
