<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the physical layout of the `sdd-forge` source tree, covering four major directories: `src/` (CLI entry points and controllers), `src/docs/` (documentation pipeline commands, data sources, and libraries), `src/flow/` (SDD workflow controllers and CLI handlers), and `src/lib/` (shared utility libraries used across all subsystems).
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

| Module | File Path | Responsibility |
| --- | --- | --- |
| cli | `src/lib/cli.js` | Provides `repoRoot`, `sourceRoot`, `parseArgs`, worktree detection helpers, `PKG_DIR` constant, and timestamp formatting used across CLI commands. |
| entrypoint | `src/lib/entrypoint.js` | Exports `isDirectRun` and `runIfDirect` to distinguish direct script execution from module imports, enabling files to serve as both standalone commands and importable modules. |
| exit-codes | `src/lib/exit-codes.js` | Defines the `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) numeric constants, centralizing exit code values to avoid magic numbers throughout CLI commands and flow handlers. |
| presets | `src/lib/presets.js` | Discovers all preset manifests under `src/presets/`, resolves linear inheritance chains via `parent` references, detects circular dependencies, and exports the `PRESETS` registry for O(1) access. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
