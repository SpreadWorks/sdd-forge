<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, and operational procedures for sdd-forge, a Node.js CLI tool built with ES Modules. The project targets Node.js >= 18.0.0, uses pnpm 10.33.0 as its package manager, and ships the current release at version 0.1.0-alpha.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 |
| Module System | ES Modules (`"type": "module"`) | — |
| Package Manager | pnpm | 10.33.0 |
| External npm Dependencies | None (Node.js built-ins only) | — |
| CLI Entry Point | `src/sdd-forge.js` (via `bin` field) | — |
| External CLI Tools (invoked at runtime) | Claude CLI (`claude`) | — |
| External CLI Tools (invoked at runtime) | GitHub CLI (`gh`) | — |
| Versioning Scheme | `0.1.0-alpha.N` (N = total commit count) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict zero-external-dependency policy: all runtime code relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, and `url`. No third-party npm packages are added as `dependencies` or `devDependencies` in `package.json`.

The package manager is **pnpm 10.33.0**, pinned via the `packageManager` field in `package.json` with a specific integrity hash to ensure reproducible installs. A `pnpm-lock.yaml` lockfile is committed to the repository and must remain in sync with `package.json`.

Dependabot is configured (`.github/dependabot.yml`) to monitor npm and composer ecosystems and open automated pull requests when updates are available.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge is distributed as an npm package under the name `sdd-forge`. The published artifact contains only the `src/` directory along with `package.json`, `README.md`, and `LICENSE`; test files and project-specific configuration are excluded via the `files` field in `package.json`.

The release process follows these steps:

1. Calculate the new version number using `git rev-list --count HEAD` to obtain the commit count N, then set the version to `0.1.0-alpha.N` in `package.json`.
2. Run `npm pack --dry-run` to verify the contents of the package and confirm that no sensitive files are included.
3. Publish to npm with the alpha tag: `npm publish --tag alpha`.
4. Promote the release to the `latest` tag: `npm dist-tag add sdd-forge@<version> latest`.

Both publish steps are required; omitting the `dist-tag` step leaves the `latest` tag pointing to an older version. Publication is performed only when an explicit release intent is stated — incrementing the version or pushing commits alone does not trigger a publish.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The following npm scripts cover the main day-to-day operations of the project:

| Command | Purpose |
|---|---|
| `npm test` | Run the full test suite (unit, e2e, and preset tests) |
| `npm run test:unit` | Run unit tests only |
| `npm run test:e2e` | Run end-to-end tests only |
| `npm run test:acceptance` | Run acceptance tests only |

Test execution is orchestrated by `tests/run.js` using the Node.js built-in test runner. To target a specific preset, pass `--preset <name>` as an argument. Individual acceptance tests can be run directly with `node tests/acceptance/run.js <name>`.

When templates or skills under `src/templates/` or `src/presets/` are modified, run `sdd-forge upgrade` afterward to propagate changes to the project's local skill files (`.claude/skills/`, `.agents/skills/`).

For long-running commands, redirect output to a file before inspecting results: `command > /tmp/output.log 2>&1`, then use `grep` or a file reader to review the relevant sections. Re-running a command solely to pipe its output is discouraged.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
