# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge exposes 22 commands organized into four namespaces — `docs`, `spec`, `flow`, and standalone commands — all invoked through a single entry point (`sdd-forge <command>`). The three namespace dispatchers (`docs`, `spec`, `flow`) each accept a subcommand as their first argument, while independent commands (`setup`, `upgrade`, `presets`, `help`) operate without a namespace prefix.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Description | Key Options |
|---|---|---|
| `help` | Display all available commands with descriptions | — |
| `setup` | Initialize a project for sdd-forge | — |
| `upgrade` | Update skill files to the current sdd-forge version template | `--dry-run` |
| `docs build` | Run the full documentation pipeline (scan→enrich→init→data→text→readme→agents→[translate]) | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | Scan source code and produce `analysis.json` | — |
| `docs enrich` | Enrich `analysis.json` with AI-generated role, summary, and chapter classification | `--agent` |
| `docs init` | Initialize `docs/` chapter files from preset templates | `--force`, `--dry-run` |
| `docs data` | Populate `{{data}}` directives in chapter files | `--dry-run` |
| `docs text` | Generate `{{text}}` sections in chapter files via AI agent | `--agent`, `--dry-run` |
| `docs readme` | Generate `README.md` from docs content | `--dry-run` |
| `docs forge` | Iteratively improve docs via AI edit → review → feedback cycle | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | Review generated documentation for quality issues | — |
| `docs translate` | Translate default-language docs to configured non-default languages | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate a changelog from git history | — |
| `docs agents` | Generate or update `AGENTS.md` / `CLAUDE.md` | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | Create a snapshot of the current docs state | `--dry-run` |
| `spec init` | Create a numbered feature branch and initialize `spec.md` / `qa.md` | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | Validate `spec.md` for unresolved items and run guardrail compliance checks | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | Initialize or update the project's `guardrail.md` | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | Run the full SDD flow: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | Display or update the active SDD flow state | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | Display the available preset inheritance tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following flags are recognized by the top-level entry point (`sdd-forge.js`) before any subcommand dispatch occurs.

| Option | Aliases | Description |
|---|---|---|
| `--version` | `-v`, `-V` | Print the installed sdd-forge version and exit. |
| `--help` | `-h` | Display the command list and exit with code 0. Passing no arguments produces the same output. |

Most subcommands also accept `--help` / `-h` locally after the subcommand name (e.g., `sdd-forge docs forge --help`). This per-command help is handled inside each command's own argument parser, not at the top-level entry point.
<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # same as help
sdd-forge -h
```

Prints the full command list grouped by section (Project, Docs, Spec, Flow, Info) with one-line descriptions. The display language is controlled by the `lang` field in `.sdd-forge/config.json` and defaults to `en`.

#### setup

```
sdd-forge setup
```

Bootstraps a new project for sdd-forge. Creates the `.sdd-forge/` configuration directory, writes a starter `config.json`, generates `AGENTS.md`, and creates the `CLAUDE.md` symbolic link.

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

Updates bundled skill files (`.agents/skills/*/SKILL.md` and the corresponding `.claude/skills/*/SKILL.md` symlinks) to match the templates shipped with the currently installed version of sdd-forge. Existing symbolic links are replaced with real files before the new content is written. If `--dry-run` is provided, changes are printed to the console without being written. The command also checks `config.json` for missing `systemPromptFlag` settings and prints a hint if any are absent.

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

Runs the complete documentation generation pipeline in sequence: `scan → enrich → init → data → text → readme → agents → [translate]`. A progress bar tracks each step's weight. When `output.isMultiLang` is `true` in config, a `translate` step is appended and non-default languages are generated. If no `defaultAgent` is configured and `--agent` is not supplied, the `enrich` and `text` steps are skipped with a warning.

| Option | Description |
|---|---|
| `--agent <name>` | Override the AI agent for enrich and text steps. |
| `--force` | Pass `--force` through to the `init` step (overwrite existing chapter files). |
| `--dry-run` | Run all steps without writing files. |
| `--verbose` | Show agent stdout/stderr output in real time. |

#### docs scan

```
sdd-forge docs scan
```

Analyzes the project source tree according to the active preset's scanner configuration and writes the result to `.sdd-forge/output/analysis.json`. This file is consumed by all subsequent pipeline steps.

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

Reads the raw `analysis.json` produced by `scan`, passes all entries to an AI agent in a single call, and writes back role, summary, detail, and chapter-classification fields to each entry. Enrichment is required for the `text` step to produce accurate output.

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

Creates the `docs/` directory and populates it with chapter Markdown files derived from the active preset's template set. Existing files are left unchanged unless `--force` is passed.

#### docs data

```
sdd-forge docs data [--dry-run]
```

Resolves all `{{data: <source>.<method>}}` directives in chapter files by calling the corresponding `DataSource` methods with the current `analysis.json`. Results are written in-place between the directive and `{{/data}}` markers.

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

Calls the configured AI agent for each `{{text: <instruction>}}` directive found in the chapter files and writes the generated content in-place. Only directives that do not yet have body text (or are explicitly flagged for regeneration) are processed.

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

Assembles a `README.md` at the project root from the generated chapter files. Existing `README.md` content outside managed sections is preserved.

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

Runs an iterative AI edit → review → feedback cycle on the docs chapter files. Each round the agent rewrites chapters, then `review` is executed; files that fail the review are passed back to the agent for the next round. The cycle repeats up to `--max-runs` times (default: 3). When `--spec` is provided, only chapters relevant to that spec are targeted.

| Option | Default | Description |
|---|---|---|
| `--prompt` | `""` | Natural-language instruction for the agent. |
| `--prompt-file` | `""` | Path to a file containing the prompt. |
| `--spec` | `""` | Path to a `spec.md`; limits scope to relevant chapters. |
| `--max-runs` | `3` | Maximum edit–review cycles. |
| `--review-cmd` | `sdd-forge review` | Command used to run the review step. |
| `--agent` | config default | Agent name override. |
| `--mode` | `local` | `local` uses deterministic patching; `assist` adds AI suggestions; `agent` delegates fully to the AI. |
| `--dry-run` | `false` | Skip file writes. |
| `--verbose` | `false` | Stream agent output to stderr. |

#### docs review

```
sdd-forge docs review
```

Checks the current state of the `docs/` chapter files against the project's `review-checklist.md` and reports any items that do not pass. Exit code is non-zero when review fails.

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

Translates chapter files and `README.md` from the default language to every non-default language listed in the `output.languages` config array. Translation uses mtime comparison to skip files that are already up to date. Only active when `output.mode` is `"translate"`.

| Option | Description |
|---|---|
| `--lang <code>` | Restrict translation to a single target language. |
| `--force` | Re-translate all files regardless of mtime. |
| `--dry-run` | Print what would be translated without writing. |

#### docs changelog

```
sdd-forge docs changelog
```

Generates or updates `docs/changelog.md` from the git commit history, grouping entries by version tag.

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

Creates or updates `AGENTS.md` (and the `CLAUDE.md` symlink) with SDD workflow instructions and project-specific context. When neither `--sdd` nor `--project` is specified, both sections are processed.

| Option | Description |
|---|---|
| `--sdd` | Update only the SDD section of `AGENTS.md`. |
| `--project` | Update only the PROJECT section of `AGENTS.md`. |
| `--dry-run` | Print the output without writing. |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

Writes a timestamped snapshot of the current `docs/` directory to `.sdd-forge/snapshots/`. Useful for preserving docs state before a major forge run.

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

Creates a sequentially numbered feature branch (`feat/NNN-<slug>`) and writes `specs/NNN-<slug>/spec.md` and `qa.md` from the preset template. The numeric index is derived from existing `specs/` subdirectories and git branch names.

| Option | Description |
|---|---|
| `--title <text>` | Human-readable title; slugified to form the branch and directory name. |
| `--no-branch` | Create the spec files without switching git branches. |
| `--worktree` | Create a new git worktree for isolated development. |
| `--allow-dirty` | Skip the working-tree cleanliness check. |
| `--dry-run` | Print actions without creating files or branches. |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

Validates `spec.md` before or after implementation. Checks for unresolved tokens (`[NEEDS CLARIFICATION]`, `TBD`, `TODO`, `FIXME`), unchecked task items (`- [ ]`), and required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`). If `guardrail.md` exists, also runs an AI compliance check against its articles. Exits with code 1 on any failure.

| Option | Description |
|---|---|
| `--spec <path>` | Path to the `spec.md` to validate (required). |
| `--phase` | `pre` (default) skips status/acceptance unchecked items; `post` checks everything. |
| `--skip-guardrail` | Skip the guardrail AI compliance check. |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

Manages the project's `guardrail.md`, which lists immutable architectural principles used by `spec gate` to validate specs. `init` writes the template (blocked if the file already exists unless `--force`). `update` passes the current `analysis.json` and existing guardrail content to an AI agent and appends newly suggested articles.

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

Orchestrates the full SDD flow: creates a spec (unless `--spec` is supplied), runs `spec gate`, saves the flow state to `.sdd-forge/flow.json`, then invokes `docs forge` with the provided request as the prompt. If the gate fails, failure reasons (up to 8 `- ` lines) are printed and the process exits with code 2.

| Option | Default | Description |
|---|---|---|
| `--request <text>` | — | User request text (required). |
| `--title <text>` | derived from `--request` | Title for the spec and branch. |
| `--spec <path>` | `""` | Existing spec path; skips `spec init`. |
| `--agent <name>` | config default | Agent override for forge. |
| `--max-runs <n>` | `5` | Maximum forge cycles. |
| `--forge-mode` | `local` | Forge mode: `local`, `assist`, or `agent`. |
| `--no-branch` | `false` | Create spec without a new branch. |
| `--worktree` | `false` | Use a git worktree for the feature branch. |
| `--dry-run` | `false` | Run without making changes. |

#### flow status

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --archive
```

Displays or modifies the active SDD flow state stored in `.sdd-forge/flow.json`. With no options, prints a formatted summary showing spec path, branches, step progress (✓ done / > in_progress / - skipped / space pending), and requirement progress. The `--archive` flag copies `flow.json` to the active spec directory and removes it from `.sdd-forge/`.

| Option | Description |
|---|---|
| `--step <id> --status <val>` | Update a named step's status. Valid step IDs are defined in `FLOW_STEPS`. |
| `--summary '<JSON>'` | Replace the requirements list with a JSON array of description strings. |
| `--req <index> --status <val>` | Update a single requirement by its zero-based index. |
| `--archive` | Move `flow.json` to the spec directory and clear it from `.sdd-forge/`. |

#### presets list

```
sdd-forge presets list
```

Prints the full preset inheritance tree to stdout. The tree begins at `base/`, followed by architecture-level nodes (`cli/`, `webapp/`, `library/`), and their leaf presets. Each node shows its label, aliases, and scan category keys.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### Exit Codes

| Code | Meaning | Typical Source |
|---|---|---|
| `0` | Success | Normal completion of any command. |
| `1` | General error | Unknown subcommand, missing required option, file not found, AI agent error, or gate check failure in `spec gate`. |
| `2` | Gate blocked | `flow start` when `spec gate` returns non-zero (unresolved spec items or guardrail failure). |

#### stdout / stderr Conventions

sdd-forge follows a consistent output convention across commands.

| Stream | Content |
|---|---|
| **stdout** | Structured user-facing output: formatted tables, generated file paths, progress summaries, help text, and version strings. |
| **stderr** | Operational log lines prefixed with `[<command>]` (e.g., `[forge]`, `[build]`, `[translate]`), progress-bar updates, per-step warnings (e.g., `WARN: no defaultAgent configured`), and error messages. |

Progress bars (used by `docs build`) write to stderr so that stdout output remains machine-readable when piped. Agent ticker dots (`.`) written during long-running AI calls also go to stderr. Commands that accept `--verbose` stream raw agent stdout and stderr in real time.

**`--dry-run` behavior:** When `--dry-run` is active, write operations are suppressed and a `DRY-RUN:` prefixed line is printed to stdout for each file that would have been created or modified.
<!-- {{/text}} -->
