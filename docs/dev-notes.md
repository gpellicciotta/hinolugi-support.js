# Development Notes

## How to publish the package to GitHub?

Normally this happens automatically: `.github/workflows/publish.yml` publishes to GitHub Packages whenever a
GitHub Release is published, using the workflow's own `GITHUB_TOKEN` (no manual steps or stored secret
needed). The steps below are only a manual fallback (e.g. for testing packaging locally with
`npm publish --dry-run`, or if the Actions pipeline is ever unavailable):
  1. Ensure the package.json's name is formatted as `@{{git-user}}/{{project-name}}`
  2. Ensure there is an `.npmrc` file which gets ignored (via `.gitignore`) by git and contains:
     ```
     @{{git-user}}:registry=https://npm.pkg.github.com
     //npm.pkg.github.com/:_authToken={{access token}}
     ```
  3. Run `npm publish --dry-run`
  4. Run `npm publish`

See:  
  https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry
