<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, deployment, and operations procedures for sdd-forge, a zero-dependency Node.js CLI tool built with ES Modules targeting Node.js ≥ 18.0.0, managed with pnpm 10.33.0, and distributed through the npm registry.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Language | JavaScript (ES Modules) | ES2022+ |
| Package Manager | pnpm | 10.33.0 |
| Distribution | npm registry | — |
| External Dependencies | None (zero-dependency policy) | — |
| Version Format | Git commit count-based | 0.1.0-alpha.N |
| Source Control | Git | — |
| Dependency Automation | GitHub Dependabot | — |
| Test Runner | Custom Node.js runner | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict zero-external-dependency policy. All runtime functionality relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, and `url`. No third-party npm packages are used at runtime.

The package manager is pnpm, pinned to an exact version (`10.33.0`) with an SHA-512 integrity hash in the `packageManager` field of `package.json`. This ensures fully reproducible installs across all environments without relying on a floating version.

Dependency updates are monitored automatically via GitHub Dependabot, configured in `.github/dependabot.yml` with weekly checks against the npm ecosystem.

Only the `src/` directory is included in the published npm package. Test files, configuration, and documentation are excluded from distribution.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published to the npm registry using a two-step process to ensure alpha releases do not immediately reach the `latest` tag.

**Step 1 — Pre-publish verification**

Before publishing, run a dry-run pack to confirm that no sensitive files or unintended directories are included in the bundle:

```bash
npm pack --dry-run
```

**Step 2 — Publish under the alpha dist-tag**

```bash
npm publish --tag alpha
```

This makes the release available for install via `npm install sdd-forge@alpha` without affecting users who install via the default `latest` tag.

**Step 3 — Promote to latest (optional)**

When a release is ready to become the default, promote it explicitly:

```bash
npm dist-tag add sdd-forge@<version> latest
```

The version number follows the format `0.1.0-alpha.N`, where `N` is the total git commit count obtained via `git rev-list --count HEAD`. Publishing is performed only when a release is explicitly requested — version bumps, commits, and pushes alone do not trigger a publish.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Running Tests**

Tests are organized into three scopes — unit, end-to-end, and acceptance — and are driven by a custom Node.js test runner located in `tests/run.js`.

```bash
npm test                        # Run all tests
npm run test:unit               # Run unit tests only
npm run test:e2e                # Run end-to-end tests only
npm run test:acceptance         # Run acceptance tests only
npm test -- --preset <name>    # Run tests scoped to a specific preset
```

Test output should be redirected to a file when inspecting results from long-running runs:

```bash
npm test > /tmp/test-output.log 2>&1
```

**Common CLI Operations**

| Command | Purpose |
|---|---|
| `sdd-forge setup` | Initialize project configuration |
| `sdd-forge docs build` | Run the full documentation generation pipeline |
| `sdd-forge docs scan` | Analyze source code and produce `analysis.json` |
| `sdd-forge docs enrich` | AI-enhance the analysis output |
| `sdd-forge docs readme` | Generate or refresh `README.md` |
| `sdd-forge flow prepare` | Start the SDD workflow for a new feature |
| `sdd-forge flow get status` | Show current flow progress |
| `sdd-forge upgrade` | Sync skills and templates after preset changes |
| `sdd-forge presets` | List all available presets |
| `sdd-forge help` | Display all available commands |

**No Build Step**

Because sdd-forge is pure JavaScript with ES Modules and no transpilation or bundling, the source in `src/` is executed directly by Node.js. There is no compile step required before running or publishing.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
