<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This project is a Node.js 18+ command-line tool written as an ES module package in JavaScript. It distributes a single `sdd-forge` CLI entry point from `src/sdd-forge.js`, uses pnpm 10.33.0 as the pinned package manager, and currently publishes version `0.1.0-alpha.361`.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Language | JavaScript (ES modules) | Not separately specified |
| Runtime | Node.js | 18 or newer |
| Package manager | pnpm | 10.33.0 |
| Package format | npm package `sdd-forge` | 0.1.0-alpha.361 |
| CLI entry point | `sdd-forge` -> `src/sdd-forge.js` | Not separately specified |
| CI workflows | GitHub Actions workflow files (`.yml` / `.yaml`) | Not separately specified |
| Edge runtime config support | Wrangler (`wrangler.toml`, `wrangler.json`, `wrangler.jsonc`) | Not separately specified |
| Preset framework support | CakePHP 2 preset data sources | Not separately specified |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project uses `package.json` as the central dependency and distribution manifest. It declares no external runtime dependencies, which matches the built-in-module-only policy described for the codebase.

Runtime constraints are enforced through the `engines` field, which requires Node.js 18 or newer, and the package manager is pinned to pnpm 10.33.0. Test execution is exposed through package scripts for the default suite, unit tests, end-to-end tests, and acceptance tests.

For publishing, the package limits distributed files to `src/` and explicitly excludes preset acceptance test folders under `src/presets/*/tests/`.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment is package-based: the npm package exposes a single executable named `sdd-forge` that resolves to `src/sdd-forge.js`. The published artifact is constrained by `package.json` so that `src/` is included while preset acceptance test folders are excluded.

Project-local skill assets are deployed by copying resolved `SKILL.md` templates into `.agents/skills` and `.claude/skills`. During this process, the deployment logic expands template includes, preserves unchanged files, removes symlink targets when necessary, and writes updated content only when the generated result differs from the existing file.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational command execution is standardized through a synchronous process wrapper that returns normalized `ok`, `status`, `stdout`, and `stderr` fields without throwing. Higher-level Git state helpers use read-only shell calls to inspect worktree cleanliness, current branch, commits ahead of a base branch, the latest commit summary, and GitHub CLI availability.

CI operations are documented by scanning `.github/workflows` YAML files and extracting workflow names, triggers, jobs, step counts, referenced actions, secrets, and environment variables into structured analysis entries and Markdown tables. Edge runtime operations are similarly derived from Wrangler configuration files, which are parsed to expose entry points, routes, and compatibility constraints, while the CakePHP Docker preset currently returns no Docker metadata.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
