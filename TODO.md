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

- [ ] T0010 Add an equivalent of `webapp/js/utils/changelog-parser.mjs` which parses a `CHANGELOG.md` into structured data
- [ ] T0011 Add a shared transport + error-hierarchy module generic enough for both JS REST clients, with `sendRequest` preserving auth's `options.headers` merging behavior. Also document in detail how upgrades of both libraries will have to be performed.
- [ ] T0016 [needs: T0010 T0011] Make a release that can be consumed by other projects (like hinolugi-counters and hinolugi-auth). Also make sure the release process is well documented in devops.md

---

### Backlog

*(Currently no tasks)*

