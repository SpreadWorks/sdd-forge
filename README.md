# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** This tool is currently in alpha. APIs, command structure, and configuration formats may change without notice. Not recommended for production use.

**A CLI tool that generates documentation from programmatic source code analysis — based on facts, not AI guesswork.**

Mechanical gate checks and structured templates guarantee the reproducibility and accuracy that AI alone cannot deliver.
The Spec-Driven Development (SDD) workflow keeps your documentation in sync as features are added or changed.

## Why sdd-forge?

Most AI documentation tools let AI "read" your code and write docs.
sdd-forge is different.

- **Programmatic analysis** — A static analyzer parses controllers, models, routes, and configs instead of asking AI to read them. No hallucinations, no missed files
- **Facts vs. generation** — `{{data}}` directives inject facts extracted mechanically from source code. `{{text}}` directives hold AI-generated explanations. What is trustworthy and what is inferred is structurally clear
- **Mechanical gate checks** — Spec completeness is verified by program logic, not AI judgment. A quality gate you can rely on
- **Structural stability** — Directives define what goes where. AI cannot rearrange paragraphs or alter the document structure

## Features

### Analyze

`scan` statically analyzes source code and produces `analysis.json`. A program — not AI — reads the structure.

- Parses controllers, models, routes, and config files to extract structural data
- `enrich` lets AI survey the whole picture and annotate each entry with role, summary, and chapter classification
- Preset system adapts to various frameworks and project structures

### Generate

`{{data}}` injects facts, `{{text}}` injects AI explanations, both into templates. A single `build` command produces `docs/` and `README.md`.

- Template inheritance — 4-layer override: base → arch → preset → project-local
- Multi-language — translate / generate modes for automatic localization
- Zero dependencies — runs on Node.js 18+ only, no npm packages required

### Enforce

`gate` mechanically validates specs, `review` checks document quality. The SDD workflow keeps documentation fresh.

- gate — detects unresolved items and missing approvals programmatically. Implementation blocked until PASS
- review — AI checks alignment between docs and source code
- AI agent integration — Claude Code (skills) and Codex CLI supported

## Quick Start

### Installation

<pre>
# npm
npm install -g <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

# yarn
yarn global add <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

# pnpm
pnpm add -g <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->
</pre>

### Setup & Generate

<pre>
# 1. Register your project (interactive wizard)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. Generate all documentation (scan → enrich → init → data → text → readme → agents → translate)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

That's it — `docs/` and `README.md` are generated.

## Commands

### Documentation Generation

| Command | Description |
|---|---|
| `setup` | Register project + generate config |
| `build` | Run the full documentation pipeline |
| `scan` | Analyze source code → `analysis.json` |
| `init` | Initialize `docs/` from templates |
| `data` | Resolve `{{data}}` directives with analysis data |
| `text` | Resolve `{{text}}` directives with AI |
| `readme` | Generate `README.md` from `docs/` |
| `forge` | Iteratively improve docs with AI |
| `review` | Check document quality |
| `translate` | Translate docs (default language → others) |
| `upgrade` | Update preset templates to latest version |

### SDD Workflow

| Command | Description |
|---|---|
| `spec` | Create spec + feature branch |
| `gate` | Pre-implementation spec check |
| `flow` | Run the SDD workflow automatically |
| `changelog` | Generate change log from specs/ |
| `agents` | Update AGENTS.md |

### Other

| Command | Description |
|---|---|
| `presets` | List available presets |
| `help` | Show command list |

## SDD Workflow

Feature development flow:

```
  spec          Create spec (feature branch + spec.md)
    ↓
  gate          Spec gate check ← verified by program (not AI)
    ↓
  implement     Code after gate PASS
    ↓
  forge         AI updates documentation
    ↓
  review        AI quality check (repeat until PASS)
```

### AI Agent Integration

#### Claude Code

Run SDD workflows via skills:

```
/sdd-flow-start   — create spec → gate → start implementation
/sdd-flow-close   — forge → review → commit → merge
```

#### Codex CLI

Run workflows from the `$` prompt:

```
$sdd-flow-start   — create spec → gate → start implementation
$sdd-flow-close   — forge → review → commit → merge
```

## Configuration

`sdd-forge setup` generates `.sdd-forge/config.json`:

```jsonc
{
  "type": "cli/node-cli",     // project type (preset selection)
  "lang": "en",               // documentation language
  "defaultAgent": "claude",   // AI agent
  "providers": { ... }        // agent settings
}
```

### Customization

Add project-specific templates and data sources:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← chapter template & README overrides
│   └── specs/     ← spec.md / qa.md templates
└── data/          ← custom data source modules
```

## Documentation

<!-- {{data: docs.chapters("Chapter|Summary")}} -->
| Chapter | Summary |
| --- | --- |
| [01. Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter describes `sdd-forge`, a CLI tool that automates project documentation by analyzing source code and rend… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge exposes 22 commands organized into four namespaces — `docs`, `spec`, `flow`, and standalone commands — all … |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge is configured primarily through a single JSON file (`.sdd-forge/config.json`) that controls output language… |
<!-- {{/data}} -->

## License

MIT
