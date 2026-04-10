<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers a `src/`-centered layout with 10 major directories that separate CLI entry points and commands, documentation generation components, flow control/configuration, and reusable library/model layers. The structure distinguishes execution surfaces (`check`, `docs`, `flow` commands) from shared logic and data-handling modules (`docs/lib`, `flow/lib`, `lib`, and `docs/data`).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (lib, cli, middleware)
src/check/commands/    (cli)
src/docs/commands/    (cli, lib)
src/docs/data/    (model)
src/docs/lib/    (lib, model)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (controller)
src/flow/lib/    (lib, controller, config, model)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, lib, model |
| src/flow | 34 | controller, lib, config, model |
| src/lib | 22 | lib, model |
| src | 10 | lib, cli, middleware |
| src/check | 3 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Class Name | File Path | Responsibility |
| --- | --- | --- |
| `FlowCommand` | `src/flow/lib/base-command.js` | Base class for flow commands, defining shared command behavior and execution structure. |
| `DataSource` | `src/docs/lib/data-source.js` | Base class for `{{data}}` directive resolvers used by documentation data sources. |
| `AnalysisEntry` | `src/docs/lib/analysis-entry.js` | Base class for `analysis.json` entries, including common metadata fields and restoration helpers. |
| N/A (module exports) | `src/flow/registry.js` | Central registry for flow subcommand metadata, command resolution, and hook wiring for the flow dispatcher. |
| N/A (module exports) | `src/lib/presets.js` | Preset discovery and inheritance-chain resolution utilities, including safe and multi-chain resolution helpers. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
