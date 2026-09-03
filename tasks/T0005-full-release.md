---
id: T0005
title: full-release
owner: "@claude"
needs: []
branch: task/T0005-full-release
worktree: ./work/T0005-full-release
status: active
started: 2026-09-04
ended: —
---

# T0005 — Full Release

## Objectives & Scope

Cut the first real release of `hinolugi-support.js` and make the package available via GitHub Packages, per
`docs/devops.md`'s Release Process (section 3). Prerequisites T0002 (publish pipeline), T0003
(shared-library-candidate review), and A0004 (guideline-alignment review) are already completed, so the
package, docs, and CI workflow are release-ready; what remains is executing the release steps.

Out of scope: this repo's own `docs/devops.md` (section 3, step 4) and `CLAUDE.md`'s Execution Boundaries both
require explicit human confirmation before publishing a GitHub Release or pushing a release tag ("Never run the
publish command unless explicitly asked", "Tag pushes are an outbound action and need the same explicit
approval as any other push") — the pickup-work-loop's pre-authorization only covers routine `git push` to
`origin/main` for claim/integrate/cleanup, not cutting a GitHub Release or pushing a version tag. `T0002`'s own
Progress Log independently reached the same conclusion when it left the Release trigger unverified.

## Task Implementation and Verification Steps

- `[Read]` Reviewed `docs/devops.md` section 3 (Release Process) and section 3.2 (Tagging a Release), and
  `package.json`/`CHANGELOG.md`'s current state (both at `0.82.0-pre`, matching).
- `[Decide]` **[Decided]** Perform steps 1-3 of the documented release process (freeze the CHANGELOG heading
  and `package.json` version, open the next `-pre` heading, verify tests/pack) autonomously — these are local,
  reversible file edits pre-authorized by the pickup-work-loop protocol. Stop before step 4 (publishing the
  GitHub Release) and step 5/3.2 (tagging), since both are outbound publishing actions this repo's own docs and
  `CLAUDE.md` explicitly gate behind human confirmation.
- `[Implement]` Freeze `CHANGELOG.md`'s `## v0.82.0-pre` heading to `## v0.82.0 [2026-09-04]`; add a new empty
  `## v0.82.1-pre` heading above it.
- `[Implement]` Update `package.json`'s `version` to `0.82.1-pre` (the new top active heading).
- `[Verify]` `npm test` and `npm pack --dry-run`.

## Progress & Validation Log

- `CHANGELOG.md`: froze `v0.82.0-pre` to `v0.82.0 [2026-09-04]`, added empty `v0.82.1-pre` heading above it.
- `package.json`: bumped `version` from `0.82.0-pre` to `0.82.1-pre`.
- `npm test`: pending.
- `npm pack --dry-run`: pending.

**[Feedback Needed]** This task cannot reach a fully "completed" terminal state autonomously: the remaining
work — publishing a GitHub Release for `v0.82.0` (triggers `.github/workflows/publish.yml`'s publish to GitHub
Packages) and then tagging/pushing `v0.82.0` once verified resolvable — is outbound publishing that `CLAUDE.md`
and this repo's own `docs/devops.md` require explicit human confirmation for. The version-freeze prep is
committed and pushed to this task's branch; a maintainer needs to either (a) explicitly authorize cutting the
GitHub Release and tag push so a follow-up turn can finish integration, or (b) cut the release manually and
have a follow-up task just mark it `[released: ...]` and merge the branch.
