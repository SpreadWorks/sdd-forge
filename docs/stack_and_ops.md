<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, and operational procedures for sdd-forge, a CLI tool built on Node.js (≥ 18.0.0) with JavaScript ES Modules, managed with pnpm 10.33.0, and currently released at version 0.1.0-alpha.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | 10.33.0 (SHA-512 pinned) |
| CLI Entry Point | `src/sdd-forge.js` | — |
| Module Format | ES Modules (`"type": "module"`) | — |
| Test Runner | Custom Node.js script (`tests/run.js`) | — |
| Dependency Monitoring | GitHub Dependabot | Weekly (npm ecosystem) |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict **no-external-dependencies** policy: only Node.js built-in modules are used (e.g., `fs`, `path`, `crypto`, `child_process`, `url`). There are no entries in `dependencies` or `devDependencies` in `package.json`.

The package manager is pnpm, with an exact version and SHA-512 hash pinned in the `packageManager` field of `package.json` to ensure reproducible installs across all environments. The `pnpm-lock.yaml` file is committed to version control.

The published package is controlled via the `files` field in `package.json`, which distributes only the `src/` directory. Preset test directories (`src/presets/*/tests/`) are explicitly excluded, keeping the distributed package lean. Development artifacts such as test files and locally generated documentation are never shipped.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Publishing follows a two-step manual process reserved for explicit release events. Before publishing, run `npm pack --dry-run` to verify that no sensitive or unintended files are included in the package.

**Step 1 — Publish pre-release:**
```bash
npm publish --tag alpha
```
This pushes the package under the `alpha` dist-tag, making it available for early adopters without affecting the default install target.

**Step 2 — Promote to latest:**
```bash
npm dist-tag add sdd-forge@<version> latest
```
This promotes the release to the `latest` dist-tag, making it the default version installed by `npm install -g sdd-forge`.

**Versioning:** During the alpha period, versions follow the format `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`. No manual version bump is needed; the value is derived automatically from the repository history.

There is no automated CI/CD pipeline for publishing. The process is fully gated and must be initiated manually with explicit release intent.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Installation**
```bash
npm install -g sdd-forge
```

**Core operational commands:**

| Operation | Command | Purpose |
|---|---|---|
| Setup | `sdd-forge setup` | Initialize project config at `.sdd-forge/config.json` via interactive wizard |
| Full docs build | `sdd-forge docs build` | Run the complete pipeline: scan → enrich → init → data → text → readme → agents → translate |
| Generate README | `sdd-forge docs readme` | Build `README.md` from the `docs/` knowledge base |
| Review docs | `sdd-forge docs review` | Check documentation quality |
| Prepare flow | `sdd-forge flow prepare` | Start a Spec-Driven Development flow, creating a spec and branch or worktree |
| Flow status | `sdd-forge flow get status` | Display current flow progress |
| Upgrade templates | `sdd-forge upgrade` | Detect and apply changes from updated templates or presets to project skills and config |
| List presets | `sdd-forge presets` | Display available framework presets and their inheritance chain |

**Upgrade procedure:** When files under `src/templates/` or `src/presets/` are modified, run `sdd-forge upgrade`. The command performs a diff and updates only changed files in `.claude/skills/`, `.agents/skills/`, and project configuration.

**Testing:**
```bash
npm test            # all tests
npm run test:unit   # unit tests only
npm run test:e2e    # end-to-end tests
npm run test:acceptance  # acceptance tests
```
No build or compilation step is needed; Node.js executes ESM source files directly.

**Key state files:**
- `.sdd-forge/config.json` — primary project configuration
- `.sdd-forge/.active-flow` — tracks the currently active flow
- `.sdd-forge/output/analysis.json` — cached source analysis data
- `specs/<spec-id>/flow.json` — per-spec workflow state
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
