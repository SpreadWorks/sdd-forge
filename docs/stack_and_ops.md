<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

The sdd-forge project is implemented in Node.js using ES modules, with no external runtime dependencies beyond the Node.js standard library. Operations are automated through GitHub Actions CI/CD pipelines, and the project ships preset support for deployment targets including Cloudflare Workers edge runtimes and Cloudflare R2 storage.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES modules (`"type": "module"`); no external dependencies |
| Package Manager | npm | Published to npmjs.com as `sdd-forge` |
| CI/CD | GitHub Actions | Workflow files located under `.github/workflows/` |
| Edge Runtime | Cloudflare Workers | Configuration via `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` |
| Object Storage | Cloudflare R2 | Bucket metadata read from wrangler config (`r2_buckets`) |
| Database (preset) | PostgreSQL | Static preset; no scan required |
| Container (preset) | Docker | Stub preset for CakePHP 2.x; not applicable to core tooling |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project enforces a strict no-external-dependency policy: only Node.js built-in modules are permitted throughout `src/`. This constraint eliminates `node_modules` concerns entirely and ensures the published npm package remains self-contained.

Dependency declarations in `package.json` are therefore limited to development tooling (if any) and the package metadata itself. The `files` field restricts the published artifact to `src/` plus `package.json`, `README.md`, and `LICENSE`, preventing accidental inclusion of workspace files.

Before each release, `npm pack --dry-run` is run to verify the exact set of files that will be published and to confirm no sensitive or unintended content is included.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases follow a two-step npm publish flow to ensure both the `alpha` tag and the `latest` tag are updated correctly:

1. **Pack verification** — Run `npm pack --dry-run` to review the file manifest and confirm no credentials or project-specific files are included.
2. **Publish to alpha** — Execute `npm publish --tag alpha` to push the new version under the `alpha` dist-tag without immediately updating `latest`.
3. **Promote to latest** — Execute `npm dist-tag add sdd-forge@<version> latest` to make the release the default install target on npmjs.com.

Versions follow the `0.1.0-alpha.N` scheme during the alpha period, where `N` is the total commit count from `git rev-list --count HEAD`. Once a version is published it cannot be reused; `npm unpublish` enforces a 24-hour embargo on version reuse.

For projects using the edge preset, deployment to Cloudflare Workers is performed via the Wrangler CLI using the `wrangler.toml` or `wrangler.json` configuration file at the project root.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

CI/CD pipelines are defined as GitHub Actions workflow YAML files under `.github/workflows/`. The `PipelinesSource` data source parses these files to surface pipeline names, trigger conditions (push, pull request, schedule), per-job runner environments, step counts, referenced reusable actions, and secret or environment variable references.

Key operational tasks:

- **Documentation rebuild** — Run `sdd-forge build` after source changes to regenerate `docs/` from the latest analysis. When source files are newer than docs output, the tooling prompts for a rebuild.
- **Preset upgrade** — After modifying files under `src/templates/` or `src/presets/`, run `sdd-forge upgrade` to propagate changes to project skill files (`.claude/skills/`, `.agents/skills/`) and configuration templates.
- **Analysis refresh** — Run `sdd-forge scan` to regenerate `analysis.json` in `.sdd-forge/output/` whenever the codebase structure changes significantly.
- **Edge runtime monitoring** — For Cloudflare Workers deployments, compatibility date and compatibility flags recorded in `wrangler.toml` should be reviewed periodically against the Cloudflare Workers runtime changelog to avoid unexpected breakage.
- **Storage operations** — R2 bucket bindings and preview bucket names are tracked via the wrangler configuration and surfaced in the generated docs for audit and access-control review.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
