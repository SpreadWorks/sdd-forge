<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, deployment procedure, and operational workflows for sdd-forge — a Node.js (>=18.0.0) CLI tool written in ES Modules JavaScript with zero external npm dependencies, currently at version `0.1.0-alpha.361`.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=18.0.0 |
| Language | JavaScript (ES Modules) | ECMAScript 2022+ |
| Package Manager | pnpm | 10.33.0 |
| Test Framework | Node.js built-in `node:test` | (bundled with Node.js) |
| Version Control | Git | — |
| Registry | npm (package: `sdd-forge`) | — |
| CLI Entry Point | `src/sdd-forge.js` | — |

No external production dependencies are used. All functionality relies exclusively on Node.js built-in modules (`fs`, `path`, `child_process`, `url`).
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

Dependencies are managed with **pnpm** (v10.33.0), with a `pnpm-lock.yaml` lockfile (lockfile version 9.0) committed to the repository for reproducible installs. The project intentionally carries **zero external production dependencies** — all runtime functionality is implemented using Node.js built-in modules only. This constraint is enforced by project policy; adding npm packages to the production dependency tree is prohibited.

For distribution, only the `src/` directory is included in the published npm package (test files under `src/presets/*/tests/` are excluded). The package is published to the npm registry under the name `sdd-forge`.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published manually to the npm registry. There are currently no automated CI/CD pipelines for publishing; GitHub Actions workflows have not been configured yet. Dependabot is set up for weekly npm dependency checks.

The release procedure follows these steps:

1. Verify the version number follows the `0.1.0-alpha.N` format, where `N` is the total git commit count (`git rev-list --count HEAD`).
2. Run `npm pack --dry-run` to confirm the published artifact contains no sensitive files.
3. Publish the package with the alpha tag: `npm publish --tag alpha`.
4. Promote to the `latest` tag: `npm dist-tag add sdd-forge@<version> latest`.

The two-step publish process is required because publishing with `--tag alpha` alone does not update the `latest` tag on the npm registry page. Publishing is only performed when the user explicitly requests a release — version bumps, commits, or pushes are not treated as release intent.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The following commands are available for day-to-day operations:

**Setup and upgrade**
- `sdd-forge setup` — Interactive wizard that generates `.sdd-forge/config.json` for a project.
- `sdd-forge upgrade` — Detects changes in skill and template files and updates only modified assets.

**Documentation pipeline** (run individually or as a full build)
- `sdd-forge build` — Runs the full pipeline: `scan → enrich → init → data → text → readme → agents`.
- `sdd-forge scan` — Analyzes source code and writes `analysis.json` to `.sdd-forge/output/`.
- `sdd-forge enrich` — Uses AI to annotate each analysis entry with role, summary, and chapter classification.
- `sdd-forge init` — Merges preset template inheritance chain and writes chapter files to `docs/`.
- `sdd-forge data` — Expands `{{data(...)}}` directives in chapter files with structured analysis data.
- `sdd-forge text` — Expands `{{text(...)}}` directives by invoking AI to generate prose.
- `sdd-forge readme` — Assembles `README.md` from the completed chapter files.
- `sdd-forge agents` — Generates or updates `AGENTS.md` with project-specific AI context.

**Testing**
- `pnpm test` — Runs all unit and e2e tests via `tests/run.js` using the Node.js native test runner.
- `pnpm run test:unit` — Runs unit tests only.
- `pnpm run test:e2e` — Runs end-to-end tests only.
- `pnpm run test:acceptance` — Runs preset-level acceptance tests via `tests/acceptance/run.js`.

When running long-duration commands, redirect output to a file (`command > /tmp/output.log 2>&1`) and inspect it afterward rather than piping inline — this avoids unnecessary re-execution.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
