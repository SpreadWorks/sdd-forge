<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project consists of 1 top-level source directory (`src/`) containing 157 files across 5 major areas: CLI entry points and commands (`src/`, `src/docs/commands/`, `src/flow/commands/`, `src/spec/commands/`), shared libraries (`src/lib/`, `src/docs/lib/`, `src/presets/lib/`), data models (`src/docs/data/`, `src/presets/*/data/`), preset-specific scanners (`src/presets/*/scan/`), and tests (`src/presets/*/tests/`). The `src/presets/` subtree accounts for the majority of directories, providing framework-specific data sources, scanners, and tests for over 15 preset types including base, laravel, symfony, hono, nextjs, and workers.
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
| src | 157 | cli, model, lib, config, test |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Class | File Path | Responsibility |
| --- | --- | --- |
| `StructureSource` | `src/presets/base/data/structure.js` | Collects entries from all enriched analysis categories via `allItems()`, builds a directory map with file counts and role sets, and exposes `tree()` (code-block directory listing) and `directories()` (top-level directory table sorted by file count). Returns `null` when `analysis.enrichedAt` is absent. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
