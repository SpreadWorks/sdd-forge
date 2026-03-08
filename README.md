# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** This tool is currently in alpha. The API, command structure, and configuration format may change without notice. Please avoid using it in production environments.

**A CLI tool that automatically generates and maintains project documentation using source code analysis + AI.**

It statically analyzes your codebase and combines templates with AI to auto-generate `docs/`.
The Spec-Driven Development (SDD) workflow also automates documentation updates when adding features or making changes.

## Features

- **Zero dependencies** — Runs on Node.js 18+ only. No npm dependencies
- **Automatic source code analysis** — Statically analyzes controllers, models, routes, and config files to extract structural data
- **AI document generation** — AI automatically expands `{{text}}` directives in templates
- **Template inheritance** — Customizable via 4-layer inheritance: base → arch → preset → project-local
- **SDD workflow** — Manage the spec → gate → implement → forge → review cycle with commands
- **Multilingual support** — Auto-generate documentation in multiple languages via translate / generate modes
- **AI agent integration** — Compatible with Claude Code (skills) and Codex CLI
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

### Setup & Document Generation

<pre>
# 1. Register your project (interactive wizard)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. Generate all documentation at once (scan → init → data → text → readme → agents → translate)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

This generates `docs/` and `README.md` in one step.

## Commands

### Document Generation

| Command | Description |
|---|---|
| `setup` | Register project + generate config file |
| `build` | Run the full document generation pipeline |
| `scan` | Analyze source code → `analysis.json` |
| `init` | Initialize `docs/` from templates |
| `data` | Resolve `{{data}}` directives with analysis data |
| `text` | Resolve `{{text}}` directives with AI |
| `readme` | Auto-generate `README.md` from `docs/` |
| `forge` | Iteratively improve documentation with AI |
| `review` | Check documentation quality |
| `translate` | Multilingual translation (default language → others) |
| `upgrade` | Update preset templates to the latest version |

### SDD Workflow

| Command | Description |
|---|---|
| `spec` | Create a spec document + feature branch |
| `gate` | Pre-implementation check for the spec |
| `flow` | Automatically run the SDD workflow |
| `changelog` | Generate change history from specs/ |
| `agents` | Update AGENTS.md |

### Project Management

| Command | Description |
|---|---|
| `default` | Set the default project |
| `presets` | List available presets |
| `help` | Show command list |

## SDD Workflow

The flow for adding features or making changes:

```
  spec          Create a spec (feature branch + spec.md)
    ↓
  gate          Spec gate check (PASS if no unresolved items)
    ↓
  implement     Write code after gate PASS
    ↓
  forge         Auto-update documentation
    ↓
  review        Quality check (repeat until PASS)
```

### AI Agent Integration

#### Claude Code

Run the SDD workflow with skills:

```
/sdd-flow-start   — Start: create spec → gate → implement
/sdd-flow-close   — Finish: forge → review → commit → merge
```

#### Codex CLI

Run the workflow from a prompt:

```
$sdd-flow-start   — Start: create spec → gate → implement
$sdd-flow-close   — Finish: forge → review → commit → merge
```

## Configuration

`sdd-forge setup` generates `.sdd-forge/config.json`.

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
│   ├── docs/      ← Chapter templates / README overrides
│   └── specs/     ← spec.md / qa.md templates
└── data/          ← Custom data source modules
```

## Documentation

<!-- {{data: docs.chapters("Chapter|Overview")}} -->
| Chapter | Overview |
| --- | --- |
| [01. System Overview](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/01_overview.md) | This chapter provides a structural overview of sdd-forge, a Node.js CLI tool that automates documentation generation … |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/02_cli_commands.md) | This chapter covers all 18 subcommands available in `sdd-forge`, organized into documentation generation commands (ro… |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/03_configuration.md) | This chapter covers all configuration files used by sdd-forge, the full range of options available in `.sdd-forge/con… |
| [04. Internal Design](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/04_internal_design.md) |  |
<!-- {{/data}} -->

## License

MIT
