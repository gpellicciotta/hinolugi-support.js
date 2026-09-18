---
id: T0020
owner: "@worker-1"
needs: []
branch: task/T0020-extract-shared-css-stylesheets
worktree: ./work/T0020-extract-shared-css-stylesheets
status: active
started: 2026-09-19
ended: —
---

# T0020: Extract Shared CSS Stylesheets

## Goals

Extract duplicate CSS stylesheets identified in the code-reuse audit into css/.
Include dialog, menu, main-layout, collapsible, demo-view, mail-layout, tooltips, wait-panel, and error-view.
Ensure stylesheets use CSS design tokens and custom properties for theme adaptability.
Verify package exports and format all stylesheets cleanly.

## Task Execution Steps

- [x] **[Read]**      Review source stylesheets in hinolugi-auth and hinolugi-counters webapp/css.
- [x] **[Implement]** Copy and normalize shared stylesheets into css/ using existing CSS custom properties.
- [x] **[Verify]**    Verify package.json exports expose the new stylesheets cleanly.
- [x] **[Verify]**    Run npm test to ensure no regressions across existing test suites.
- [x] **[Doc]**       Update visual style guide and task documentation with new stylesheet inventory.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0020 to extract shared stylesheets from auth and counters webapps.

- [2026-09-19] **[Read]**
  Audited and compared 9 shared stylesheets across hinolugi-auth and hinolugi-counters.

- [2026-09-19] **[Implement]**
  Extracted 9 shared stylesheets into css/ directory normalized with CSS design tokens.
  - Normalized colors.css and style.css tokens
  - Added dialog, menu, main-layout, and collapsible
  - Added demo-view, mail-layout, tooltips, wait-panel, and error-view

- [2026-09-19] **[Verify]**
  Added automated test suite verifying stylesheet presence, export resolution, and import integrity.
  - Ran npm test with all 159 tests passing

- [2026-09-19] **[Doc]**
  Updated visual style guide specification with complete inventory of 19 shared stylesheets.
