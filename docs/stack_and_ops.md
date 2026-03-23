<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a CLI tool built entirely in JavaScript on Node.js, using ES modules with zero external dependencies. It provides automated documentation generation and Spec-Driven Development workflows, leveraging only Node.js built-in modules for all functionality including YAML parsing and file system operations.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version / Notes |
|---|---|---|
| Language | JavaScript (ES Modules) | Node.js built-in modules only |
| Runtime | Node.js | `"type": "module"` in package.json |
| Package Manager | npm | Version follows `0.1.0-alpha.N` (alpha period) |
| CI/CD Integration | GitHub Actions | Workflow YAML parsed via regex-based scanner |
| Edge Runtime Support | Cloudflare Workers | `wrangler.toml` / `wrangler.json` configuration parsing |
| Frontend Asset Detection | jQuery, Highcharts, FancyBox, etc. | Library pattern matching for CakePHP 2 preset |
| Configuration Format | JSON, TOML | Internal TOML parser for wrangler config; JSON for project settings |
| Version Control | Git | Used for diff-based incremental updates and versioning |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge follows a strict **zero external dependencies** policy. All functionality is implemented using only Node.js built-in modules such as `fs`, `path`, and `child_process`. This means there is no `node_modules` directory or lock file to manage.

For example, the CI workflow scanner (`workflows.js`) parses YAML files using a custom regex-based parser rather than relying on a third-party YAML library. Similarly, the edge runtime preset includes an internal TOML parser for reading `wrangler.toml` files.

The published npm package includes only the `src/` directory, `package.json`, `README.md`, and `LICENSE`. This minimal footprint ensures fast installation and eliminates supply-chain risks associated with transitive dependencies.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge supports CI/CD pipeline analysis through its `ci` preset, which scans GitHub Actions workflow definitions located in `.github/workflows/`.

The deployment analysis flow works as follows:

1. **Scan** — `scanWorkflows()` reads all `.yml` / `.yaml` files under `.github/workflows/` and extracts pipeline metadata (name, triggers, jobs, secrets, environment variables).
2. **Parse** — `parseWorkflow()` processes each workflow file, detecting trigger configurations (push, pull_request, schedule cron), job definitions (runner, steps, dependencies), and secret/environment variable references via `${{ secrets.X }}` and `${{ env.X }}` patterns.
3. **Report** — The `PipelinesSource` DataSource exposes three views: a pipeline list with trigger and job counts, a cross-pipeline job detail table, and an environment/secrets inventory.

For edge deployments, the `edge` preset parses `wrangler.toml` or `wrangler.json` to extract entry points, route configurations, and runtime constraints such as `compatibility_date` and `compatibility_flags`.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational visibility is provided through sdd-forge's scanning and data extraction pipeline. Key operational procedures include:

- **Pipeline inventory** — Run `sdd-forge scan` followed by `sdd-forge data` to generate an up-to-date summary of all CI/CD pipelines, including job counts, runners, and action dependencies.
- **Secrets and environment audit** — The CI preset's `env()` data method produces a consolidated table of all referenced secrets and environment variables across workflows, enabling security reviews.
- **Edge runtime constraints** — The edge preset's `constraints()` method reports compatibility dates and flags from `wrangler.toml`, helping track runtime version requirements for Cloudflare Workers deployments.
- **Incremental updates** — When source files change, sdd-forge supports diff-based updates: only modified files are re-analyzed and only affected chapters are regenerated, reducing unnecessary processing.
- **Asset tracking** — For CakePHP 2 projects, the asset scanner detects front-end library versions (jQuery, Highcharts, FancyBox, and others) from file naming patterns, providing a quick inventory of client-side dependencies.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
