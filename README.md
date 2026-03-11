# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha Release:** This tool is currently in alpha. APIs, command structure, and configuration formats may change without notice. Not recommended for production use.

**A CLI tool that automatically generates and maintains project documentation using source code analysis + AI.**

Statically analyzes your codebase and combines templates with AI to auto-generate `docs/`.
The Spec-Driven Development (SDD) workflow also automates documentation updates when adding or modifying features.

## Features

- **Zero dependencies** — Runs on Node.js 18+ only. No npm packages required
- **Automatic source analysis** — Statically analyzes controllers, models, routes, and config files to extract structural data
- **AI documentation generation** — AI automatically expands `{{text}}` directives in templates
- **Template inheritance** — Four-layer inheritance (base → arch → preset → project-local) for flexible customization
- **SDD workflow** — Manage the spec → gate → implement → forge → review development cycle with commands
- **Multi-language support** — Auto-generate documentation in multiple languages via translate / generate modes
- **AI agent integration** — Supports Claude Code (skills) and Codex CLI
- **Multi-preset** — Supports Node.js CLI / CakePHP2 / Laravel / Symfony

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

### Setup & Documentation Generation

<pre>
# 1. Register your project (interactive wizard)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. Generate all documentation (scan → init → data → text → readme → agents → translate)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

This generates `docs/` and `README.md` in one step.

## Commands

### Documentation Generation

| Command | Description |
|---|---|
| `setup` | Register project + generate config file |
| `build` | Run the full documentation generation pipeline |
| `scan` | Analyze source code → `analysis.json` |
| `init` | Initialize `docs/` from templates |
| `data` | Resolve `{{data}}` directives with analyzed data |
| `text` | Resolve `{{text}}` directives with AI |
| `readme` | Auto-generate `README.md` from `docs/` |
| `forge` | Iteratively improve documentation with AI |
| `review` | Check documentation quality |
| `translate` | Multi-language translation (default language → other languages) |
| `upgrade` | Update preset templates to the latest version |

### SDD Workflow

| Command | Description |
|---|---|
| `spec` | Create a spec document + feature branch |
| `gate` | Pre-implementation check for spec documents |
| `flow` | Run the SDD workflow automatically |
| `changelog` | Generate change history from specs/ |
| `agents` | Update AGENTS.md |

### Project Management

| Command | Description |
|---|---|
| `default` | Set the default project |
| `presets` | List available presets |
| `help` | Show command list |

## SDD Workflow

Feature development and modification flow:

```
  spec          Create a spec document (feature branch + spec.md)
    ↓
  gate          Spec gate check (PASS when no unresolved items)
    ↓
  implement     Start coding after gate PASS
    ↓
  forge         Automatically update documentation
    ↓
  review        Quality check (repeat until PASS)
```

### AI Agent Integration

#### Claude Code

Run the SDD workflow using skills:

```
/sdd-flow-start   — Start spec creation → gate → implementation
/sdd-flow-close   — Finish with forge → review → commit → merge
```

#### Codex CLI

Run the workflow from prompts:

```
$sdd-flow-start   — Start spec creation → gate → implementation
$sdd-flow-close   — Finish with forge → review → commit → merge
```

## Configuration

Running `sdd-forge setup` generates `.sdd-forge/config.json`.

```jsonc
{
  "type": "cli/node-cli",     // Project type (preset selection)
  "lang": "en",               // Documentation language
  "defaultAgent": "claude",   // AI agent
  "providers": { ... }        // Agent configuration
}
```

### Customization

You can add project-specific templates and data sources:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← Chapter template and README overrides
│   └── specs/     ← spec.md / qa.md templates
└── data/          ← Custom data source modules
```

## Documentation

<!-- {{data: docs.chapters("Chapter|Overview")}} -->
| Chapter | Overview |
| --- | --- |
| [01. System Overview](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/01_overview.md) | This chapter describes the overall architecture of `sdd-forge`, a Node.js CLI tool that automates documentation gener… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/02_cli_commands.md) | `sdd-forge` provides 19 subcommands organized across a three-level dispatch architecture: top-level commands route th… |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/03_configuration.md) |  |
| [04. Internal Design](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/04_internal_design.md) |  |
<!-- {{/data}} -->

## License

MIT
