---
id: T0022
owner: "@worker-1"
needs: []
branch: task/T0022-add-wire-date-and-page-helpers
worktree: ./work/T0022-add-wire-date-and-page-helpers
status: active
started: 2026-09-19
ended: —
---

# T0022: Add Wire Date Formatters and Pagination Helper

## Goals

Port client wire date formatting and parsing helpers into http.mjs and utils.mjs.
Add uniform paged-result abstraction page.mjs matching HiNoLuGi REST client contracts.
Verify null and undefined safety across formatters and pagination builders.
Add comprehensive unit tests and document exports in CHANGELOG.md.

## Task Execution Steps

- [ ] **[Read]**      Review toWireDate, fromWireDate, and page.mjs across consumer client libraries.
- [ ] **[Implement]** Add toWireDate, fromWireDate, and parseDate to js/http.mjs with re-exports.
- [ ] **[Implement]** Port js/page.mjs implementing Page, singlePage, and pagedResult helpers.
- [ ] **[Verify]**    Add unit test suites in tests/page.test.mjs and expand tests/http.test.mjs.
- [ ] **[Doc]**       Update CHANGELOG.md and task documentation.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0022 to implement wire date helpers and uniform client pagination.
