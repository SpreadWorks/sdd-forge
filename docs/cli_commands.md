<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter covers the `sdd-forge` CLI, which provides approximately 20 top-level commands and subcommands organized into three namespaces: the root dispatcher, the `docs` namespace (documentation pipeline), and the `flow` namespace (Spec-Driven Development workflow). Commands follow a three-level dispatch pattern: `sdd-forge` → namespace dispatchers (`docs.js`, `flow.js`) → individual command modules.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display help and list all available commands | — |
| `sdd-forge setup` | Interactive wizard to initialize a project | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Deploy skills and migrate config to latest format | `--dry-run` |
| `sdd-forge presets list` | Print the preset inheritance tree | — |
| `sdd-forge docs build` | Run full docs build pipeline (scan→enrich→init→data→text→readme→agents→translate) | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Analyze source files and generate `analysis.json` | — |
| `sdd-forge docs enrich` | Enrich analysis entries with AI-assigned roles and chapter classifications | — |
| `sdd-forge docs init` | Initialize docs directory structure from preset templates | `--type`, `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Populate `{{data}}` directives in chapter files from analysis | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives with AI-generated content | `--dry-run` |
| `sdd-forge docs readme` | Generate or update `README.md` from the preset readme template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven iterative documentation authoring with write-review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Validate documentation quality and completeness | — |
| `sdd-forge docs translate` | Translate chapter files to configured target languages concurrently | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate a Markdown changelog from `specs/` directory metadata | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` with AI-refined project context | `--dry-run` |
| `sdd-forge flow prepare` | Initialize a spec document and create a feature branch or worktree | — |
| `sdd-forge flow get <key>` | Read flow state values (`status`, `prompt`, `issue`) | — |
| `sdd-forge flow set <key>` | Update flow state values (`issue`, `test-summary`, `metric`) | — |
| `sdd-forge flow run <action>` | Execute named flow actions (`finalize`, `sync`, `retro`, `review`) | `--mode`, `--steps`, `--merge-strategy`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Description | Applicable Commands |
|---|---|---|
| `--help` / `-h` | Display help for the command and exit with code `0` | All commands |
| `--dry-run` | Preview actions without writing files or executing side effects | Most commands (`setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run finalize`, `flow run sync`, `flow cleanup`, `flow merge`) |
| `--verbose` / `-v` | Enable verbose logging and stream agent output to stderr | `docs build`, `docs forge` |
| `--lang` | Override the output language for documentation generation | `docs init`, `docs readme`, `docs translate` |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Prints a formatted list of all available commands grouped by category (Project, Docs, Flow, Info), including localized descriptions. Displays the package version.

**Usage:** `sdd-forge help`

#### `sdd-forge setup`

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, source path, language, preset type, documentation purpose and tone, and AI agent provider. Writes `config.json` to `.sdd-forge/`, creates required directories, updates `.gitignore` and `.gitattributes`, deploys skill files, and creates or updates `AGENTS.md`.

**Usage:** `sdd-forge setup [options]`

| Option | Description |
|---|---|
| `--name <name>` | Project name (skips prompt) |
| `--path <path>` | Source root path (skips prompt) |
| `--work-root <path>` | Working root directory |
| `--type <type>` | Preset type (skips prompt) |
| `--purpose <purpose>` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone <tone>` | Documentation tone |
| `--agent <provider>` | AI agent provider |
| `--lang <lang>` | Project language |
| `--dry-run` | Preview configuration without writing files |

#### `sdd-forge upgrade`

Re-deploys skill files from the current package version and applies any required `config.json` schema migrations (e.g., migrating `chapters` from string array to object array format). Reports each skill file as updated or unchanged.

**Usage:** `sdd-forge upgrade [--dry-run]`

| Option | Description |
|---|---|
| `--dry-run` | Show what would be updated without writing |

#### `sdd-forge presets list`

Prints the full preset inheritance tree to stdout, showing each preset key, label, axis, language, aliases, scan configuration, and whether a `templates/` directory is present. Uses box-drawing characters for tree rendering.

**Usage:** `sdd-forge presets list`

#### `sdd-forge docs build`

Runs the full documentation generation pipeline sequentially: `scan → enrich → init → data → text → readme → agents`, followed by `translate` for multi-language configurations. Tracks weighted progress across all steps. Skips `enrich` and `text` steps when no `agent.default` is configured.

**Usage:** `sdd-forge docs build [options]`

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during `init` |
| `--regenerate` | Skip `init` and regenerate text in existing chapter files |
| `--dry-run` | Preview pipeline steps without writing files |
| `--verbose` | Enable verbose step-level logging |

#### `sdd-forge docs scan`

Scans the source directory according to the configured preset and writes `analysis.json` to `.sdd-forge/output/`. This is the first step in the documentation pipeline and must be run before any other `docs` commands.

**Usage:** `sdd-forge docs scan`

#### `sdd-forge docs enrich`

Sends the raw analysis to an AI agent to assign roles, summaries, detail descriptions, and chapter classifications to each entry. Requires `agent.default` to be configured; the `build` pipeline skips this step with a warning if no agent is available.

**Usage:** `sdd-forge docs enrich`

#### `sdd-forge docs init`

Initialises the `docs/` directory by resolving the preset template chain, merging chapter lists, and writing chapter Markdown files. Optionally uses an AI agent to filter chapters based on project analysis and documentation purpose. Skips existing files unless `--force` is passed.

**Usage:** `sdd-forge docs init [options]`

| Option | Description |
|---|---|
| `--type <type>` | Override preset type |
| `--lang <lang>` | Target output language |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

#### `sdd-forge docs data`

Resolves all `{{data(...)}}` directives in chapter files by invoking the preset resolver against `analysis.json` and writes populated content back to each chapter file.

**Usage:** `sdd-forge docs data [--dry-run]`

#### `sdd-forge docs text`

Fills all `{{text(...)}}` directives in chapter files by calling the configured AI agent with per-directive prompts. Operates concurrently across files according to the configured concurrency setting.

**Usage:** `sdd-forge docs text [--dry-run]`

#### `sdd-forge docs readme`

Generates or updates `README.md` (or a per-language README) by resolving the preset readme template, applying `{{data}}` directives, and optionally filling `{{text}}` directives with AI. Skips writing if generated content is identical to the existing file.

**Usage:** `sdd-forge docs readme [options]`

| Option | Description |
|---|---|
| `--lang <lang>` | Target output language |
| `--output <path>` | Custom output file path |
| `--dry-run` | Print generated content without writing |

#### `sdd-forge docs forge`

Orchestrates AI-driven documentation authoring using an iterative write-review loop. Supports three modes: `local` (per-file agent calls, default), `assist`, and `agent`. Runs up to `--max-runs` iterations, passing review failure output as feedback in subsequent rounds. Finalises by regenerating `README.md` and translations.

**Usage:** `sdd-forge docs forge [options]`

| Option | Description |
|---|---|
| `--prompt <text>` | User instruction for the AI agent (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Read prompt from a file |
| `--spec <path>` | Path to a `spec.md` to inject as context |
| `--max-runs <n>` | Maximum write-review iterations (default: `3`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--review-cmd <cmd>` | Review command to run between iterations (default: `sdd-forge docs review`) |
| `--dry-run` | Preview target files without running the agent |
| `--verbose` / `-v` | Stream agent stdout/stderr to the terminal |

#### `sdd-forge docs review`

Validates documentation quality by checking each chapter file for: minimum line count (15 lines), presence of an H1 heading, unfilled `{{text}}` directives, unfilled `{{data}}` directives, exposed directive syntax, broken HTML comments, and residual block tags. Also verifies `README.md` existence, multi-language docs completeness, and analysis entry coverage. Exits with `EXIT_ERROR` if any check fails.

**Usage:** `sdd-forge docs review [docs-dir]`

#### `sdd-forge docs translate`

Translates existing docs chapter files and `README.md` into all configured non-default languages using an AI agent. Skips files where the target is newer than the source unless `--force` is set. Runs translations concurrently per the configured concurrency setting. Creates language subdirectories under `docs/` automatically.

**Usage:** `sdd-forge docs translate [options]`

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate even if target files are newer than source |
| `--dry-run` | List files that would be translated without writing |

#### `sdd-forge docs changelog`

Scans the `specs/` directory for numbered subdirectories, extracts metadata (title, status, date, description) from each `spec.md`, and writes a formatted Markdown changelog table to `docs/change_log.md`. Groups entries by series and shows the latest version per series.

**Usage:** `sdd-forge docs changelog [out-file] [--dry-run]`

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` by resolving `{{data}}` directives in the SDD section and calling an AI agent to refine the PROJECT section using `package.json` scripts, generated docs content, and `README.md` as context. Creates a stub `AGENTS.md` if none exists.

**Usage:** `sdd-forge docs agents [--dry-run]`

#### `sdd-forge flow prepare`

Initializes a new spec document and creates a feature branch or git worktree for isolated development. Requires `config.json` to be present; exits with `EXIT_ERROR` if config is missing.

**Usage:** `sdd-forge flow prepare [options]`

#### `sdd-forge flow get <key>`

Reads a value from the current flow state (`flow.json`) and outputs a structured JSON envelope to stdout. Exits with `EXIT_ERROR` if no active flow exists.

**Usage:** `sdd-forge flow get <key>`

| Key | Description |
|---|---|
| `status` | Returns phase, steps array, requirements progress, branch names, metrics, and `autoApprove` flag |
| `prompt` | Returns a predefined prompt object (choices, description, recommendation) by language and kind |
| `issue` | Fetches GitHub issue metadata via `gh issue view --json` |

#### `sdd-forge flow set <key>`

Updates a value in the current flow state (`flow.json`) and outputs a structured JSON envelope confirming the change.

**Usage:** `sdd-forge flow set <key> [args]`

| Key | Arguments | Description |
|---|---|---|
| `issue <number>` | Positive integer | Associates a GitHub issue number with the current flow |
| `test-summary` | `--unit`, `--integration`, `--acceptance` | Records test counts by category |
| `metric` | Named counter | Updates a phase-level metric counter |

#### `sdd-forge flow run finalize`

Orchestrates the full close-out pipeline for a completed flow. In `all` mode runs all six steps in sequence; in `select` mode runs only the specified steps.

**Usage:** `sdd-forge flow run finalize [options]`

| Option | Description |
|---|---|
| `--mode <all\|select>` | Execution scope (required) |
| `--steps <1,2,...>` | Comma-separated step numbers for `select` mode (1=commit, 2=merge, 3=retro, 4=sync, 5=cleanup, 6=record) |
| `--merge-strategy <squash\|pr>` | Override merge strategy (default: auto-detect) |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview steps without executing |

#### `sdd-forge flow run sync`

Triggers a full `docs build`, runs `docs review`, stages changed documentation files, and commits them with the message `docs: sync documentation`. Skips the commit if there are no staged changes.

**Usage:** `sdd-forge flow run sync [--dry-run]`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Meaning | When Triggered |
|---|---|---|
| `0` | Success | Command completed without errors, or `--help` was displayed |
| `1` (`EXIT_ERROR`) | Failure | Unknown subcommand, pipeline error, missing config or flow state, invalid arguments, validation failure, or agent call failure |

**stdout conventions:**

| Command Group | Output Format |
|---|---|
| `flow get`, `flow set`, `flow run` | Single JSON envelope per invocation: `{"type":"ok","group":"...","key":"...","data":{...}}` on success, `{"type":"fail",...,"error":{"code":"...","message":"..."}}` on failure |
| `docs` commands | Plain-text progress lines prefixed with `[command-name]`, e.g. `[scan] done`, `[agents] refining...` |
| Top-level commands | Plain text written directly to stdout |
| `--dry-run` mode | Previews of file paths or commands that would be executed, written to stdout |

**stderr conventions:**

Error messages and usage errors are written to stderr via `console.error()`. During long-running AI agent calls in `docs forge`, progress tickers write dots to stderr when `--verbose` is not active. When `--verbose` is enabled, agent stdout and stderr are streamed directly to stderr.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
