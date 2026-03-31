<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the layout and responsibilities of the four major directories that make up the project: `src/` (CLI entry points), `src/docs/` (documentation generation commands, data sources, and libraries), `src/flow/` (SDD workflow controllers and commands), and `src/lib/` (shared libraries and models).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/docs/lib/lang/    (lib)
src/flow/    (controller, config)
src/flow/commands/    (cli)
src/flow/get/    (lib)
src/flow/run/    (cli, controller)
src/flow/set/    (controller)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, model, lib |
| src/flow | 32 | cli, controller, config, lib |
| src/lib | 20 | lib, model |
| src | 7 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| File | Path | Responsibility |
| --- | --- | --- |
| presets.js | `src/lib/presets.js` | Auto-discovers all presets from `src/presets/{key}/preset.json` and provides parent chain resolution. Exports `PRESETS_DIR`, the `PRESETS` array, and functions including `resolveChain()`, `resolveMultiChains()`, `resolveChainSafe()`, `presetByLeaf()`, and `presetsForArch()` for walking and deduplicating preset inheritance chains. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
