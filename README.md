# <!-- {{data("cli.project.name")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data("cli.docs.langSwitcher", {labels: "absolute"})}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)
[![license](https://img.shields.io/npm/l/sdd-forge.svg)](https://opensource.org/licenses/MIT)
[![downloads](https://img.shields.io/npm/dm/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** APIs, command structure, and configuration formats may change without notice.

## Spec-Driven Development — Design, implement, and document in a single flow

A spec-first development flow manager designed to work with AI coding agents.

## The SDD Flow

Every feature goes through three phases, from spec to merge.

```
plan ─────── Specification
│  ├─ draft      Refine requirements through dialogue
│  ├─ spec       Create spec (feature branch + spec.md)
│  ├─ gate       Spec validation + guardrail check
│  └─ test       Review test plan → write test code
│
implement ── Implementation
│  ├─ code       Write code after gate PASS
│  └─ review     AI code review
│
merge ────── Wrap-up
   ├─ docs       Auto-update documentation
   ├─ commit     Commit changes
   └─ merge      Merge to base branch → cleanup
```

### AI stays in its lane

Source code analysis, spec gate checks, and flow orchestration are all handled by deterministic commands. AI is not in charge of the flow — it assists with spec drafting, code review, and prose generation within well-defined boundaries.

- **Spec gate** — Programmatic validation of unresolved items and missing approvals. No PASS, no implementation
- **Guardrails** — Project-specific design principles checked against each spec
- **Compaction resilience** — Flow state and requirements are persisted, so you can resume after context compression

## Automatic Doc Sync

Source code is statically analyzed to extract file structure, classes, methods, configuration, and dependencies. The extracted data is injected into templates to produce structured documentation (`docs/`) and `README.md`.

Documentation is automatically refreshed during the merge phase, so docs and code never drift apart. With always-current docs, both humans and AI agents can understand the system without reading every source file.

## Quick Start

### Install

<pre>
npm install -g <!-- {{data("cli.project.name")}} -->sdd-forge<!-- {{/data}} -->
</pre>

### Setup

<pre>
<!-- {{data("cli.project.name")}} -->sdd-forge<!-- {{/data}} --> setup
</pre>

An interactive wizard configures your project type (preset) and AI agent.

### Generate docs for an existing project

If you already have source code, generate documentation to get a complete picture of the system. Especially useful for onboarding onto legacy codebases.

<pre>
<!-- {{data("cli.project.name")}} -->sdd-forge<!-- {{/data}} --> docs build
</pre>

### Develop with the SDD flow

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — run each phase via skills:

| Skill | Phase |
|---|---|
| `/sdd-forge.flow-plan` | plan (specification) |
| `/sdd-forge.flow-impl` | implement (coding + review) |
| `/sdd-forge.flow-merge` | merge (wrap-up) |

**[Codex CLI](https://github.com/openai/codex)** — invoke via `$` prefix:

| Command | Phase |
|---|---|
| `$sdd-forge flow start` | plan (start specification) |
| `$sdd-forge flow review` | implement (AI code review) |
| `$sdd-forge flow merge` | merge (wrap-up) |

## Commands

| Command | Description |
|---|---|
| `setup` | Register project and generate config |
| `docs build` | Run the full documentation pipeline |
| `docs readme` | Generate `README.md` from `docs/` |
| `docs review` | Check documentation quality |
| `flow start` | Start the SDD flow |
| `flow status` | Show flow progress |
| `presets` | List available presets |
| `help` | Show all commands |

See `sdd-forge help` or the [command reference](docs/cli_commands.md) for the full list.

## Configuration

`setup` generates `.sdd-forge/config.json`:

```jsonc
{
  "type": "cli/node-cli",     // project type (preset selection)
  "lang": "en",               // operating language
  "defaultAgent": "claude",   // AI agent
  "providers": { ... }        // agent settings
}
```

See the [configuration reference](docs/configuration.md) for details.

## Documentation

<!-- {{data("cli.docs.chapters", {header: "", labels: "Chapter|Summary", ignoreError: true})}} -->
| Chapter | Summary |
| --- | --- |
| [Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter introduces sdd-forge, a CLI tool that automates technical documentation generation from source code anal… |
| [Technology Stack and Operations](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/stack_and_ops.md) | sdd-forge is a Node.js CLI tool written in JavaScript (ES modules), currently at version 0.1.0-alpha.361, with Node.j… |
| [Project Structure](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/project_structure.md) | This chapter covers the layout of the src/ directory, which is organized into five major areas: entry-point CLI scrip… |
| [CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge provides over 40 commands organized into two namespace dispatchers — docs (12 subcommands covering the full… |
| [Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge reads its project settings from a single JSON file located inside the .sdd-forge/ directory, with optional … |
| [Internal Design](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/internal_design.md) | This chapter describes the internal structure of sdd-forge, a CLI tool built around a three-level dispatch architectu… |
| [Development, Testing, and Distribution](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/development_testing.md) | This chapter covers everything needed to work on sdd-forge itself: setting up a local development environment, unders… |
<!-- {{/data}} -->

## License

MIT
