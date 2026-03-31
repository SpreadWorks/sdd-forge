<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers 5 major directory groups: `src` for top-level CLI entry points, `src/docs` for documentation-related CLI and library code, `src/flow` for workflow commands and configuration, `src/lib` for shared library, configuration, and model utilities, and `src/presets` for preset-specific data, models, framework support, and test fixtures. The directory layout and responsibility table show that `src/presets` is the largest area, while the other directories provide the core CLI, flow, and shared-library foundation.
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (lib)
src/docs/lib/    (lib)
src/flow/    (cli, config)
src/flow/commands/    (cli)
src/flow/get/    (cli)
src/flow/run/    (cli)
src/flow/set/    (cli)
src/lib/    (lib, config, model)
src/presets/base/data/    (lib)
src/presets/base/tests/acceptance/    (test)
src/presets/base/tests/acceptance/fixtures/src/    (config, lib, other)
src/presets/cakephp2/data/    (lib)
src/presets/cakephp2/tests/acceptance/    (test)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/cli/data/    (lib)
src/presets/cli/tests/acceptance/    (test)
src/presets/cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/database/data/    (lib)
src/presets/drizzle/data/    (lib)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (lib)
src/presets/graphql/data/    (lib)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (middleware)
src/presets/hono/tests/unit/    (test)
src/presets/js-webapp/tests/acceptance/    (test)
src/presets/js-webapp/tests/acceptance/fixtures/src/    (config, lib, other)
src/presets/laravel/data/    (cli, config, controller, model, route, migration)
src/presets/laravel/tests/acceptance/    (test)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/library/tests/acceptance/    (test)
src/presets/library/tests/acceptance/fixtures/src/    (other)
src/presets/library/tests/acceptance/fixtures/src/rules/    (other)
src/presets/library/tests/acceptance/fixtures/src/utils/    (lib)
src/presets/monorepo/data/    (model)
src/presets/nextjs/data/    (model)
src/presets/nextjs/tests/unit/    (test)
src/presets/node-cli/tests/acceptance/    (test)
src/presets/node-cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    (controller)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/php-webapp/tests/acceptance/    (test)
src/presets/postgres/data/    (model)
src/presets/r2/data/    (model)
src/presets/storage/data/    (model)
src/presets/symfony/data/    (model, controller, route)
src/presets/symfony/tests/acceptance/    (test)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (cli, controller, model, route, lib)
src/presets/webapp/tests/acceptance/    (test)
src/presets/workers/data/    (config)
src/presets/workers/tests/unit/    (test)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/presets | 122 | lib, config, other, test, cli, middleware, controller, model, route, migration |
| src/docs | 34 | cli, lib |
| src/flow | 31 | cli, config |
| src/lib | 19 | lib, config, model |
| src | 7 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Class Name | File Path | Responsibility |
| --- | --- | --- |
| N/A | `src/lib/agents-md.js` | Loads the SDD section template for `AGENTS.md`, resolving a localized preset file and falling back to English when needed. |
| `StructureSource` | `src/presets/base/data/structure.js` | Builds derived project-structure views from enriched analysis output, including a directory tree block and an aggregated directory responsibility table. |
| N/A | `src/presets/library/tests/acceptance/fixtures/src/index.js` | Re-exports the fixture library surface and provides convenience `parse` and `render` helpers for working with Markdown input. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
