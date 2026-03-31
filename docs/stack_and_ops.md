<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational tooling used in the project, including runtime environments, CI/CD pipelines configured via GitHub Actions, edge runtime constraints managed through Wrangler, database integration with PostgreSQL, and object storage via Cloudflare R2.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES modules (`"type": "module"`); no external dependencies |
| CI/CD | GitHub Actions | Workflow files under `.github/workflows/` (`.yml` / `.yaml`) |
| Edge Runtime | Cloudflare Workers | Entry points and constraints defined in `wrangler.toml` / `wrangler.json` |
| Database | PostgreSQL | Static configuration; no ORM dependency |
| Object Storage | Cloudflare R2 | Bucket bindings declared in `wrangler.toml` / `wrangler.json` |
| Config Formats | TOML, JSON, YAML | Used by Wrangler and GitHub Actions configuration files |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project relies exclusively on Node.js built-in modules and imposes a strict no-external-dependencies policy. There is no `node_modules` installation step required beyond the Node.js runtime itself. Cloudflare-specific configuration (edge runtime compatibility flags, R2 bucket bindings, `compatibility_date`) is declared directly in `wrangler.toml` or `wrangler.json` and is consumed at deploy time by the Wrangler CLI rather than managed as a runtime dependency.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment targets Cloudflare Workers and is driven by the Wrangler CLI. The `wrangler.toml` or `wrangler.json` file at the project root specifies the entry point (`main` or `build.upload.main`), route patterns, `compatibility_date`, `compatibility_flags`, and optional `node_compat` constraints. R2 bucket bindings (`r2_buckets`) are also declared in the same Wrangler config, mapping bucket names to binding identifiers used in application code. GitHub Actions workflows automate the deployment pipeline: jobs reference runners (`runs-on`), trigger conditions (push, pull request, schedule), and upstream actions via `uses:` steps. Secrets and environment variables required during deployment are referenced through `${{ secrets.* }}` and `${{ env.* }}` expressions in the workflow YAML.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Ongoing operations are monitored and automated through GitHub Actions pipelines defined under `.github/workflows/`. Each pipeline exposes its triggers (branch filters, cron schedules, or event hooks), job runners, step counts, and referenced third-party actions, making the operational surface fully auditable from the workflow YAML. For edge deployments, Cloudflare Workers compatibility settings (`compatibility_date`, `compatibility_flags`) govern runtime behaviour and must be reviewed when updating the Wrangler configuration. R2 storage operations are managed through bucket bindings; adding or renaming a bucket requires updating both the `r2_buckets` entry in the Wrangler config and any corresponding binding references in application code. PostgreSQL database access is configured statically and does not require migration tooling within the sdd-forge preset layer.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
