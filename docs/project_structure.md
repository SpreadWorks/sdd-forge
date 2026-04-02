<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project source is organized into three major directories — `src/docs`, `src/flow`, and `src/lib` — alongside the `src/` root, covering documentation generation pipelines, spec-driven flow management, and shared utility libraries respectively.
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli, controller)
src/docs/commands/    (cli, controller)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (cli)
src/flow/get/    (lib, controller, cli)
src/flow/run/    (cli, lib, controller)
src/flow/set/    (cli, lib)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, controller, model, lib |
| src/flow | 29 | cli, lib, controller, config |
| src/lib | 20 | lib, model |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| cli | `src/lib/cli.js` | Provides repo and source root resolution, argument parsing, worktree detection, and timestamp formatting used across CLI commands. |
| entrypoint | `src/lib/entrypoint.js` | Guards script entry points to distinguish direct execution from module imports, enabling files to function both as CLI scripts and importable modules. |
| exit-codes | `src/lib/exit-codes.js` | Defines `EXIT_SUCCESS` and `EXIT_ERROR` constants, centralizing exit code values to avoid magic numbers throughout the codebase. |
| presets | `src/lib/presets.js` | Discovers available presets from the filesystem, resolves inheritance chains via `parent` references, and provides lookup utilities for preset configuration. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
