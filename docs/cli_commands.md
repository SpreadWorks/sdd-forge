# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
This chapter documents all 20 CLI commands available in sdd-forge, covering project setup, documentation generation, spec management, and SDD workflow automation. Commands are routed through a three-layer dispatch architecture: the top-level entry point (`sdd-forge.js`) delegates to one of five dispatchers (`docs`, `spec`, `flow`, `presets-cmd`, `help`), which in turn load the appropriate implementation module.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| Command | Dispatcher | Description | Key Options |
|---|---|---|---|
| `help` | `help.js` | Display all available commands with descriptions | — |
| `setup` | `docs` | Interactive project registration and config generation | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | Upgrade template-derived skill files to the current sdd-forge version | `--dry-run` |
| `default [name]` | `docs` | List registered projects or set the default project | `[name]` positional arg |
| `build` | `docs` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | Initialize `docs/` from preset templates | `--force`, `--dry-run` |
| `forge` | `docs` | Iteratively improve docs using AI based on a prompt and spec | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | Run quality checks against the review checklist | — |
| `changelog` | `docs` | Generate `change_log.md` from `specs/` directories | — |
| `agents` | `docs` | Update `AGENTS.md` with SDD and project sections | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | Generate `README.md` from docs content | `--dry-run` |
| `translate` | `docs` | Translate default-language docs to configured non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | Analyse source code and write `.sdd-forge/output/analysis.json` | — |
| `enrich` | `docs` | Enrich `analysis.json` entries with AI-generated roles, summaries, and chapter classifications | `--agent` |
| `data` | `docs` | Resolve all `{{data}}` directives in `docs/` files | `--dry-run` |
| `text` | `docs` | Resolve all `{{text}}` directives in `docs/` files using an AI agent | `--agent`, `--dry-run` |
| `spec` | `spec` | Create a numbered feature branch and initialise `specs/NNN-slug/spec.md` | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | Validate a spec file for unresolved items before (or after) implementation | `--spec`, `--phase` |
| `flow` | `flow` (direct) | Automate the full SDD flow: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd` (direct) | Display the preset inheritance tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
The following options are handled by `sdd-forge.js` before any subcommand is dispatched and apply regardless of which command is invoked.

| Option | Short | Description |
|---|---|---|
| `--project <name>` | — | Select a registered project by name. Sets `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` environment variables for the duration of the command. |
| `--version` | `-v`, `-V` | Print the installed sdd-forge package version and exit. |
| `--help` | `-h` | Display the top-level command list. When passed to an individual command, show that command's own help text. |

> **Note:** `--project` is silently stripped from `process.argv` before the subcommand arguments are forwarded to the dispatcher, so individual command modules never see it.
<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

Prints all available commands grouped by section (Project, Build, Docs, Scan, Spec, Flow, Info) along with a one-line description for each, sourced from the i18n `ui:help.commands.*` keys. The package version is read from `package.json` at runtime.

```
sdd-forge help
sdd-forge          # no arguments also shows help
sdd-forge -h
```

#### setup

Launches an interactive wizard that registers a project, creates `.sdd-forge/config.json`, generates `AGENTS.md`, creates a `CLAUDE.md` symlink, and installs skill files under `.agents/skills/` and `.claude/skills/`. Each step can be supplied non-interactively via CLI flags.

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 --agent claude
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source code directory |
| `--work-root <path>` | Working root (defaults to source path) |
| `--type <preset>` | Preset identifier (e.g. `webapp/cakephp2`, `cli/node-cli`) |
| `--purpose <text>` | Documentation purpose description |
| `--tone <text>` | Documentation tone |
| `--agent <name>` | Default AI agent name |
| `--lang <code>` | Output language code |
| `--set-default` | Mark this project as the default |
| `--dry-run` | Show what would be written without writing |

#### upgrade

Upgrades template-managed files — specifically the skill `SKILL.md` files under `.agents/skills/` — to match the templates bundled with the currently installed sdd-forge version. Safe to run repeatedly; only overwrites template-derived content and never touches `config.json`.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

Without arguments, lists all registered projects and marks the current default. With a project name, changes the default.

```
sdd-forge default               # list projects
sdd-forge default myapp         # set "myapp" as default
```

#### build

Executes the full documentation generation pipeline in order: `scan → enrich → init → data → text → readme → agents`. If `output.isMultiLang` is `true` in the configuration, a `translate` (or per-language generate) step is appended. Progress is reported via a weighted progress bar.

```
sdd-forge build
sdd-forge build --agent claude --force --verbose
sdd-forge build --dry-run
```

| Option | Description |
|---|---|
| `--agent <name>` | AI agent to use for `enrich` and `text` steps (overrides `config.defaultAgent`) |
| `--force` | Force re-initialisation of existing docs files |
| `--verbose` | Show per-step log output |
| `--dry-run` | Skip all file writes |

#### init

Initialises (or re-initialises) `docs/` from the preset templates. Existing files are skipped unless `--force` is set.

```
sdd-forge init
sdd-forge init --force
```

#### forge

Iteratively improves `docs/` content by prompting an AI agent with the given `--prompt` and, optionally, a linked spec. Runs up to `--max-runs` iterations until the review passes.

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| Option | Description |
|---|---|
| `--prompt <text>` | Improvement request (required) |
| `--spec <path>` | Path to the spec file for context |
| `--max-runs <n>` | Maximum improvement iterations (default: 5) |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | Override the configured default agent |
| `--dry-run` | Skip writes |

#### review

Runs quality checks against the review checklist (`templates/review-checklist.md`) and reports any issues found in `docs/`. Exits non-zero if the check fails.

```
sdd-forge review
```

#### changelog

Reads all `specs/NNN-*/spec.md` files and generates or updates `change_log.md` in the project root.

```
sdd-forge changelog
```

#### agents

Updates `AGENTS.md` with the latest SDD section (from the `agents.sdd` data source) and/or the project section (from `agents.project`). Defaults to updating both sections.

```
sdd-forge agents
sdd-forge agents --sdd            # update SDD section only
sdd-forge agents --project        # update project section only
sdd-forge agents --dry-run
```

#### readme

Generates `README.md` in the project root from the docs content and preset README template.

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

Translates the default-language `docs/` files into every non-default language configured in `output.languages`. Re-translates a file only when its source has a newer `mtime` than the existing translation, unless `--force` is set.

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| Option | Description |
|---|---|
| `--lang <code>` | Translate into this language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Show what would be translated without writing |

#### scan

Parses the source code under the configured `sourcePath` and writes structured analysis data to `.sdd-forge/output/analysis.json`.

```
sdd-forge scan
```

#### enrich

Reads `analysis.json` and uses an AI agent to annotate each entry with a `role`, `summary`, `detail`, and chapter classification. The enriched result is written back to `analysis.json`.

```
sdd-forge enrich --agent claude
```

#### data

Resolves all `{{data: …}}` directives in `docs/` files in place, replacing directive blocks with generated Markdown. Skips `{{text}}` blocks without re-processing them.

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

Calls an AI agent for each `{{text: …}}` directive found in `docs/` files and inserts the generated text. Only directives with no existing body (or with a stale body when `--force` is used) are processed.

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

Creates a numbered feature branch (`feature/NNN-slug`) and scaffolds `specs/NNN-slug/spec.md` and `specs/NNN-slug/qa.md`. Supports three branching strategies: branch (default), worktree, or spec-only.

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| Option | Description |
|---|---|
| `--title <text>` | Feature name — used for branch/directory slug (required) |
| `--base <branch>` | Base branch (defaults to current HEAD) |
| `--no-branch` | Create spec files only, no branch |
| `--worktree` | Create an isolated git worktree under `.sdd-forge/worktree/` |
| `--allow-dirty` | Skip the working-tree cleanliness check |
| `--dry-run` | Print what would be created without writing |

#### gate

Validates a `spec.md` file for completeness before (`--phase pre`, default) or after (`--phase post`) implementation. Checks for unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked task items, required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`), and the `- [x] User approved this spec` approval marker.

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| Option | Description |
|---|---|
| `--spec <path>` | Path to the spec file (required) |
| `--phase pre\|post` | Validation phase; `pre` skips task-item checks in Acceptance Criteria sections |

#### flow

Automates the complete SDD flow: creates a spec (if `--spec` is not given), runs `gate`, and — on gate success — runs `forge`. Exits with code `2` and prints `NEEDS_INPUT` when gate fails, listing up to eight blocking issues.

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| Option | Description |
|---|---|
| `--request <text>` | The user's change request (required) |
| `--title <text>` | Spec title slug (derived from `--request` if omitted) |
| `--spec <path>` | Use an existing spec instead of creating one |
| `--agent <name>` | AI agent to pass to `forge` |
| `--max-runs <n>` | Maximum `forge` iterations (default: 5) |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent` (default: `local`) |
| `--no-branch` | Create spec without a new branch |
| `--worktree` | Create an isolated git worktree |
| `--dry-run` | Skip writes in spec-init and forge steps |

#### presets list

Displays the full preset inheritance tree, showing arch-level nodes and their leaf presets together with aliases and configured scan categories.

```
sdd-forge presets list
sdd-forge presets          # also shows the list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| Exit Code | Meaning | Typical Source |
|---|---|---|
| `0` | Success | Normal completion of any command |
| `1` | General error | Unknown subcommand, missing required argument, file not found, AI agent failure, gate error thrown as exception |
| `2` | Gate check failed (blocking) | `flow` command when `gate` exits non-zero |

**stdout conventions**

Informational progress messages, generated Markdown previews (dry-run), and final success summaries are written to `stdout`. The `build` command uses a weighted progress bar (via `createProgress()`) that prints step labels and optionally verbose per-step logs when `--verbose` is set. Commands that produce structured output (e.g. `default` listing projects, `presets list` showing the tree) write their formatted text directly to `stdout`.

**stderr conventions**

Error messages — including unknown command notices, missing `--spec` warnings, gate failure reason lists, and pipeline step errors — are written to `stderr` via `console.error()`. The `flow` command forwards both `stdout` and `stderr` from its child processes (`spec init`, `gate`, `forge`) so that all output remains visible to the caller.

**dry-run output**

When `--dry-run` is active, commands print `[dry-run]`-prefixed lines describing each write operation that would occur, then exit `0` without modifying the filesystem.
<!-- {{/text}} -->
