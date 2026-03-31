<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

sdd-forge is a Node.js CLI tool that automates technical documentation generation from static source code analysis and provides a structured Spec-Driven Development (SDD) workflow. It solves the problem of documentation drifting out of sync with evolving codebases, and is used by development teams to produce and maintain accurate developer guides, API references, and README files as first-class project artifacts.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

Software projects routinely suffer from documentation that falls behind the code — written once at project start and then abandoned as the codebase evolves. sdd-forge addresses this by treating documentation as a generated artifact: it parses source files to extract structural metadata (classes, methods, routes, configuration, dependencies), enriches those entries with AI-generated summaries, and injects the results into versioned Markdown templates. The output is a coherent, up-to-date documentation site produced on demand.

Target users are developers and engineering teams who want accurate technical docs without the manual overhead of keeping them current. The tool is particularly suited to teams practising iterative development, where specs and source code change frequently. By separating structural data extraction (deterministic) from prose generation (AI-assisted), sdd-forge keeps documentation reproducible and auditable while still producing readable narrative text.
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
    CLI["sdd-forge &lt;command&gt;"] --> DISPATCH{Top-level dispatch}

    DISPATCH --> SETUP[setup]
    DISPATCH --> UPGRADE[upgrade]
    DISPATCH --> PRESETS[presets]
    DISPATCH --> HELP[help]
    DISPATCH --> DOCS[docs &lt;subcommand&gt;]
    DISPATCH --> FLOW[flow &lt;subcommand&gt;]

    DOCS --> SCAN[scan\nParse source → analysis.json]
    SCAN --> ENRICH[enrich\nAI-annotate entries]
    ENRICH --> INIT[init\nMerge preset templates → docs/]
    INIT --> DATA[data\nReplace {{data}} directives]
    DATA --> TEXT[text\nReplace {{text}} directives via AI]
    TEXT --> README[readme\nGenerate README.md]
    README --> AGENTS[agents\nGenerate CLAUDE.md / AGENTS.md]

    FLOW --> GET[flow get\nQuery flow state]
    FLOW --> SET[flow set\nMutate flow state]
    FLOW --> RUN[flow run\nExecute actions]

    RUN --> GATE[gate — spec gate check]
    RUN --> REVIEW[review — code review]
    RUN --> FINALIZE[finalize — commit / merge pipeline]
    RUN --> SYNC[sync — documentation sync]
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Concept | Description |
|---|---|
| **Preset** | A named configuration bundle (e.g., `node-cli`, `laravel`, `hono`) that provides scanner rules, DataSource classes, and Markdown chapter templates for a specific project type. Presets inherit from one another via a `parent` chain. |
| **analysis.json** | The machine-readable output of `docs scan`. Contains structured metadata extracted from source files: classes, methods, routes, configuration keys, and dependencies. |
| **Enrich** | An AI-assisted pass (`docs enrich`) that annotates each entry in `analysis.json` with a human-readable summary, a chapter assignment, and a role classification. |
| **`{{data}}` directive** | A template placeholder replaced by the `docs data` command with deterministically generated structured content (tables, lists) drawn from `analysis.json` via a DataSource method. |
| **`{{text}}` directive** | A template placeholder replaced by the `docs text` command with AI-generated prose, guided by a prompt embedded in the directive itself. |
| **Chapter** | A single Markdown file in `docs/` corresponding to one topic area (e.g., `overview.md`, `cli_commands.md`). The chapter list and order are defined in `preset.json`. |
| **DataSource** | A JavaScript class inside a preset that knows how to read `analysis.json` and format a specific slice of it as Markdown. Scannable DataSources also define `match()` and `scan()` methods used during source parsing. |
| **Flow** | The SDD workflow engine, implemented as `flow get` / `flow set` / `flow run` subcommands. It tracks progress through plan → implement → merge phases using a persistent `flow.json` state file. |
| **Spec Gate** | A deterministic validation step (`flow run gate`) that checks whether a specification meets defined quality criteria before implementation begins. |
| **Config (`config.json`)** | The project-level configuration file at `.sdd-forge/config.json`. Specifies project type, output language(s), AI agent settings, and documentation style. Created by `sdd-forge setup`. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

**Step 1 — Install the package**

Install sdd-forge globally from npm:

```
npm install -g sdd-forge
```

Node.js 18 or later is required. The package has no external runtime dependencies.

**Step 2 — Run the setup wizard**

In your project root, run:

```
sdd-forge setup
```

The interactive wizard prompts you to choose a project name, output language(s), one or more preset types (e.g., `node-cli`, `laravel`), documentation purpose, tone, and AI agent (Claude or Codex). It creates a `.sdd-forge/config.json`, initialises the `docs/` and `specs/` directories, and deploys the appropriate agent skill files.

**Step 3 — Scan your source code**

```
sdd-forge docs scan
```

This parses your source files according to the preset's scanner rules and writes structured metadata to `.sdd-forge/output/analysis.json`.

**Step 4 — Enrich the analysis**

```
sdd-forge docs enrich
```

An AI pass annotates each entry in `analysis.json` with summaries, chapter assignments, and role classifications. This step can be resumed if interrupted.

**Step 5 — Initialise the document templates**

```
sdd-forge docs init
```

Preset templates are resolved through the inheritance chain and written into your `docs/` directory as editable Markdown files.

**Step 6 — Generate the full documentation**

```
sdd-forge docs build
```

This runs the `data`, `text`, and `readme` pipeline in sequence, filling every `{{data}}` and `{{text}}` directive and producing a complete `README.md`. After this step, your `docs/` directory and project README reflect the current state of your source code.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
