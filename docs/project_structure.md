<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project is organized into four major directories: `src/` (entry points and controllers), `src/docs/` (documentation generation commands, data sources, and libraries), `src/flow/` (Spec-Driven Development workflow commands and handlers), and `src/lib/` (shared utility libraries used across the entire codebase).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli, controller)
src/docs/commands/    (cli)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/docs/lib/lang/    (lib)
src/flow/    (controller)
src/flow/commands/    (cli)
src/flow/get/    (lib, cli)
src/flow/run/    (cli, lib)
src/flow/set/    (cli, lib)
src/lib/    (lib)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, model, lib |
| src/flow | 29 | cli, lib, controller |
| src/lib | 20 | lib |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| cli | src/lib/cli.js | Provides `repoRoot`, `sourceRoot`, `parseArgs`, worktree detection helpers, `PKG_DIR` constant, and timestamp formatting utilities used across CLI commands. |
| entrypoint | src/lib/entrypoint.js | Exports `isDirectRun` and `runIfDirect` to distinguish direct script execution from module imports, enabling files to serve as both standalone commands and importable modules. |
| exit-codes | src/lib/exit-codes.js | Defines `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) constants, centralizing exit code values to eliminate magic numbers throughout CLI commands and flow handlers. |
| presets | src/lib/presets.js | Discovers all available presets from the filesystem, resolves linear inheritance chains via `parent` references, detects circular dependencies, and exports the `PRESETS` registry for O(1) access. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
