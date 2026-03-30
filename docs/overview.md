<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

sdd-forge is a Node.js CLI for Spec-Driven Development and automated documentation generation. It helps teams turn source code and project configuration into structured docs, README content, agent instructions, and workflow state using commands for setup, documentation, specs, and flow management.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

This CLI addresses two related needs: keeping technical documentation aligned with source code and running a structured Spec-Driven Development workflow from the command line.

Based on the package definition and command layout, it is aimed at developers and teams who want to scan a codebase, generate or update `docs/` and `README.md`, manage specs under `specs/`, and operate a repeatable flow through `setup`, `docs`, `spec`, and `flow` commands. The package is distributed as a single `sdd-forge` executable, uses ES Modules, requires Node.js 18 or later, and ships without external runtime dependencies.
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
  A[CLI entry point<br/>src/sdd-forge.js] --> B{Top-level argument}
  B -->|no arg / --help| H[help.js]
  B -->|-v / --version| V[Read package version]
  B -->|docs| D[docs.js dispatcher]
  B -->|spec| S[spec.js dispatcher]
  B -->|flow| F[flow.js dispatcher]
  B -->|setup| U[setup.js]
  B -->|upgrade| G[upgrade.js]
  B -->|presets| P[presets-cmd.js]

  D --> D1[scan]
  D --> D2[enrich]
  D --> D3[init]
  D --> D4[data]
  D --> D5[text]
  D --> D6[readme]
  D --> D7[agents]
  D --> D8[translate]
  D --> DB[build pipeline]

  DB --> I[Input<br/>source tree + .sdd-forge/config.json + templates]
  I --> X1[scan source files]
  X1 --> O1[.sdd-forge/output/analysis.json]
  O1 --> X2[enrich analysis with AI metadata]
  X2 --> X3[init docs templates]
  X3 --> X4[resolve {{data}} directives]
  X4 --> X5[fill {{text}} directives]
  X5 --> X6[generate README.md]
  X6 --> X7[update AGENTS.md]
  X7 --> X8[translate non-default languages when configured]
  X8 --> O2[Output<br/>docs/ + README.md + AGENTS.md]

  S --> S1[spec init]
  S --> S2[spec gate]
  S --> S3[spec guardrail]
  S --> S4[spec lint]

  F --> F1[get]
  F --> F2[set]
  F --> F3[run]
  F1 --> F4[read flow state]
  F2 --> F5[update flow state]
  F3 --> F6[execute flow actions]
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Term | Meaning |
| --- | --- |
| `work root` | The main working directory used by the CLI. It is resolved from `SDD_WORK_ROOT`, the Git repository root, or the current directory. |
| `source root` | The source-code base path used for scanning. It comes from `SDD_SOURCE_ROOT` when set, otherwise it matches the work root. |
| `.sdd-forge/config.json` | The validated project configuration file. It defines language, preset type, documentation settings, optional agent settings, flow settings, and command availability. |
| `preset` | A project-type definition used to decide scan rules, templates, and chapter ordering. Presets can form inheritance chains. |
| `docs build` | The main documentation pipeline. It runs `scan`, `enrich`, `init`, `data`, `text`, `readme`, `agents`, and optionally `translate`. |
| `analysis.json` | The structured analysis output saved under `.sdd-forge/output/analysis.json`. It is produced by scanning and then reused by later documentation steps. |
| `{{data}}` directive | A template directive resolved from analysis data and other structured sources during the `docs data` step. |
| `{{text}}` directive | A template directive filled with generated prose during the `docs text` step. |
| `document style` | Documentation-writing settings under `docs.style`, including purpose, tone, and an optional custom instruction. |
| `output languages` | The configured documentation languages in `docs.languages`, with one `defaultLanguage` and either `translate` or `generate` mode for other languages. |
| `agent` | The configured AI provider used by commands such as `docs enrich`, `docs text`, `docs agents`, and translation-related steps. |
| `flow` | The Spec-Driven Development state and action system exposed through `flow get`, `flow set`, and `flow run`. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

1. Install the package in a Node.js 18 or later environment so the `sdd-forge` CLI is available.
2. Run `sdd-forge help` to see the top-level command groups: project setup, documentation commands, spec commands, flow commands, and preset listing.
3. Run `sdd-forge setup` to register the project. The setup command creates `.sdd-forge/config.json`, `.sdd-forge/output`, `docs/`, and `specs/`, and it also prepares `.gitignore` entries.
4. During setup, provide the project name, output language settings, preset type, document purpose, tone, and agent configuration.
5. Run `sdd-forge docs build` to generate documentation. In the documented pipeline, this executes `scan`, `enrich`, `init`, `data`, `text`, `readme`, `agents`, and translation steps when multi-language output is enabled.
6. Review the generated output in `docs/`, along with the generated `README.md` and updated `AGENTS.md` when those steps are part of the pipeline.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
