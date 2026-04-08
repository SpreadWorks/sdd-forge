<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool built with JavaScript (ES Modules), requiring Node.js 18 or later and managed with pnpm 10.33.0. It has no external runtime dependencies, relying entirely on Node.js built-in modules.
## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->
<!-- {{/text}} -->
<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Language | JavaScript (ESM) | ES2022+ |
| Package Manager | pnpm | 10.33.0 |
| CLI Entry Point | `src/sdd-forge.js` | — |
| Distribution | npm (npmjs.com) | `sdd-forge` |
| Version Control | Git / GitHub | — |
| Dependency Updates | Dependabot | weekly (npm) |

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->
<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project uses **pnpm 10.33.0** as its package manager, pinned via the `packageManager` field in `package.json` with a full integrity hash to ensure reproducible installs across environments. There are **no external runtime dependencies** — all production code relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, `url`, and `crypto`. This is an intentional design constraint enforced by project policy to eliminate supply-chain risk and keep the installed package lightweight. Dependabot is configured to monitor the npm ecosystem on a weekly schedule, though its impact is limited given the absence of third-party dependencies.

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is distributed via the npm registry under the name `sdd-forge` and can be installed globally with `npm install -g sdd-forge`.

The published artifact consists of the `src/` directory (excluding `src/presets/*/tests/`), along with `package.json`, `README.md`, and `LICENSE`.

The release process follows a two-step flow:

1. Publish as a pre-release tag: `npm publish --tag alpha`
2. Promote to the latest tag: `npm dist-tag add sdd-forge@<version> latest`

Before publishing, `npm pack --dry-run` is run to verify that no sensitive or unintended files are included in the package.

Versioning during the alpha period follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained via `git rev-list --count HEAD`.
