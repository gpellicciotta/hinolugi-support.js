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

## Goals

Add an automated GitHub Actions pipeline that publishes `hinolugi-support.js` to GitHub Packages on GitHub
Release, so `hinolugi-auth`/`hinolugi-counters` can depend on it as an installed package instead of the prior
fully-manual `npm publish` steps.

## Task Execution Steps

- [x] **[Read]**      Review sibling libraries' publish workflows and this repo's manual publish notes.
- [x] **[Decided]**    Target GitHub Packages via `release: published`, authenticated with `GITHUB_TOKEN`.
- [x] **[Decided]**    Fix `package.json`'s broken `main` entry with a proper `exports` map and `files` list.
- [x] **[Implement]**  Update `package.json` (`type: module`, `exports`, `files`, `publishConfig`).
- [x] **[Implement]**  Add `.github/workflows/publish.yml`.
- [x] **[Doc]**        Update `README.md` with Installing/Publishing sections.
- [x] **[Doc]**        Add a `CHANGELOG.md` entry (no version bump; tooling change only).
- [x] **[Verify]**     Run `npm test` and `npm pack --dry-run`; confirm the tarball contents.

## Execution Log

- [2026-09-04] **[Implement]**
  Added `.github/workflows/publish.yml` and fixed `package.json`'s broken `main: index.js` entry point with
  an `exports` map, `type: module`, and a `files` allowlist.
  - First `exports` pattern double-appended `.mjs`; caught via a real packed-tarball import test, fixed.

- [2026-09-04] **[Doc]**
  Updated `README.md` (Installing/Publishing) and `docs/dev-notes.md` to document the automated pipeline,
  keeping manual steps as a documented fallback.

- [2026-09-04] **[Verify]**
  `npm test`: 21/21 pass. `npm pack` tarball verified to contain exactly the intended 22 files, no test/demo
  leakage.
  - `publish.yml` was reviewed structurally against the Python sibling's workflow, not actually triggered
    by a real GitHub Release (out of scope for autonomous execution).

- [2026-09-04] **[Complete]**
  Delivered `.github/workflows/publish.yml` publishing to GitHub Packages on release, plus a working
  `exports`/`files` packaging fix, verified end-to-end via a real packed tarball. Pre-authorized autonomous
  integration, no separate human reviewer.
