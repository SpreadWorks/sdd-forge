<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is implemented in JavaScript using Node.js (>=18.0.0) with the ES Modules system, and is distributed as a zero-dependency CLI package managed with pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | ESM (`"type": "module"`) |
| Runtime | Node.js | >= 18.0.0 |
| Package Manager | pnpm | 10.33.0 (pinned with SHA512 integrity hash) |
| Package Registry | npm | — |
| CLI Entry Point | `sdd-forge` binary | `./src/sdd-forge.js` |
| Dependencies | None (Node.js built-ins only) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project enforces a zero-external-dependency policy; only Node.js built-in modules (`fs`, `path`, `child_process`, `url`, etc.) are used at runtime. There are no entries in the `dependencies` or `devDependencies` fields of `package.json`.

The package manager is **pnpm**, pinned to version 10.33.0 via the `packageManager` field with a SHA512 integrity hash, ensuring a reproducible environment across all contributors. The lockfile `pnpm-lock.yaml` (lockfile format version 9.0) is committed to the repository.

Dependency updates for the npm ecosystem are monitored automatically by Dependabot, configured to run on a weekly schedule via `.github/dependabot.yml`.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published to the npm registry under the name `sdd-forge`. The published artifact is limited to the `src/` directory together with `package.json`, `README.md`, and `LICENSE`, as defined by the `files` field in `package.json`.

The recommended release sequence is:

1. Confirm the version number using the `0.1.0-alpha.N` convention, where `N` is the total commit count (`git rev-list --count HEAD`).
2. Run `npm pack --dry-run` to verify that no sensitive or unintended files are included in the package.
3. Publish with the alpha tag: `npm publish --tag alpha`.
4. Promote to the `latest` tag: `npm dist-tag add sdd-forge@<version> latest`.

The two-step publish process is required because publishing with `--tag alpha` alone does not update the `latest` tag on the npm registry page. No automated CI/CD pipeline is currently configured for publication.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Day-to-day operations are performed through the `sdd-forge` CLI. The main operational commands are grouped as follows:

**Project initialisation and upgrades**
- `sdd-forge setup` — Initialise a new project (generates `AGENTS.md` and creates the `CLAUDE.md` symlink).
- `sdd-forge upgrade` — Detect and apply updates to skills and templates after changes to `src/templates/` or `src/presets/`.

**Documentation pipeline**
- `sdd-forge docs build` — Run the full documentation generation pipeline (`scan → enrich → init → data → text → readme`).
- Individual stages can be run separately: `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `translate`, `changelog`, `agents`, `snapshot`.

**SDD workflow**
- `sdd-forge flow get` — Retrieve the current flow state.
- `sdd-forge flow set` — Update flow state values.
- `sdd-forge flow run` — Execute flow operations.

**Testing**
- `pnpm test` — Run the full test suite (unit, end-to-end, and acceptance tests).
- `pnpm run test:unit` / `pnpm run test:e2e` / `pnpm run test:acceptance` — Run individual test layers.
- `node tests/acceptance/run.js <preset-name>` — Run the acceptance test for a specific preset.

**Information**
- `sdd-forge presets list` — List all available presets.
- `sdd-forge help` — Display the full command reference.
- `sdd-forge --version` — Display the current version.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
