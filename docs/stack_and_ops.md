<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational tooling for sdd-forge, a Node.js CLI tool built exclusively on Node.js built-in modules with no external dependencies. It includes CI/CD pipeline support via GitHub Actions, edge runtime deployment through Cloudflare Workers, and preset-level integrations for PostgreSQL and Cloudflare R2 storage.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES modules (`"type": "module"`); no external npm dependencies |
| CI/CD | GitHub Actions | Workflow files located under `.github/workflows/` (`.yml` / `.yaml`) |
| Edge Runtime | Cloudflare Workers | Configured via `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc` |
| Storage | Cloudflare R2 | R2 bucket bindings declared in wrangler config files |
| Database | PostgreSQL | Supported via the `postgres` preset; database type is statically declared |
| Container | Docker | Placeholder integration for the CakePHP 2.x preset; no active scan |

Version constraints for Cloudflare Workers deployments are captured from the `compatibility_date` and `compatibility_flags` fields in wrangler configuration files.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a zero-external-dependency policy: only Node.js built-in modules are used throughout the codebase. There is no `node_modules` install step required at runtime. YAML parsing for GitHub Actions workflow files is performed via custom regex-based logic rather than a third-party YAML library, consistent with this constraint. Preset-level DataSources rely solely on file I/O, regex, and JSON/TOML parsing implemented in-house.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment targets are detected from wrangler configuration files (`wrangler.toml`, `wrangler.json`, `wrangler.jsonc`). The edge runtime preset parses these files to extract entry points — defined by `main` or `build.upload.main` — as well as route triggers from `routes` or `route` fields. Compatibility constraints such as `compatibility_date`, `compatibility_flags`, and `node_compat` are also extracted and surfaced in documentation.

For Cloudflare R2, bucket configurations are read from the same wrangler config files, mapping `r2_buckets` entries to their `name`, `binding`, and `preview_bucket_name` fields.

CI/CD pipelines are defined as GitHub Actions workflows. The pipeline DataSource extracts trigger types (schedule, push with branch filters, etc.), job definitions (runner, step count, referenced actions), and referenced secrets or environment variables from `${{ secrets.X }}` and `${{ env.X }}` expressions.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Pipeline metadata is collected from all `.github/workflows/*.yml` and `.github/workflows/*.yaml` files. Extracted information includes the number of jobs per workflow, the runner environment (`runs-on`), external action dependencies (`uses:`), and environment variable or secret references. This data is exposed as structured tables in the generated documentation for operational visibility.

For edge deployments, the runtime DataSource surfaces entry points and compatibility constraints, enabling operators to review which Worker scripts are registered and under what runtime conditions they execute.

R2 storage operations are documented through bucket binding tables, listing each bucket's name and its wrangler binding identifier. The generic storage preset additionally flattens bucket entries across all analysis sources into a unified provider-annotated table, supporting multi-provider storage overviews.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
