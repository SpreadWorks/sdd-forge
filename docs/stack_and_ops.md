<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool implemented in JavaScript as an ES module package, with no external runtime dependencies declared.
The distributed tool targets Node.js 18 or newer, pins pnpm to 10.33.0, and is currently versioned as `0.1.0-alpha.361`.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Application | `sdd-forge` CLI package | `0.1.0-alpha.361` |
| Language | JavaScript | Not separately specified |
| Module system | ECMAScript modules (`"type": "module"`) | Not separately specified |
| Runtime | Node.js | `>=18` |
| Package manager | pnpm | `10.33.0` |
| Source control tooling | Git | Not specified in the analysis |
| GitHub tooling | GitHub CLI (`gh`) availability is checked by the code | Not specified in the analysis |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project follows a minimal dependency model. `package.json` declares no external runtime dependencies, which matches the built-in-module-only policy described in the analysis.

Dependency and script execution are managed through a pinned pnpm toolchain and npm-compatible scripts. The manifest defines test entry points for the default suite, unit tests, end-to-end tests, and acceptance tests.

For distribution, the published package is limited to `src/`, and preset acceptance test folders under `src/presets/*/tests/` are explicitly excluded from the npm package.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The available deployment-related analysis describes npm package distribution rather than service hosting.

The package is prepared as a CLI distribution named `sdd-forge`, exposes the `sdd-forge` executable from `./src/sdd-forge.js`, and requires Node.js 18 or newer in the target environment.

During publication, only the configured package contents are included, with `src/` published and preset acceptance test folders excluded. The resulting installation provides the `sdd-forge` command to end users through the npm package.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational support is implemented through small, synchronous utility modules and documentation-oriented data sources.

Git state is inspected through read-only helpers that report worktree status, current branch, ahead count, the latest commit, and whether the GitHub CLI is available. Process execution is standardized through a `runSync` wrapper that returns normalized status, stdout, and stderr fields.

Project-local skill files are deployed into `.agents/skills` and `.claude/skills`, with include resolution, symlink cleanup when needed, and change detection to avoid unnecessary rewrites. Documentation data sources also scan GitHub Actions workflow files and Wrangler configuration files to expose CI pipeline details and Edge runtime entry points as Markdown tables.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
