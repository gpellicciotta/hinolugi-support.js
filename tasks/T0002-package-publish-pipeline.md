---
id: T0002
title: package-publish-pipeline
owner: "@claude"
needs: []
branch: task/T0002-package-publish-pipeline
worktree: ./work/T0002-package-publish-pipeline
status: completed
started: 2026-09-04
ended: 2026-09-04
---

# T0002 — Package Publish Pipeline

## Objectives & Scope

Add a real, automated package-publish pipeline to `hinolugi-support.js`, so other hinolugi Javascript or web
projects can depend on it as an installed package, replacing the current fully-manual `npm publish` steps
documented in `docs/dev-notes.md` (local `.npmrc` with a personal access token, run by hand).

`hinolugi-support.java` already publishes Maven packages to GitHub Packages (see its README and
`build.gradle`'s `publishing {}` block), so GitHub Packages (not the public npm registry) is the established
registry for this project family; `hinolugi-support.python` targets PyPI instead, via GitHub Actions OIDC
trusted publishing triggered by a GitHub Release — that on-release-published trigger pattern is reusable here,
adapted to GitHub Packages' simpler same-repo `GITHUB_TOKEN` auth (no OIDC trusted-publisher registration or
stored PAT secret needed for a same-repo GitHub Actions publish to GitHub Packages).

Also found and fixed a pre-existing packaging bug while making this package actually installable:
`package.json`'s `"main": "index.js"` pointed at a file that has never existed in this repo (actual code lives
under `js/*.mjs`) — publishing without fixing this would ship a package no consumer could `require`/`import`.

Out of scope (left to other tracked tasks): reviewing hinolugi-counters/hinolugi-auth JS for further
shared-library candidates (T0003), bringing this repo's project files fully in line with guidelines incl.
missing `docs/index.md`/`docs/requirements.md`/`docs/devops.md` (A0004), and the full release itself (T0005,
needs T0002+T0003+A0004).

## Task Implementation and Verification Steps

- `[Read]` Reviewed `hinolugi-support.python`'s `.github/workflows/publish.yml` and README Publishing section
  (OIDC trusted publishing to PyPI on `release: published`), `hinolugi-support.java`'s README/`build.gradle`
  (GitHub Packages Maven publish, currently manual/local-credential, "never run unless explicitly asked") and
  this repo's own `docs/dev-notes.md` (manual `npm publish` steps against GitHub Packages via a personal
  `.npmrc` token). No existing consumer imports this package yet (hinolugi-counters currently hand-copies
  `clients/js/src` instead — see its `T0087`), so there is no existing import-shape contract to preserve.
- `[Decide]` **[Decided]** Target GitHub Packages (consistent with the Java sibling and this repo's own
  scoped package name `@gpellicciotta/hinolugi-support.js`), publish automatically from a GitHub Actions
  workflow triggered by `release: types: [published]` (mirrors the Python sibling's human-in-the-loop trigger:
  a maintainer explicitly publishes a GitHub Release, CI does the mechanical registry push), authenticating
  with the workflow's own `GITHUB_TOKEN` (`permissions: packages: write`) — no stored secret or one-time
  registry-side registration needed, unlike PyPI's trusted-publisher setup.
- `[Decide]` **[Decided]** Fix `package.json`: drop the broken `main: index.js`, add `"type": "module"`, an
  `exports` map (`"./*": "./js/*.mjs"`, so consumers do `import { CliLogger } from
  '@gpellicciotta/hinolugi-support.js/cli-log.mjs'`, mirroring this repo's own internal relative-import
  shape), `files` (ship `js/`, `css/`, `README.md`, `CHANGELOG.md`, `LICENSE.md` only — not `tests/`, `html/`
  demo pages, or `img/`), and `publishConfig.registry` pointing at GitHub Packages.
- `[Implement]` Update `package.json`.
- `[Implement]` Add `.github/workflows/publish.yml`.
- `[Doc]` Update `README.md` with Installing/Publishing sections (mirrors Python sibling's style) and update
  `docs/dev-notes.md` to point at the automated pipeline, keeping the manual steps only as a documented
  fallback.
- `[Doc]` Add `CHANGELOG.md` entry; no version bump (packaging/tooling change, not a library API change).
- `[Verify]` `npm test` (existing `cli-log` suite) still passes. `npm pack --dry-run` confirms the tarball
  contains exactly the intended files and that `js/cli-log.mjs` is resolvable via the new `exports` map.

## Progress & Validation Log

- Updated `package.json`: removed the broken `main: index.js`, added `"type": "module"`, an `exports` map,
  `files`, and `publishConfig.registry`.
- Added `.github/workflows/publish.yml` (test job + publish-to-GitHub-Packages job on `release: published`).
- Updated `README.md` (Installing/Publishing sections) and `docs/dev-notes.md` (points at the automated
  pipeline, keeps manual steps as documented fallback).
- Added a `CHANGELOG.md` entry (no version bump — packaging/tooling change, not a library API change).
- `npm test`: 21/21 pass (unchanged `cli-log` suite).
- First `exports` attempt (`"./*": "./js/*.mjs"`) was wrong: with a consumer import that already includes the
  `.mjs` extension (e.g. `.../cli-log.mjs`), the pattern's `*` captures `cli-log.mjs` and appends `.mjs` again,
  resolving to a nonexistent `js/cli-log.mjs.mjs`. Caught this by actually exercising the packaged output
  (`npm pack`, extract the tarball into a scratch `node_modules/@gpellicciotta/hinolugi-support.js/`, dynamic
  `import()` by package specifier — done without a real registry/network round-trip, which the sandboxed Bash
  tool can't reach) rather than trusting the map by inspection alone. Fixed to `"./*.mjs": "./js/*.mjs"`
  (pattern itself includes the extension), re-verified: `import('@gpellicciotta/hinolugi-support.js/cli-log.mjs')`
  now resolves and exports `CliLogger`, `LogLevel`, `formatLogMessage`, `formatSeverityIndicator` as expected.
- `npm pack` tarball contents verified: exactly `js/*.mjs`, `css/*`, `README.md`, `CHANGELOG.md`,
  `package.json` (22 files) — no `tests/`, `html/` demo pages, or `img/` leaked into the published package.
- Did not verify the GitHub Actions workflow by actually triggering a GitHub Release (that's a real,
  externally-visible publish action, out of scope for autonomous execution) — reviewed it against the
  already-working `hinolugi-support.python` sibling's `publish.yml` for structural correctness instead
  (checkout → setup-node with `registry-url` → `npm publish` with `NODE_AUTH_TOKEN` from `GITHUB_TOKEN`,
  `permissions.packages: write` scoped to just the publish job).

## Completion Record

- Delivered an automated publish pipeline: `.github/workflows/publish.yml` publishes to GitHub Packages
  (matching the `hinolugi-support.java` sibling's registry choice) whenever a GitHub Release is published,
  using the workflow's own `GITHUB_TOKEN` — no stored secret or registry-side setup needed, unlike the
  PyPI/OIDC path in `hinolugi-support.python`.
- Fixed `package.json`'s previously-broken entry point (`main: index.js`, pointing at a file that never
  existed) with a proper `exports` map, `type: module`, and a `files` allowlist — the package is now actually
  installable and importable subpath-by-subpath, verified end-to-end via a real packed tarball rather than by
  inspection.
- Updated `README.md` and `docs/dev-notes.md` to document the automated pipeline, keeping the prior manual
  steps as a documented fallback.
- Left out of scope, tracked in still-open `TODO.md` entries: reviewing hinolugi-counters/hinolugi-auth JS for
  further shared-library candidates (T0003), bringing this repo's project files fully in line with guidelines
  incl. missing `docs/index.md`/`docs/requirements.md`/`docs/devops.md` (A0004), and the full release itself
  (T0005).
- Review: passing-test pre-authorized autonomous execution per the pickup-work-loop protocol; no separate
  human reviewer for this integration.
