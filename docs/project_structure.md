<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers the physical layout of the sdd-forge source tree, which is organized into five major top-level directories: `src/presets` (preset definitions, data sources, and tests across all supported project types), `src/docs` (documentation generation commands, data sources, and engine utilities), `src/flow` (SDD workflow management commands and state handling), `src/lib` (shared core utilities), and `src/` (CLI entry points).
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

| Class / Module | File | Responsibility |
|---|---|---|
| `DataSource` | `src/docs/lib/data-source.js` | Base class for all `{{data}}` directive resolvers; provides override support and the common `(analysis, labels)` method signature |
| `ProjectSource` | `src/docs/data/project.js` | Reads `package.json` lazily with caching and exposes project metadata (name, description, version, scripts) as `{{data}}` directives across all preset types |
| `AnalysisEntry` | `src/docs/lib/analysis-entry.js` | Base class for `analysis.json` entries with summary aggregation support and shared metadata key definitions |
| `FlowState` | `src/lib/flow-state.js` | Manages SDD workflow state persistence using an `.active-flow` pointer and per-spec `flow.json` files; exposes load, save, mutate, and step-status helpers |
| `loadConfig` | `src/lib/config.js` | Loads `.sdd-forge/config.json`, resolves the SDD working directory path, and provides shared helpers for language and concurrency settings |
| `cli` helpers | `src/lib/cli.js` | Resolves repository and source roots, parses CLI arguments, detects worktree context, and exports `PKG_DIR` for internal path resolution |
| `callAgent` | `src/lib/agent.js` | Invokes AI agents synchronously or asynchronously with prompt assembly, system prompt support, and context file management |
| `createI18n` | `src/lib/i18n.js` | Three-layer internationalization with domain namespacing and config-aware language resolution for CLI output and skill text |
| `resolveChain` | `src/lib/presets.js` | Auto-discovers preset definitions from `src/presets/` and resolves parent chains with safe fallback handling |
| `loadDataSources` | `src/docs/lib/data-source-loader.js` | Loads and instantiates DataSource subclasses from preset directories, respecting the full preset inheritance chain |
| `createResolver` | `src/docs/lib/resolver-factory.js` | Factory that constructs a DataSource resolver with the resolved preset chain and project-level overrides applied |
| `buildLayers` | `src/docs/lib/template-merger.js` | Resolves template inheritance chains and merges block-based overrides for chapter template composition |
| `mergeChapters` | `src/docs/lib/chapter-resolver.js` | Merges preset-defined and project config chapter lists, applying exclusions and project-specific ordering |
| `mapWithConcurrency` | `src/docs/lib/concurrency.js` | Parallel execution queue that enforces a maximum concurrency limit while collecting all results |
| `deploySkills` | `src/lib/skills.js` | Copies skill files from package templates into `.agents/skills` and `.claude/skills` with locale and option support |
| `parseComposer` | `src/presets/lib/composer-utils.js` | Parses `composer.json` and `.env` files for PHP preset data sources |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
