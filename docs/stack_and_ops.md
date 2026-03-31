<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This project is a Node.js command-line tool written as native ES modules in JavaScript and distributed as the `sdd-forge` CLI package. It targets Node.js 18 or newer, pins pnpm to `10.33.0`, and is currently versioned as `0.1.0-alpha.361`; the implementation uses built-in Node.js facilities rather than an external application framework.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Programming language | JavaScript (ES modules) | Native ESM; version not separately declared |
| Runtime | Node.js | 18+ |
| Package manager | pnpm | 10.33.0 |
| CLI package | sdd-forge | 0.1.0-alpha.361 |
| CI/CD platform | GitHub Actions | Workflow-defined; no fixed platform version declared |
| Database preset | PostgreSQL | Technology only; no server version declared |
| Object storage preset | Cloudflare R2 | Service-defined; no fixed version declared |
| Container preset support | Docker (CakePHP 2 preset placeholder) | Not applicable in this preset |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

Dependency management is intentionally minimal. The package manifest declares the published CLI, its Node.js engine requirement, repository metadata, packaging scope, and script entrypoints, while the codebase follows a no-external-dependencies approach and relies on built-in Node.js modules.

Package analysis is handled through a base data source that reads `package.json` and `composer.json`, extracting dependency blocks and script definitions into normalized analysis entries. For npm distribution, only the `src/` tree is published, and preset acceptance-test fixtures under `src/presets/*/tests/` are explicitly excluded from the package artifact.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment is centered on npm package distribution of the CLI. The published artifact exposes a single executable, `sdd-forge`, which resolves to `./src/sdd-forge.js`, and packaging is restricted to runtime source files under `src/`.

Project-local skill deployment is handled by `deploySkills(workRoot, lang, opts)`. It reads packaged `SKILL.md` templates, resolves include directives, compares the generated content with the existing `.agents` copy, skips unchanged files, removes symlink targets when necessary, and writes synchronized copies to both `.agents/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md`.

This flow keeps the published package focused on runtime code while distributing project-facing skill files only when deployment into a workspace is requested.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational status checks are supported by read-only Git helpers. These routines report whether the worktree is dirty, list changed files, read the current branch, calculate how many commits `HEAD` is ahead of a base branch, show the last commit summary, and verify whether the GitHub CLI is available.

CI/CD operations are documented from GitHub Actions workflow files under `.github/workflows/`. Workflow analysis extracts triggers, branch filters, cron schedules, job identifiers, runner targets, step counts, referenced actions, environment-variable references, and secret references, and can render them as overview, job, and environment/secret tables.

Preset-specific operational data is also normalized for documentation. PostgreSQL contributes a simple database identification table, Cloudflare R2 bucket definitions are collected from Wrangler configuration files, and generic storage bucket tables are rendered from normalized `analysis.storage` entries.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
