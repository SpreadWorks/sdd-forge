# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

This chapter documents all 17 CLI commands provided by `sdd-forge`, organized by dispatch path: documentation commands (routed through `docs.js`), specification commands (routed through `spec.js`), and directly executed commands (`flow`, `presets`). All commands share a common set of global options, and most require a resolved project context before execution.

<!-- {{/text}} -->

## Contents

### Command List

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| Command | Description | Main Options |
|---|---|---|
| `build` | Run the full documentation pipeline: `scan → init → data → text → readme → agents → [translate]` | `--project` |
| `scan` | Analyze source code and output `analysis.json` and `summary.json` | `--project` |
| `init` | Initialize `docs/` directory from preset templates | `--project`, `--force` |
| `data` | Resolve `{{data}}` directives in docs using analysis data | `--project` |
| `text` | Resolve `{{text}}` directives in docs using an AI agent | `--project`, `--agent`, `--file` |
| `readme` | Auto-generate `README.md` from docs content | `--project` |
| `forge` | Iteratively improve docs with an AI agent | `--prompt`, `--spec`, `--project` |
| `review` | Run a quality check on generated docs | `--project` |
| `changelog` | Generate `change_log.md` from accumulated spec files in `specs/` | `--project` |
| `agents` | Update `AGENTS.md` (SDD section and/or PROJECT section) | `--sdd`, `--project`, `--dry-run` |
| `snapshot` | Save, compare, or update regression snapshots | `save` \| `check` \| `update` |
| `translate` | Translate docs into additional languages | `--lang`, `--force`, `--dry-run` |
| `upgrade` | Update bundled doc templates to the latest preset version | `--project` |
| `setup` | Register a project and generate initial configuration | — |
| `default` | Set the default project for the current working directory | — |
| `spec` | Initialize a new spec file and feature branch for SDD | `--title`, `--no-branch` |
| `gate` | Run pre- or post-implementation gate checks against a spec | `--spec`, `--phase` |
| `flow` | Automate the full SDD workflow for a given request | `--request` |
| `presets` | List available presets and their configuration details | — |
| `help` | Display the full command list and usage summary | — |

<!-- {{/text}} -->

### Global Options

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| Option | Aliases | Description |
|---|---|---|
| `--project <name>` | — | Specify the target project by name, as registered in `.sdd-forge/projects.json`. When omitted, the `default` project entry is used. |
| `--help` | `-h` | Display usage information for the given command and exit. |
| `--version` | `-v`, `-V` | Print the installed `sdd-forge` version number and exit. |

The commands `setup`, `default`, `help`, and `presets` skip project context resolution entirely — they do not require a registered project or a `.sdd-forge/config.json` to be present. All other commands resolve the project context before execution, populating the `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` environment variables for downstream modules.

<!-- {{/text}} -->

### Command Details

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

Runs the complete documentation generation pipeline in the following fixed order:

```
scan → init → data → text → readme → agents → [translate]
```

The `translate` step is only executed when `output.languages` in `config.json` contains more than one language entry. All intermediate outputs are written to `.sdd-forge/output/` and `docs/` within the project root.

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

Analyzes the source code of the target project and writes two output files:

- `.sdd-forge/output/analysis.json` — full structured analysis (no indentation)
- `.sdd-forge/output/summary.json` — lightweight version for AI consumption

The scanner behavior is determined by the `type` field in `config.json` and the matching preset's scan configuration.

```bash
sdd-forge scan
```

#### init

Initializes the `docs/` directory by copying templates from the resolved preset. If a `docs/` directory already exists, use `--force` to overwrite. Template inheritance (`@extends` / `@block`) is resolved at this stage.

```bash
sdd-forge init
sdd-forge init --force
```

#### data

Resolves all `{{data: ...}}` directives found in `docs/` files. Directive content is replaced with structured data extracted from `analysis.json`. Content outside directives is preserved.

```bash
sdd-forge data
```

#### text

Resolves all `{{text: ...}}` directives in `docs/` files by invoking an AI agent. The agent is specified via `defaultAgent` in `config.json`, or overridden with `--agent`. Use `--file` to target a single document.

```bash
sdd-forge text
sdd-forge text --agent claude
sdd-forge text --file docs/01_overview.md
```

#### readme

Generates `README.md` at the project root using the resolved docs content as source material.

```bash
sdd-forge readme
```

#### forge

Iteratively improves `docs/` content using an AI agent. Provide a plain-language `--prompt` describing the desired improvement. Optionally pass `--spec` to include a spec file as additional context.

```bash
sdd-forge forge --prompt "Add more detail to the architecture section"
sdd-forge forge --prompt "Reflect the new authentication module" --spec specs/012-auth/spec.md
```

#### review

Runs a quality check against the generated `docs/` files using the bundled review checklist (`src/templates/review-checklist.md`). Outputs a PASS or FAIL result to stdout.

```bash
sdd-forge review
```

#### changelog

Generates `docs/change_log.md` by aggregating all spec files found under `specs/`. Entries are ordered chronologically based on spec metadata.

```bash
sdd-forge changelog
```

#### agents

Updates `AGENTS.md` (and its symlink `CLAUDE.md`) in the project root. By default, both the `<!-- SDD:START/END -->` section (from the preset template) and the `<!-- PROJECT:START/END -->` section (generated from `analysis.json`) are updated. Use `--dry-run` to preview the output without writing to disk.

| Option | Description |
|---|---|
| `--sdd` | Update only the SDD template section |
| `--project` | Update only the PROJECT section |
| `--dry-run` | Preview output without writing to disk |

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --dry-run
```

#### snapshot

Manages regression snapshots for detecting unintended changes in generated output.

| Subcommand | Description |
|---|---|
| `save` | Save current output as a new snapshot baseline |
| `check` | Compare current output against the saved snapshot |
| `update` | Overwrite the saved snapshot with current output |

Captured files: `.sdd-forge/output/analysis.json`, `docs/*.md`, `docs/{lang}/*.md`, `README.md`. Snapshots are stored in `.sdd-forge/snapshots/` with a `manifest.json` index.

```bash
sdd-forge snapshot save
sdd-forge snapshot check
sdd-forge snapshot update
```

#### translate

Translates the primary-language `docs/` files into each additional language listed in `output.languages`. When `output.mode` is `"generate"`, each language version is generated independently rather than translated.

| Option | Description |
|---|---|
| `--lang <code>` | Target a specific language code (e.g. `en`, `ja`) |
| `--force` | Overwrite existing translated files |
| `--dry-run` | Preview changes without writing to disk |

```bash
sdd-forge translate
sdd-forge translate --lang en --force
sdd-forge translate --dry-run
```

#### upgrade

Updates the bundled template files in `docs/` to match the current preset version. Useful after upgrading the `sdd-forge` package to pick up new template structures.

```bash
sdd-forge upgrade
```

#### setup

Registers the current directory as a project and generates `.sdd-forge/config.json` with sensible defaults. Prompts for project type, language settings, and AI agent configuration. Also creates `AGENTS.md` and a `CLAUDE.md` symlink.

```bash
sdd-forge setup
```

#### default

Sets the default project for the current working environment. The selected project name is written to the `default` field of `.sdd-forge/projects.json`.

```bash
sdd-forge default
```

#### spec

Creates a new spec directory (e.g. `specs/NNN-feature-name/`) with a blank `spec.md`, and checks out a new feature branch unless `--no-branch` is specified. Inside a git worktree, `--no-branch` is applied automatically.

| Option | Description |
|---|---|
| `--title <name>` | Title of the new spec (required) |
| `--no-branch` | Skip feature branch creation |

```bash
sdd-forge spec --title "Add CSV export"
sdd-forge spec --title "Fix pagination bug" --no-branch
```

#### gate

Checks a spec file against the defined gate criteria, validating that all required fields are populated and all open questions are resolved. Use `--phase post` to run the full post-implementation checklist.

| Option | Description |
|---|---|
| `--spec <path>` | Path to the target `spec.md` (required) |
| `--phase <pre\|post>` | Gate phase to run (default: `pre`) |

```bash
sdd-forge gate --spec specs/012-auth/spec.md
sdd-forge gate --spec specs/012-auth/spec.md --phase post
```

#### flow

Automates the full SDD workflow — from spec creation and gate checks through implementation guidance — based on a free-form request description. Wraps the same steps described in the SDD flow in `CLAUDE.md`.

```bash
sdd-forge flow --request "Add role-based access control to the admin panel"
```

#### presets

Lists all available presets discovered under `src/presets/`, including their key, canonical type path, architecture layer, and supported scan categories.

```bash
sdd-forge presets
```

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| Exit Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | General error (invalid arguments, missing config, file I/O failure, etc.) |
| `2` | Gate or review check returned FAIL (spec requirements not met or docs quality insufficient) |

**stdout / stderr conventions:**

| Stream | Content |
|---|---|
| `stdout` | Primary command output: generated text, table displays, PASS/FAIL results, dry-run previews |
| `stderr` | Progress indicators, warnings, and diagnostic messages |

The `gate` and `review` commands write their PASS or FAIL verdict to stdout, making them suitable for use in shell pipelines or CI scripts that inspect exit codes alongside output text. Informational messages such as "Running gate check…" or file-write confirmations are emitted to stderr and do not interfere with programmatic stdout consumers.

<!-- {{/text}} -->
