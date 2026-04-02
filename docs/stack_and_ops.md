<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a zero-dependency CLI tool written in JavaScript (ES modules) targeting Node.js 18 or later, with no external framework. The project is managed with pnpm 10.33.0 and published to the npm registry as a globally installable binary.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | ECMAScript 2022+ |
| Runtime | Node.js | ≥ 18.0.0 |
| Package Manager | pnpm | 10.33.0 |
| Binary Entry Point | sdd-forge CLI | — |
| Module System | ES Modules (`"type": "module"`) | — |
| License | MIT | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

pnpm 10.33.0 is used as the package manager, with its version pinned via the `packageManager` field in `package.json` including a SHA-512 integrity hash. A `pnpm-lock.yaml` lockfile (lockfile version 9.0) ensures reproducible installs across environments.

The project intentionally carries zero external runtime dependencies and zero devDependencies — all functionality relies exclusively on Node.js built-in modules. This is a deliberate architectural constraint to keep the distribution lightweight and avoid supply-chain risk.

Dependabot is configured to monitor npm packages on a weekly schedule, ensuring the project stays aware of upstream changes even without direct dependencies.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published to the npm registry under the name `sdd-forge` and installed globally by end users via `npm install -g sdd-forge`.

The release procedure follows a two-step process:

1. Run `npm pack --dry-run` to verify that only the `src/` directory (plus `package.json`, `README.md`, and `LICENSE`) is included and that no sensitive files are bundled.
2. Publish the pre-release with `npm publish --tag alpha` to push the package without overwriting the `latest` tag.
3. Promote to `latest` with `npm dist-tag add sdd-forge@<version> latest`.

Versioning follows the `0.1.0-alpha.N` format during the alpha period, where `N` is the total commit count from `git rev-list --count HEAD`. Once a version is published to npm it cannot be re-published under the same version number.

No automated CI/CD pipeline triggers the publish step; all releases are performed manually.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The following npm scripts cover the primary day-to-day operations:

| Command | Description |
|---|---|
| `npm test` | Run the full test suite (unit, e2e, and per-preset acceptance tests) |
| `npm run test:unit` | Run unit tests only (files matching `*.test.js` under `tests/unit/`) |
| `npm run test:e2e` | Run end-to-end tests only |
| `npm run test:acceptance` | Run acceptance tests for each preset |

Tests are executed using Node.js's built-in `--test` flag through a custom orchestrator at `tests/run.js`. No compilation or build step is required before running the project or its tests, as the codebase is pure JavaScript with no transpilation.

When templates in `src/templates/` or `src/presets/` are modified, `sdd-forge upgrade` must be run to propagate changes to project-level skills and configuration files (`.claude/skills/`, `.agents/skills/`). The upgrade command detects diffs and updates only changed files.

Documentation is regenerated from source code analysis using the `sdd-forge build` pipeline (`scan → enrich → init → data → text → readme → agents`). Long-running commands should redirect output to a file (e.g., `command > /tmp/output.log 2>&1`) before inspecting results.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
