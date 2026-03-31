<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational tooling supported by sdd-forge, spanning a Node.js (ES modules) core with preset-level integrations for GitHub Actions CI/CD pipelines, Cloudflare Workers edge runtime (wrangler), Cloudflare R2 object storage, and PostgreSQL databases.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js (ES modules) | No external dependencies; built-in modules only |
| CI/CD | GitHub Actions | Workflow YAML files under `.github/workflows/` |
| Edge Runtime | Cloudflare Workers | Configured via `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` |
| Object Storage | Cloudflare R2 | R2 bucket bindings declared in wrangler config |
| Database | PostgreSQL | Static configuration; no ORM layer |
| PHP Framework | CakePHP 2.x | Supported via dedicated preset; Docker integration is a no-op stub |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project enforces a zero-external-dependency policy: only Node.js built-in modules are permitted. There is no `node_modules` install step for the core package. Preset-level integrations (CI pipelines, edge runtime, storage) are configured through their respective platform tooling files (`wrangler.toml`, GitHub Actions YAML) rather than through npm packages, keeping the dependency surface minimal and the package portable across environments.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Edge deployments target Cloudflare Workers and are driven by `wrangler.toml` or `wrangler.json` configuration files. The `edge/data/runtime.js` data source extracts the worker entry point (`main` field or `build.upload.main`), registered routes, `compatibility_date`, `compatibility_flags`, and `node_compat` constraints from these files. Deployments are triggered by pushing the configured entry point through the Wrangler CLI, with route bindings and compatibility settings applied as declared. R2 bucket bindings used during deployment are read from the same wrangler config via `r2_buckets` entries, mapping bucket names to Worker binding identifiers.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational monitoring and automation are handled through two main mechanisms. CI/CD pipelines defined as GitHub Actions workflows (`.github/workflows/*.yml`) are parsed to expose trigger conditions (push, pull request, schedule), runner environments, step counts, and referenced Actions. Secrets and environment variable references (`${{ secrets.X }}`, `${{ env.X }}`) are catalogued automatically to support access-control auditing. For storage operations, Cloudflare R2 bucket configurations (name, binding, preview bucket) are tracked via wrangler config, and generic storage sources aggregate bucket lists across providers using enriched analysis data for operational visibility.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
