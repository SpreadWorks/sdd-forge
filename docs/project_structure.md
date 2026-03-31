<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the physical layout of the sdd-forge source tree, which is organized into five major top-level directories: `src/presets` (preset definitions, DataSources, and their acceptance and unit tests), `src/docs` (documentation generation commands, DataSources, and the processing engine), `src/flow` (SDD workflow commands and state management), `src/lib` (shared utility libraries used across all subsystems), and `src` (top-level CLI entry points).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/docs/lib/lang/    (lib)
src/flow/    (cli, config)
src/flow/commands/    (cli)
src/flow/get/    (lib, cli)
src/flow/run/    (cli)
src/flow/set/    (cli)
src/lib/    (lib)
src/presets/base/data/    (model)
src/presets/base/tests/acceptance/    (test)
src/presets/base/tests/acceptance/fixtures/src/    (test, lib, other)
src/presets/cakephp2/data/    (lib, config, controller, other, model, test, view)
src/presets/cakephp2/tests/acceptance/    (test)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/cli/data/    (lib)
src/presets/cli/tests/acceptance/    (test)
src/presets/cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/database/data/    (model)
src/presets/drizzle/data/    (model)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (config)
src/presets/graphql/data/    (model)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (middleware)
src/presets/hono/tests/unit/    (test)
src/presets/js-webapp/tests/acceptance/    (test)
src/presets/js-webapp/tests/acceptance/fixtures/src/    (config, lib, other)
src/presets/laravel/data/    (cli, config, controller, model, route)
src/presets/laravel/tests/acceptance/    (test)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/library/tests/acceptance/    (test)
src/presets/library/tests/acceptance/fixtures/src/    (lib)
src/presets/library/tests/acceptance/fixtures/src/rules/    (lib)
src/presets/library/tests/acceptance/fixtures/src/utils/    (lib)
src/presets/monorepo/data/    (model)
src/presets/nextjs/data/    (model)
src/presets/nextjs/tests/unit/    (test)
src/presets/node-cli/tests/acceptance/    (test)
src/presets/node-cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/php-webapp/tests/acceptance/    (test)
src/presets/postgres/data/    (lib)
src/presets/r2/data/    (lib)
src/presets/storage/data/    (lib)
src/presets/symfony/data/    (lib, config, controller, model, route, migration)
src/presets/symfony/tests/acceptance/    (test)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (lib, controller, model, route, migration)
src/presets/webapp/tests/acceptance/    (test)
src/presets/workers/data/    (model)
src/presets/workers/tests/unit/    (test)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/presets | 122 | model, test, lib, other, config, controller, view, cli, middleware, route, migration |
| src/docs | 39 | cli, model, lib |
| src/flow | 32 | cli, config, lib |
| src/lib | 20 | lib |
| src | 7 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

The shared libraries are spread across three directories. `src/lib/` provides universal utilities consumed by all subsystems, `src/docs/lib/` contains the documentation generation engine, and `src/presets/lib/` holds preset-specific helpers.

| Class / Function | File | Responsibility |
| --- | --- | --- |
| `ProjectSource` | `src/docs/data/project.js` | DataSource exposing project metadata (name, description, version, npm scripts) from `package.json` |
| `DataSource` | `src/docs/lib/data-source.js` | Base class for all `{{data}}` directive resolvers; defines the standard method contract |
| `AnalysisEntry` | `src/docs/lib/analysis-entry.js` | Base class for `analysis.json` entries with aggregation rules |
| `loadDataSources()` | `src/docs/lib/data-source-loader.js` | Loads and instantiates DataSource classes discovered from preset directories |
| `parseDirectives()` | `src/docs/lib/directive-parser.js` | Parses `{{data}}` and `{{text}}` template directives from document files |
| `resolveForPresets()` | `src/docs/lib/resolver-factory.js` | Creates DataSource resolvers by walking the preset inheritance chain |
| `mergeChapters()` | `src/docs/lib/chapter-resolver.js` | Merges chapter definitions and maps `{{data}}` category assignments |
| `templateMerger` | `src/docs/lib/template-merger.js` | Bottom-up template resolution with block-based inheritance for preset templates |
| `mapWithConcurrency()` | `src/docs/lib/concurrency.js` | Concurrent task queue with configurable parallelism for build pipelines |
| `loadConfig()` | `src/lib/config.js` | Loads JSON configuration and resolves SDD project directory paths |
| `parseArgs()` / `repoRoot()` | `src/lib/cli.js` | Argument parsing and repo/source root resolution for all CLI commands |
| `callAgent()` | `src/lib/agent.js` | Spawns AI agent processes with stdio management and configurable timeout |
| `createI18n()` | `src/lib/i18n.js` | Three-layer i18n with domain-based namespacing across ui, messages, and prompts |
| `flow-state.js` | `src/lib/flow-state.js` | Persists and restores SDD workflow state across plan, impl, finalize, and sync phases |
| `discoverPresets()` | `src/lib/presets.js` | Auto-discovers preset directories and resolves single-inheritance preset chains |
| `createLogger()` | `src/lib/progress.js` | Progress bar and spinner utilities with ANSI formatting for build pipeline output |
| `isDirectRun()` | `src/lib/entrypoint.js` | Detects whether a module is being run directly, enabling conditional top-level execution |
| `getWorktreeStatus()` | `src/lib/git-state.js` | Read-only Git and GitHub CLI state access for worktree and branch inspection |
| `parseComposer()` | `src/presets/lib/composer-utils.js` | Parses `composer.json` and extracts environment variables for PHP preset DataSources |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
