<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational procedures for sdd-forge, a Node.js CLI tool built with ES Modules (Node.js ≥ 18.0.0) and zero external npm dependencies, currently versioned at 0.1.0-alpha series and managed with pnpm 10.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version / Notes |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 (required) |
| Language | JavaScript (ESM) | `"type": "module"` — no transpilation |
| Package Manager | pnpm | 10.33.0 |
| Test Runner | Node.js built-in `--test` | Native, no external test framework |
| Version Control | Git | Commit count drives version number |
| External npm dependencies | — | None (Node.js built-ins only) |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict **zero external dependency** policy; only Node.js built-in modules (`fs`, `path`, `child_process`, etc.) are used. As a result, the `pnpm-lock.yaml` lockfile contains no third-party package entries.

pnpm 10 is used as the package manager. Dependency updates are monitored by Dependabot, configured to check npm packages on a weekly schedule.

The version number is not set manually. During the alpha period, it follows the format `0.1.0-alpha.N` where `N` is derived automatically from the total Git commit count (`git rev-list --count HEAD`).
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Publishing to npm is a strictly manual, two-step process that must only be initiated when an explicit release intent is stated.

**Pre-publication check**

Before publishing, run `npm pack --dry-run` to confirm that no sensitive files are included. Only the `src/` directory, `package.json`, `README.md`, and `LICENSE` are bundled.

**Two-step release**

1. Publish under the `alpha` dist-tag:
   ```
   npm publish --tag alpha
   ```
2. Promote the release to the `latest` tag:
   ```
   npm dist-tag add sdd-forge@<version> latest
   ```

There is no automated CI/CD release pipeline. The GitHub repository contains only a Dependabot configuration; all publishing is performed manually via the npm CLI.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Installation**

Install the package globally with:
```
npm install -g sdd-forge
```

**Running tests**

| Command | Scope |
|---|---|
| `npm test` | All tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:e2e` | End-to-end tests only |
| `npm run test:acceptance` | Acceptance tests only |

Tests are discovered recursively as `*.test.js` files under `tests/` and `src/presets/*/tests/`. A `--preset <name>` flag can be passed to scope tests to a specific preset.

**Template synchronisation**

When files under `src/templates/` or `src/presets/` are modified, run:
```
sdd-forge upgrade
```
This command detects changed files and applies updates to project skills and configuration selectively.

**Documentation pipeline**

To regenerate all project documentation from source analysis:
```
sdd-forge docs build
```
The full pipeline runs: `scan → enrich → init → data → text → readme → agents → [translate]`.

**Configuration** is stored in `.sdd-forge/config.json`, generated automatically by `sdd-forge setup`. The active agent profile can be overridden at runtime via the `SDD_FORGE_PROFILE` environment variable.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
