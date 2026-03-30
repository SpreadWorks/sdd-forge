<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers five major directory areas: `src` for top-level CLI entry points, `src/docs` for documentation commands and supporting data, `src/flow` for Spec-Driven Development workflow commands and state handling, `src/lib` for shared core libraries, and `src/presets` for preset-specific data sources and test fixtures. The largest area is `src/presets`, which groups built-in preset implementations and their tests, while the other directories provide the CLI, documentation, workflow, and reusable infrastructure those presets rely on.
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (other)
src/docs/lib/    (lib)
src/flow/    (cli, config)
src/flow/commands/    (cli)
src/flow/get/    (cli)
src/flow/run/    (cli)
src/flow/set/    (cli)
src/lib/    (lib, config, model)
src/presets/base/data/    (other)
src/presets/base/tests/acceptance/    (test)
src/presets/base/tests/acceptance/fixtures/src/    (config, lib, controller)
src/presets/cakephp2/data/    (other, controller, lib)
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
src/presets/edge/data/    (config)
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
src/presets/library/tests/acceptance/fixtures/src/    (lib)
src/presets/library/tests/acceptance/fixtures/src/rules/    (lib)
src/presets/library/tests/acceptance/fixtures/src/utils/    (lib)
src/presets/monorepo/data/    (lib)
src/presets/nextjs/data/    (lib)
src/presets/nextjs/tests/unit/    (test)
src/presets/node-cli/tests/acceptance/    (test)
src/presets/node-cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/php-webapp/tests/acceptance/    (test)
src/presets/postgres/data/    (config)
src/presets/r2/data/    (config)
src/presets/storage/data/    (config)
src/presets/symfony/data/    (config, lib, model, route)
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
| src/presets | 122 | other, config, lib, controller, test, cli, middleware, model, route, migration |
| src/docs | 33 | cli, other, lib |
| src/flow | 30 | cli, config |
| src/lib | 19 | lib, config, model |
| src | 7 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Class Name | File Path | Responsibility |
| --- | --- | --- |
| — | `src/lib/agents-md.js` | Loads the SDD section template for `AGENTS.md` generation and falls back from the requested locale to English when needed. |
| — | `src/lib/presets.js` | Discovers preset manifests, resolves parent inheritance chains, and provides shared preset lookup helpers. |
| `ModulesSource` | `src/presets/cli/data/modules.js` | Scans JavaScript-family source files, captures class and method metadata, and renders a module listing table for CLI presets. |
| `MonorepoSource` | `src/presets/monorepo/data/monorepo.js` | Generates target-app badge text for documentation chapters from monorepo configuration or enriched analysis data. |
| `NextjsComponentsSource` | `src/presets/nextjs/data/components.js` | Scans Next.js component files, classifies them as server, client, or shared, and renders component tables. |
| `RoutesSource` | `src/presets/nextjs/data/routes.js` | Scans Next.js App Router and Pages Router files, derives route metadata, and renders route-oriented documentation tables. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
