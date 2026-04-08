<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the source tree of sdd-forge, which is organized into five major directories: `src/docs` (documentation pipeline controllers, CLI handlers, models, and libraries), `src/flow` (SDD workflow controllers, libraries, and configuration), `src/lib` (shared utility libraries and data models), `src` (top-level CLI entrypoints and command dispatchers), and `src/check` (validation CLI commands).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (controller, cli)
src/check/commands/    (cli)
src/docs/commands/    (controller, cli)
src/docs/data/    (model)
src/docs/lib/    (model, lib)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (controller, lib)
src/flow/lib/    (lib, controller)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| `agent.js` | `src/lib/agent.js` | Unified interface for invoking configured AI agents with prompt handling, timeout management, and stdin/stdout piping |
| `agents-md.js` | `src/lib/agents-md.js` | Loads SDD section markdown templates for AGENTS.md from presets with i18n fallback |
| `cli.js` | `src/lib/cli.js` | Core utilities for resolving project roots, source roots, worktree detection, and parsing CLI arguments across all entrypoints |
| `config.js` | `src/lib/config.js` | Loads and validates `.sdd-forge/config.json`, handles language selection, and resolves concurrency defaults |
| `entrypoint.js` | `src/lib/entrypoint.js` | Utilities for detecting direct script execution and running main functions with error handling |
| `exit-codes.js` | `src/lib/exit-codes.js` | Unified process exit code constants (`EXIT_SUCCESS`, `EXIT_ERROR`) shared across all commands |
| `flow-envelope.js` | `src/lib/flow-envelope.js` | Standardizes JSON response envelope format for all flow commands via `ok()`, `fail()`, and `warn()` helpers |
| `flow-state.js` | `src/lib/flow-state.js` | Manages SDD workflow state persistence across flow phases using JSON storage with an active-flow pointer |
| `formatter.js` | `src/lib/formatter.js` | Shared text formatting helpers for CLI output used by flow reports and status commands |
| `git-helpers.js` | `src/lib/git-helpers.js` | Queries git state (branch, commits, diffs) and invokes the GitHub CLI for issue comments and PR operations |
| `guardrail.js` | `src/lib/guardrail.js` | Loads guardrails from JSON, filters by phase and scope, and applies lint patterns for compliance checking |
| `i18n.js` | `src/lib/i18n.js` | Three-tier internationalization system with domain namespacing (`ui`, `messages`, `prompts`) for multi-language support |
| `include.js` | `src/lib/include.js` | Resolves `include()` directives in markdown templates with path aliasing for `@templates/` and `@presets/` |
| `json-parse.js` | `src/lib/json-parse.js` | Repairs malformed JSON from AI responses, handling unescaped quotes, truncation, markdown fences, and invalid escapes |
| `lint.js` | `src/lib/lint.js` | Runs mechanical validation of file contents against guardrail lint patterns and returns structured results |
| `log.js` | `src/lib/log.js` | Two-tier JSONL logger with daily metadata logs and per-request JSON bodies, covering agent, git, and event domains |
| `multi-select.js` | `src/lib/multi-select.js` | Terminal-based single/multi-select UI widget with tree display for interactive preset selection |
| `presets.js` | `src/lib/presets.js` | Auto-discovers presets from `src/presets/` and resolves parent-based inheritance chains |
| `process.js` | `src/lib/process.js` | Unified synchronous and asynchronous command execution wrapper that returns result objects without throwing |
| `progress.js` | `src/lib/progress.js` | TTY-aware progress bar and logger for the documentation build pipeline |
| `skills.js` | `src/lib/skills.js` | Deploys skill template files from source directories to `.agents/skills/` and `.claude/skills/` |
| `types.js` | `src/lib/types.js` | JSDoc type definitions and validation functions for all configuration sections (`DocsConfig`, `FlowConfig`, etc.) |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
