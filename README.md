# <!-- {{data("cli.project.name")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data("cli.docs.langSwitcher", {labels: "absolute"})}} -->
[日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md) | **English**
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
plan ──────── Specification
│  ├─ draft       Refine requirements through dialogue
│  ├─ spec        Create spec (feature branch + spec.md)
│  ├─ gate        Spec validation + guardrail check
│  └─ test        Write test code
│
implement ─── Coding
│  ├─ implement   Write code after gate PASS
│  └─ review      AI code review
│
finalize ──── Wrap-up
│  ├─ commit      Commit + retro + report
│  ├─ merge       Squash merge or PR
│  ├─ sync        Auto-update documentation
│  └─ cleanup     Remove branch / worktree
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
| `/sdd-forge.flow-finalize` | finalize (commit, merge, docs sync, cleanup) |

**[Codex CLI](https://github.com/openai/codex)** — invoke via `$` prefix:

| Command | Phase |
|---|---|
| `$sdd-forge flow prepare --title "..." --base main` | plan (create spec + branch) |
| `$sdd-forge flow run review` | implement (AI code review) |
| `$sdd-forge flow run finalize --mode all` | finalize (wrap-up) |

## Commands

| Command | Description |
|---|---|
| `setup` | Register project and generate config |
| `docs build` | Run the full documentation pipeline |
| `docs readme` | Generate `README.md` from `docs/` |
| `docs review` | Check documentation quality |
| `flow prepare` | Create spec and branch |
| `flow get status` | Show flow progress |
| `presets` | List available presets |
| `help` | Show all commands |

See `sdd-forge help` or the [command reference](docs/cli_commands.md) for the full list.

## Configuration

`setup` generates `.sdd-forge/config.json`:

```jsonc
{
  "type": "node-cli",          // project type (preset name)
  "lang": "en",                // operating language
  "agent": {
    "default": "claude/sonnet",  // default provider key
    "workDir": ".tmp",           // agent working directory
    "providers": {               // provider definitions (built-ins are pre-loaded)
      "claude/sonnet": { "command": "claude", "args": ["-p", "{{PROMPT}}", "--model", "sonnet"] }
    },
    "profiles": {                // named profiles: commandId prefix → provider key
      "default": {
        "docs": "claude/sonnet",
        "spec": "claude/sonnet"
      },
      "fast": {
        "docs": "claude/sonnet",
        "spec": "claude/haiku"
      }
    },
    "useProfile": "default"      // active profile (overridable via SDD_FORGE_PROFILE env var)
  }
}
```

See the [configuration reference](docs/configuration.md) for details.

## Documentation

<!-- {{data("cli.docs.chapters", {header: "", labels: "Chapter|Summary", ignoreError: true})}} -->
| Chapter | Summary |
| --- | --- |
| [Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter introduces sdd-forge — a CLI tool for automated documentation generation and Spec-Driven Development (SD… |
| [Technology Stack and Operations](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/stack_and_ops.md) | sdd-forge is implemented in JavaScript using Node.js (>=18.0.0) with the ES Modules system, and is distributed as a z… |
| [Project Structure](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/project_structure.md) | This chapter describes the source layout of sdd-forge across three major directory groups: src/docs (documentation ge… |
| [CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | The CLI provides over 30 commands organized in a three-level dispatch hierarchy: the top-level sdd-forge entry point … |
| [Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge reads a single JSON configuration file placed inside your project's .sdd-forge/ directory and exposes a bro… |
| [Internal Design](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/internal_design.md) | This chapter describes the internal architecture of sdd-forge, a layered CLI tool in which top-level dispatchers rout… |
<!-- {{/data}} -->

## License

MIT
