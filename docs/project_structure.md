<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter covers the layout and responsibilities of the four major directories that make up the project — `src/docs`, `src/flow`, `src/lib`, and the root `src/` — spanning documentation generation pipelines, flow orchestration, shared utility libraries, and top-level CLI entry points.
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

| Module | File Path | Responsibility |
| --- | --- | --- |
| presets | `src/lib/presets.js` | Auto-discovers all presets from `src/presets/{key}/preset.json` and exposes preset inheritance utilities: `resolveChain` (walks parent chain root→leaf), `resolveMultiChains` (resolves multiple type strings with deduplication), `resolveChainSafe` (fallback-safe wrapper), `presetByLeaf` (lookup by leaf key), and `presetsForArch` (filters presets by parent key). |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
