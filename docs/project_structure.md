<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/project_structure.md) | **English**
<!-- {{/data}} -->

# Project Structure

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the number of major directories and their roles."})}} -->

This chapter describes the source layout of sdd-forge across three major directory groups: `src/docs` (documentation generation commands, data sources, and libraries), `src/flow` (spec-driven development workflow commands and registry), and `src/lib` (shared configuration and preset utilities).
<!-- {{/text}} -->

## Content

### Directory Layout

<!-- {{data("base.structure.tree")}} -->
```
src/    (controller, cli)
src/check/commands/    (cli)
src/docs/commands/    (controller, cli)
src/docs/data/    (model)
src/docs/lib/    (model, lib)
src/docs/lib/lang/    (lib)
src/flow/    (config)
src/flow/commands/    (controller, lib)
src/flow/lib/    (lib, controller)
src/lib/    (lib, model)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### Directory Responsibilities\n", labels: "Directory|Files|Role", ignoreError: true})}} -->
### Directory Responsibilities

| Directory | Files | Role |
| --- | --- | --- |
| src/docs | 40 | controller, cli, model, lib |
| src/flow | 34 | controller, lib, config |
| src/lib | 22 | lib, model |
| src | 8 | controller, cli |
| src/check | 2 | cli |
<!-- {{/data}} -->

### Shared Libraries

<!-- {{text({prompt: "List the shared libraries with class name, file path, and responsibility in table format."})}} -->

| Module | File Path | Responsibility |
| --- | --- | --- |
| flow/registry | `src/flow/registry.js` | Maps all flow command strings to their handler modules; provides step-tracking middleware (`stepPre`, `stepPost`) and `deriveActivePhase` for reading persisted flow state. |
| presets | `src/lib/presets.js` | Discovers available presets from `src/presets/`, resolves single and merged parent-chain inheritance, and exposes safe fallback variants for contexts where missing presets must not abort execution. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Technology Stack and Operations](stack_and_ops.md) | [CLI Command Reference →](cli_commands.md)
<!-- {{/data}} -->
