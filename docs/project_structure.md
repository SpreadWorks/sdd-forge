<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

The project is organized into three major directories: `src/docs/` (documentation generation commands, data sources, and libraries), `src/flow/` (Spec-Driven Development workflow commands and handlers), and `src/lib/` (shared utility libraries used across the entire tool).
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
| cli | src/lib/cli.js | Provides core CLI utilities including repository root resolution, argument parsing, worktree detection, and timestamp formatting |
| entrypoint | src/lib/entrypoint.js | Guards direct script execution versus module imports; wraps main functions so they only run when invoked directly |
| exit-codes | src/lib/exit-codes.js | Defines `EXIT_SUCCESS` (0) and `EXIT_ERROR` (1) constants to eliminate magic numbers across CLI commands and flow handlers |
| presets | src/lib/presets.js | Discovers available presets from the filesystem, resolves `parent`-based inheritance chains, and exposes a module-level `PRESETS` registry for O(1) lookup |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
