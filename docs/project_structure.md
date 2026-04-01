<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the top-level layout of the sdd-forge source tree, which is organized into four major directories: `src/docs` for documentation generation commands, data models, and libraries; `src/flow` for the Spec-Driven Development workflow engine and its controllers; `src/lib` for shared utility libraries and models; and `src` for the root CLI entry points.
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

| Module | File | Responsibility |
| --- | --- | --- |
| Presets | `src/lib/presets.js` | Auto-discovers all presets from `src/presets/{key}/preset.json` and exposes the full preset registry (`PRESETS`) along with parent-chain resolution utilities: `resolveChain()` (leaf → root order), `resolveMultiChains()` (deduplicating multi-type chains), `resolveChainSafe()` (fallback-safe variant), `presetByLeaf()` (single preset lookup), and `presetsForArch()` (presets filtered by parent key). |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
