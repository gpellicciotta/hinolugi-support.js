# HiNoLuGi Support.js
General-purpose Javascript support code, both for client and server-side use.

Published as an npm package on [GitHub Packages](https://github.com/gpellicciotta/hinolugi-support.js/packages/),
licensed under the [MIT License](LICENSE.md).

See also:
- [CHANGELOG](CHANGELOG.md)
- [Documentation Index](docs/index.md)

## Installing

Add a `.npmrc` in the consuming project (or in the user's npm config) pointing the `@gpellicciotta` scope at
GitHub Packages:

```
@gpellicciotta:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @gpellicciotta/hinolugi-support.js
```

Each module is importable as a subpath, e.g.:

```js
import { CliLogger } from '@gpellicciotta/hinolugi-support.js/cli-log.mjs';
```

## Publishing

`.github/workflows/publish.yml` publishes a build of this package to
[GitHub Packages](https://github.com/gpellicciotta/hinolugi-support.js/packages/) whenever a GitHub Release
is published, authenticating with the workflow's own `GITHUB_TOKEN` — no stored secret needs to be configured
in this repo. See `docs/devops.md` for the manual fallback steps and the full release process.
