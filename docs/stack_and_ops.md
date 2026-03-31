<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js 18+ command-line tool written as native ECMAScript modules and distributed through a single `sdd-forge` CLI entrypoint. The analyzed stack combines package metadata from `package.json`, Git and GitHub CLI status helpers, GitHub Actions workflow analysis, and a pinned `pnpm` 10.33.0 package-manager configuration.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Language | JavaScript (ES modules) | Not explicitly specified |
| Runtime | Node.js | 18 or newer |
| CLI package | `sdd-forge` | `0.1.0-alpha.361` |
| Package manager | `pnpm` | `10.33.0` |
| Source control tooling | Git | Version not specified |
| GitHub integration | GitHub CLI (`gh`) | Version not specified |
| CI/CD platform | GitHub Actions | Version not specified |
| Database preset | PostgreSQL | Version not specified |
| Object storage preset | Cloudflare R2 | Version not specified |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

Dependency management is centered on standard package manifests. The base package data source reads `package.json` and `composer.json`, extracting runtime and development dependency blocks as well as npm scripts so they can be documented consistently.

For the published CLI itself, `package.json` defines the package metadata, constrains the runtime to Node.js 18 or newer, and pins the package-management environment to `pnpm` 10.33.0. Test entrypoints are managed through package scripts, with separate general, unit, end-to-end, and acceptance commands implemented through the repository's own Node-based runners.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment is split between npm packaging and project-local skill installation. The published package exposes a single `sdd-forge` executable at `./src/sdd-forge.js` and limits the npm payload to the `src/` tree while excluding preset acceptance-test fixtures under `src/presets/*/tests/`.

For project setup, `deploySkills(workRoot, lang, opts)` installs packaged `SKILL.md` files into both `.agents/skills` and `.claude/skills`. It resolves included content, compares the generated result with the existing `.agents` copy, skips unchanged files, removes symlink targets when necessary, and writes updated files only when content has changed unless `dryRun` is enabled.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operations helpers focus on repository state reporting and workflow inspection. The Git-state library provides read-only checks for worktree cleanliness, current branch, commits ahead of a base branch, last commit, and whether the GitHub CLI is available.

CI/CD operations are documented through the GitHub Actions pipeline data source, which scans `.github/workflows/*.yml` and `.yaml` files, extracts triggers, jobs, `runs-on` targets, step counts, referenced actions, environment-variable references, and secret references, and renders those details as markdown tables.

Preset-specific operational views are also available for infrastructure-related documentation. PostgreSQL is reported through a minimal database info table, Cloudflare R2 buckets are extracted from Wrangler configuration files, generic storage buckets are rendered from normalized storage analysis, and the CakePHP 2 Docker preset explicitly reports that no Docker container list is available.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
