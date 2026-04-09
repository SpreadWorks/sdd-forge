<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the directory layout of the sdd-forge project, which is organized across six major areas: `src/` (CLI source code), `docs/` (generated documentation output), `specs/` (SDD specification files), `tests/` (unit and integration test suites), `experimental/` (prototype features), and configuration directories (`.sdd-forge/`, `.agents/`, `.claude/`) that hold project-specific state and agent deployment targets.
## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->
<!-- {{/text}} -->
<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

The following shared modules reside in `src/lib/` and are consumed across all CLI commands.

| Module | File Path | Responsibility |
|---|---|---|
| agent | `src/lib/agent.js` | Invokes the Claude CLI agent with prompt arguments, timeout management, and stdin/stdout piping |
| config | `src/lib/config.js` | Loads and validates `.sdd-forge/config.json` and exposes package metadata |
| cli | `src/lib/cli.js` | Resolves repository and source root paths, parses CLI arguments, and initialises the runtime environment |
| flow-state | `src/lib/flow-state.js` | Persists SDD workflow state via an `.active-flow` pointer and per-spec `flow.json` files |
| flow-envelope | `src/lib/flow-envelope.js` | Produces standardised JSON response envelopes (`ok`, `fail`, `warn`) for all flow commands |
| git-helpers | `src/lib/git-helpers.js` | Queries git branch, diff, and commit state; wraps GitHub CLI operations |
| guardrail | `src/lib/guardrail.js` | Loads guardrail rule sets from JSON and filters them by phase and pattern |
| lint | `src/lib/lint.js` | Runs guardrail lint patterns against the set of changed files |
| process | `src/lib/process.js` | Provides a unified interface for synchronous and asynchronous child-process execution |
| log | `src/lib/log.js` | Writes daily JSONL logs and per-request prompt records under `.tmp/logs/` |
| i18n | `src/lib/i18n.js` | Resolves translation keys using a domain-namespaced, multi-tier locale discovery strategy |
| presets | `src/lib/presets.js` | Discovers preset directories and resolves the full parent-chain inheritance hierarchy |
| include | `src/lib/include.js` | Expands `<!-- include() -->` directives with support for `@templates/` and `@presets/` path aliases |
| json-parse | `src/lib/json-parse.js` | Repairs malformed JSON returned by AI agents (unescaped quotes, truncation, markdown fences) |
| formatter | `src/lib/formatter.js` | Renders CLI output helpers such as section headers and dividers for plain-text reports |
| skills | `src/lib/skills.js` | Deploys and manages `SKILL.md` files into `.agents/` and `.claude/` directories |
| multi-select | `src/lib/multi-select.js` | Provides an interactive terminal widget for single- and multi-select with tree navigation |
| entrypoint | `src/lib/entrypoint.js` | Detects direct module invocation and attaches top-level error handlers for CLI entry points |
