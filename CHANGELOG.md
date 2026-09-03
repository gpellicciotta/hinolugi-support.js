# Changelog

All notable changes to this project are documented here.

> See [coordinating work guidelines](https://github.com/gpellicciotta/dev-guidelines/blob/main/guidelines/coordinating-work-guidelines.md)
> for the versioning and changelog conventions used across the HiNoLuGi projects.

## v0.82.0-pre

- JS: Add `js/cli-log.mjs`, a guideline-compliant CLI logging utility API-similar to the `LogLevel`/`Log`
  (Java) and `LogLevel`/`CliLogger` (Python) implementations in the sibling support libraries.
- DevEx: Add an automated publish pipeline (`.github/workflows/publish.yml`) that publishes to GitHub
  Packages on GitHub Release; fix `package.json`'s broken entry point so the package is actually installable.
