---
id: T0017
owner: "@antigravity"
needs: []
branch: task/T0017-extend-shared-ui-components-and-utilities
worktree: ./work/T0017-extend-shared-ui-components-and-utilities
status: active
started: 2026-09-18
ended: —
---

# T0017: Extend Shared UI Components and Webapp Utilities

## Goals

Extend hinolugi-support.js with reusable UI components and utilities identified from hinolugi-counters.
Implement missing button loading state in formutils to fulfill the visual style guide contract.
Add human-friendly date and detailed relative time formatters to the shared utility module.
Incorporate local usage tracking, notification bar, action bar, and progress bar components.
Ensure complete test coverage and visual consistency across all shared components.

## Task Execution Steps

- [ ] **[Implement]** Add setButtonLoading helper in formutils.mjs with unit tests.
- [ ] **[Implement]** Add formatHumanDateTime and formatDetailedRelativeTime formatters to utils.mjs with unit tests.
- [ ] **[Implement]** Add data-ui-state tracking and overloaded operation runners to Component base class.
- [ ] **[Implement]** Port local-usage-tracking.mjs into js directory with unit tests.
- [ ] **[Implement]** Add AppNotificationBar and AppActionBar components with matching stylesheets.
- [ ] **[Implement]** Port top progress bar stylesheet into css/progress.css.
- [ ] **[Implement]** Add generic redirectToHinolugiAuth helper for SSO sign-in flows.
- [ ] **[Verify]**    Run full automated test suite to confirm all tests pass.
- [ ] **[Doc]**       Update visual style guide, exports, and CHANGELOG.md for new release.

## Execution Log

- [2026-09-18] **[Read]**
  Assembled reusable component and utility opportunities from counters webapp audit.
  Documented implementation requirements, reference sources, and test coverage scope.

- [2026-09-18] **[Decide]**
  Claimed task T0017 with approved implementation plan for worktree execution.

## Implementation Details & Source References

### Button Loading State (`formutils.mjs`)

- **Context**: The visual style guide (`docs/specs/visual-style-guide.md`) specifies `formutils.setButtonLoading(buttonEl, isLoading, loadingText)`.
- **Gap**: The function is currently missing from `hinolugi-support.js/js/formutils.mjs`.
- **Reference Source**: `hinolugi-counters/webapp/js/utils/formutils.mjs` lines 146–186.
- **Specification**:
  - `setButtonLoading(buttonEl, isLoading = true, loadingText = null)`
  - Preserves original button HTML in `dataset.originalContent`.
  - Disables button and applies `is-loading` class.
  - Injects FontAwesome spinner (`<i class="icon fa-solid fa-circle-notch fa-spin"></i>`) alongside label.
  - Restores previous DOM content and state when `isLoading` is false.

### Date and Relative Time Formatters (`utils.mjs`)

- **Context**: Audit logs, activity streams, and account panels require human-readable timestamp displays.
- **Reference Source**: `hinolugi-counters/webapp/js/utils/utils.mjs` lines 1280–1363.
- **Functions to Add**:
  - `formatHumanDateTime(dateTime, withTime = true)`: formats dates as `15 January 2026 at 09:08` or `15 January 2026`.
  - `formatDetailedRelativeTime(dateTime, now = new Date())`: formats durations as `1 day, 2 hours and 15 minutes ago`, `45 minutes ago`, or `just now`.
  - Handles null, undefined, timestamps, and invalid Date objects safely.

### Component Lifecycle Enhancements (`component.mjs`)

- **Context**: Counters hardened `Component` with operational overloads and automated state attributes.
- **Reference Source**: `hinolugi-counters/webapp/js/utils/component.mjs` lines 114–280.
- **Enhancements**:
  - Add `data-ui-state` attribute management (`"ready"`, `"updating"`, `"error"`) to `this.componentUIEl`.
  - Support signature overloads in `startLongRunningOperation`:
    - `startLongRunningOperation(title, asyncFn)`
    - `startLongRunningOperation(asyncFn)`
    - `startLongRunningOperation(optionsObject)`
  - Coordinate with top-level progress bar via `app.startProgress()` and `app.stopProgress()`.

### Local Usage Tracking Store (`local-usage-tracking.mjs`)

- **Context**: Manages recent and frequent selections in `localStorage` without framework dependencies.
- **Reference Source**: `hinolugi-counters/webapp/js/utils/local-usage-tracking.mjs`.
- **Features**:
  - `recordUsage(storageKey, key)`: records timestamp and increments usage counter.
  - `getTopKeys(storageKey, limit)`: returns sorted keys prioritizing pinned, then count, then recency.
  - `pinKey(storageKey, key, pinned)`: pins items to always remain at top of suggestion lists.
  - Safe error handling when `localStorage` is inaccessible or full.

### App Notification Bar (`app-notification-bar.mjs` and `notification-bar.css`)

- **Context**: Universal top notification bar component displaying alert banners across all SPAs.
- **Reference Source**: `hinolugi-counters/webapp/js/view/app-notification-bar.mjs` and `webapp/css/notification-bar.css`.
- **Features**:
  - Collapsible banner showing latest alert with expandable drawer.
  - Dismiss button triggering `app.deleteNotification(notificationId)`.
  - Standard responsive styling integrating with sticky shell headers.

### App Action Bar (`app-action-bar.mjs` and `action-bar.css`)

- **Context**: Reusable action bar for desktop and mobile touch navigation.
- **Reference Source**: `hinolugi-counters/webapp/js/view/app-action-bar.mjs` and `webapp/css/action-bar.css`.
- **Features**:
  - Renders action buttons from registered action IDs.
  - Supports enabled/disabled states, tooltip descriptions, and badge indicators.
  - Standard layout and mobile bottom-bar positioning.

### Top Progress Bar Stylesheet (`progress.css`)

- **Context**: Visual style guide section 3.1 mandates `#app-top-progress-bar`.
- **Reference Source**: `hinolugi-counters/webapp/css/progress.css`.
- **Features**:
  - Fixed 3px indeterminate linear progress animation across top edge of viewport.
  - Smooth opacity transitions when toggled active.

### Auth Service Redirection Helper (`hinolugi-auth-redirect.mjs`)

- **Context**: Generic SSO authentication redirect helper for HiNoLuGi applications.
- **Reference Source**: `hinolugi-counters/webapp/js/utils/hinolugi-auth-redirect.mjs`.
- **Features**:
  - `redirectToHinolugiAuth({ authServiceBaseUrl, appName, redirectUrl, appLogoUrl })`
  - Encodes query parameters and redirects browser to `hinolugi-auth/sign-in`.
