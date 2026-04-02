<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

`sdd-forge` is a CLI tool that combines automated documentation generation with a structured Spec-Driven Development (SDD) workflow, helping teams keep technical docs in sync with code and manage AI-assisted feature development from specification through to merge.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

Maintaining accurate technical documentation is a persistent challenge in software projects — docs drift from the code, specs are written informally, and AI coding agents lack the structured context they need to work reliably. `sdd-forge` addresses these problems by providing two integrated capabilities: a source-code analysis pipeline that automatically generates and updates documentation, and a structured SDD workflow that guides AI agents through planning, implementation, and review with deterministic guardrails.

**Target users** are development teams who:

- Use AI coding agents such as Claude Code and want a repeatable, auditable workflow
- Need technical documentation that stays synchronized with the source code after every change
- Work across multiple frameworks (Next.js, Laravel, Hono, Symfony, and more) and want a consistent tooling layer
- Require zero-dependency, pure Node.js tooling that can be adopted without adding npm bloat to existing projects
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
    CLI["sdd-forge (entry point)"] --> HELP[help]
    CLI --> SETUP[setup]
    CLI --> UPGRADE[upgrade]
    CLI --> PRESETS[presets]
    CLI --> DOCS["docs.js (dispatcher)"]
    CLI --> FLOW["flow.js (dispatcher)"]

    DOCS --> SCAN[docs scan]
    DOCS --> ENRICH[docs enrich]
    DOCS --> INIT[docs init]
    DOCS --> DATA[docs data]
    DOCS --> TEXT[docs text]
    DOCS --> README[docs readme]
    DOCS --> AGENTS[docs agents]
    DOCS --> REVIEW[docs review]
    DOCS --> TRANSLATE[docs translate]
    DOCS --> FORGE[docs forge]
    DOCS --> CHANGELOG[docs changelog]

    FLOW --> GET["flow get"]
    FLOW --> SET["flow set"]
    FLOW --> RUN["flow run"]

    RUN --> PREPARE[run prepare-spec]
    RUN --> GATE[run gate]
    RUN --> IMPL[run impl-confirm]
    RUN --> REVIEW2[run review]
    RUN --> FINALIZE[run finalize]
    RUN --> SYNC[run sync]

    subgraph DocsPipeline ["Documentation Pipeline (docs build)"]direction LR
        SRC[Source Code] --> SCAN
        SCAN --> ENRICH
        ENRICH --> INIT
        INIT --> DATA
        DATA --> TEXT
        TEXT --> README
    end

    subgraph FlowState ["Flow State (flow.json)"]
        GET
        SET
    end
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Concept | Description |
|---|---|
| **Preset** | A named configuration package (e.g., `node-cli`, `laravel`, `nextjs`) that defines source scan patterns, documentation chapter layout, and template inheritance for a specific project type. Presets form a parent–child hierarchy starting from `base`. |
| **`{{data}}` directive** | A template placeholder filled deterministically by a `DataSource` method. It injects structured data (tables, lists, code blocks) extracted from source analysis into a document. |
| **`{{text}}` directive** | A template placeholder filled by an AI agent. It generates prose such as descriptions, explanations, and summaries within a defined boundary, keeping paragraph structure stable. |
| **DataSource** | A class that reads the `analysis.json` produced by `docs scan` and exposes structured methods used to populate `{{data}}` directives in templates. |
| **SDD Flow** | A three-phase workflow (Plan → Implement → Merge) managed by `sdd-forge flow` commands and persisted in `flow.json`. It structures the collaboration between the developer and an AI coding agent. |
| **`flow.json`** | A state file in the project's `.sdd-forge/` directory that tracks the current SDD flow phase, branch, requirements, and metrics. It enables the workflow to resume after context compression. |
| **Guardrail** | A deterministic validation check run during `flow run gate` that verifies a spec meets design principles before implementation is allowed to begin. |
| **`analysis.json`** | The output of `docs scan`, stored in `.sdd-forge/output/`. It contains the extracted source structure — files, classes, methods, configuration, and dependencies — used by all downstream documentation commands. |
| **Template inheritance** | Preset templates extend parent templates using `{%extends%}` and `{%block%}` directives, allowing shared structure to be defined once in a parent preset and selectively overridden by child presets. |
| **Enrich** | A pipeline step (`docs enrich`) where an AI agent adds summaries, role descriptions, and chapter classifications to each entry in `analysis.json`, producing enriched metadata for higher-quality documentation. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

**1. Install the package**

Install `sdd-forge` globally via npm:

```bash
npm install -g sdd-forge
```

**2. Register your project**

Run `setup` in the project root. This detects your project type, prompts for configuration (language, AI agent, preset), and writes `.sdd-forge/config.json`:

```bash
cd my-project
sdd-forge setup
```

**3. Scan your source code**

Extract the source structure into `analysis.json`:

```bash
sdd-forge docs scan
```

**4. Enrich the analysis (optional)**

Have an AI agent annotate the extracted data with summaries and chapter classifications:

```bash
sdd-forge docs enrich
```

**5. Initialise the docs directory**

Generate the `docs/` template structure from your preset:

```bash
sdd-forge docs init
```

**6. Run the full documentation pipeline**

Fill all `{{data}}` and `{{text}}` directives and generate `README.md`:

```bash
sdd-forge docs build
```

After this step, `docs/` contains the completed documentation and the project `README.md` is updated.

**7. (Optional) Start an SDD flow for a new feature**

When adding a feature, launch the planning workflow:

```bash
sdd-forge flow run prepare-spec
```

This opens a spec dialogue, validates the spec with `flow run gate`, and guides you through implementation and merge.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
