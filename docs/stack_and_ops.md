<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a pure Node.js CLI tool (ES modules, Node.js >=18.0.0) with zero external dependencies, built entirely on Node.js built-in modules. The package is managed with pnpm 10.33.0 and published to npm as the `sdd-forge` package at version 0.1.0-alpha series.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=18.0.0 |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | 10.33.0 |
| Package Format | npm (CommonJS-free ESM) | — |
| External Libraries | None | — |
| Test Runner | Custom (`tests/run.js`) | — |
| Version Control | Git | — |
| Registry | npmjs.com | — |

All runtime functionality relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, and `readline`. No third-party runtime dependencies are declared or installed.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

pnpm is the designated package manager, pinned to version 10.33.0 with a SHA-512 checksum in the `packageManager` field of `package.json` to ensure reproducible installations across environments. The lockfile `pnpm-lock.yaml` (format version 9.0) records the exact resolved state of the dependency graph.

The project intentionally has no runtime or development dependencies. The `dependencies` and `devDependencies` sections of `package.json` are absent, and the lockfile contains no package entries. This design keeps the install footprint minimal and eliminates supply-chain risk. Running `pnpm install` in a clean checkout produces an empty `node_modules` directory and requires only the Node.js runtime to operate.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published to the npm registry under the name `sdd-forge` and is intended for global installation (`npm install -g sdd-forge`). The binary entry point `sdd-forge` maps directly to `src/sdd-forge.js`.

The `files` field in `package.json` restricts the published payload to the `src/` directory (excluding `src/presets/*/tests/`), along with `package.json`, `README.md`, and `LICENSE`. This ensures that test fixtures, experimental scripts, and project-specific configuration files are never included in the public release.

The release procedure follows a two-step process:

1. Publish with the pre-release tag: `npm publish --tag alpha`
2. Promote to the `latest` tag: `npm dist-tag add sdd-forge@<version> latest`

Before publishing, `npm pack --dry-run` is run to verify the file manifest and confirm that no sensitive or unintended files are included. Because npm does not allow version numbers to be reused after publication, the version is always incremented beforehand. The version string follows the format `0.1.0-alpha.N`, where `N` is the total Git commit count (`git rev-list --count HEAD`).
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Day-to-day operations are performed entirely through npm scripts and the `sdd-forge` CLI.

**Running tests**

| Command | Scope |
|---|---|
| `npm test` | All tests (unit + e2e) |
| `npm run test:unit` | Unit tests only |
| `npm run test:e2e` | End-to-end tests only |
| `npm run test:acceptance` | Acceptance tests (preset-specific) |

Tests are discovered via the glob pattern `**/*.test.js` and executed by the custom runner at `tests/run.js`, which supports a `--scope` flag for targeted filtering.

**Documentation pipeline**

After modifying source code, the documentation can be regenerated with:

```
sdd-forge build
```

This runs the full pipeline: `scan → enrich → init → data → text → readme`. Individual stages can also be invoked directly (e.g., `sdd-forge scan`, `sdd-forge agents`).

**Template and skill updates**

When files under `src/templates/` or `src/presets/` are changed, run:

```
sdd-forge upgrade
```

This detects diffs in skills (`.claude/skills/`, `.agents/skills/`) and templates, and applies only the changed files to the project.

**SDD workflow**

Specification-driven development is managed through the `sdd-forge flow` subcommand: `start` initiates the planning phase, `review` runs an AI code review, and `merge` finalises and merges the branch.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
