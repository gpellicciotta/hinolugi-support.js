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

## Objectives & Scope

Add a shared CLI logging utility to `hinolugi-support.js` that is:

- Compliant with the dev-guidelines Logging section (`[YYYY-MM-DD HH:MM:SS] **[LEVEL]**  <origin> Message`
  prefix, 11-char-wide severity indicators, stdout/stderr stripping rules, `DEBUG` gated behind `--debug`).
- Maximally API-similar to the existing implementations in `hinolugi-support.java`
  (`com.hinolugi.support.logging.LogLevel`/`Log`) and `hinolugi-support.python`
  (`hinolugi_support.logging.LogLevel`/`CliLogger`), adapted to JS naming conventions (camelCase) and to
  this repo's existing module (`js/log.mjs` already uses `ERROR_LEVEL`/`WARNING_LEVEL`/`INFO_LEVEL`/
  `TRACE_LEVEL` naming for a separate, browser-safe, handler-based event logger — this task does not touch
  that module).
- Scoped like the Python version: simple CLI tools, not the full SPI/back-end/span machinery of the Java
  library (out of scope here, per the Python module's own documented scoping decision).

Out of scope (left to other tracked tasks): a real package-publish pipeline (T0002), reviewing
hinolugi-counters/hinolugi-auth JS for further shared-library candidates (T0003), and bringing this repo's
project files (missing `CHANGELOG.md`/`LICENSE.md`/`docs/index.md`/`docs/requirements.md`/`docs/devops.md`)
fully in line with guidelines (A0004). A minimal `CHANGELOG.md` is created here only because finalizing this
task requires recording an entry in it.

## Task Implementation and Verification Steps

- `[Read]` Reviewed `hinolugi-support.java`'s `logging` package (`LogLevel`, `LogService`, `Log`,
  `package-info.java`) and `hinolugi-support.python`'s `src/hinolugi_support/logging.py`
  (`LogLevel`, `format_severity_indicator`, `format_log_message`, `CliLogger`) as the API models to mirror.
  Reviewed existing `js/log.mjs` and `js/utils.mjs`'s `formatDateTime` for repo conventions to reuse.
- `[Decide]` **[Decided]** New module `js/cli-log.mjs` (Node-only; first Node-specific module in this repo),
  exporting a `LogLevel` class (static `NONE`/`ERROR`/`WARNING`/`INFO`/`DEBUG`/`ALL`, static `toString`/
  `parse`), `formatSeverityIndicator`/`formatLogMessage` functions, and a `CliLogger` class with
  `log`/`info`/`progress`/`warning`(+`warn` alias)/`error`/`debug`/`logStart`/`logEnd` methods — directly
  mirroring the Python `CliLogger`'s shape and method names (camelCased).
- `[Implement]` Implement `js/cli-log.mjs`.
- `[Implement]` Add tests under `tests/cli-log.test.mjs` using Node's built-in `node:test` + `node:assert`
  (no new dependency, mirrors the "minimize dependencies" guideline already followed by the Python sibling).
- `[Verify]` `node --test tests/` passes.
- `[Doc]` Create minimal `CHANGELOG.md` (none existed before this task) with an active `-pre` heading and an
  entry for this change; bump `package.json` version (minor, new backward-compatible feature).

## Progress & Validation Log

- Implemented `js/cli-log.mjs` and `tests/cli-log.test.mjs` (21 tests, `node:test`).
- Ran `npm test` (now `node --test`, replacing the previous no-op placeholder script): 21/21 pass.
- Design note: the fixed-width (11-char) severity-indicator scheme, mirrored from the Python implementation,
  intentionally produces a visually consistent 12-char prefix column before the next field (origin, or
  message when no origin is given) regardless of level-name length — confirmed this is deliberate (not a
  formatting bug) by tracing why `**[ERROR]**` (11 chars, flush) and `**[INFO]** ` (10 chars + 1 self-pad =
  11 chars) both land on the same column once the join separator is added; encoded this as an explicit test
  case (`aligns continuation lines...`) rather than leaving it as an unstated assumption.
- Created `CHANGELOG.md` (didn't exist in this repo before) with an active `v0.82.0-pre` heading (minor bump:
  new backward-compatible module) and bumped `package.json` to match.

## Completion Record

- Delivered `js/cli-log.mjs` (`LogLevel`, `formatSeverityIndicator`, `formatLogMessage`, `CliLogger`),
  API-similar to `hinolugi-support.java`'s `com.hinolugi.support.logging.LogLevel`/`Log` and
  `hinolugi-support.python`'s `hinolugi_support.logging.LogLevel`/`CliLogger`, adapted to this repo's
  camelCase convention. Left the existing browser-safe `js/log.mjs` untouched (separate, unrelated module).
- Added `tests/cli-log.test.mjs` (Node's built-in `node:test`, no new dependency) and wired `package.json`'s
  `test` script to run it; 21/21 tests pass.
- Created `CHANGELOG.md` (previously absent) and bumped `package.json` to `0.82.0-pre`.
- Left out of scope, tracked in still-open `TODO.md` entries: a real publish pipeline (T0002), a broader
  JS-reuse-candidate review across hinolugi-counters/hinolugi-auth (T0003), and bringing the rest of this
  repo's project files (missing `LICENSE.md`, `docs/index.md`, `docs/requirements.md`, `docs/devops.md`) in
  line with guidelines (A0004) — this task only added the minimum `CHANGELOG.md` needed to record its own
  entry.
- Review: passing-test pre-authorized autonomous execution per the pickup-work-loop protocol; no separate
  human reviewer for this integration.
