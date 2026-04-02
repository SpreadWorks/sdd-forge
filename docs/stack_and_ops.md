<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter documents the technology stack and operational procedures for sdd-forge, a Node.js CLI tool built exclusively on Node.js built-in modules with no external runtime dependencies. The project requires Node.js 18.0.0 or later and is managed and distributed via pnpm and npm.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=18.0.0 |
| Module System | ES Modules (`"type": "module"`) | — |
| Package Manager | pnpm | 10.33.0 |
| Distribution | npm | — |
| Version Control | Git | — |
| AI Agent (default) | Claude CLI (`claude`) | — |
| AI Agent (optional) | OpenAI Codex CLI (`codex`) | — |
| Current Package Version | sdd-forge | 0.1.0-alpha.361 |
| License | MIT | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict no-external-dependencies policy: only Node.js built-in modules are used throughout the `src/` codebase. Adding third-party packages to the project is explicitly prohibited.

Dependencies are managed with pnpm (version 10.33.0, hash-locked via `packageManager` field). The `files` field in `package.json` limits the published package to the `src/` directory, excluding preset test fixtures (`src/presets/*/tests/`) from the npm artifact.

Development tooling such as test runners (`tests/run.js`) relies solely on built-in Node.js capabilities, maintaining the zero-dependency constraint across both production and development contexts.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published to the npm registry under the package name `sdd-forge`. The deployment process follows a two-step procedure to ensure both the `alpha` and `latest` dist-tags are updated correctly:

1. **Pre-publish verification** — Run `npm pack --dry-run` to confirm only intended files are included and no sensitive information is present.
2. **Publish with alpha tag** — Run `npm publish --tag alpha` to push the new version without overwriting the `latest` tag automatically.
3. **Promote to latest** — Run `npm dist-tag add sdd-forge@<version> latest` to update the `latest` tag, which causes the release to appear on the npmjs.com package page.

Versions follow the `0.1.0-alpha.N` format during the alpha phase, where `N` is derived from the total git commit count (`git rev-list --count HEAD`). Once a version is published it cannot be re-published under the same version number; npm prevents overwriting even after an unpublish for 24 hours.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Day-to-day operations center on the `sdd-forge` CLI. The primary operational commands are:

- **`sdd-forge build`** — Full documentation pipeline: scan → enrich → init → data → text → readme. Run this after source code changes to regenerate all documentation.
- **`sdd-forge scan`** — Analyses the source tree and writes `analysis.json` to `.sdd-forge/output/`. Use the `--reset-category` option to re-classify entries when the project structure changes.
- **`sdd-forge agents`** — Regenerates `AGENTS.md` (and the `CLAUDE.md` symlink) from the current source analysis. Run after significant structural changes.
- **`sdd-forge upgrade`** — Detects changes in `src/templates/` and `src/presets/` and propagates updates to project skills (`.claude/skills/`, `.agents/skills/`) and configuration files. Run after modifying any template or preset.
- **`sdd-forge flow`** — Manages Spec-Driven Development flows (`start`, `status`, `resume`, `review`, `merge`, `cleanup`). Concurrent flows require separate git worktrees.
- **Test execution** — `node tests/run.js` (all), `--scope unit` or `--scope e2e` for targeted runs. Long-running test output should be redirected to a file for inspection (`node tests/run.js > /tmp/output.log 2>&1`).
- **Task board** — `node experimental/workflow/board.js` manages development tasks (search, add, list, show, update, to-issue).
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
