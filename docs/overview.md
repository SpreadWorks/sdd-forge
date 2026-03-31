<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

sdd-forge is a Node.js CLI for Spec-Driven Development and automated documentation generation from source code. It helps teams turn existing code and feature requests into structured specs, synchronized docs, and repeatable development workflows for setup, documentation, and flow-based implementation.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

sdd-forge addresses two related problems: understanding a codebase without manually reading every file, and running a spec-first development process with consistent checkpoints. It targets developers and teams who want to analyze source code, generate structured project documentation and README files, and manage feature work through an SDD flow with spec preparation, gate checks, review, and finalization.

The tool combines deterministic CLI steps with AI-assisted text generation. Source analysis, directive resolution, setup, and flow state handling are implemented as commands, while AI is used for enriched summaries, prose generation, and review-oriented tasks within that command structure.
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
  A[CLI input: sdd-forge <command> [options]] --> B[src/sdd-forge.js]

  B -->|help or no args| H[src/help.js]
  B -->|setup| S[src/setup.js]
  B -->|upgrade| U[src/upgrade.js]
  B -->|presets| P[src/presets-cmd.js]
  B -->|docs| D[src/docs.js]
  B -->|flow| F[src/flow.js]

  D --> DB[docs build]
  D --> DS[docs scan]
  D --> DE[docs enrich]
  D --> DI[docs init]
  D --> DD[docs data]
  D --> DT[docs text]
  D --> DR[docs readme]
  D --> DG[docs agents]
  D --> DX[docs translate]
  D --> DV[docs review]
  D --> DC[docs changelog]
  D --> DF[docs forge]

  DB --> I1[Project source + config + templates]
  I1 --> P1[scan -> enrich -> init -> data -> text -> readme -> agents -> translate]
  P1 --> O1[docs/, README.md, AGENTS.md, translated docs]

  F --> FG[flow get]
  F --> FS[flow set]
  F --> FR[flow run]

  FG --> G1[Read flow state, checks, prompts, guardrails, context]
  FS --> G2[Update step, request, requirements, notes, metrics]
  FR --> G3[Run actions: prepare-spec, gate, review, impl-confirm, sync, finalize, lint, retro]

  S --> O2[.sdd-forge/config.json and agent files]
  U --> O3[Updated template-derived files]
  P --> O4[Preset inheritance tree]
  H --> O5[Command help output]
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Concept | Meaning |
| --- | --- |
| Preset | A project-type definition discovered from `src/presets/*/preset.json`. Presets define inheritance, scan behavior, and chapter structure. |
| Multi-preset chain | A resolved root-to-leaf preset chain, with support for combining multiple preset types in configuration. |
| Setup | The interactive command that registers project settings and writes `.sdd-forge/config.json`, output language settings, and agent-related files. |
| Docs pipeline | The documentation generation flow executed by `docs build`: `scan -> enrich -> init -> data -> text -> readme -> agents -> translate`. |
| Scan | Static source analysis that produces `analysis.json` from the target codebase. |
| Enrich | An AI-assisted step that adds summary, detail, chapter, and role information to analysis entries. |
| `{{data}}` directive | A template directive resolved from analysis and configuration data during the `docs data` step. |
| `{{text}}` directive | A template directive resolved into prose by an AI agent during the `docs text` step. |
| Flow state | Persisted SDD progress and metadata read with `flow get` and updated with `flow set`. |
| Flow action | An executable SDD operation under `flow run`, such as `prepare-spec`, `gate`, `review`, `sync`, or `finalize`. |
| Guardrail | Project-specific principles or rules that can be checked during the SDD flow. |
| Command dispatcher | The top-level routing structure that sends `docs`, `flow`, `setup`, `upgrade`, `presets`, and `help` commands to dedicated scripts. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

1. Install the CLI globally with `npm install -g sdd-forge`.
2. Run `sdd-forge setup` to start the interactive setup wizard.
3. Choose the UI language, project name, source path, output language, default output language, preset, document purpose, writing tone, and default AI agent.
4. Save the configuration so the tool writes `.sdd-forge/config.json` and, when selected, agent-related files and skills.
5. Run `sdd-forge docs build` to start the full documentation pipeline.
6. The tool analyzes source code, enriches analysis data, initializes chapter files from templates, resolves `{{data}}` and `{{text}}` directives, generates `README.md`, updates `AGENTS.md`, and translates docs when multilingual output is configured.
7. Review the generated output in `docs/` and `README.md`; for command details, use `sdd-forge help` or `sdd-forge <command> --help`. 
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
