---
id: T0011
owner: "@gemini"
needs: []
branch: task/T0011-add-a-shared-transport-error-hierarchy-module-generic
worktree: ./work/T0011-add-a-shared-transport-error-hierarchy-module-generic
status: completed
started: 2026-09-06
ended: 2026-09-06
---

# T0011: Add A Shared Transport Error Hierarchy Module Generic

## Goals

Extract a generic REST client HTTP transport and error hierarchy module into the shared library.
Preserve auth's header merging behavior and counters' redirect handling across both client libraries.
Document the upgrade procedure for downstream client libraries in auth and counters.

## Task Execution Steps

- [x] **[Read]**      Compare HTTP transport and error hierarchy implementations in auth and counters clients.
- [x] **[Decided]**   Design shared http and errors modules with options.headers merging and unified exports.
- [x] **[Implement]** Add js/errors.mjs with ApiError hierarchy and regex-based mapError logic.
- [x] **[Implement]** Add js/http.mjs with buildUrl, auth headers, date helpers, and sendRequest.
- [x] **[Implement]** Add comprehensive tests in tests/errors.test.mjs and tests/http.test.mjs.
- [x] **[Doc]**       Document client upgrade guide and update requirements and index docs.
- [x] **[Verify]**    Verify test suite passes and check formatting for added files.

## Execution Log

- [2026-09-06] **[Read]**
  Audited `http.mjs` and `errors.mjs` in both `hinolugi-auth` and `hinolugi-counters` client packages.

- [2026-09-06] **[Decided]**
  Adopted superset transport returning `{ status, data, headers }` with auth header merging and redirect handling.

- [2026-09-06] **[Implement]**
  Added `js/errors.mjs` with `ApiError` hierarchy and `mapError`.
  - Added `js/http.mjs` with `buildUrl`, auth headers, `toWireDate`, `fromWireDate`, and `sendRequest`.
  - Added unit test suites `tests/errors.test.mjs` and `tests/http.test.mjs`.

- [2026-09-06] **[Doc]**
  Created `docs/specs/client-upgrade-guide.md` and updated `docs/requirements.md`, `docs/index.md`, and `README.md`.

- [2026-09-06] **[Verify]**
  Verified all 105 tests passing and verified Prettier code style on new files.

- [2026-09-06] **[Complete]**
  Delivered generic shared REST client transport and error hierarchy modules with documentation.
