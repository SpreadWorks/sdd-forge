<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a command-line tool written in JavaScript (ES Modules) targeting Node.js 18 or later, with no external dependencies beyond the Node.js standard library. The package is managed with pnpm 10.33.0 and distributed as the `sdd-forge` npm package.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 (current: 22.x) |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | 10.33.0 |
| CLI Entry Point | sdd-forge.js | — |
| AI Agent (default) | Claude (Anthropic) | configurable via `agent.providers` |
| AI Agent (alternative) | Codex | configurable via `agent.providers` |
| Version Control | Git | — |
| Distribution | npm registry | `sdd-forge` package |

The project carries zero external runtime or development dependencies; all functionality relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, and `url`.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

pnpm is the designated package manager, enforced through the `packageManager` field in `package.json` (pinned to `pnpm@10.33.0` with a SHA-512 integrity hash). A minimal `pnpm-lock.yaml` (lockfile version 9.0) is committed to the repository, with `autoInstallPeers: true` and `excludeLinksFromLockfile: false`.

Because the project has no external dependencies, the lockfile contains only header metadata. All runtime functionality is implemented using Node.js built-in modules, so there are no third-party packages to install or update.

Dependabot is configured (`.github/dependabot.yml`) to check the npm ecosystem weekly and open pull requests for any new dependency additions in the future.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge is distributed as an npm package under the name `sdd-forge`. The release process follows a two-step procedure:

1. **Publish with alpha tag** — Run `npm publish --tag alpha` to upload the package to the npm registry under the `alpha` dist-tag.
2. **Promote to latest** — Run `npm dist-tag add sdd-forge@<version> latest` to move the release to the `latest` tag, making it the default installation target on the npm registry page.

Before publishing, run `npm pack --dry-run` to verify the set of files included in the package and confirm that no sensitive information is bundled. Only the `src/` directory, `package.json`, `README.md`, and `LICENSE` are shipped; preset test files (`src/presets/*/tests/`) are excluded via the `files` field.

The version number follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`. There is no automated CI/CD pipeline for publishing; releases are triggered manually.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Day-to-day operations center on the sdd-forge CLI and the project-local `.sdd-forge/` directory, which holds all runtime state.

**Documentation generation** — Run `sdd-forge build` to execute the full pipeline: `scan → enrich → init → data → text → readme`. Individual steps can be run in isolation (e.g., `sdd-forge scan`, `sdd-forge text`) to regenerate only the affected output.

**SDD flow management** — Use `sdd-forge flow start`, `flow status`, `flow resume`, `flow review`, `flow merge`, and `flow cleanup` to progress through a Spec-Driven Development cycle. Active flow state is persisted in `.sdd-forge/.active-flow`.

**Analysis cache** — Source analysis results are cached in `.sdd-forge/output/analysis.json`. Re-run `sdd-forge scan` whenever the source tree changes to refresh the cache.

**Task board** — Use `node experimental/workflow/board.js` with subcommands (`add`, `list`, `search`, `show`, `update`, `to-issue`) to manage development tasks and draft GitHub Issues.

**Testing** — Execute `pnpm test` (unit + e2e), `pnpm run test:unit`, `pnpm run test:e2e`, or `pnpm run test:acceptance` as needed. The custom test runner at `tests/run.js` accepts `--scope` and `--preset` flags for targeted runs.

**AI agent timeout** — The default agent execution timeout is 600 seconds, configurable in `config.json` under `agent.timeout`. Parallel command concurrency is set to `4`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
