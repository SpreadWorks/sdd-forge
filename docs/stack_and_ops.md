<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers a Node.js 18+ command-line project written as native JavaScript ES modules, published as the `sdd-forge` CLI. The codebase uses its own preset and data-source framework for documentation analysis, with package management pinned to pnpm 10.33.0 and the current package version set to `0.1.0-alpha.361`.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Language | JavaScript (ES modules) | Not separately declared |
| Runtime | Node.js | 18+ |
| CLI package | `sdd-forge` | `0.1.0-alpha.361` |
| Package manager | pnpm | `10.33.0` |
| Source control tooling | Git | Not declared |
| GitHub CLI integration | `gh` | Not declared |
| CI/CD platform | GitHub Actions | Not declared |
| Database preset | PostgreSQL | Not declared |
| Object storage preset | Cloudflare R2 | Not declared |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project uses a package manifest centered on a single published CLI package, with runtime packaging limited to the `src/` tree and preset acceptance-test fixtures explicitly excluded from the npm artifact. Dependency and script metadata are read from `package.json` by the base package data source, which extracts `dependencies`, `devDependencies`, and npm `scripts` for analysis and documentation.

Project scripts are executed through repository-provided Node-based runners, with separate entry points for general, unit, end-to-end, and acceptance testing. The manifest also pins pnpm to a specific `10.33.0` build hash to keep package-management behavior reproducible.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published as the `sdd-forge` CLI, with the executable name `sdd-forge` mapped to `./src/sdd-forge.js`. The published artifact is intentionally scoped to runtime code under `src/`, which keeps deployment output focused on the CLI implementation.

For project-local skill deployment, `deploySkills(workRoot, lang, opts)` reads packaged `SKILL.md` templates, resolves include directives, compares the resolved content with the existing `.agents` copy, and skips unchanged files. When updates are required, it removes symlink destinations if needed and writes matching files to both `.agents/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md`.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational status checks are implemented through read-only Git and GitHub CLI helpers. The code can inspect worktree cleanliness, list dirty files, read the current branch, count commits ahead of a base branch, read the last commit summary, and detect whether the `gh` command is available.

CI/CD workflow operations are documented from GitHub Actions workflow files under `.github/workflows/`. The pipeline parser extracts trigger definitions, branch filters, cron schedules, job names, runner targets, step counts, referenced actions, environment-variable references, and secret references, then renders overview, job, and environment/secret tables for reporting.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
