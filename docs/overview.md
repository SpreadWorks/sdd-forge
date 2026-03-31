<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

This chapter introduces sdd-forge, a CLI tool that automates technical documentation generation through source code analysis and provides a Spec-Driven Development workflow for AI coding agents. It covers the tool's core purpose, high-level architecture, essential concepts, and the typical path from installation to first output.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

Engineering teams using AI coding agents face a recurring challenge: documentation drifts out of sync with the codebase as features evolve, and there is no structured process to guide AI agents through planning, implementation, and review in a consistent way. sdd-forge addresses both problems as a zero-dependency Node.js CLI tool.

On the documentation side, it scans your source code to produce a structured `analysis.json`, enriches each entry with AI-generated metadata, and injects the results into versioned Markdown templates — replacing manual doc maintenance with an automated pipeline (`scan → enrich → init → data → text → readme`).

On the workflow side, it implements Spec-Driven Development (SDD): a three-phase cycle of Plan, Implement, and Merge that keeps AI agents aligned with agreed requirements and prevents unconstrained code changes.

The primary target users are software development teams that pair human developers with AI coding agents (such as Claude Code or Codex CLI) and want both their documentation and their AI-assisted workflow to remain reproducible and auditable.
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
    CLI["sdd-forge <cmd>"] --> DISP{Dispatcher\nsdd-forge.js}

    DISP -->|"docs <sub>"| DOCS[docs.js]
    DISP -->|"flow get|set|run"| FLOW[flow.js]
    DISP -->|setup| SETUP[setup.js]
    DISP -->|upgrade| UPGRADE[upgrade.js]
    DISP -->|presets| PRESETS[presets-cmd.js]
    DISP -->|help| HELP[help.js]

    DOCS --> SCAN[scan\nanalysis.json]
    SCAN --> ENRICH[enrich\nAI metadata]
    ENRICH --> INIT[init\ndocs/ templates]
    INIT --> DATA[data\n{{data}} directives]
    DATA --> TEXT[text\n{{text}} directives]
    TEXT --> README[readme\nREADME.md]
    README --> AGENTS[agents\nAGENTS.md]
    AGENTS --> TRANS[translate\nmulti-language]

    FLOW --> GET[flow/get\nread state]
    FLOW --> SET[flow/set\nwrite state]
    FLOW --> RUN[flow/run\nexecute actions]

    RUN --> SPEC[prepare-spec]
    RUN --> GATE[gate]
    RUN --> REVIEW[review]
    RUN --> FINAL[finalize]

    SETUP --> CFG[".sdd-forge/config.json"]
    TRANS --> OUT["docs/ + README.md\n(all languages)"]
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Concept | Description |
|---|---|
| **SDD (Spec-Driven Development)** | A three-phase workflow (Plan → Implement → Merge) that constrains AI agents to work from an agreed specification before writing any code. |
| **Preset** | A named configuration bundle (`preset.json` + scan rules + templates + DataSources) that models a specific technology stack. Presets form an inheritance chain (e.g., `base → webapp → hono`). |
| **analysis.json** | The intermediate artifact produced by `sdd-forge docs scan`. It captures source code structure — files, classes, methods, imports, exports — in a language-agnostic JSON format. |
| **Enrich** | An AI-assisted step that annotates each entry in `analysis.json` with a human-readable summary, a chapter assignment, and a role classification before documentation is rendered. |
| **`{{data}}` directive** | A template marker replaced at build time with structured data extracted from `analysis.json` via a DataSource method. The content inside is fully managed and overwritten on each build. |
| **`{{text}}` directive** | A template marker replaced at build time with AI-generated prose. The prompt is embedded in the directive itself; content inside is overwritten on each build. |
| **DataSource** | A JavaScript class defined inside a preset that exposes named methods returning structured data (tables, lists, code snippets) for use by `{{data}}` directives. |
| **flow.json** | A per-project file that tracks the current SDD flow state, including phase, step statuses, requirements, and metrics. |
| **Worktree** | An isolated Git working tree created by `flow run prepare-spec`, allowing parallel or sandboxed implementation without affecting the main branch. |
| **`sdd-forge build`** | The end-to-end documentation pipeline alias that runs scan → enrich → init → data → text → readme → agents in sequence. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

**1. Install the package globally**

```bash
npm install -g sdd-forge
```

**2. Verify the installation**

```bash
sdd-forge help
```

This prints all available commands and confirms the binary is on your `PATH`.

**3. Register your project**

Run the interactive setup wizard from your project root. It generates `.sdd-forge/config.json` with your project type, language, and AI agent configuration.

```bash
sdd-forge setup
```

**4. Build documentation**

Run the full pipeline. This scans your source code, enriches the analysis with AI metadata, initialises the `docs/` directory from the appropriate preset templates, injects data and AI-generated text, and writes `README.md`.

```bash
sdd-forge docs build
```

**5. Review the output**

After the build completes, the `docs/` directory contains one Markdown file per chapter. `README.md` at the project root is also regenerated from the documentation content.

**6. (Optional) Start an SDD flow for new work**

When you are ready to implement a feature, start the Spec-Driven Development workflow. The tool guides the AI agent through planning, gate check, implementation, review, and merge.

```bash
sdd-forge flow run prepare-spec
```
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
