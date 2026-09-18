---
id: T0023
owner: "@worker-1"
needs: []
branch: task/T0023-add-offline-storage-adapters
worktree: ./work/T0023-add-offline-storage-adapters
status: active
started: 2026-09-19
ended: —
---

# T0023: Add Offline Storage Adapters

## Goals

Port zero-dependency offline storage adapters from hinolugi-counters into js/offline-storage.mjs.
Provide StorageAdapter base class, MemoryStorageAdapter, and IndexedDbStorageAdapter.
Support isolated user namespaces, transactional store access, and key-value crud operations.
Provide comprehensive automated test coverage and record updates in CHANGELOG.md.

## Task Execution Steps

- [ ] **[Read]**      Review offline storage adapter implementation in hinolugi-counters/clients/js/src.
- [ ] **[Implement]** Port js/offline-storage.mjs exporting StorageAdapter, MemoryStorageAdapter, and IndexedDbStorageAdapter.
- [ ] **[Verify]**    Implement comprehensive unit test suite in tests/offline-storage.test.mjs.
- [ ] **[Verify]**    Run npm test to ensure all suites pass with zero regressions.
- [ ] **[Doc]**       Update CHANGELOG.md and task documentation.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0023 to port zero-dependency offline storage adapters into the shared JS library.
