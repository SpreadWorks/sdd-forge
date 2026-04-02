<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/project_structure.md)
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the physical layout of the sdd-forge source tree, covering three major directories: `src/docs` (documentation generation pipeline with CLI, controller, model, and library components), `src/flow` (Spec-Driven Development workflow controllers), and `src/lib` (shared utilities spanning configuration, model, and view responsibilities).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli, controller)
src/docs/commands/    (cli, lib, controller)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/docs/lib/lang/    (lib)
src/flow/    (controller)
src/flow/commands/    (controller)
src/flow/get/    (controller)
src/flow/run/    (controller)
src/flow/set/    (controller)
src/lib/    (lib, config, model, view)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | cli, lib, controller, model |
| src/flow | 31 | controller |
| src/lib | 20 | lib, config, model, view |
| src | 7 | cli, controller |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| cli | `src/lib/cli.js` | Provides the `PKG_DIR` constant, repository and source root resolution (with `SDD_WORK_ROOT` / `SDD_SOURCE_ROOT` env var support), a spec-driven `parseArgs` option parser, worktree detection, and package version retrieval. |
| presets | `src/lib/presets.js` | Discovers all available presets under `src/presets/`, resolves parent-chain inheritance from `preset.json` manifests, and exposes lookup helpers (`presetByLeaf`, `presetsForArch`) for the rest of the toolchain. |
| skills | `src/lib/skills.js` | Reads skill templates from `src/templates/skills/`, resolves `include` directives, and deploys the resulting `SKILL.md` files into both `.agents/skills/` and `.claude/skills/` in the target project, skipping unchanged files to avoid unnecessary disk writes. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
