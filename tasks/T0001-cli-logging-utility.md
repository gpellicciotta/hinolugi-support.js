---
id: T0001
title: cli-logging-utility
owner: "@claude"
needs: []
branch: task/T0001-cli-logging-utility
worktree: ./work/T0001-cli-logging-utility
status: completed
started: 2026-09-04
ended: 2026-09-04
---

# T0001 — CLI Logging Utility

## Goals

Add a guideline-compliant CLI logging utility (`js/cli-log.mjs`) to `hinolugi-support.js`, API-similar to the
`LogLevel`/logger classes in the Java and Python sibling libraries, scoped to simple CLI tools like the Python
version.

## Task Execution Steps

- [x] **[Read]**      Review Java/Python sibling logging APIs and existing `js/log.mjs` conventions.
- [x] **[Decided]**    Mirror Python's `CliLogger` shape in a new Node-only `js/cli-log.mjs` module.
- [x] **[Implement]**  Implement `js/cli-log.mjs` (`LogLevel`, format helpers, `CliLogger`).
- [x] **[Implement]**  Add `tests/cli-log.test.mjs` using Node's built-in `node:test`.
- [x] **[Verify]**     Run `node --test tests/` and confirm all tests pass.
- [x] **[Doc]**        Create `CHANGELOG.md` with an active `-pre` heading and bump `package.json`.

## Execution Log

- [2026-09-04] **[Implement]**
  Added `js/cli-log.mjs` and `tests/cli-log.test.mjs` (21 `node:test` cases); `npm test` passes 21/21.
  - Fixed-width severity-indicator column alignment confirmed deliberate, not a bug.

- [2026-09-04] **[Doc]**
  Created `CHANGELOG.md` (none existed before) with an active `v0.82.0-pre` heading; bumped `package.json`
  to match.

- [2026-09-04] **[Complete]**
  Delivered `js/cli-log.mjs` (`LogLevel`, `CliLogger`, format helpers), API-similar to the Java/Python
  siblings; left `js/log.mjs` untouched. Pre-authorized autonomous integration, no separate human reviewer.
