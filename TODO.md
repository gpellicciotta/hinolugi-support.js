# TODO

An overview of all tasks and their planning.

> Tasks are listed by milestone.
> See [coordinating work guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md) for the full coordination protocol.
>
> Status: `[ ]` available · `[~]` active · `[!]` blocked · `[?]` needs-review
> Owner: `@name` shown only when active/blocked/needs-review.
> Dependencies: `(needs Tnnnn)` shown only when unresolved.

**Next ID:** 0013

---

## Next Milestone

- [ ] T0005 Make a full release, including making the packages available via GitHub. 

---

### Backlog

- [ ] A0006 `webapp/js/utils/utils.mjs` (general-purpose helpers: deep-clone, date/number formatting, string
      utils, etc.) is ~95% byte-identical between `hinolugi-auth` and `hinolugi-counters` (after normalizing
      CRLF-vs-LF line endings, only 88 of ~1300 lines differ). The divergent lines are a handful of
      functions each side has that the other doesn't: auth-only `areEqual`/`areArraysEqual`,
      `isValidPassword`/`validPasswordDescription`, `hslToString`; counters-only `escapeHtml`. Candidate:
      add this library's own `utils.mjs` with the union of both sides' functions, have both webapps import
      it instead of maintaining near-duplicate 1300-line files. @gio please review before this is picked up.
- [ ] A0007 `webapp/js/utils/formutils.mjs` (form-field validation/marking helpers) — `hinolugi-counters`'s
      version (96 lines) is a strict subset of `hinolugi-auth`'s (179 lines): every function counters has
      (`markInvalid`/`markValid`/`disable`/enable-type field helpers) is byte-identical in auth, which
      additionally has `reset`, `removeValidityMarks`, `validateInputField`, `validateEmailField`, and a
      `readOnly` toggle in `disable`/`enable`. Candidate: add auth's superset version to this library's
      `utils` module; counters would gain the extra validation helpers for free. @gio please review before
      this is picked up.
- [ ] A0008 SPA component/DOM/event framework core — `webapp/js/utils/component.mjs` (base `Component`
      lifecycle class), `dialog.mjs`, `domutils.mjs` (738 lines), `events.mjs` (global event bus, byte-for-byte
      identical already), `log.mjs` (byte-for-byte identical already), and `reorder.mjs` (drag-reorder helper)
      are all near-byte-identical between the two webapps (0-10 differing lines each, after normalizing line
      endings — see `hinolugi-auth/webapp/js/utils/` vs `hinolugi-counters/webapp/js/utils/`). This is the
      framework-level plumbing both SPAs' component model is built on. Candidate: move this whole set into
      this library as a small framework-core module. @gio please review before this is picked up — this is
      the highest-leverage candidate since every view in both apps depends on `component.mjs`.
- [ ] A0009 App-shell scaffolding — `webapp/js/view/app-view.mjs` (base `AppView` class every view extends),
      `app-internals-view.mjs`, `app-menu.mjs`, `home-view.mjs`, and `webapp/js/model/installer.mjs` (PWA
      install-prompt handling) are near-byte-identical between the two webapps (2-10 differing lines each,
      after normalizing line endings). Candidate: move into this library alongside A0008's framework core,
      since these are the generic app-shell layer, not app-specific views. @gio please review before this is
      picked up.
- [ ] A0010 `webapp/js/utils/changelog-parser.mjs` (parses a `CHANGELOG.md` into structured data for the
      About view) is near-byte-identical between the two webapps (15 differing lines out of ~150, after
      normalizing line endings) - the differences look like inconsequential wording. Candidate: move into
      this library. @gio please review before this is picked up.
- [ ] A0011 REST client HTTP transport + typed error hierarchy (JS) — `clients/js/src/http.mjs`
      (`buildUrl`/`basicAuthHeader`/`bearerAuthHeader`/`sendRequest`, a `fetch`-based transport that maps
      non-2xx responses onto an `ApiError` hierarchy) and `clients/js/src/errors.mjs`
      (`ApiError`/`AuthenticationError`/`ValidationError`/`NotFoundError`/`ConflictError` + a status-code-to-
      exception `mapError` function) are the same structural shape in both `hinolugi-auth` and
      `hinolugi-counters` clients, differing mainly in parameter naming and counters' extra
      `redirect`/`credentials` handling (23 of ~75 lines differ in `errors.mjs`, 69 of ~115 in `http.mjs`,
      after normalizing line endings). This mirrors the already-flagged Python equivalent
      (`hinolugi-support.python`'s backlog T0007/T0008). Candidate: add a shared transport + error-hierarchy
      module to this library, generic enough for both JS REST clients to depend on instead of hand-copying.
      @gio please review before this is picked up — wire-format-adjacent code, needs care.
- [ ] A0012 `webapp/js/constants.mjs` is only partially shared: roughly half its lines (55 of ~105, after
      normalizing line endings) are generic dev-mode switches (e.g. `RUN_MODE`-style toggles, notification
      durations) that look identical in shape between the two webapps, while the rest is genuinely
      app-specific (`APP_ACTIONS` names, `API_BASE_URL`). Lower-confidence than A0006-A0011 since a clean
      split needs a design decision on how to structure a "shared defaults + app-specific overrides" shape
      without over-coupling the two webapps' dev-mode switches. @gio please review before this is picked up.