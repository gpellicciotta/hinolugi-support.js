---
id: T0021
owner: "@worker-1"
needs: []
branch: task/T0021-add-mock-dom-test-utility
worktree: ./work/T0021-add-mock-dom-test-utility
status: active
started: 2026-09-19
ended: —
---

# T0021: Add Lightweight Mock DOM Test Utility

## Goals

Implement a zero-dependency headless Mock DOM utility in js/mock-dom.mjs.
Support MockElement, MockDocument, and global mock environment installers.
Provide query selector matching, class list, dataset, attributes, events, and templates.
Cover all functionality with comprehensive unit tests in tests/mock-dom.test.mjs.

## Task Execution Steps

- [x] **[Read]**      Review existing mock DOM implementations in hinolugi-auth and hinolugi-counters tests.
- [x] **[Implement]** Implement js/mock-dom.mjs providing MockElement, MockDocument, installMockDom, and uninstallMockDom.
- [x] **[Verify]**    Add unit test suite in tests/mock-dom.test.mjs covering DOM operations and global hooks.
- [x] **[Verify]**    Run npm test to confirm all suites pass cleanly.
- [x] **[Doc]**       Update CHANGELOG.md and task documentation.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0021 to implement a canonical headless Mock DOM module for Node test environments.

- [2026-09-19] **[Read]**
  Reviewed reference MockElement and installMockDom implementations across auth and counters webapps.

- [2026-09-19] **[Implement]**
  Implemented js/mock-dom.mjs with MockElement, MockDocument, and install/uninstall global hooks.
  - Implemented selector matching, dataset proxy, classList, and events
  - Added HTML parsing and template content support

- [2026-09-19] **[Verify]**
  Added 35 comprehensive unit tests in tests/mock-dom.test.mjs.
  - Verified 194 tests across 41 suites passing cleanly

- [2026-09-19] **[Doc]**
  Updated CHANGELOG.md under v0.83.1-pre and updated task checklist.
