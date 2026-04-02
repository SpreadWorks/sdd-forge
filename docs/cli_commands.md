<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter is a complete reference for all `sdd-forge` CLI commands. The tool exposes over 40 commands organized under four standalone commands (`help`, `setup`, `upgrade`, `presets`), a `docs` namespace with 13 subcommands covering the full documentation pipeline, and a `flow` namespace with `prepare` plus three subgroups — `get` (8 keys), `set` (10 keys), and `run` (7 actions) — for managing Spec-Driven Development workflows.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display all available commands grouped by section | — |
| `setup` | Interactive wizard to initialize a new sdd-forge project | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Re-deploy skill files and apply `config.json` schema migrations | `--dry-run` |
| `presets list` | Print the full preset inheritance tree with axis, aliases, and scan keys | — |
| `docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents (→ translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan the source tree and generate `.sdd-forge/output/analysis.json` | — |
| `docs enrich` | AI-annotate analysis entries with role, summary, detail, and chapter classification | — |
| `docs init` | Write initial chapter Markdown files to `docs/` from the preset template chain | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `docs data` | Resolve `{{data(...)}}` directives in chapter files using the data resolver | `--dry-run` |
| `docs text` | Fill `{{text(...)}}` directives with AI-generated content | `--dry-run` |
| `docs readme` | Generate or update `README.md` from the preset template | `--lang`, `--output`, `--dry-run` |
| `docs forge` | Orchestrate AI documentation authoring with an iterative write–review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--dry-run`, `--verbose` |
| `docs review` | Validate documentation quality: directives, headings, line count, comment integrity | — |
| `docs translate` | Translate chapter files and README into configured target languages via AI | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate a Markdown changelog table from `specs/` directory metadata | `--dry-run` |
| `docs agents` | Generate and AI-refine `AGENTS.md` / `CLAUDE.md` for the project | `--dry-run` |
| `docs snapshot` | Snapshot the current docs state | — |
| `flow prepare` | Initialize a spec file, feature branch, and optional git worktree for a new flow | — |
| `flow get status` | Return phase, steps, requirements, metrics, and request from active flow state | — |
| `flow get issue` | Fetch a GitHub issue by number via `gh` and return structured metadata | — |
| `flow get prompt` | Return a predefined choice prompt object by kind (e.g., `plan.approach`) | — |
| `flow get context` | Read source or docs file content and record a read metric in flow state | — |
| `flow get check` | Check flow preconditions | — |
| `flow get guardrail` | Evaluate flow guardrail conditions | — |
| `flow get qa-count` | Return the current Q&A iteration count | — |
| `flow get resolve-context` | Resolve project context for skill use | — |
| `flow set issue` | Persist a GitHub issue number in `flow.json` | — |
| `flow set step` | Update the status of a named step | — |
| `flow set metric` | Increment a named phase metric counter | — |
| `flow set redo` | Record a redo event with reason and resolution | — |
| `flow set request` | Store the original feature request text | — |
| `flow set note` | Append a note to the flow state | — |
| `flow set req` | Update requirement status | — |
| `flow set summary` | Store a phase summary | — |
| `flow set auto` | Toggle auto-approve mode | — |
| `flow set test-summary` | Record unit/integration/acceptance test counts | `--unit`, `--integration`, `--acceptance` |
| `flow run sync` | Build docs, run review, then commit changed documentation files | `--dry-run` |
| `flow run finalize` | Run the finalization sequence (commit, merge/PR, cleanup, report) | — |
| `flow run review` | Run the code review step and update step status | — |
| `flow run gate` | Execute the spec gate check | — |
| `flow run lint` | Run the linting step | — |
| `flow run retro` | Run a retrospective analysis on the completed flow | — |
| `flow run impl-confirm` | Check implementation confirmation status | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

Only `--help` / `-h` is accepted by every command. The `--dry-run` flag is available on the majority of commands that write files or execute git operations. The table below covers options that appear across multiple unrelated commands.

| Option | Supported Commands | Description |
| --- | --- | --- |
| `--help`, `-h` | All commands | Print command-specific help text and exit with code `0` |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run sync` | Preview the operation without writing files or running git commands |
| `--verbose`, `-v` | `docs build`, `docs forge` | Stream detailed per-step or per-agent output to stderr |
| `--lang` | `docs init`, `docs readme`, `docs translate` | Override the output language code (e.g., `en`, `ja`) |
| `--force` | `docs build`, `docs init`, `docs translate` | Overwrite existing files or bypass up-to-date checks |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Prints a formatted list of all available sdd-forge commands grouped by section (Project, Docs, Flow, Info), along with the package version number. Invoking `sdd-forge` or `sdd-forge --help` with no subcommand produces identical output.

```
sdd-forge help
sdd-forge --help
```

#### setup

Launches an interactive multi-step wizard that collects project configuration and writes `.sdd-forge/config.json`. On completion it creates required directories (`docs/`, `specs/`, `.sdd-forge/output/`), updates `.gitignore` and `.gitattributes`, deploys skill files, and generates or updates `AGENTS.md`.

```
sdd-forge setup
sdd-forge setup --name my-project --path ./src --type node-cli --lang en
```

| Option | Description |
| --- | --- |
| `--name` | Project name |
| `--path` | Path to the source root |
| `--work-root` | Separate working root when different from the source path |
| `--type` | Preset type (e.g., `node-cli`, `laravel`, `symfony`) |
| `--purpose` | Documentation purpose: `developer-guide`, `user-guide`, or `api-reference` |
| `--tone` | Writing tone: `polite`, `formal`, or `casual` |
| `--agent` | Default AI agent identifier |
| `--lang` | Project language code |
| `--dry-run` | Preview configuration without writing files |

#### upgrade

Re-deploys all skill files from the installed package version and applies pending `config.json` schema migrations. Currently detects and converts legacy `chapters` string arrays to the object format used by current versions.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### presets list

Prints the full preset inheritance tree to stdout using box-drawing characters. Each node shows its key, axis, language, aliases, scan configuration, and whether a `templates/` directory exists.

```
sdd-forge presets list
```

#### docs build

Runs the full documentation generation pipeline sequentially: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`. When multi-language output is configured, a `translate` step is appended. Each step is weighted in a progress indicator printed to stderr. The `enrich` and `text` steps are skipped when no default agent is configured.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init` and regenerate `{{text}}` content in existing files |
| `--verbose` | Stream per-step agent output to stderr |
| `--dry-run` | Run the pipeline in preview mode without writing files |

#### docs scan

Scans the project source tree and writes `.sdd-forge/output/analysis.json`. This file is consumed by all subsequent pipeline steps.

```
sdd-forge docs scan
```

#### docs enrich

Passes the raw analysis data to the configured AI agent, which annotates each entry with a role, one-line summary, detail description, and chapter classification. The enriched data is written back to `analysis.json`. Skips gracefully if no default agent is configured.

```
sdd-forge docs enrich
```

#### docs init

Resolves the preset template chain for the configured type and writes initial chapter Markdown files to `docs/`. Existing files are skipped unless `--force` is provided. If an AI agent is configured and `config.chapters` is not explicitly set, it calls the agent to filter chapters based on analysis content and the configured documentation purpose.

```
sdd-forge docs init
sdd-forge docs init --type node-cli --force
sdd-forge docs init --lang ja --docs-dir docs/ja
```

| Option | Description |
| --- | --- |
| `--type` | Override the preset type |
| `--lang` | Override the output language |
| `--docs-dir` | Override the target output directory |
| `--force` | Overwrite files that already exist |
| `--dry-run` | Preview the operation without writing |

#### docs data

Reads each chapter file in `docs/` and resolves all `{{data(...)}}` directives by calling the appropriate resolver methods against the loaded analysis data. Writes the updated content back to each file.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### docs text

Fills all `{{text(...)}}` directives in chapter files by calling the configured AI agent. Before generation, stale directive content is stripped from each file to avoid accumulating outdated text across multiple runs.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### docs readme

Resolves the `README.md` template from the preset chain, applies `{{data}}` directives, fills any `{{text}}` directives with AI-generated content, and writes the result. The output path defaults to `README.md` in the project root. Per-language files can be generated by providing `--output`.

```
sdd-forge docs readme
sdd-forge docs readme --output docs/ja/README.md --lang ja
```

| Option | Description |
| --- | --- |
| `--lang` | Target language code |
| `--output` | Override the output file path |
| `--dry-run` | Print generated content without writing |

#### docs forge

Orchestrates AI documentation authoring with an iterative write–review loop. The agent is called once per target chapter file per round (up to `--max-runs`). After each round, the review command is run and its failure output is fed back to the agent as context in the next round. Supports three modes: `local` (per-file agent calls), `assist`, and `agent`.

```
sdd-forge docs forge --prompt "Improve the CLI commands chapter"
sdd-forge docs forge --prompt-file prompts/doc.txt --spec specs/041/spec.md --max-runs 2
```

| Option | Description |
| --- | --- |
| `--prompt` | Instruction text passed to the AI agent |
| `--prompt-file` | Path to a file whose contents are used as the prompt |
| `--spec` | Path to a `spec.md` file to include as context |
| `--max-runs` | Maximum write–review iterations (default: `3`) |
| `--review-cmd` | Shell command used for review (default: `sdd-forge docs review`) |
| `--mode` | Execution mode: `local`, `assist`, or `agent` |
| `--dry-run` | List target files without invoking the agent |
| `--verbose`, `-v` | Stream agent output to stderr |

#### docs review

Validates the `docs/` directory against a set of quality rules. For each chapter file, it checks: minimum line count (15 lines), presence of a top-level heading (`# `), unfilled `{{text}}` directives, unfilled `{{data}}` directives, broken HTML comment pairs, and residual block tags. Also verifies that `README.md` exists and that all configured translated language directories are non-empty. Exits with code `1` if any check fails.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### docs translate

Translates chapter files and `README.md` from the default language into each configured target language using the AI agent. Files whose translation target is newer than the source are skipped unless `--force` is set. Output is written to `docs/<lang>/` subdirectories, which are created automatically.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
| --- | --- |
| `--lang` | Translate into this specific language only |
| `--force` | Retranslate files even when the target is already up to date |
| `--dry-run` | List files that would be translated without writing |

#### docs changelog

Scans the `specs/` directory for numbered subdirectories, reads each `spec.md`, and extracts title, status, creation date, and input summary. Outputs a formatted Markdown table — a latest-per-series index and a full all-specs table — to `docs/change_log.md` by default.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### docs agents

Generates or updates `AGENTS.md` for the current project. Resolves `{{data}}` directives in the SDD section from the installed template, then calls the AI agent to produce refined project-specific content for the PROJECT block. The PROJECT block content is replaced in place; content outside the directive blocks is preserved.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### flow prepare

Initialises a new SDD flow by creating a spec file, an optional feature branch or git worktree, and writing `flow.json` to `.sdd-forge/` to track active flow state. This is the entry point for every new feature or fix workflow.

```
sdd-forge flow prepare
```

#### flow get

Reads a named value from the active flow state and writes a structured JSON envelope to stdout. Requires an active flow (`flow.json`) for most keys; `prompt` and `guardrail` work without one.

```
sdd-forge flow get status
sdd-forge flow get issue 42
sdd-forge flow get prompt plan.approach
sdd-forge flow get context src/docs.js
```

| Key | Description |
| --- | --- |
| `status` | Phase, steps, requirements, metrics, and request |
| `issue` | Fetch a GitHub issue by number via `gh` |
| `prompt` | Return a predefined choice prompt object by kind |
| `context` | Read a source or docs file and record a read metric |
| `check` | Evaluate flow preconditions |
| `guardrail` | Evaluate guardrail conditions |
| `qa-count` | Return the current Q&A iteration count |
| `resolve-context` | Resolve project context for skill use |

#### flow set

Writes a named value to the active `flow.json` and outputs a confirmation envelope. Used by skills to track progress, record events, and store metadata throughout the flow lifecycle.

```
sdd-forge flow set issue 42
sdd-forge flow set step implement done
sdd-forge flow set metric plan docsRead
sdd-forge flow set test-summary --unit 12 --integration 3 --acceptance 1
```

| Key | Description |
| --- | --- |
| `issue` | Associate a GitHub issue number with the flow |
| `step` | Update the status of a named step (`in_progress`, `done`) |
| `metric` | Increment a named counter for a flow phase |
| `redo` | Record a redo event with reason and resolution |
| `request` | Store the original feature request text |
| `note` | Append a free-text note |
| `req` | Update the status of a requirement |
| `summary` | Store a phase summary string |
| `auto` | Toggle auto-approve mode on or off |
| `test-summary` | Record unit, integration, and acceptance test counts |

#### flow run sync

Runs `docs build` followed by `docs review`, then stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md` and commits with the message `docs: sync documentation`. If no files changed, the commit step is skipped. Outputs a JSON envelope with the list of changed files.

```
sdd-forge flow run sync
sdd-forge flow run sync --dry-run
```

#### flow run finalize

Executes the end-of-flow finalization sequence managed by the finalize skill: commit, merge or PR creation, retrospective, documentation sync, and cleanup. Step status is managed entirely by the calling skill rather than by registry hooks.

```
sdd-forge flow run finalize
```

#### flow run review

Runs the code review step and updates the `review` step status in `flow.json` to `done` on success.

```
sdd-forge flow run review
```

#### flow run gate

Executes the spec gate check. Sets the `gate` step to `done` when the result is `pass`, or leaves it `in_progress` otherwise.

```
sdd-forge flow run gate
```

#### flow run retro

Runs a retrospective analysis on the completed flow, typically after the implementation phase. Does not own the finalize step; output is recorded separately.

```
sdd-forge flow run retro
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit codes**

| Code | Constant | Condition |
| --- | --- | --- |
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Unrecoverable error: missing config, unknown subcommand, pipeline failure, missing required argument, or git operation failure |

All commands that detect a fatal error call `process.exit(1)` (via `EXIT_ERROR`). Unknown subcommands in the `sdd-forge`, `docs`, `flow`, and `presets` dispatchers always exit with `1` after printing an error message to stderr.

**Output conventions**

| Stream | Usage |
| --- | --- |
| stdout | Human-readable command results; generated file previews (with `--dry-run`); help text; structured JSON envelopes from all `flow get`, `flow set`, and `flow run` commands |
| stderr | Progress indicators, step labels, warnings, and verbose agent output (`--verbose`) |

`flow get`, `flow set`, and `flow run` commands always write a single JSON line to stdout using the envelope format `{"ok": true|false, "group": "...", "command": "...", "data": {...}}`. Error envelopes include a `code` string and a `message` field.

The `docs build` command renders a weighted progress bar to stderr as each pipeline step begins and completes. Individual steps prefix log lines with `[step]` (e.g., `[text] WARN: ...`). The `--dry-run` flag suppresses all file writes but preserves all console output, allowing the intended changes to be inspected without side effects.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
