<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project is organized under the `src/` directory with 6 major areas: `src/presets/` (122 files) housing DataSource definitions and tests for each supported framework, `src/flow/` (33 files) implementing the SDD workflow engine, `src/docs/` (32 files) providing documentation generation commands and libraries, `src/lib/` (17 files) containing shared utility modules, `src/` root (8 files) serving as the CLI entry point and dispatcher, and `src/spec/` (4 files) handling spec-related commands.
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
src/flow/get/    (lib)
src/flow/run/    (lib)
src/flow/set/    (cli)
src/lib/    (lib)
src/presets/base/data/    (lib)
src/presets/base/tests/acceptance/    (test)
src/presets/base/tests/acceptance/fixtures/src/    (test)
src/presets/cakephp2/data/    (lib, model, view)
src/presets/cakephp2/tests/acceptance/    (test)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/cli/data/    (lib)
src/presets/cli/tests/acceptance/    (test)
src/presets/cli/tests/acceptance/fixtures/src/    (test)
src/presets/cli/tests/acceptance/fixtures/src/commands/    (test)
src/presets/cli/tests/acceptance/fixtures/src/lib/    (test)
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    (test)
src/presets/database/data/    (lib)
src/presets/drizzle/data/    (lib)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (lib)
src/presets/graphql/data/    (lib)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (lib)
src/presets/hono/tests/unit/    (test)
src/presets/js-webapp/tests/acceptance/    (test)
src/presets/js-webapp/tests/acceptance/fixtures/src/    (config, lib, other)
src/presets/laravel/data/    (lib)
src/presets/laravel/tests/acceptance/    (test)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/library/tests/acceptance/    (test)
src/presets/library/tests/acceptance/fixtures/src/    (test)
src/presets/library/tests/acceptance/fixtures/src/rules/    (test)
src/presets/library/tests/acceptance/fixtures/src/utils/    (test)
src/presets/monorepo/data/    (lib)
src/presets/nextjs/data/    (lib)
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
src/presets/symfony/data/    (lib)
src/presets/symfony/tests/acceptance/    (test)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (lib)
src/presets/webapp/tests/acceptance/    (test)
src/presets/workers/data/    (lib)
src/presets/workers/tests/unit/    (test)
src/spec/commands/    (cli)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/presets | 122 | lib, test, model, view, config, other, cli |
| src/flow | 33 | cli, config, lib |
| src/docs | 32 | cli, lib |
| src/lib | 17 | lib |
| src | 8 | cli |
| src/spec | 4 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Class | File | Responsibility |
| --- | --- | --- |
| PackageSource / PackageEntry | `src/presets/base/data/package.js` | Extracts dependency and script information from `package.json` and `composer.json`. Parses dependencies, devDependencies, scripts (npm) and require, require-dev (Composer) into PackageEntry records. Available to all presets through base inheritance. |
| StructureSource | `src/presets/base/data/structure.js` | Generates a directory tree and role-based summary table from the enriched analysis. Collects all category entries, builds a directory map with file counts and role sets, and produces markdown output via `tree()` and `directories()` methods. Auto-expands depth when only one top-level directory exists. |
| CakephpControllersSource | `src/presets/cakephp2/data/controllers.js` | Analyzes CakePHP 2.x controllers by extending the webapp ControllersSource. Parses class names, parent classes, `$components`, `$uses`, and public actions. Provides CSV import/export tables, action-to-logic mappings, permission component analysis, and ACL rule extraction. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
