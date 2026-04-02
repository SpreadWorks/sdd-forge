<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers the source code layout of the `sdd-forge` package, organized across three major directories: `src/` for top-level CLI entry points and controllers, `src/docs/` for documentation generation commands and data sources, `src/flow/` for Spec-Driven Development workflow handlers, and `src/lib/` for shared utility libraries used throughout the tool.
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
src/flow/    (lib)
src/flow/commands/    (cli)
src/flow/get/    (lib, cli)
src/flow/run/    (controller, lib, cli)
src/flow/set/    (cli, lib)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, controller, model, lib |
| src/flow | 29 | cli, lib, controller |
| src/lib | 20 | lib, model |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| `cli.js` | `src/lib/cli.js` | Provides core CLI utilities including repository root resolution, argument parsing, worktree detection, and the `PKG_DIR` constant used for script path resolution across the codebase. |
| `entrypoint.js` | `src/lib/entrypoint.js` | Supplies `isDirectRun` and `runIfDirect` guards that distinguish direct script execution from module imports, enabling commands to function both as standalone executables and as importable modules. |
| `exit-codes.js` | `src/lib/exit-codes.js` | Exports `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) constants to centralize exit code definitions and eliminate magic numbers across CLI commands and flow handlers. |
| `presets.js` | `src/lib/presets.js` | Implements the preset registry and inheritance chain resolver, discovering all available presets from `src/presets/` at startup and resolving linear ancestor chains with circular reference detection. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
