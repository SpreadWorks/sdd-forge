<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents the complete CLI command reference for sdd-forge, covering four top-level commands (`help`, `setup`, `upgrade`, `presets`) and two namespace dispatchers — `docs` with 12 subcommands and `flow` with `prepare` plus three subcommand groups (`get`, `set`, `run`) — totalling more than 25 addressable commands. The `docs` namespace drives the full documentation pipeline, while the `flow` namespace manages the Spec-Driven Development workflow lifecycle.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `help` | Print all available commands grouped by category | — |
| `setup` | Interactive project setup wizard; writes `config.json`, deploys skills, and creates `AGENTS.md` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Re-deploy skill files and apply config schema migrations | `--dry-run` |
| `presets list` | Print the full preset inheritance tree to stdout | — |
| `docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents (→ translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan source files and write `analysis.json` to `.sdd-forge/output/` | — |
| `docs enrich` | AI-annotate each analysis entry with role, summary, detail, and chapter classification | — |
| `docs init` | Initialise `docs/` from preset templates; optionally AI-filter chapters | `--type`, `--force`, `--dry-run` |
| `docs data` | Resolve `{{data(...)}}` directives in chapter files using the analysis | `--dry-run` |
| `docs text` | Fill `{{text(...)}}` directives in chapter files using an AI agent | `--dry-run` |
| `docs readme` | Generate or update `README.md` from the preset template | `--lang`, `--output`, `--dry-run` |
| `docs forge` | Iterative AI-driven documentation authoring with a write-review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--verbose`, `--dry-run` |
| `docs review` | Validate documentation quality and exit non-zero on any failure | — |
| `docs translate` | Translate chapter files and README into configured target languages concurrently | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate a Markdown changelog table from `specs/` directories | `--dry-run` |
| `docs agents` | Generate or refine `AGENTS.md` with AI-enriched project context | `--dry-run` |
| `flow prepare` | Initialise spec directory, feature branch, and optional worktree | — |
| `flow get status` | Return current phase, steps, requirements, and progress as a JSON envelope | — |
| `flow get issue` | Fetch a GitHub issue by number via the `gh` CLI | — |
| `flow get prompt` | Retrieve a predefined flow prompt definition by language and kind key | — |
| `flow set issue` | Associate a GitHub issue number with the active flow | — |
| `flow set step` | Update the status of a named flow step | — |
| `flow set metric` | Record a phase-level counter (docsRead, srcRead, question, redo) | — |
| `flow set note` | Append a free-text note to the active flow | — |
| `flow set req` | Add or update a requirement entry in the flow state | — |
| `flow set test-summary` | Record unit/integration/acceptance test counts | `--unit`, `--integration`, `--acceptance` |
| `flow run sync` | Build docs, run review, stage, and commit as part of the finalize pipeline | `--dry-run` |
| `flow run review` | Run the code review step within the flow | — |
| `flow run retro` | Execute a retrospective evaluation of requirement completion | — |
| `flow run gate` | Run the spec gate check | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Description | Applicable To |
|---|---|---|
| `-h`, `--help` | Display help for the command and exit cleanly | All commands |
| `-v`, `--version`, `-V` | Print the installed sdd-forge version and exit | Top-level entry point only |
| `--dry-run` | Preview planned changes without writing files or executing side effects | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run sync`, `flow cleanup` |

Note: `--dry-run` is supported by most `docs` and `flow` commands but is not universally available. Commands such as `docs review`, `docs scan`, and `docs enrich` do not accept this flag. Each command's `--help` output confirms which options are supported.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `help`

Prints all available sdd-forge commands to stdout, grouped by category (Project, Docs, Flow, Info), with a short localised description for each entry. Also displays the installed package version.

```
sdd-forge help
```

#### `setup`

An interactive multi-step wizard that initialises a new sdd-forge project. Prompts for project name, source root path, output language(s), preset type(s), documentation purpose, writing tone, and AI agent provider. Writes `.sdd-forge/config.json`, creates `docs/` and `specs/` directories, adds entries to `.gitignore` and `.gitattributes`, deploys skill files, and generates `AGENTS.md` (updating only the SDD directive block if the file already exists).

| Option | Description |
|---|---|
| `--name <name>` | Project name (skips prompt) |
| `--path <path>` | Source root path |
| `--work-root <path>` | Work root path (defaults to source root) |
| `--type <type>` | Preset type key |
| `--purpose <purpose>` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone <tone>` | Writing tone (`polite`, `formal`, `casual`) |
| `--agent <agent>` | Default AI agent provider |
| `--lang <lang>` | Project language code (e.g. `en`, `ja`) |
| `--dry-run` | Print configuration without writing any files |

```
sdd-forge setup
sdd-forge setup --name myproject --type node-cli --lang en --dry-run
```

#### `upgrade`

Re-deploys all skill files from the current package version into the project's `.claude/skills/` and `.agents/skills/` directories, overwriting only files that have changed. Also reads `.sdd-forge/config.json` and applies any necessary schema migrations (for example, migrating a `chapters` string-array to the object format).

| Option | Description |
|---|---|
| `--dry-run` | Show planned changes without writing files |

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `presets list`

Prints the full preset inheritance tree to stdout using box-drawing characters. Each node shows the preset key, axis, language support, aliases, scan category keys, and whether a `templates/` directory is present. Useful for discovering available preset types before running `setup`.

```
sdd-forge presets list
```

#### `docs build`

Runs the complete documentation generation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`. When multi-language output is configured, a `translate` step is appended. Displays a weighted progress indicator for each step. The `enrich`, `text`, and `agents` steps are skipped if no default AI agent is configured.

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init` and regenerate text in existing chapter files |
| `--verbose` | Stream detailed per-step output |
| `--dry-run` | Preview pipeline steps without writing files |

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate
```

#### `docs scan`

Scans all source files under the configured source root and writes the resulting `analysis.json` to `.sdd-forge/output/`. This file is the primary input for all subsequent documentation commands. Re-running `scan` refreshes the analysis with the latest source state.

```
sdd-forge docs scan
```

#### `docs enrich`

Sends the raw `analysis.json` to an AI agent that annotates each entry with a `role`, `summary`, `detail`, and chapter classification. The enriched result is written back to `analysis.json`. This step substantially improves the quality of data and text generation in later pipeline steps. Skipped automatically in `docs build` if no default agent is configured.

```
sdd-forge docs enrich
```

#### `docs init`

Initialises the `docs/` directory by resolving chapter templates from the configured preset inheritance chain. Merges preset and config chapter lists, optionally calls an AI agent to filter out chapters not relevant to the analysis, and writes each Markdown file with block directives stripped. Files that already exist are skipped unless `--force` is passed.

| Option | Description |
|---|---|
| `--type <type>` | Override the preset type for template resolution |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Report what would be written without creating files |

```
sdd-forge docs init
sdd-forge docs init --type node-cli --force
```

#### `docs data`

Resolves all `{{data(...)}}` directives in chapter files by querying the data-source resolver with the current `analysis.json`. Populates the content between directive tags in-place. Must be run after `scan` (and ideally after `enrich`) to ensure fresh analysis data.

| Option | Description |
|---|---|
| `--dry-run` | Print resolved content to stdout without writing files |

```
sdd-forge docs data
```

#### `docs text`

Fills all `{{text(...)}}` directives in chapter files by invoking the configured AI agent. Processes files concurrently according to the project's concurrency setting. Strips previously filled content before each regeneration run to avoid stale text accumulation.

| Option | Description |
|---|---|
| `--dry-run` | Report which directives would be filled without invoking the agent |

```
sdd-forge docs text
```

#### `docs readme`

Generates or updates `README.md` by merging the preset's readme template, resolving `{{data}}` directives via the resolver, and filling any `{{text}}` blocks using an AI agent. Preserves the existing file unchanged if the generated content is identical. The output path can be overridden with `--output` for per-language readme variants.

| Option | Description |
|---|---|
| `--lang <lang>` | Target output language for template resolution |
| `--output <path>` | Override the output file path |
| `--dry-run` | Print the generated content without writing |

```
sdd-forge docs readme
sdd-forge docs readme --output docs/ja/README.md --lang ja
```

#### `docs forge`

Orchestrates iterative AI-driven documentation authoring. Runs an agent over all target chapter files, then executes the review command and feeds any failures back as context for the next round. Repeats up to `--max-runs` times. Supports three modes: `local` (independent per-file agent calls), `assist`, and `agent`. Finalises by regenerating `README.md`.

| Option | Description |
|---|---|
| `--prompt <text>` | Instruction text for the AI agent (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Path to a `spec.md` to include as additional context |
| `--max-runs <n>` | Maximum write-review rounds (default: `3`) |
| `--review-cmd <cmd>` | Review command to execute after each round (default: `sdd-forge docs review`) |
| `--mode <mode>` | Invocation mode: `local`, `assist`, or `agent` |
| `--verbose`, `-v` | Stream agent output to stderr in real time |
| `--dry-run` | List target files without generating any content |

```
sdd-forge docs forge --prompt "Expand all architecture descriptions"
sdd-forge docs forge --spec specs/042-feature/spec.md --max-runs 2 --mode local
```

#### `docs review`

Validates all chapter files against a set of quality checks: minimum line count (15 lines), presence of an H1 heading, no unfilled `{{text}}` or `{{data}}` directives, no broken HTML comments, and no residual block-template tags. Also verifies that `README.md` exists, that all configured translation language directories are populated, and that `analysis.json` is present. Exits with `EXIT_ERROR` if any check fails, making it suitable for use as a CI gate.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### `docs translate`

Translates source chapter files and `README.md` into each configured target language using an AI agent. Skips file pairs where the target is already newer than the source unless `--force` is set. Creates per-language subdirectories under `docs/` automatically and runs translations concurrently.

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Retranslate all files regardless of modification time |
| `--dry-run` | List translation tasks without calling the agent or writing files |

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

#### `docs changelog`

Scans `specs/` for numbered subdirectories, reads each `spec.md`, and extracts title, status, creation date, and description. Outputs a formatted Markdown table to `docs/change_log.md` by default. Includes both a latest-per-series index and a full entry listing across all spec directories.

| Option | Description |
|---|---|
| `--dry-run` | Print the generated Markdown to stdout without writing |

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### `docs agents`

Generates or updates `AGENTS.md` with AI-refined project context. Reads the existing file (or creates a stub), resolves `{{data}}` directives in the SDD section, then calls an AI agent to improve the PROJECT section using the project's generated docs, README, and `package.json` scripts as input. Writes the result back, preserving all content outside the PROJECT directive block.

| Option | Description |
|---|---|
| `--dry-run` | Print the generated content to stdout without writing |

```
sdd-forge docs agents
```

#### `flow prepare`

Initialises a new SDD flow by creating the spec directory structure, writing `flow.json`, and setting up the chosen work environment (git worktree, feature branch, or no branch). Called automatically by the plan-phase skill at the start of a new development flow.

```
sdd-forge flow prepare
```

#### `flow get status`

Returns the full current flow state as a structured JSON envelope, including the active spec path, base and feature branches, worktree flag, current phase (derived from completed steps), step and requirement progress counts, notes array, per-phase metrics, and merge strategy.

```
sdd-forge flow get status
```

#### `flow get issue`

Fetches a GitHub issue by number using the `gh` CLI and returns its title, body, labels, and state wrapped in a flow envelope. Requires `gh` to be installed and authenticated.

```
sdd-forge flow get issue 42
```

#### `flow get prompt`

Returns a predefined prompt definition (phase, step, description, recommendation, and choices array) keyed by language and kind. Used by skill scripts to present structured decision points to the user without embedding prompt text in the skills themselves.

```
sdd-forge flow get prompt plan.approach
sdd-forge flow get prompt impl.review-mode
```

#### `flow set issue`

Associates a GitHub issue number with the active flow by persisting it to `flow.json`. Typically called immediately after creating a GitHub issue so that the merge command can add a `fixes #N` reference to the commit or PR.

```
sdd-forge flow set issue 42
```

#### `flow set step`

Updates the status of a named step in the active flow (e.g. marking a step as `done` or `in-progress`). Used by skill scripts to advance the flow state machine as the development process progresses.

```
sdd-forge flow set step impl done
```

#### `flow set metric`

Increments or sets a named counter within the per-phase metrics tracked in `flow.json`. Supported keys include `docsRead`, `srcRead`, `question`, and `redo`. Metrics are aggregated by `flow/commands/report.js` into the final flow report.

```
sdd-forge flow set metric docsRead
sdd-forge flow set metric redo
```

#### `flow set note`

Appends a free-text note string to the `notes` array in the active `flow.json`. Notes accumulate across the flow lifecycle and are available to skill scripts for context.

```
sdd-forge flow set note "Discovered that the resolver needs refactoring"
```

#### `flow set test-summary`

Records unit, integration, and acceptance test counts into the flow state metrics. Any combination of the three flags is accepted. Values are validated as non-negative integers before being written.

| Option | Description |
|---|---|
| `--unit <n>` | Number of unit tests |
| `--integration <n>` | Number of integration tests |
| `--acceptance <n>` | Number of acceptance tests |

```
sdd-forge flow set test-summary --unit 24 --integration 8 --acceptance 3
```

#### `flow run sync`

Runs the documentation synchronisation pipeline as part of the finalize flow: executes `docs build`, validates the result with `docs review`, stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`, then commits with the message `docs: sync documentation`. Outputs a JSON envelope listing the changed files. If no files changed, the commit is skipped and the result is reported as `skipped`.

| Option | Description |
|---|---|
| `--dry-run` | Execute build and review but skip staging and committing |

```
sdd-forge flow run sync
sdd-forge flow run sync --dry-run
```

#### `flow run retro`

Executes a retrospective evaluation of requirement completion for the active flow. Computes completion rate and per-requirement status, and stores the result in the flow state for inclusion in the final report.

```
sdd-forge flow run retro
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit Codes**

| Code | Constant | Condition |
|---|---|---|
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Unknown command, missing required argument, pipeline step failure, validation failure, or missing active flow state |

**stdout / stderr Conventions**

| Output | Stream | Description |
|---|---|---|
| Progress messages and results | `stdout` via `console.log` | Used by all `docs` commands and most `flow` commands |
| Structured JSON envelopes | `stdout` | Used by all `flow get` and `flow run` commands; format: `{"type": "ok"|"fail", "command": "...", "key": "...", "data": {...}}` |
| Error messages | `stderr` via `console.error` | Fatal errors, unknown command notices, and missing-flow warnings |
| Dry-run preview | `stdout` | Commands with `--dry-run` print their planned output or file list to stdout instead of writing |
| Agent streaming output | `stderr` | Commands supporting `--verbose` stream raw agent stdout/stderr to the terminal's stderr |
| Pipeline progress bar | `stderr` | `docs build` renders a weighted progress indicator per step via `createProgress()` |

All `flow get` and `flow run` commands unconditionally write a single JSON envelope line to stdout; consuming scripts should parse this output and check the `type` field (`ok` or `fail`) rather than relying on the exit code alone.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
