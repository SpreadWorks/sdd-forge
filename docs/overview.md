<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

sdd-forge is a Node.js CLI for Spec-Driven Development and automated documentation generation from source code. It helps teams and AI coding agents keep specifications, implementation flow, and generated project docs aligned through commands for setup, documentation pipelines, and persistent flow management.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

sdd-forge addresses two related problems: project knowledge is often buried in source code, and feature work can drift when specification, implementation, and documentation are handled separately. Its package metadata describes it as "Spec-Driven Development tooling for automated documentation generation," and the README shows that it combines static source analysis, template-based document generation, and a managed SDD flow.

The tool is aimed at developers working with AI coding agents, especially teams that want deterministic command-driven control over spec creation, gate checks, review, and documentation refresh. It is also intended for users onboarding to existing codebases, since `docs build` can analyze an existing project and generate structured `docs/` content and `README.md`.
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
    A[User runs `sdd-forge <command>`] --> B{Top-level dispatch in `src/sdd-forge.js`}
    B -->|no args / --help| H[`help.js`]
    B -->|--version| V[Print package version]
    B -->|setup| S[`setup.js`]
    B -->|upgrade| U[`upgrade.js`]
    B -->|presets| P[`presets-cmd.js`]
    B -->|docs| D[`docs.js`]
    B -->|flow| F[`flow.js`]

    S --> S1[Interactive wizard]
    S1 --> S2[Create `.sdd-forge/config.json`, `docs/`, `specs/`, agent files]

    U --> U1[Refresh template-derived skills and managed files]

    P --> P1[Read preset manifests]
    P1 --> P2[Print preset inheritance tree]

    D --> D0{Docs subcommand}
    D0 -->|build| DB[Build pipeline]
    D0 -->|scan| DS[Analyze source files]
    D0 -->|data| DD[Resolve `{{data}}` directives]
    D0 -->|text| DT[Resolve `{{text}}` directives with agent]
    D0 -->|readme| DR[Generate `README.md` from docs/templates]
    D0 -->|review / forge / translate / agents / changelog| DX[Supporting docs operations]

    DB --> DB1[scan]
    DB1 --> DB2[enrich]
    DB2 --> DB3[init]
    DB3 --> DB4[data]
    DB4 --> DB5[text]
    DB5 --> DB6[readme]
    DB6 --> DB7[agents]
    DB7 --> DB8[translate if multi-language]
    DS --> O1[`.sdd-forge/output/analysis.json`]
    DD --> O2[Filled chapter files in `docs/`]
    DT --> O2
    DR --> O3[`README.md`]
    DB8 --> O4[Updated docs set]

    F --> F0{Flow subcommand}
    F0 -->|get| FG[Read flow state or prompts]
    F0 -->|set| FS[Update flow state]
    F0 -->|run| FR[Execute flow actions]

    FR --> FR1[prepare-spec]
    FR --> FR2[gate]
    FR --> FR3[review]
    FR --> FR4[impl-confirm]
    FR --> FR5[finalize]
    FR --> FR6[sync]
    FR --> FR7[lint / retro]

    FG --> O5[Status, checks, prompts, context]
    FS --> O6[Updated `flow.json` state]
    FR1 --> O7[Spec directory, branch or worktree, persisted flow state]
    FR5 --> O8[Commit, merge or PR route, docs sync, cleanup]
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Term | Meaning in this tool |
| --- | --- |
| Preset | A project-type definition discovered from `src/presets/*/preset.json`. Presets provide scan patterns, templates, chapter order, and inheritance. |
| Type | The selected preset name, or an array of preset names, stored in `.sdd-forge/config.json` and used to resolve behavior for docs generation. |
| `analysis.json` | Structured output written under `.sdd-forge/output/analysis.json` by `docs scan`; later steps read it as the main intermediate representation of the codebase. |
| `{{data}}` directive | A template directive resolved deterministically from analysis data during `docs data`. It inserts generated factual content into chapter files. |
| `{{text}}` directive | A template directive resolved by an AI agent during `docs text`. It fills prose sections after analysis data is available. |
| Docs build pipeline | The main documentation pipeline in `docs build`: `scan -> enrich -> init -> data -> text -> readme -> agents`, with translation added for multi-language output. |
| Flow state | Persistent SDD workflow state stored as a pointer in `.sdd-forge/.active-flow` and detailed state in `specs/<id>/flow.json`. |
| Spec | The feature specification created during `flow run prepare-spec`, including files such as `spec.md` and `qa.md` under `specs/<id>/`. |
| Phase | The high-level SDD stages reflected in the README and flow state: planning, implementation, finalization, and sync-related follow-up. |
| Worktree mode | An option in spec preparation where a dedicated Git worktree is created for feature work instead of using only the current repository checkout. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

1. Install the CLI globally with `npm install -g sdd-forge`. The package declares a Node.js requirement of `>=18.0.0`.
2. Run `sdd-forge setup` to register the project through the interactive wizard. This creates `.sdd-forge/config.json` and prepares project directories such as `docs/` and `specs/`.
3. During setup, choose the project type preset, language, and default AI agent so the CLI can resolve scan rules, templates, and agent-backed text generation.
4. Run `sdd-forge docs build` to execute the full documentation pipeline. According to help output, this runs `scan`, `enrich`, `init`, `data`, `text`, and `readme`, with `agents` and optional translation steps in the build implementation.
5. The first generated output is a populated documentation set in `docs/`, plus an auto-generated `README.md`. For an existing codebase, this is the fastest path to a usable first result.
6. After setup, use `sdd-forge help`, `sdd-forge docs --help`, or `sdd-forge flow --help` to inspect the available command families for documentation and SDD workflow operations.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
