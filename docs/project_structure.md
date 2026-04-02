<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the directory layout of the `sdd-forge` source tree, which is organized into three major areas: `src/docs/` for documentation generation (commands, data sources, and libraries), `src/flow/` for the Spec-Driven Development workflow engine, and `src/lib/` for shared utilities used across the entire codebase.
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
src/flow/commands/    (cli, lib)
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
| src/flow | 31 | cli, lib, controller |
| src/lib | 20 | lib |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

The `src/lib/` directory contains four shared library modules used throughout the tool.

| Module | File Path | Responsibility |
| --- | --- | --- |
| cli | `src/lib/cli.js` | Provides `repoRoot`, `sourceRoot`, `parseArgs`, worktree detection helpers, `PKG_DIR`, and timestamp formatting for CLI commands |
| entrypoint | `src/lib/entrypoint.js` | Supplies `isDirectRun` and `runIfDirect` guards so scripts can be both executed directly and imported as modules |
| exit-codes | `src/lib/exit-codes.js` | Exports `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) constants to eliminate magic numbers across CLI commands and flow handlers |
| presets | `src/lib/presets.js` | Discovers available presets from the filesystem, resolves `parent`-based inheritance chains, and exposes lookup utilities including `resolveChainSafe` for graceful fallback on unknown preset keys |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
