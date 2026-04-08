<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the source layout of the project, which is organized into 6 major directories: `src/presets` (preset definitions and tests), `src/docs` (documentation generation CLI, controllers, and models), `src/flow` (Spec-Driven Development flow control), `src/lib` (shared utilities and models), `src` (top-level CLI entry points), and `src/check` (validation commands).
## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/check/commands/    (cli)
src/docs/commands/    (cli, lib, controller)
src/docs/data/    (model)
src/docs/lib/    (lib, model)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (controller)
src/flow/lib/    (lib, config, controller, model)
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
| src/docs | 40 | cli, lib, controller, model |
| src/flow | 34 | controller, lib, config, model |
| src/lib | 22 | lib, model |
| src | 8 | cli |
| src/check | 3 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->
<!-- {{/text}} -->
<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File | Responsibility |
| --- | --- | --- |
| presets | `src/lib/presets.js` | Discovers preset definitions from the presets directory, resolves parent-chain inheritance to build ordered composition chains, detects circular references, and provides lookup utilities (`presetByLeaf`, `presetsForArch`) as well as a safe resolver (`resolveChainSafe`) that returns an empty array instead of throwing on missing presets. |
