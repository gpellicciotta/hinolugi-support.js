---
id: T0003
title: review-js-common-library-candidates
owner: "@claude"
needs: []
branch: task/T0003-review-js-common-library-candidates
worktree: ./work/T0003-review-js-common-library-candidates
status: completed
started: 2026-09-04
ended: 2026-09-04
---

# T0003 — Review JS Common-Library Candidates

## Objectives & Scope

Review the JavaScript code in `hinolugi-counters` and `hinolugi-auth` (both webapps' `webapp/js/` SPA
code and both repos' `clients/js/src/` REST client libraries) and identify code that would benefit from
being extracted into this shared support library, mirroring the audits already done for
`hinolugi-support.java` (its own backlog's A0013-A0018) and `hinolugi-support.python` (its own backlog's
T0006-T0010). Deliverable is a set of backlog TODO entries here, each scoped to one topic and flagged for
`@gio` review before being picked up — no code changes to the two consumer repos in this task.

## Task Implementation and Verification Steps

- `[Read]` Listed every non-generated, non-test `.mjs`/`.js` file under both repos' `webapp/js/` and
  `clients/js/src/` (excluding `node_modules`, `output/` build artifacts, and test suites).
- `[Read]` For every file sharing the same name/path shape between the two repos, diffed it after
  normalizing line endings (`hinolugi-auth`'s webapp files are CRLF, `hinolugi-counters`'s are LF — a raw
  `diff` reports every line as different otherwise, which would have hidden the real overlap) to measure
  actual content similarity rather than relying on file existence alone.
- `[Decide]` **[Decided]** Grouped findings into 7 topics by similarity/confidence, from near-byte-identical
  (framework core, app-shell, changelog-parser, JS REST-client transport/errors) to partially-overlapping
  and needing a design decision (`constants.mjs`). Filed each as its own backlog entry (A0006-A0012) rather
  than one giant catch-all, so `@gio` can accept/reject/reprioritize per topic independently.
- `[Doc]` Added `TODO.md` backlog entries A0006-A0012, each citing the specific files and diff-line counts
  that justify the finding.

## Progress & Validation Log

- Findings filed as `TODO.md` backlog entries (see there for full detail per topic):
  - **A0006** `utils/utils.mjs` — ~1300-line general-utility module, ~95% byte-identical (88 differing
    lines) between the two webapps once CRLF/LF is normalized. Highest-value single-file candidate by line
    count.
  - **A0007** `utils/formutils.mjs` — counters' 96-line version is a strict line-for-line subset of auth's
    179-line version.
  - **A0008** SPA framework core (`utils/component.mjs`, `dialog.mjs`, `domutils.mjs`, `events.mjs`,
    `log.mjs`, `reorder.mjs`) — 0-10 differing lines each; `events.mjs` and `log.mjs` are already
    byte-identical. Highest-leverage candidate since every view in both apps depends on `component.mjs`.
  - **A0009** App-shell scaffolding (`view/app-view.mjs`, `app-internals-view.mjs`, `app-menu.mjs`,
    `home-view.mjs`, `model/installer.mjs`) — 2-10 differing lines each.
  - **A0010** `utils/changelog-parser.mjs` — 15 differing lines out of ~150.
  - **A0011** REST-client HTTP transport + typed error hierarchy (`clients/js/src/http.mjs`,
    `errors.mjs`) — same structural shape in both clients (23/~75 and 69/~115 differing lines), mirroring
    the already-flagged Python equivalent in `hinolugi-support.python`'s backlog (T0007/T0008).
  - **A0012** `webapp/js/constants.mjs` — roughly half its lines look genuinely shared (dev-mode switches),
    half app-specific; flagged as lower-confidence, needing a design decision on shape rather than a
    straight move.
- Deliberately did **not** re-flag `webapp/js/client/` (hinolugi-counters) vs `clients/js/src/`
  (hinolugi-auth/hinolugi-counters) duplication — that's a different problem (a same-repo sync/copy step,
  not cross-repo library duplication) already tracked as `hinolugi-counters`' own T0087/T0093 and
  `hinolugi-support.java`'s T0005/A0011.
- Reviewed but did not file a candidate for `model/model-types.mjs`: despite matching file names, the two
  versions are mostly divergent (153 of ~155-194 lines differ) — counters' version carries substantial
  counter-specific value-formatting logic (enums, threshold-goal formatting, elapsed-time formatting) that
  auth has no equivalent of, so there's no clean-cut shared subset worth extracting without a deeper
  redesign.
- No automated tests apply (docs/TODO-only change, no source code touched); verified `TODO.md` renders
  correctly and each new entry's file/line references were spot-checked to still be accurate at the
  time of writing.

## Completion Record

- Delivered 7 backlog candidates (A0006-A0012) for shared-library extraction, each scoped to one topic and
  citing concrete file paths and normalized-diff evidence, ready for `@gio` to accept/reject/prioritize
  independently — mirrors the audit style already established in `hinolugi-support.java` and
  `hinolugi-support.python`'s own backlogs.
- No code in `hinolugi-auth` or `hinolugi-counters` was touched, per this task's scope (review + backlog
  filing only).
- Cleared `T0005`'s now-resolved `(needs T0003 ...)` dependency annotation.
