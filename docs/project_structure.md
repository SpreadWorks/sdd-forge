<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The source tree is organized into four major directories, each with a distinct role: `src/lib/` provides core shared utilities used across the entire codebase, `src/docs/` contains the documentation generation pipeline (CLI commands, DataSources, and engine libraries), `src/flow/` orchestrates the Spec-Driven Development workflow, and `src/check/` implements quality-gate checks.
## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/check/commands/    (cli)
src/docs/commands/    (cli, lib, controller)
src/docs/data/    (model)
src/docs/lib/    (lib, model)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (controller)
src/flow/lib/    (lib, config, controller, model)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->
<!-- {{/text}} -->
<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

The following modules in `src/lib/` are shared across the docs, flow, and check layers.

| Module | File | Responsibility |
|---|---|---|
| agent | `src/lib/agent.js` | AI agent invocation (Claude, Codex); prompt templating, JSON output parsing, and provider resolution |
| agents-md | `src/lib/agents-md.js` | Loads SDD section templates from the base preset for AGENTS.md generation |
| cli | `src/lib/cli.js` | Project/source root resolution, CLI argument parsing, and worktree detection |
| config | `src/lib/config.js` | Configuration file loading, `.sdd-forge/` path helpers, and language resolution |
| entrypoint | `src/lib/entrypoint.js` | Module detection and direct-execution handling for standalone scripts |
| exit-codes | `src/lib/exit-codes.js` | Unified exit code constants (`EXIT_SUCCESS`, `EXIT_ERROR`) |
| flow-envelope | `src/lib/flow-envelope.js` | JSON envelope factory (ok / fail / warn) for flow command responses |
| flow-state | `src/lib/flow-state.js` | SDD workflow state persistence; tracks step progress and phases in `specs/NNN/flow.json` |
| formatter | `src/lib/formatter.js` | Text formatting helpers for CLI output (dividers, section headers) |
| git-helpers | `src/lib/git-helpers.js` | Git and GitHub CLI operations: status, branch info, ahead count, and issue comments |
| guardrail | `src/lib/guardrail.js` | Guardrail loading, filtering by phase, and scope matching for spec gate checks |
| i18n | `src/lib/i18n.js` | Internationalization with three-tier (domain / language / key) lookup and English fallback |
| include | `src/lib/include.js` | Resolves `<!-- include("path") -->` directives in templates with circular-reference detection |
| json-parse | `src/lib/json-parse.js` | Repairs malformed JSON from AI responses (unescaped quotes, truncation, markdown fences) |
| lint | `src/lib/lint.js` | Executes guardrail lint patterns against changed files |
| log | `src/lib/log.js` | Unified JSONL logger with daily log files and per-request prompt recording |
| multi-select | `src/lib/multi-select.js` | Interactive terminal selection widget (arrow-key navigation, tree display) |
| presets | `src/lib/presets.js` | Preset discovery from `src/presets/` and parent-chain resolution |
| process | `src/lib/process.js` | Unified synchronous and asynchronous command execution; returns result objects without throwing |
| progress | `src/lib/progress.js` | Progress bar and pipeline logging with ANSI-aware header pinning |
| skills | `src/lib/skills.js` | Skill template deployment to `.agents/skills/` and `.claude/skills/` |
| types | `src/lib/types.js` | JSDoc type definitions and config validation (`SddConfig`, `AgentProvider`, `DocumentStyle`, etc.) |
