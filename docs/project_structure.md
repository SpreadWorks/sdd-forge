<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the physical layout of the sdd-forge source tree, organized into four major directories: `src/` (entry points and top-level controllers), `src/docs/` (documentation generation pipeline), `src/flow/` (Spec-Driven Development workflow engine), and `src/lib/` (shared utility libraries).
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
src/flow/get/    (lib, cli)
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
| src/flow | 29 | cli, lib, config, controller |
| src/lib | 20 | lib, model |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File | Responsibility |
| --- | --- | --- |
| cli | `src/lib/cli.js` | Provides `repoRoot`, `sourceRoot`, `parseArgs`, worktree detection helpers, `PKG_DIR` constant, and timestamp formatting used across commands. |
| entrypoint | `src/lib/entrypoint.js` | Exports `isDirectRun` and `runIfDirect` to distinguish direct script execution from module imports, enabling files to serve as both CLI entry points and importable modules. |
| exit-codes | `src/lib/exit-codes.js` | Defines `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) constants, centralizing exit code values to eliminate magic numbers throughout the codebase. |
| presets | `src/lib/presets.js` | Discovers and registers all available presets from `src/presets/`, resolves linear inheritance chains via `parent` references, detects circular dependencies, and exports the `PRESETS` map for O(1) access. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
