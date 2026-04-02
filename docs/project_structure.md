<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project source is organized into four major directories: `src/` holds the top-level entry points and controllers, `src/docs/` contains the documentation generation pipeline (commands, data sources, and libraries), `src/flow/` implements the Spec-Driven Development workflow engine, and `src/lib/` provides shared utility modules used across the entire codebase.
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
src/flow/    (controller)
src/flow/commands/    (cli)
src/flow/get/    (lib, controller, cli)
src/flow/run/    (controller, lib, cli)
src/flow/set/    (cli, lib)
src/lib/    (lib)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, controller, model, lib |
| src/flow | 30 | cli, lib, controller |
| src/lib | 20 | lib |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | Path | Responsibility |
| --- | --- | --- |
| cli.js | src/lib/cli.js | Provides core CLI utilities including repository root resolution, source root detection, argument parsing, worktree detection, and the `PKG_DIR` constant used for script path resolution throughout the tool. |
| entrypoint.js | src/lib/entrypoint.js | Exports `isDirectRun` and `runIfDirect` helpers that distinguish direct script execution from module imports, enabling commands to support both invocation modes without duplicating guard logic. |
| exit-codes.js | src/lib/exit-codes.js | Defines the `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) numeric constants, centralizing exit code values to eliminate magic numbers across CLI commands and flow handlers. |
| presets.js | src/lib/presets.js | Discovers all available presets from `src/presets/` at startup, resolves linear inheritance chains via `parent` references, detects circular or missing parents, and exports the `PRESETS` registry for O(1) repeated access throughout the tool. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
