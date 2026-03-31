<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter documents the runtime environment and operational tooling that sdd-forge targets through its preset DataSource implementations, covering Node.js as the execution platform, GitHub Actions for CI/CD pipelines, Cloudflare Workers and R2 for edge deployment and storage, and PostgreSQL as a supported database backend.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES modules; no external dependencies |
| CI/CD | GitHub Actions | Workflow YAML scanning via `PipelinesSource` (`.github/workflows/`) |
| Edge Runtime | Cloudflare Workers | Configuration parsed from `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` |
| Object Storage | Cloudflare R2 | Bucket bindings extracted from wrangler config via `R2StorageSource` |
| Database | PostgreSQL | Static metadata surfaced through `DatabaseSource` |
| Container | Docker | Stub DataSource for CakePHP 2.x preset; returns null (not applicable to that stack) |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project enforces a strict zero-external-dependency policy: only Node.js built-in modules are used throughout `src/`. No `package.json` dependency entries are added, and no third-party libraries are imported. TOML parsing for wrangler configuration files is handled inline using custom regex-based logic rather than a dedicated YAML/TOML library. This constraint keeps the npm package lightweight and eliminates supply-chain risk for downstream consumers.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Edge deployments targeting Cloudflare Workers are configured via `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc` files at the project root. sdd-forge's `EdgeRuntimeSource` parses these files to extract entry points (`main`, `build.upload.main`), route bindings (`routes` / `route`), and runtime constraints (`compatibility_date`, `compatibility_flags`, `node_compat`). CI/CD pipelines defined as GitHub Actions workflows under `.github/workflows/` are scanned by `PipelinesSource`, which captures triggers (push, pull_request, schedule cron), per-job runner environments, step counts, and referenced reusable actions. The resulting tables give a consolidated view of how code flows from repository to production.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational visibility is provided through dedicated DataSource implementations for each infrastructure layer. `PipelinesSource` surfaces secrets and environment variable references (via `${{ secrets.X }}` and `${{ env.X }}` patterns) across all GitHub Actions workflows, enabling a quick audit of credential exposure. `R2StorageSource` lists R2 bucket names, binding identifiers, and preview bucket names sourced from wrangler configuration, and exposes an access-pattern table derived from enriched analysis. `DatabaseSource` provides a static info table confirming the PostgreSQL backend. For projects where a category is not applicable (e.g., Docker on CakePHP 2.x), the corresponding DataSource returns `null`, suppressing the section cleanly without error.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
