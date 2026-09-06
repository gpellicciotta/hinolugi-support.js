# DevOps and Operations

Practical guidance on building, testing, developing, and releasing `hinolugi-support.js`.

---

## Prerequisites and Environment

- **Node.js**: a current LTS release, providing `node:test`/`node:assert` and native ESM (`.mjs`) support.
- **npm**: bundled with Node.js; used for dependency installs and running scripts.
- **Git**: Git 2.30+ supporting worktrees (`git worktree`).

---

## Development Workflows

### Initial Bootstrap
```bash
npm install
npm test
```

### Testing
```bash
# Run the full test suite
npm test

# Equivalent, direct invocation
node --test tests/
```

### Formatting
```bash
# Check formatting (CI-safe, no writes)
npm run format:check

# Reformat all source files with Prettier
npm run format
```

### Task Coordination Protocol
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

## Release Process

Ongoing work accumulates under the top `CHANGELOG.md` heading while carrying a `-pre` SemVer suffix.
The version in `CHANGELOG.md` must match `version` in `package.json` exactly.
Escalate the heading and version together whenever landing breaking, feature, or patch changes.

### Step 1: Verify Prerequisites

Confirm the test suite passes cleanly and verify tarball contents:

```bash
npm test
npm pack --dry-run
```

Ensure git working tree is clean and aligned with mainline:

```bash
git status
```

### Step 2: Freeze Release Version

Update `CHANGELOG.md` and `package.json` in a dedicated freeze commit.
Replace the `-pre` suffix in `CHANGELOG.md` with `[{{date}}]`.
Drop `-pre` from `package.json`'s `version` field.
Do not reopen `-pre` in this commit.

```bash
git add CHANGELOG.md package.json
git commit -m "Freeze v0.83.0 release version."
```

Capture the commit SHA of this freeze commit:

```bash
git rev-parse HEAD
```

### Step 3: Reopen Next Development Version

Add the next patch pre-release heading in `CHANGELOG.md` above the frozen version.
Bump `package.json` to the corresponding `-pre` version.

```bash
git add CHANGELOG.md package.json
git commit -m "Reopen v0.83.1-pre development version."
```

Push both commits to mainline:

```bash
git push origin master
```

### Step 4: Publish GitHub Release

Extract that version's `CHANGELOG.md` section as the release notes body; never pass a placeholder
`--notes` string:

```bash
npm run release-notes -- v0.83.0 > release-notes.md
```

Create the GitHub Release pointing explicitly to the frozen commit SHA:

```bash
gh release create v0.83.0 --target <frozen-commit-sha> --title "v0.83.0" --notes-file release-notes.md
```

Publishing the release creates tag `v0.83.0` at the target commit.
This triggers `.github/workflows/publish.yml` to publish to GitHub Packages automatically.

Monitor the publish workflow execution:

```bash
gh run list --workflow=publish.yml --limit 5
gh run watch <run-id>
```

### Step 5: Verify Package Publication

Verify the package version is visible in GitHub Packages:

```bash
npm view @gpellicciotta/hinolugi-support.js versions --registry https://npm.pkg.github.com
```

Once verified, update `CHANGELOG.md` to mark the release finalized:

```markdown
## v0.83.0 [released: 2026-09-06]
```

Commit and push this documentation update:

```bash
git commit -m "Mark v0.83.0 released in changelog." CHANGELOG.md
git push origin master
```

### Manual Publishing Fallback

Use this fallback if the Actions pipeline is unavailable:
1. Ensure `package.json`'s `name` is formatted as `@gpellicciotta/hinolugi-support.js`.
2. Ensure there is an `.npmrc` file (ignored by git, never committed) containing:
   ```ini
   @gpellicciotta:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken={{access token}}
   ```
3. Run `npm publish --dry-run`, then `npm publish`.

### Manual Tagging Fallback

Publishing a GitHub Release already creates its tag at the specified target commit.
If tag creation fails or manual fallback was used, create and push the tag manually:

```bash
git tag -a v0.83.0 <frozen-commit-sha> -m "Release v0.83.0"
git push origin v0.83.0
```

---

## Consuming in Downstream Projects

Downstream projects (`hinolugi-counters`, `hinolugi-auth`, etc.) consume packages from GitHub Packages.

### Registry Configuration

Create or update `.npmrc` in the consumer project root:

```ini
@gpellicciotta:registry=https://npm.pkg.github.com
```

To install packages in CI or authenticated contexts:

```ini
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### Adding Dependency

Add the package under `dependencies` in consumer's `package.json`:

```json
{
  "dependencies": {
    "@gpellicciotta/hinolugi-support.js": "^0.83.0"
  }
}
```

Install dependencies:

```bash
npm install
```

### Importing Modules and Styles

Import JavaScript modules using subpath exports:

```javascript
import { CliLogger } from '@gpellicciotta/hinolugi-support.js/cli-log.mjs';
import { sendRequest, buildUrl } from '@gpellicciotta/hinolugi-support.js/http.mjs';
import { ApiError, mapError } from '@gpellicciotta/hinolugi-support.js/errors.mjs';
import { parseChangelog } from '@gpellicciotta/hinolugi-support.js/changelog-parser.mjs';
```

Import CSS stylesheets directly:

```css
@import '@gpellicciotta/hinolugi-support.js/css/reset.css';
@import '@gpellicciotta/hinolugi-support.js/css/colors.css';
```

---

## Continuous Integration

`.github/workflows/publish.yml` runs formatting check and test suite before publishing on release.
Publishing occurs automatically when a release is published in GitHub Releases.

