<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a CLI tool written in JavaScript (ES Modules, Node.js ≥ 18.0.0) that provides automated documentation generation and a Spec-Driven Development workflow with zero external npm dependencies. The package is managed with pnpm 10.33.0 and distributed via the npm registry.
## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->
<!-- {{/text}} -->
<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | ES2022+ |
| Runtime | Node.js | ≥ 18.0.0 |
| Package Manager | pnpm | 10.33.0 |
| Distribution | npm registry | — |
| License | MIT | — |
| External Dependencies | None | — |

All functionality relies exclusively on Node.js built-in modules (`fs`, `path`, `child_process`, `url`). No third-party libraries or frameworks are introduced.
### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->
<!-- {{/text}} -->
<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

pnpm 10.33.0 is the designated package manager, pinned via the `packageManager` field in `package.json` to ensure a reproducible environment across all contributors. A `pnpm-lock.yaml` lockfile is committed to version control.

The project declares no production or development dependencies — the entire codebase is built on Node.js built-ins only. Dependency updates are monitored automatically by GitHub Dependabot on a weekly schedule, which opens pull requests when relevant ecosystem changes are detected.
<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases follow a two-step publish flow using the npm CLI.

1. **Verify the package contents** by running `npm pack --dry-run` and confirming that only `src/`, `package.json`, `README.md`, and `LICENSE` are included, with no sensitive files present.
2. **Publish to the alpha tag** with `npm publish --tag alpha`. This makes the release available under the `alpha` dist-tag without affecting the `latest` tag.
3. **Promote to latest** with `npm dist-tag add sdd-forge@<version> latest` once the release is confirmed stable.

The version number follows the `0.1.0-alpha.N` scheme, where `N` is the total commit count obtained from `git rev-list --count HEAD`. No compilation or build step is required before publishing — the source files in `src/` are distributed directly.

`npm publish` and `npm dist-tag` must only be executed when a release is explicitly requested.
