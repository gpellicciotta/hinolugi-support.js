# Code-Reuse Opportunities Specification

Comprehensive inventory and specification of code-reuse opportunities between `hinolugi-auth`, `hinolugi-counters`, and `hinolugi-support.js`.

---

## Executive Summary

An audit of the JavaScript, HTML, and CSS assets across `hinolugi-auth` and `hinolugi-counters` identified over **16,000 lines of duplicate code** and **15+ distinct scripts and modules** that can be extracted into `@gpellicciotta/hinolugi-support.js`.

Adopting these shared modules will:
1. Eliminate code duplication across web application shells, stylesheets, and test tooling.
2. Establish a single source of truth for UI components, CSS design tokens, and SPA routing.
3. Provide turnkey test infrastructure including a lightweight mock DOM and headless static servers.

---

## Code-Reuse & Line Savings Matrix

| Category | Reusable Component / Module | Consumer File Locations | Est. Lines Spared | Replaced Scripts / Modules |
|:---|:---|:---|:---:|:---|
| **Stylesheets** | Identical Core CSS Stylesheets (`menu.css`, `collapsible.css`, `demo-view.css`, `mail-layout.css`, `tooltips.css`, `wait-panel.css`) | `webapp/css/*.css` in both repos | ~1,628 lines | 6 complete stylesheets per consumer |
| **Stylesheets** | Near-Identical CSS Stylesheets (`dialog.css`, `main-layout.css`, `error-view.css`, `create-account-view.css`) | `webapp/css/*.css` in both repos | ~884 lines | 4 stylesheets unified via design tokens |
| **Testing** | Lightweight Mock DOM (`mock-dom.mjs`) | `hinolugi-auth/webapp/js/test/mock-dom.mjs`, 5 test suites in `hinolugi-counters` | ~730 lines | 5 duplicate `MockElement` test classes |
| **Client** | Wire Date Formatters (`toWireDate`, `fromWireDate`, `parseDate`) | `clients/js/src/http.mjs` in both repos | ~30 lines | Redundant date wire conversions |
| **Client** | Uniform Pagination Shape (`page.mjs`) | `hinolugi-counters/clients/js/src/page.mjs` | ~70 lines | Replaces local `page.mjs` |
| **Client** | Offline Storage Adapters (`offline-storage.mjs`) | `hinolugi-counters/clients/js/src/offline-storage.mjs` | ~267 lines | Replaces local storage adapters |
| **Scripts** | Reusable Static Test/Dev Server (`test-static-server.mjs`) | 4 verification scripts in `hinolugi-counters/scripts` | ~234 lines | Replaces server boilerplate in 4 scripts |
| **Scripts** | Playwright Tour & Visual Integrity Recorder (`tour-recorder.mjs`) | `hinolugi-counters/scripts/lib/tour-recorder.mjs` | ~120 lines | Replaces `tour-recorder.mjs` |
| **Scripts** | REST Coverage Tracker & Auth Relays | `hinolugi-counters/scripts/lib/*.mjs` | ~154 lines | Replaces `test-scenario-lib` & `auth-helper` |
| **Webapp** | Existing Ported Utilities | `webapp/js/utils/*` in both repos | ~6,565 lines | Deletes local copies of utilities in consumers |
| **Webapp** | Core SPA Base Application (`AppBase` in `app.mjs`) | `webapp/js/app.mjs` in both repos | ~2,300 lines | Replaces ~80% of `app.mjs` in each app |
| **Webapp** | Delegated SSO Views (`sign-in-view.mjs`, `create-account-view.mjs`) | `webapp/js/view/sign-in-view.mjs` & `create-account-view.mjs` | ~240 lines | Replaces local SSO adapter views |
| **Webapp** | Service Worker Engine | `webapp/service-worker.mjs` in both repos | ~390 lines | Unifies service worker lifecycle & caching |
| **Webapp** | Unified Help & About View Subsystem | `help-view.mjs`, `about-view.mjs` | ~520 lines | Unifies changelog and status presentation |
| **HTML** | Email Template Preview Harness | `demo/mail-template-preview.html` in both repos | ~1,070 lines | Replaces local preview harnesses |
| **HTML** | View Demo Harness Scaffolding | `webapp/demo/*-harness.html` in both repos | ~500 lines | Standardizes harness runner setup |
| **Total** | | | **~16,712 lines** | **15+ distinct scripts/modules** |

---

## Detailed Component Analysis

### 1. Shared CSS Stylesheets (`css/`)

Both `hinolugi-auth` and `hinolugi-counters` maintain independent CSS directories. Diffing normalized line endings reveals substantial byte-for-byte identity:

- **Exact Overlap (0 diff lines)**:
  - `collapsible.css` (95 lines): Expandable accordion and details styling.
  - `demo-view.css` (270 lines): Styling for demo badges, scenario runners, and status panels.
  - `mail-layout.css` (170 lines): Responsive transactional email layout shell.
  - `menu.css` (219 lines): Drawer navigation menu, hamburger toggles, and responsive menu bars.
  - `tooltips.css` (41 lines): CSS-only hover tooltips.
  - `wait-panel.css` (19 lines): Full-page and card-level loading spinner overlays.

- **Near-Identical Overlap (<20 diff lines)**:
  - `dialog.css` (126–128 lines, 18 diff lines): Modal dialog overlay and button layout. Notice `hinolugi-support.js` exports `js/dialog.mjs` but lacked the companion stylesheet `css/dialog.css`.
  - `main-layout.css` (211–215 lines, 8 diff lines): Header, sticky top navigation, main content, and footer grid.
  - `error-view.css` (58 lines, 2 diff lines): Standardized error banners and detail blocks.
  - `create-account-view.css` (45 lines, 4 diff lines): Account creation form layout.

### 2. Testing Utilities: Headless Mock DOM (`js/mock-dom.mjs`)

Currently:
- `hinolugi-auth/webapp/js/test/mock-dom.mjs` (230 lines) provides `MockElement`, `MockDocument`, and `installMockDom()`.
- `hinolugi-counters/clients/js/test/` reimplements `MockElement` independently across 5 test suites (`about-view.test.mjs`, `dashboard-visibility.test.mjs`, `context-action-bar-dom-lifecycle.test.mjs`, `help-view.test.mjs`, and `sign-in-view.test.mjs`), totaling over 500 lines of duplicated mock code.
- `hinolugi-support.js/tests/` maintains private `FakeElement` helpers in `component.test.mjs`, `app-view.test.mjs`, and `app-internals-view.test.mjs`.

A shared `js/mock-dom.mjs` (and package export `./mock-dom.mjs`) eliminates these duplicates with zero third-party dependencies.

### 3. REST Client Transport & Pagination Helpers (`clients/js/`)

Both `hinolugi-auth` and `hinolugi-counters` have identical client transport mechanisms:
- **Wire Date Conversion**: `toWireDate(date)` (UTC ISO without milliseconds) and `fromWireDate(string)` / `parseDate(string)` exist in both client `http.mjs` modules.
- **Pagination Shape**: `hinolugi-counters/clients/js/src/page.mjs` defines `Page<T>`, `singlePage(items)`, and `pagedResult()`. This envelope structure is general-purpose and ready for shared consumption.
- **Offline Storage**: `hinolugi-counters/clients/js/src/offline-storage.mjs` provides `StorageAdapter`, `MemoryStorageAdapter`, and `IndexedDbStorageAdapter`. It has zero dependencies and can be used across any offline-capable JavaScript client or SPA.

### 4. Test Automation & Script Utilities (`scripts/lib/`)

`hinolugi-counters/scripts/` has accumulated mature automation modules:
- **Static Test Server**: `verify-harnesses.mjs`, `verify-interactive-flows.mjs`, `test-admin-view-playwright.mjs`, and `verify-counter-migration-ui.mjs` duplicate 50–60 lines each of Node `http.createServer` handling MIME types and static routing. Providing `scripts/lib/test-static-server.mjs` unifies these into a reusable module.
- **Playwright Tour & Visual Integrity Recorder**: `scripts/lib/tour-recorder.mjs` captures viewport screenshots, checks for blank frames (<5KB), checks SHA-256 collision regressions, and writes structured Markdown walkthrough tables.
- **REST Coverage Tracker**: `scripts/lib/test-scenario-lib.mjs` intercepts Playwright network traffic, collapses route patterns (`/{id}`, `/{interval}`), and asserts 100% endpoint coverage.
- **Headless Auth Helper**: `scripts/lib/auth-helper.mjs` handles basic authentication against `hinolugi-auth`, captures one-time passcodes, and mints session tokens for test harnesses.

### 5. Webapp Architecture & Views (`webapp/js/`)

- **Core Application Framework (`AppBase`)**: Over 1,000 lines in `app.mjs` are common between auth and counters: event bus, router, navigation stack, action bar registry, notification banner management, and wait/error panel lifecycle. Extracting `AppBase` into `hinolugi-support.js` allows downstream apps to subclass `AppBase` and provide only app-specific views and branding.
- **SSO Authentication Views**: `hinolugi-counters` contains `SignInView` (handling SSO redirection to `hinolugi-auth`, one-time passcode relay, and error parameters) and `CreateAccountView` (redirecting to SSO sign-in). These views can be extracted as turnkey components for any HiNoLuGi client application.
- **Service Worker Engine**: Both applications run near-identical service worker scripts (`service-worker.mjs`, ~250 lines) managing versioned cache lifecycle, stale cache pruning, and offline fetch fallbacks.

---

## Phased Implementation Roadmap

1. **Phase 1 (Immediate Extraction & Packaging)**:
   - Export shared CSS stylesheets in `css/`.
   - Implement `js/mock-dom.mjs` with full test coverage.
   - Implement client wire date formatters and pagination helper `js/page.mjs`.
   - Implement zero-dependency offline storage adapters in `js/offline-storage.mjs`.
   - Implement script automation helpers in `scripts/lib/`.
   - Cut release `v0.83.1`.

2. **Phase 2 (Downstream Client Adoption)**:
   - Replace duplicate `errors.mjs` and `http.mjs` in `hinolugi-auth/clients/js` and `hinolugi-counters/clients/js` with imports from `@gpellicciotta/hinolugi-support.js`.
   - Adopt `page.mjs` and `offline-storage.mjs`.

3. **Phase 3 (Webapp & Script Adoption)**:
   - Eliminate local `webapp/js/utils/` copies in downstream apps.
   - Link shared CSS stylesheets in webapp HTML headers.
   - Refactor `app.mjs` to extend `AppBase`.
