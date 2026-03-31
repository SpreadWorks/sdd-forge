<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The source tree is organized into five major directories: `src/presets` (preset definitions and tests), `src/docs` (documentation generation commands, data sources, and utilities), `src/flow` (SDD workflow orchestration), `src/lib` (shared libraries and models), and the top-level `src` directory containing the CLI entry points.
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
src/flow/    (controller, config)
src/flow/commands/    (cli)
src/flow/get/    (lib)
src/flow/run/    (cli, controller)
src/flow/set/    (controller)
src/lib/    (lib, model)
src/presets/base/data/    
src/presets/base/tests/acceptance/    
src/presets/base/tests/acceptance/fixtures/src/    
src/presets/cakephp2/data/    
src/presets/cakephp2/tests/acceptance/    
src/presets/cakephp2/tests/unit/    
src/presets/ci/data/    
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
| src/docs | 39 | cli, model, lib |
| src/flow | 32 | cli, controller, config, lib |
| src/lib | 20 | lib, model |
| src | 7 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File | Responsibility |
| --- | --- | --- |
| presets | `src/lib/presets.js` | Auto-discovers all presets from `src/presets/{key}/preset.json` and exposes functions for resolving parent-chain inheritance: `resolveChain()` (root→leaf order), `resolveMultiChains()` (deduplicates overlapping chains), `resolveChainSafe()` (fallback-safe wrapper), `presetByLeaf()` (direct lookup), and `presetsForArch()` (filter by parent key). |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
