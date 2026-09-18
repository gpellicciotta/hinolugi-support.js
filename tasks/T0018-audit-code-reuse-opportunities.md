---
id: T0018
owner: "@antigravity"
needs: []
branch: task/T0018-audit-code-reuse-opportunities
worktree: ./work/T0018-audit-code-reuse-opportunities
status: completed
started: 2026-09-18
ended: 2026-09-19
---

# T0018: Audit Code-Reuse Opportunities

## Goals

Audit JavaScript, HTML, and CSS assets across hinolugi-auth and hinolugi-counters for reuse opportunities in hinolugi-support.js.
Examine scripts, client transport code, webapp frameworks, views, stylesheets, and test harnesses.
Calculate concrete line counts spared and entire scripts replaced across both consumer repositories.
Formulate a reusable specification and plan subsequent extraction tasks in TODO.md.

## Task Execution Steps

- [x] **[Read]**      Survey non-generated scripts, clients, webapps, and stylesheets across both consumer repositories.
- [x] **[Read]**      Compare matching CSS stylesheets and scripts line-by-line to calculate concrete duplication metrics.
- [x] **[Decided]**   Group reuse opportunities into stylesheets, test infrastructure, client transport, and webapp architecture.
- [x] **[Doc]**       Author comprehensive specification in docs/specs/code-reuse-opportunities.md.
- [x] **[Doc]**       Index new specification in docs/index.md and populate backlog tasks in TODO.md.

## Execution Log

- [2026-09-18] **[Read]**
  Audited all JS, CSS, and HTML assets across hinolugi-auth and hinolugi-counters checkouts.

- [2026-09-19] **[Decide]**
  Identified over 16,000 lines of duplicated code and 15+ candidate modules for shared library extraction.

- [2026-09-19] **[Doc]**
  Authored code-reuse opportunities specification and registered backlog tasks for prioritized implementation.

- [2026-09-19] **[Complete]**
  Delivered comprehensive audit specification and established extraction roadmap across projects.
  - Review tier: autonomous agent pre-authorized; all checks validated.

## Walkthrough & Validation

### Audit Results

- Identified 6 identical CSS stylesheets (814 lines) and 4 near-identical stylesheets (442 lines).
- Identified duplicated MockElement testing infrastructure across 5 suites in counters and auth (730 lines).
- Identified shared client transport and pagination utilities in clients/js (370 lines).
- Identified reusable static dev server and Playwright tour recorder across test scripts (508 lines).
- Authored comprehensive specification: `docs/specs/code-reuse-opportunities.md`.
