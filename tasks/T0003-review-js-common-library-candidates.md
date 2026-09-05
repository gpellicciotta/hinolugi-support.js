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

## Goals

Review `hinolugi-counters`/`hinolugi-auth`'s webapp and JS-client code for extraction candidates into this
shared library, mirroring the audits already done for the Java and Python sibling libraries. Deliverable is
backlog `TODO.md` entries only, no code changes.

## Task Execution Steps

- [x] **[Read]**      List every non-generated `.mjs`/`.js` file under both repos' webapp/client trees.
- [x] **[Read]**      Diff same-path files after normalizing CRLF/LF to measure real content overlap.
- [x] **[Decided]**   Group findings into 7 topics by similarity/confidence, one backlog entry each.
- [x] **[Doc]**       Add `TODO.md` backlog entries A0006-A0012 citing files and diff-line counts.

## Execution Log

- [2026-09-04] **[Read]**
  Diffed matching files between both repos after CRLF/LF normalization to find real overlap, since raw diffs
  reported every line as different.

- [2026-09-04] **[Doc]**
  Filed A0006-A0012 in `TODO.md`: `utils.mjs`, `formutils.mjs`, SPA framework core, app-shell scaffolding,
  `changelog-parser.mjs`, REST-client transport/errors, and `constants.mjs`.
  - Skipped `model/model-types.mjs`: too divergent (153 of ~155-194 lines) for a clean shared subset.
  - Left `webapp/js/client/` vs `clients/js/src/` duplication to existing tracked tasks elsewhere.

- [2026-09-04] **[Complete]**
  Delivered 7 backlog candidates (A0006-A0012) with concrete file/diff evidence for `@gio` to
  accept/reject/prioritize independently; no source code touched. Cleared T0005's resolved dependency on
  this task.
