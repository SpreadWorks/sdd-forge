<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers the directory layout and module organization of the sdd-forge codebase, which is organized into six major top-level directories. These directories serve distinct roles: `src` (CLI entry point), `src/docs` (documentation pipeline — CLI, library, and model), `src/flow` (spec-driven workflow — controller, library, config, and model), `src/lib` (shared utilities — library and model), `src/check` (input validation CLI), and `src/presets` (preset definitions and test fixtures).
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
src/presets/base/data/    
src/presets/base/tests/acceptance/    
src/presets/base/tests/acceptance/fixtures/src/    
src/presets/cakephp2/data/    
src/presets/cakephp2/tests/acceptance/    
src/presets/cakephp2/tests/unit/    
src/presets/cli/data/    
src/presets/cli/tests/acceptance/    
src/presets/cli/tests/acceptance/fixtures/src/    
src/presets/cli/tests/acceptance/fixtures/src/commands/    
src/presets/cli/tests/acceptance/fixtures/src/lib/    
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    
src/presets/database/data/    
src/presets/drizzle/data/    
src/presets/drizzle/tests/unit/    
src/presets/edge/data/    
src/presets/github-actions/data/    
src/presets/graphql/data/    
src/presets/graphql/tests/unit/    
src/presets/hono/data/    
src/presets/hono/tests/unit/    
src/presets/js-webapp/tests/acceptance/    
src/presets/js-webapp/tests/acceptance/fixtures/src/    
src/presets/laravel/data/    
src/presets/laravel/tests/acceptance/    
src/presets/laravel/tests/e2e/    
src/presets/laravel/tests/unit/    
src/presets/lib/    
src/presets/library/tests/acceptance/    
src/presets/library/tests/acceptance/fixtures/src/    
src/presets/library/tests/acceptance/fixtures/src/rules/    
src/presets/library/tests/acceptance/fixtures/src/utils/    
src/presets/monorepo/data/    
src/presets/nextjs/data/    
src/presets/nextjs/tests/unit/    
src/presets/node-cli/tests/acceptance/    
src/presets/node-cli/tests/acceptance/fixtures/src/    
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    
src/presets/php-webapp/tests/acceptance/    
src/presets/postgres/data/    
src/presets/r2/data/    
src/presets/storage/data/    
src/presets/symfony/data/    
src/presets/symfony/tests/acceptance/    
src/presets/symfony/tests/e2e/    
src/presets/symfony/tests/unit/    
src/presets/webapp/data/    
src/presets/webapp/tests/acceptance/    
src/presets/workers/data/    
src/presets/workers/tests/unit/    
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/presets | 122 | — |
| src/docs | 40 | cli, lib, model |
| src/flow | 34 | controller, lib, config, model |
| src/lib | 22 | lib, model |
| src | 8 | cli |
| src/check | 3 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| `presets` | `src/lib/presets.js` | Discovers presets from `src/presets/` and resolves parent-chain inheritance for multi-preset configurations |
| `config` | `src/lib/config.js` | Loads JSON and package.json files, retrieves SDD configuration, and resolves concurrency settings |
| `cli` | `src/lib/cli.js` | Core CLI utilities for repository root resolution, environment variable handling, and argument parsing |
| `agent` | `src/lib/agent.js` | AI agent invocation with system prompt handling and prompt argument resolution |
| `flow-state` | `src/lib/flow-state.js` | Manages SDD workflow state via `.active-flow` pointer and `flow.json`, and derives phases from step IDs |
| `flow-envelope` | `src/lib/flow-envelope.js` | Creates structured JSON envelope objects for flow command responses (success, failure, warning) |
| `git-helpers` | `src/lib/git-helpers.js` | Shared helpers for querying Git state and GitHub CLI availability |
| `guardrail` | `src/lib/guardrail.js` | Loads, filters, matches, and merges guardrails from JSON configuration |
| `i18n` | `src/lib/i18n.js` | Internationalization with domain-namespaced translation and locale fallback |
| `include` | `src/lib/include.js` | Resolves `include()` directives in templates with recursive includes and multiple path resolution schemes |
| `json-parse` | `src/lib/json-parse.js` | Repairs malformed JSON from AI responses (unescaped quotes, truncation, markdown fences) |
| `lint` | `src/lib/lint.js` | Validates files against lint guardrail patterns and retrieves lists of changed files |
| `Logger` | `src/lib/log.js` | Unified JSONL logger with daily rotation and `agent()`, `git()`, `event()` channels for prompt storage |
| `process` | `src/lib/process.js` | Unified command execution helpers (`runCmd`, `runCmdAsync`, `assertOk`) that return result objects without throwing |
| `Progress` | `src/lib/progress.js` | Progress bar and pipeline logging utility with TTY/non-TTY handling |
| `skills` | `src/lib/skills.js` | Discovers skill templates and deploys them to `.agents` and `.claude` directories |
| `types` | `src/lib/types.js` | JSDoc type definitions and validation functions for config and context objects |
| `formatter` | `src/lib/formatter.js` | Shared text formatting helpers for CLI output, including section headers and dividers |
| `agents-md` | `src/lib/agents-md.js` | Loads SDD section markdown templates from preset directories with locale fallback to `en` |
| `multi-select` | `src/lib/multi-select.js` | Builds flattened tree item lists from presets for interactive terminal selection |
| `entrypoint` | `src/lib/entrypoint.js` | Detects whether a module is run directly and executes a main function with unified error handling |
| `exit-codes` | `src/lib/exit-codes.js` | Defines unified exit code constants (`EXIT_SUCCESS`, `EXIT_ERROR`) shared across CLI commands |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
