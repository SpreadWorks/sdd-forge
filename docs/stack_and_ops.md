<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational procedures for sdd-forge, a zero-dependency Node.js CLI tool built with ES modules (Node.js ≥ 18.0.0) and managed via pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | ES2022+ |
| Runtime | Node.js | ≥ 18.0.0 |
| Package Manager | pnpm | 10.33.0 |
| Module System | ESM (`"type": "module"`) | — |
| CLI Entry Point | Node shebang script (`sdd-forge.js`) | — |
| Test Runner | Custom (`tests/run.js`) | — |
| Version Control | Git | — |
| GitHub Integration | gh CLI (child process) | — |
| AI Agent Integration | Claude CLI (child process) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge declares zero external npm dependencies as an explicit architectural constraint — only Node.js built-in modules (`fs`, `path`, `child_process`, `url`, etc.) are used throughout the codebase. This eliminates supply chain risk and keeps the installation footprint minimal.

pnpm is used as the package manager, pinned to version 10.33.0 via the `packageManager` field in `package.json`. A `pnpm-lock.yaml` lockfile is maintained at the repository root. No production or development npm packages are declared; all tooling, including the test runner, is implemented in-house.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge is distributed as an npm package under the name `sdd-forge`. The release process follows a two-step tagging workflow to ensure the `latest` dist-tag on npmjs.com is updated correctly:

1. **Pre-publish check** — Run `npm pack --dry-run` to verify that only the intended files under `src/` are included and that no sensitive information is present.
2. **Publish with alpha tag** — Execute `npm publish --tag alpha` to push the release without immediately promoting it to `latest`.
3. **Promote to latest** — Execute `npm dist-tag add sdd-forge@<version> latest` to update the default install tag.

The version number follows the format `0.1.0-alpha.N` during the alpha period, where `N` is the total commit count obtained from `git rev-list --count HEAD`. Once a version is published, it cannot be re-published under the same version number. No CI/CD pipeline or containerized deployment is configured; all releases are performed manually.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Running Tests**

The project provides a custom test runner with scope filtering:

- Run all tests: `node tests/run.js`
- Unit tests only: `node tests/run.js --scope unit`
- End-to-end tests only: `node tests/run.js --scope e2e`
- Acceptance tests: `node tests/acceptance/run.js`

When running long-duration commands, redirect output to a file and inspect it afterwards (e.g., `node tests/run.js > /tmp/test.log 2>&1`). Do not re-run commands to pipe output inline.

**Updating Presets and Skills**

Whenever files under `src/templates/` or `src/presets/` are modified, run `sdd-forge upgrade` to propagate the changes to the project's skill files (`.claude/skills/`, `.agents/skills/`) and related templates. The command detects diffs and updates only changed files.

**Regenerating Documentation**

Project documentation under `docs/` is generated from source code analysis. To regenerate, run `sdd-forge build`. If source files are newer than the docs, the tool will prompt to rebuild. The `docs/` directory should not be edited directly inside `{{data}}` or `{{text}}` directive blocks, as those regions are overwritten on the next build.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
