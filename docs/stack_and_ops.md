<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This project is implemented in Node.js using ES modules, with no external runtime dependencies. It provides a preset-based documentation and spec tooling system covering multiple language ecosystems including Node.js (npm) and PHP (Composer), with first-class support for CI pipelines, edge runtimes, and cloud storage.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES Modules (`"type": "module"`) |
| Package manifest (Node.js) | npm / `package.json` | `dependencies`, `devDependencies`, scripts |
| Package manifest (PHP) | Composer / `composer.json` | `require`, `require-dev` |
| CI/CD | GitHub Actions | Workflow YAML under `.github/workflows/` |
| Edge runtime | Cloudflare Workers | Configured via `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` |
| Database | PostgreSQL | Identified via the `postgres` preset |
| Object storage | Cloudflare R2 | R2 bucket bindings read from `wrangler.toml` / `wrangler.json` |
| Generic storage | Pluggable (preset chain) | Provider resolved from `analysis.storage` at build time |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project itself carries no external npm dependencies; only Node.js built-in modules are used throughout `src/`. For projects consuming sdd-forge, the `base` preset scans `package.json` to extract `dependencies`, `devDependencies`, and npm scripts, and scans `composer.json` to extract `require` and `require-dev` sections. Both manifests are matched by filename alone, so they are detected regardless of directory depth. Parse errors are handled silently, returning an empty entry to avoid blocking the documentation build pipeline.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment targets vary by preset. For Cloudflare Workers projects using the `edge` preset, deployment configuration is read from `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc`. Entry points are resolved from `cfg.main`, `cfg.build.upload.main`, and route bindings (`cfg.routes` / `cfg.route`). Runtime compatibility constraints — including `compatibility_date`, `compatibility_flags`, and `node_compat` — are also extracted to document the exact runtime requirements before deployment. For CI-driven workflows, the `ci` preset parses GitHub Actions YAML files to expose pipeline triggers, branch filters, job definitions, runner types, step counts, action dependencies, and referenced secrets and environment variables.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operational visibility is provided through structured data tables generated at documentation build time. Pipeline operations are surfaced via three views: an overview table (name, file, triggers, job count), a jobs table (pipeline, job, runner, steps, action dependencies), and an environment table (secrets and environment variable references per pipeline). Storage operations for Cloudflare R2 are covered by a bucket binding table (bucket name, binding, preview bucket) and an access pattern table. For CakePHP 2.x deployments, Docker infrastructure is intentionally stubbed out via a null-returning placeholder, reflecting that containerised deployment is not applicable to that preset. PostgreSQL presence is identified statically and surfaced as a single-entry reference table.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
