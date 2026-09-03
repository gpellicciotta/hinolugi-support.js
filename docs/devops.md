# DevOps and Operations

Practical guidance on building, testing, developing, and releasing `hinolugi-support.js`.

---

## 1. Prerequisites and Environment

- **Node.js**: a current LTS release, providing `node:test`/`node:assert` and native ESM (`.mjs`) support.
- **npm**: bundled with Node.js; used for dependency installs and running scripts.
- **Git**: Git 2.30+ supporting worktrees (`git worktree`).

---

## 2. Development Workflows

### 2.1. Initial Bootstrap
```bash
npm install
npm test
```

### 2.2. Testing
```bash
# Run the full test suite
npm test

# Equivalent, direct invocation
node --test tests/
```

### 2.3. Task Coordination Protocol
All non-trivial task work follows the protocol in
[Coordinating Work Guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md):
1. **Claim**: Update the task line in `TODO.md` on `master` from `[ ]` to `[~] @owner`, commit, push.
2. **Worktree** (full tasks only): Create an isolated worktree at `./work/Tnnnn-slug` on branch
   `task/Tnnnn-slug`:
   ```bash
   git worktree add ./work/T0001-task-slug -b task/T0001-task-slug
   ```
3. **Execute**: Work within the isolated worktree (or, for adhoc `Annnn` tasks, directly in the primary
   checkout) and maintain `tasks/Tnnnn-slug.md` for full tasks.
4. **Finalize**: Pass all tests, update documentation and `CHANGELOG.md`, integrate into mainline, remove the
   worktree and branch, and clear the entry from `TODO.md`.

---

## 3. Release Process

Ongoing work accumulates under the top `CHANGELOG.md` heading while it carries a `-pre` SemVer suffix (e.g.
`## v0.82.0-pre`), which must always match `version` in `package.json` (the single source of truth for the
published package) exactly, `-pre` included. Escalate that heading/version together — to the next major,
minor, or patch number — the moment a change lands that needs it.

1. Confirm the top `CHANGELOG.md` heading's version and `package.json`'s `version` already agree (both carry
   the same `-pre` suffix) — this should already be true from ongoing work, not something decided here.
2. Freeze: replace the heading's `-pre` suffix with `[{{date}}]`, and drop `-pre` from `package.json`'s
   `version` so both again match exactly (without the suffix). In the same commit, add the next patch
   version's `## vX.Y.Z-pre` heading above it (empty, ready for the next round of ongoing work) and bump
   `package.json`'s `version` to match.
3. Run `npm test` for a clean verification, and `npm pack --dry-run` to confirm the published tarball contains
   exactly the intended files.
4. Commit the changes, then publish a GitHub Release for the frozen version — this triggers
   `.github/workflows/publish.yml`, which publishes to GitHub Packages automatically (see 3.1).
5. Once the package is verified resolvable from GitHub Packages, mark the entry `[released: {{date}}]` and tag
   the release (see 3.2). A frozen version that never gets published is an accepted terminal state, not
   something requiring cleanup.

### 3.1. Publishing to GitHub Packages

`.github/workflows/publish.yml` publishes a build of this package to
[GitHub Packages](https://github.com/gpellicciotta/hinolugi-support.js/packages/) whenever a GitHub Release is
published, authenticating with the workflow's own `GITHUB_TOKEN` (`permissions: packages: write`) — no stored
secret or one-time registry-side registration needed.

Manual fallback (e.g. for testing packaging locally with `npm publish --dry-run`, or if the Actions pipeline is
ever unavailable):
1. Ensure `package.json`'s `name` is formatted as `@{{git-user}}/{{project-name}}`.
2. Ensure there is an `.npmrc` file (ignored by git, never committed) containing:
   ```
   @{{git-user}}:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken={{access token}}
   ```
3. Run `npm publish --dry-run`, then `npm publish`.

See:
[Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

### 3.2. Tagging a Release
Once a version is actually verified released (published and resolvable):
```bash
git tag -a v0.82.0 -m "Release v0.82.0"
git push origin v0.82.0
```
Tag pushes are an outbound action and need the same explicit approval as any other push.

---

## 4. Continuous Integration

`.github/workflows/publish.yml` runs the test suite (`npm test`) before publishing on `release: published`.
There is currently no separate push/PR-triggered CI workflow in this repository.
