<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers 6 major directories: `src/` and `src/spec/` for CLI entry points and command handling, `src/docs/` for documentation generation support, `src/flow/` for workflow commands and supporting logic, `src/lib/` for shared library code, and `src/presets/` for preset-specific libraries, configuration, models, views, and tests. Together, they show a CLI-centered codebase with shared infrastructure in common libraries and most framework-specific logic grouped under presets.
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
src/presets/monorepo/data/    (config)
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
| src/docs | 32 | cli, lib |
| src/flow | 30 | cli, config, lib |
| src/lib | 17 | lib |
| src | 8 | cli |
| src/spec | 4 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Class | File Path | Responsibility |
| --- | --- | --- |
| `PackageSource` | `src/presets/base/data/package.js` | Scans `package.json` and `composer.json` files and extracts dependency and script information into analysis entries shared through the base preset. |
| `StructureSource` | `src/presets/base/data/structure.js` | Builds directory-tree output and directory responsibility tables from enriched analysis data for structural documentation. |
| `CakephpControllersSource` | `src/presets/cakephp2/data/controllers.js` | Analyzes CakePHP 2.x controllers, including class metadata, components, models, actions, CSV mappings, permission methods, and ACL data. |
| `MonorepoSource` | `src/presets/monorepo/data/monorepo.js` | Supplies chapter-level target app information for monorepo documentation, using configured app definitions or enriched analysis results. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
