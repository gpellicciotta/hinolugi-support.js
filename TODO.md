# TODO

An overview of all tasks and their planning.

> Tasks are listed by milestone.
> See [coordinating work guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md) for the full coordination protocol.
>
> Status: `[ ]` available · `[~]` active · `[!]` blocked · `[?]` needs-review
> Owner: `@name` shown only when active/blocked/needs-review.
> Dependencies: `(needs Tnnnn)` shown only when unresolved.

**Next ID:** 0016

---

## Next Milestone

- [!] A0009 [owner: @claude] [blocked: awaiting @gio's review/approval of the move before implementation] App-shell scaffolding — `webapp/js/view/app-view.mjs` (base `AppView` class every view extends),
      `app-internals-view.mjs`, `app-menu.mjs`, `home-view.mjs`, and `webapp/js/model/installer.mjs` (PWA
      install-prompt handling) are near-byte-identical between the two webapps (2-10 differing lines each,
      after normalizing line endings). Candidate: move into this library alongside A0008's framework core,
      since these are the generic app-shell layer, not app-specific views. @gio please review before this is
      picked up.
- [!] A0010 [owner: @claude] [blocked: awaiting @gio's review/approval of the move before implementation] `webapp/js/utils/changelog-parser.mjs` (parses a `CHANGELOG.md` into structured data for the
      About view) is near-byte-identical between the two webapps (15 differing lines out of ~150, after
      normalizing line endings). NOT just wording: counters' switch statement is missing the `'clients'`
      (plural) case that auth has, so `Clients:`-prefixed entries misclassify as `'feature'` there today.
      @gio must decide which behavior is canonical before this is merged into the shared library.
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
      app-specific (`APP_ACTIONS` names, `API_BASE_URL`). Lower-confidence than A0007-A0011 since a clean
      split needs a design decision on how to structure a "shared defaults + app-specific overrides" shape
      without over-coupling the two webapps' dev-mode switches. @gio please review before this is picked up.
- [ ] A0013 `docs/devops.md`'s Release Process section, step 2, has the freeze-and-reopen edits land in
      one commit, so no commit ever has `package.json`'s `version` at the plain frozen value (e.g. `0.82.0`,
      no `-pre`) — HEAD jumps straight from `0.82.0-pre` to `0.82.1-pre`. Since the publish path is a
      GitHub-Release-triggered CI job that runs `npm publish` against whatever `package.json` says at the
      released commit, tagging/releasing HEAD as-is would publish the wrong version under the release name.
      T0005 worked around this with an extra pin/unpin commit pair; fix the documented process (e.g. a
      dedicated frozen-version commit before reopening `-pre`) so future releases don't need the workaround.
- [ ] T0016 [needs: A0013 A0012 A0011 A0010 A0009] Make a release that can be consumed by other projects (like hinolugi-counters and hinolugi-auth). Also make sure the release process is well documented in devops.md

---

### Backlog

*(Currently no tasks)*

