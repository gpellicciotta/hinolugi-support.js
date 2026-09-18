---
id: T0024
owner: "@worker-1"
needs: []
branch: task/T0024-add-static-server-and-tour-recorder
worktree: ./work/T0024-add-static-server-and-tour-recorder
status: active
started: 2026-09-19
ended: —
---

# T0024: Add Reusable Static Test Server and Tour Recorder

## Goals

Port reusable test automation helpers identified in the code-reuse audit into scripts/lib/.
Provide configurable static file server for demo harnesses and Playwright execution.
Provide TourRecorder with visual regression checking, screenshot hashing, and Markdown reporting.
Cover all helpers with unit tests and document additions in CHANGELOG.md.

## Task Execution Steps

- [ ] **[Read]**      Review static server implementations and TourRecorder in hinolugi-counters/scripts.
- [ ] **[Implement]** Implement scripts/lib/static-server.mjs with MIME detection, path aliases, and lifecycle.
- [ ] **[Implement]** Implement scripts/lib/tour-recorder.mjs with integrity verification and report generation.
- [ ] **[Verify]**    Add unit test suites in tests/scripts-lib.test.mjs covering server and recorder.
- [ ] **[Doc]**       Update CHANGELOG.md and task documentation.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0024 to implement shared test automation server and visual tour recorder.
