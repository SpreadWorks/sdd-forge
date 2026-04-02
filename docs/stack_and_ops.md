<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, deployment process, and operational procedures for sdd-forge — a Node.js CLI tool (requires Node.js >= 18.0.0) built entirely on native ES modules with no external npm dependencies, managed with pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | ECMAScript 2020+ |
| Runtime | Node.js | >= 18.0.0 |
| Package Manager | pnpm | 10.33.0 |
| Lock File Format | pnpm-lock.yaml | lockfileVersion 9.0 |
| External Dependencies | None (Node.js built-ins only) | — |
| Test Runner | Custom Node.js runner | — |
| CLI Entry Point | sdd-forge (bin alias) | — |
| Version Control | Git | — |
| Dependency Monitoring | Dependabot (npm, weekly) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge uses **pnpm** (v10.33.0) as its package manager, with `pnpm-lock.yaml` (lockfile version 9.0) tracking the exact resolved dependency tree. The project carries **zero external runtime dependencies** — all functionality is implemented using Node.js built-in modules such as `fs`, `path`, `child_process`, `url`, and `stream`. This means no `node_modules` installation is required for the package to run once it is globally installed via npm.

Dependabot is configured to monitor the npm ecosystem on a weekly schedule, ensuring that any future dependency additions are automatically reviewed for security updates. The `files` field in `package.json` restricts what is published to npm: only the `src/` directory (excluding preset test files), `package.json`, `README.md`, and `LICENSE` are included in the distributed package.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releasing sdd-forge to npm follows a two-step process to ensure both the `alpha` and `latest` dist-tags are correctly assigned:

1. **Verify package contents** — Run `npm pack --dry-run` to confirm the files included in the tarball and check that no sensitive information is present.
2. **Publish to npm under the alpha tag** — Execute `npm publish --tag alpha`. Publishing directly to `latest` is avoided during the alpha period.
3. **Promote to latest** — Run `npm dist-tag add sdd-forge@<version> latest` to update the `latest` tag so the release appears on the npmjs.com package page.

Version numbers during the alpha period follow the format `0.1.0-alpha.N`, where `N` is the total commit count produced by `git rev-list --count HEAD`. Once a version is published, npm does not permit republishing under the same version number, so the commit count provides a monotonically increasing identifier without manual management.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Installation**

Install sdd-forge globally using any npm-compatible package manager:

```bash
npm install -g sdd-forge
```

**Project Setup**

Run `sdd-forge setup` inside a target project to select a preset, configure the AI agent provider, and generate the initial `.sdd-forge/config.json`. The `sdd-forge upgrade` command re-applies skill templates and configuration changes from the installed package version whenever `src/templates/` or `src/presets/` are updated.

**Documentation Generation**

The full documentation pipeline is executed with a single command:

```bash
sdd-forge docs build
```

This runs the sequential steps: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`. Individual steps can be run independently (e.g., `sdd-forge docs scan`, `sdd-forge docs text`) for incremental updates.

**Running Tests**

The project provides a custom Node.js test runner with three scopes:

```bash
node tests/run.js                        # all tests
node tests/run.js --scope unit           # unit tests only
node tests/run.js --scope e2e            # end-to-end tests only
node tests/acceptance/run.js             # acceptance tests
```

Long-running test output should be redirected to a file and examined with `grep` or `Read` rather than re-executed.

**Environment Variables**

| Variable | Purpose |
|---|---|
| `SDD_SOURCE_ROOT` | Root directory of the target project's source code |
| `SDD_WORK_ROOT` | Working directory containing `.sdd-forge/` and `docs/` |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
