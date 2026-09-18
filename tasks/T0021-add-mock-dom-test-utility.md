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

- [ ] **[Read]**      Review existing mock DOM implementations in hinolugi-auth and hinolugi-counters tests.
- [ ] **[Implement]** Implement js/mock-dom.mjs providing MockElement, MockDocument, installMockDom, and uninstallMockDom.
- [ ] **[Verify]**    Add unit test suite in tests/mock-dom.test.mjs covering DOM operations and global hooks.
- [ ] **[Verify]**    Run npm test to confirm all suites pass cleanly.
- [ ] **[Doc]**       Update CHANGELOG.md and task documentation.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0021 to implement a canonical headless Mock DOM module for Node test environments.
