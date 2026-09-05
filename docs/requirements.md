# Requirements

Functional and technical requirements for the `hinolugi-support.js` project.

---

## High-Level Goals

- Provide general-purpose JavaScript support code, for both client-side (browser) and server-side (Node.js)
  use, with as few third-party dependencies as possible.
- Serve as a shared library for other HiNoLuGi web projects (`hinolugi-auth`, `hinolugi-counters`), reducing
  hand-duplicated utility code between their web apps and JS REST clients.
- Publish releases as an npm package (`@gpellicciotta/hinolugi-support.js`) on GitHub Packages.

---

## Functional Requirements

### CLI Logging (Node.js)
- Provide `LogLevel`, `formatSeverityIndicator`/`formatLogMessage`, and a `CliLogger` class implementing the
  guideline-compliant CLI log format, API-similar to the `LogLevel`/`Log` (Java) and `LogLevel`/`CliLogger`
  (Python) implementations in the sibling support libraries (`js/cli-log.mjs`).

### Browser Logging and Eventing
- Provide a browser-safe, handler-based event logger (`js/log.mjs`) and a general event registration/firing
  mechanism (`js/events.mjs`), independent of any DOM or global-object dependency where possible.

### DOM and Forms
- Provide DOM-related utility functions that rely on the global `document`/`window` objects (`js/domutils.mjs`).
- Provide form-related validation/marking helper functions (`js/formutils.mjs`).
- Provide a drag-to-reorder utility for container items (`js/reorder.mjs`).
- Provide a dialog component (`js/dialog.mjs`).

### General Utilities
- Provide general-purpose helper functions with no global-object or DOM dependency (`js/utils.mjs`).
- Provide `Vector` and `Matrix` classes for 2D/3D math (`js/vector.mjs`, `js/matrix.mjs`).
- Provide Perlin noise generation (`js/noise.mjs`).

### Canvas and Games
- Provide canvas-drawing utility functions relying only on the Canvas API (`js/canvas.mjs`).
- Provide collision-detection utility functions between shapes, for simple games (`js/collisions.mjs`).
- Provide decorative canvas effects: fireworks (`js/fireworks.mjs`) and snowflakes (`js/snowflakes.mjs`).

### Word Lists
- Provide Dutch and English word lists for word-based games or utilities (`js/dutchwords.mjs`,
  `js/englishwords.mjs`).

### Styling
- Provide a CSS reset (`css/reset.css`) and a shared color palette (`css/colors.css`).

---

## Technical Requirements

- **Module Format**: ECMAScript modules (`.mjs`), consumed via subpath imports (e.g.
  `@gpellicciotta/hinolugi-support.js/cli-log.mjs`).
- **Runtime**: Browser-safe modules avoid Node-only APIs; Node-only modules (e.g. `cli-log.mjs`) are the
  exception, documented as such.
- **Testing**: Node's built-in `node:test` and `node:assert` (no third-party test framework dependency).
- **Dependencies**: As few third-party dependencies as possible, per
  [general-guidelines.md](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/general-guidelines.md).
- **Packaging**: npm package published to GitHub Packages via an automated GitHub Actions workflow, triggered
  by a published GitHub Release.
- **Code Standards**: 2-space indentation, UTF-8 encoding, US English.
- **Versioning**: [Semantic Versioning](https://semver.org/); backward-incompatible changes bump the major
  version and get an explicit breaking-change note in `CHANGELOG.md`.
