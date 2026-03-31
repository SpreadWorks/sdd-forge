<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This project is a Node.js command-line tool written as native ES modules in JavaScript and published as the `sdd-forge` CLI. It requires Node.js 18 or later, pins pnpm to `10.33.0`, and is currently versioned as `0.1.0-alpha.361`, with repository-managed test entrypoints for general, unit, end-to-end, and acceptance runs.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
| --- | --- | --- |
| Language | JavaScript (ES modules) | Not separately declared |
| Runtime | Node.js | 18+ |
| CLI Package | `sdd-forge` | `0.1.0-alpha.361` |
| Package Manager | pnpm | `10.33.0` |
| Source Control Tooling | Git | Not declared |
| GitHub CLI Integration | `gh` | Not declared |
| CI Platform | GitHub Actions | Not declared |
| Database Preset | PostgreSQL | Not declared |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project uses the package manifest as the primary dependency and script definition source. For `package.json`, runtime dependencies and development dependencies are analyzed separately, and npm scripts are captured when defined.

The published package is intentionally narrow in scope: npm artifacts include the `src/` tree and exclude preset acceptance-test fixtures under `src/presets/*/tests/`. Test execution is managed through repository-provided Node-based scripts rather than external task runners.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment centers on publishing the `sdd-forge` CLI package with its executable mapped to `./src/sdd-forge.js`. The npm package is scoped to runtime source files, which keeps the published artifact focused on the command-line application.

Packaged skill templates are deployed into project-local `.agents/skills` and `.claude/skills` directories. During deployment, include directives are resolved, unchanged content is left in place, symlink targets are safely removed when necessary, and both destinations receive the same rendered `SKILL.md` content.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational status checks are supported by read-only Git helpers that report worktree cleanliness, changed files, the current branch, commits ahead of a base branch, the last commit summary, and whether the GitHub CLI is available.

CI/CD operations are documented from GitHub Actions workflow files by extracting triggers, jobs, runner targets, referenced actions, environment-variable references, and secret references. Preset-specific operational data can also be rendered from analyzed configuration files, including PostgreSQL database identification and storage bucket metadata from normalized storage analysis or Wrangler R2 configuration.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
