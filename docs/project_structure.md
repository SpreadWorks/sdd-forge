# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the layout of the sdd-forge source tree, which is organized into 4 major areas: `src/lib/` for core framework utilities, `src/docs/` for the documentation generation engine, `src/presets/` for technology-specific scanners and data sources, and `src/spec/` and `src/flow/` for the SDD workflow commands. Each directory follows a clear separation of concerns — CLI entry points, shared libraries, data models, and tests — enabling a modular preset-based architecture with no external dependencies.

<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/flow/commands/    (cli)
src/lib/    (lib, cli, config)
src/presets/base/data/    (model, lib)
src/presets/cakephp2/data/    (model, lib)
src/presets/cakephp2/scan/    (lib)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/ci/scan/    (lib)
src/presets/cli/data/    (lib)
src/presets/database/data/    (lib)
src/presets/drizzle/data/    (lib)
src/presets/drizzle/scan/    (lib)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (lib)
src/presets/graphql/data/    (lib)
src/presets/graphql/scan/    (lib)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (lib)
src/presets/hono/scan/    (lib)
src/presets/hono/tests/unit/    (test)
src/presets/laravel/data/    (lib)
src/presets/laravel/scan/    (config, lib)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/monorepo/data/    (lib)
src/presets/nextjs/data/    (lib)
src/presets/nextjs/scan/    (lib)
src/presets/nextjs/tests/unit/    (test)
src/presets/postgres/data/    (lib)
src/presets/r2/data/    (lib)
src/presets/storage/data/    (lib)
src/presets/symfony/data/    (lib)
src/presets/symfony/scan/    (lib)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (lib)
src/presets/workers/data/    (lib)
src/presets/workers/scan/    (lib)
src/presets/workers/tests/unit/    (test)
src/spec/commands/    (cli)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src | 156 | cli, model, lib, config, test |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

The following table lists the shared library modules available across the codebase. These are organized into three layers: core framework utilities (`src/lib/`), documentation engine libraries (`src/docs/lib/`), and base preset data sources (`src/presets/base/data/`).

**Core Framework Utilities (`src/lib/`)**

| Class / Export | File Path | Responsibility |
| --- | --- | --- |
| `loadConfig()`, `sddDir()` | `src/lib/config.js` | Loads `.sdd-forge/config.json` and resolves project paths |
| `resolveChain()`, `PRESETS` | `src/lib/presets.js` | Auto-discovers presets and resolves parent chain inheritance |
| `callAgent()`, `callAgentAsync()` | `src/lib/agent.js` | AI agent invocation with stdin fallback for large prompts |
| `createI18n()`, `translate()` | `src/lib/i18n.js` | Three-layer i18n with domain namespacing (ui, messages, prompts) |
| `loadFlowState()`, `saveFlowState()` | `src/lib/flow-state.js` | Persists SDD flow state and tracks workflow steps |
| `deploySkills()` | `src/lib/skills.js` | Deploys skill templates to `.agents/skills/` and `.claude/skills/` |
| `parseArgs()`, `repoRoot()` | `src/lib/cli.js` | CLI argument parsing, repo root resolution, worktree detection |
| `createProgress()`, `createLogger()` | `src/lib/progress.js` | Progress bar display and scoped logging for build pipeline |
| `isDirectRun()` | `src/lib/entrypoint.js` | Detects if a module is directly executed vs. imported |
| `runSync()` | `src/lib/process.js` | Wraps `spawnSync` for synchronous command execution |
| `validateConfig()` | `src/lib/types.js` | JSDoc type definitions and config schema validation |
| `select()` | `src/lib/multi-select.js` | Terminal UI for interactive single/multi-select input |
| `loadSddTemplate()` | `src/lib/agents-md.js` | Loads SDD section templates for AGENTS.md generation |

**Documentation Engine (`src/docs/lib/`)**

| Class / Export | File Path | Responsibility |
| --- | --- | --- |
| `DataSource` | `src/docs/lib/data-source.js` | Base class for `{{data}}` directive resolvers with table generation |
| `ScanSource`, `Scannable()` | `src/docs/lib/scan-source.js` | Base class and mixin for scan-capable data sources |
| `loadDataSources()` | `src/docs/lib/data-source-loader.js` | Dynamically loads and instantiates DataSource classes from preset chain |
| `parseBlocks()` | `src/docs/lib/directive-parser.js` | Parses `{{data}}`, `{{text}}`, and block directives in templates |
| `buildLayers()`, `resolveOneFile()` | `src/docs/lib/template-merger.js` | Bottom-up template resolution with inheritance and block overrides |
| `resolveCommandContext()` | `src/docs/lib/command-context.js` | Resolves shared command context (root, config, lang, agent, i18n) |
| `mapWithConcurrency()` | `src/docs/lib/concurrency.js` | Processes items with controlled concurrency limit |
| `patternToRegex()`, `findFiles()` | `src/docs/lib/scanner.js` | Generic source code scanning with glob pattern matching |
| `parseTOML()` | `src/docs/lib/toml-parser.js` | Minimal TOML parser for wrangler.toml |
| `detectTestEnvironment()` | `src/docs/lib/test-env-detection.js` | Auto-detects test frameworks from analysis.json |

**Base Preset Data Sources (`src/presets/base/data/`)**

| Class / Export | File Path | Responsibility |
| --- | --- | --- |
| `StructureSource` | `src/presets/base/data/structure.js` | Generates directory trees and role tables from enriched analysis |
| `PackageSource` | `src/presets/base/data/package.js` | Extracts dependencies and scripts from package.json / composer.json |

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
