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

- [ ] **[Read]**      Review source stylesheets in hinolugi-auth and hinolugi-counters webapp/css.
- [ ] **[Implement]** Copy and normalize shared stylesheets into css/ using existing CSS custom properties.
- [ ] **[Verify]**    Verify package.json exports expose the new stylesheets cleanly.
- [ ] **[Verify]**    Run npm test to ensure no regressions across existing test suites.
- [ ] **[Doc]**       Update visual style guide and task documentation with new stylesheet inventory.

## Execution Log

- [2026-09-19] **[Decide]**
  Claimed task T0020 to extract shared stylesheets from auth and counters webapps.
