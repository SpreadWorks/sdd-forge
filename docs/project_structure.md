<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project is organized into seven major directories, each serving a distinct purpose: `src/` contains the full npm package source code, `docs/` holds generated documentation output, `tests/` provides the test suite, `.sdd-forge/` manages SDD flow state and worktrees, `specs/` stores feature specifications, `.github/` handles CI/CD configuration, and `experimental/` contains prototype features under development.
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/check/commands/    (cli)
src/docs/commands/    (cli, lib)
src/docs/data/    (model)
src/docs/lib/    (lib, model)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (controller)
src/flow/lib/    (lib, controller, config, model)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, lib, model |
| src/flow | 34 | controller, lib, config, model |
| src/lib | 22 | lib, model |
| src | 8 | cli |
| src/check | 3 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
|---|---|---|
| cli | `src/lib/cli.js` | Resolves project context (repo root, source root, PKG_DIR), parses CLI arguments, and detects git repositories and worktrees |
| config | `src/lib/config.js` | Loads `.sdd-forge/config.json`, extracts `package.json` fields, and provides defaults for language and concurrency settings |
| agent | `src/lib/agent.js` | Invokes AI agents via process spawn, manages request IDs, timeouts, and built-in provider detection |
| presets | `src/lib/presets.js` | Discovers and resolves the full preset parent chain; acts as the single source of truth for preset metadata |
| flow-state | `src/lib/flow-state.js` | Persists SDD flow state via an `.active-flow` pointer and `specs/NNN/flow.json`; tracks phase progression |
| flow-envelope | `src/lib/flow-envelope.js` | Provides a unified JSON response envelope (ok/error status) for all flow commands |
| git-helpers | `src/lib/git-helpers.js` | Encapsulates Git and GitHub operations: branch status, commit info, diff stats, and worktree dirty-state checks |
| i18n | `src/lib/i18n.js` | Implements three-layer internationalization with domain namespacing and message interpolation for `en/` and `ja/` locales |
| log | `src/lib/log.js` | Writes opt-in JSONL logs to daily log files and per-request prompt directories |
| guardrail | `src/lib/guardrail.js` | Loads, filters, and matches guardrail rules; handles lint-pattern parsing and phase-based filtering |
| lint | `src/lib/lint.js` | Runs mechanical guardrail validation against source files; extracted for reuse across flow commands |
| json-parse | `src/lib/json-parse.js` | Repairs and normalizes AI response JSON, handling unescaped quotes, truncation, and markdown fences |
| progress | `src/lib/progress.js` | Renders TTY-aware progress bars and build-pipeline log output with spinner animations |
| multi-select | `src/lib/multi-select.js` | Provides an interactive terminal selection widget (single and multi-select) without a readline dependency |
| skills | `src/lib/skills.js` | Handles skill file deployment used by the `setup` and `upgrade` commands |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
