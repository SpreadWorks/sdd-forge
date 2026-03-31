<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, deployment flow, and operations procedures for the project. The codebase is built on Node.js using ES modules, with preset-level integrations spanning GitHub Actions CI/CD, Cloudflare Workers edge runtime, PostgreSQL, and Cloudflare R2 object storage.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES modules (`"type": "module"`), no external dependencies |
| CI/CD | GitHub Actions | Workflow YAML files under `.github/workflows/` |
| Edge Runtime | Cloudflare Workers | Configured via `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` |
| Database | PostgreSQL | Static preset integration, no ORM layer |
| Object Storage | Cloudflare R2 | Bucket bindings defined in wrangler config |
| Legacy Framework | CakePHP 2.x | Supported via dedicated preset; Docker configuration is not applicable for this preset |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project enforces a zero-external-dependency policy: only Node.js built-in modules are used throughout `src/`. There is no `npm install` step for runtime dependencies. YAML parsing for GitHub Actions workflow files is implemented with regex-based logic rather than a third-party YAML library. TOML parsing for wrangler configuration files is handled by an internal `parseTOML()` utility. This approach eliminates supply-chain risk and keeps the published npm package lightweight.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment targets Cloudflare Workers and is driven by `wrangler.toml` or `wrangler.json` configuration files. The `EdgeRuntimeSource` parser extracts the entry point from the `main` field (or `build.upload.main`), resolves route bindings from `routes` / `route`, and captures runtime constraints including `compatibility_date`, `compatibility_flags`, and `node_compat`. For Cloudflare R2, bucket names and bindings are declared under the `r2_buckets` key in the same wrangler config. CI/CD pipelines defined as GitHub Actions workflows automate build and release steps; each workflow's triggers, runner environments, job count, referenced Actions, and secret references are parsed and surfaced in the pipeline tables.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational visibility is provided through three levels of pipeline data: a high-level pipeline summary table (name, platform, triggers), a job detail table (job ID, runner, step count, dependent Actions), and a secrets/environment variable reference table listing all `${{ secrets.X }}` and `${{ env.X }}` usages across workflows. For storage operations, the R2 preset surfaces bucket name, binding identifier, and optional preview bucket name to support environment-specific bucket mapping. The PostgreSQL preset exposes a static info table confirming the database type. The edge runtime preset exposes entry points and compatibility constraints to assist in diagnosing runtime behaviour across Cloudflare Workers deployments.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
