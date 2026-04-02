<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the directory layout of the `sdd-forge` source tree, which is organized into four major directories: `src/` for top-level CLI entrypoints and controllers, `src/docs/` for documentation generation commands and data sources, `src/flow/` for the Spec-Driven Development workflow engine, and `src/lib/` for shared utility libraries.
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
src/flow/commands/    (controller, lib, cli)
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
| src/flow | 31 | controller, lib, cli |
| src/lib | 20 | lib |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| File | Path | Responsibility |
| --- | --- | --- |
| cli.js | src/lib/cli.js | Provides `repoRoot`, `sourceRoot`, `parseArgs`, `isInsideWorktree`, `getMainRepoPath`, `PKG_DIR`, and timestamp formatting utilities used across CLI commands. |
| entrypoint.js | src/lib/entrypoint.js | Exposes `isDirectRun` and `runIfDirect` guards that distinguish direct script execution from module imports, enabling scripts to support both invocation styles. |
| exit-codes.js | src/lib/exit-codes.js | Defines `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) constants, centralizing exit code values to avoid magic numbers throughout the codebase. |
| presets.js | src/lib/presets.js | Discovers preset manifests from `src/presets/`, resolves linear inheritance chains via `parent` references, detects circular dependencies, and exports the `PRESETS` registry for O(1) lookup. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
