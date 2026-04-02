<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides more than 20 CLI commands organized into a two-tier structure: four independent top-level commands (`help`, `setup`, `upgrade`, `presets`) and two namespace dispatchers — `docs` with 13 subcommands covering the full documentation pipeline, and `flow` with three command groups (`get`, `set`, `run`) for managing spec-driven development workflows.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Print all available commands with descriptions | — |
| `setup` | Interactive wizard to initialize a new project | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Re-deploy skill files and apply `config.json` schema migrations | `--dry-run` |
| `presets list` | Print the preset inheritance tree | — |
| `docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan source files and produce `analysis.json` | — |
| `docs enrich` | AI-enrich analysis entries with roles, summaries, and chapter assignments | — |
| `docs init` | Initialize `docs/` with chapter template files | `--type`, `--force`, `--dry-run` |
| `docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `docs text` | Fill `{{text}}` directives via AI agent | `--dry-run` |
| `docs readme` | Generate or update `README.md` from the preset template | `--lang`, `--output`, `--dry-run` |
| `docs forge` | AI-driven iterative documentation authoring with a write-review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `docs review` | Validate documentation quality: directives, line count, and coverage | — |
| `docs translate` | Translate docs into configured target languages using AI | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate a Markdown changelog from `specs/` directories | `--dry-run` |
| `docs agents` | Generate or refine `AGENTS.md` / `CLAUDE.md` using AI | `--dry-run` |
| `flow prepare` | Initialize a spec file and create a feature branch or worktree | — |
| `flow get status` | Read full flow state including phase, steps, and metrics | — |
| `flow get prompt <kind>` | Retrieve predefined choice prompts for a given phase/step key | — |
| `flow get issue <number>` | Fetch GitHub issue metadata via `gh` | — |
| `flow set issue <number>` | Associate a GitHub issue number with the current flow | — |
| `flow set step <id> <status>` | Update the status of a workflow step | — |
| `flow set metric <phase> <counter>` | Increment a phase metric counter | — |
| `flow set note <text>` | Append a note to the flow's notes array | — |
| `flow set auto on\|off` | Enable or disable autoApprove mode | — |
| `flow run finalize` | Orchestrate commit, merge/PR, retro, docs sync, and cleanup | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `flow run lint` | Run guardrail lint checks on changed files | `--base`, `--dry-run` |
| `flow run sync` | Trigger docs build and commit the result | `--dry-run` |
| `flow run retro` | Evaluate spec accuracy by comparing requirements to the git diff | `--dry-run` |
| `flow run review` | Run AI-driven code quality review with proposal and verdict output | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
| --- | --- | --- |
| `--help`, `-h` | All commands | Print command usage and available options, then exit with code 0 |
| `--dry-run` | `setup`, `upgrade`, all `docs` commands, all `flow run` actions | Preview changes without writing any files to disk |
| `--verbose`, `-v` | `docs build`, `docs forge` | Enable detailed progress output during pipeline execution |
| `--lang` | `docs init`, `docs readme`, `docs translate` | Override the output language (e.g. `en`, `ja`) |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `help`

Prints a formatted list of all available commands grouped by section, along with the current package version. Invoked automatically when `sdd-forge` is run without arguments or with `--help`.

**Usage:** `sdd-forge help`

No options are accepted.

#### `setup`

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, source path, language, preset type, documentation purpose, and AI agent provider. Writes `config.json` to `.sdd-forge/`, creates project directories, updates `.gitignore` and `.gitattributes`, deploys skill files, and generates `AGENTS.md`.

**Usage:** `sdd-forge setup [options]`

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source path |
| `--type <type>` | Preset type |
| `--lang <lang>` | Project language (e.g. `en`, `ja`) |
| `--agent <provider>` | AI agent provider |
| `--dry-run` | Preview without writing files |

#### `upgrade`

Re-deploys skill files from the installed package and applies any pending `config.json` schema migrations (e.g. converting `chapters` string arrays to object format). Safe to run after a package update to keep skill files in sync.

**Usage:** `sdd-forge upgrade [--dry-run]`

| Option | Description |
| --- | --- |
| `--dry-run` | Show what would be updated without writing |

#### `presets list`

Prints the full preset inheritance tree to stdout using box-drawing characters. Shows each preset's key, axis, language, aliases, scan keys, and whether a `templates/` directory is present.

**Usage:** `sdd-forge presets list`

No options are accepted.

#### `docs build`

Runs the complete documentation pipeline in sequence: `scan → enrich → init → data → text → readme → agents`, with an optional `translate` step for multi-language configurations. AI-dependent steps (`enrich`, `text`) are silently skipped if no `defaultAgent` is configured. Displays a weighted progress bar for each step.

**Usage:** `sdd-forge docs build [options]`

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip the `init` step and regenerate text for existing files |
| `--verbose` | Show detailed step-level output |
| `--dry-run` | Preview pipeline steps without writing files |

#### `docs scan`

Scans the source directory using the project's preset scan configuration and writes `analysis.json` to `.sdd-forge/output/`. This file is the required input for all subsequent pipeline steps.

**Usage:** `sdd-forge docs scan`

#### `docs enrich`

Passes `analysis.json` to an AI agent to annotate each entry with a `role`, `summary`, `detail`, and chapter classification. Requires `defaultAgent` to be configured in `config.json`.

**Usage:** `sdd-forge docs enrich`

#### `docs init`

Creates chapter Markdown files in `docs/` by resolving the preset template chain for the configured type. Skips files that already exist unless `--force` is passed. When `config.chapters` is not set and an AI agent is available, uses AI to filter chapters based on analysis content and `docs.style.purpose`.

**Usage:** `sdd-forge docs init [options]`

| Option | Description |
| --- | --- |
| `--type <type>` | Override the preset type |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Print intended actions without writing |

#### `docs data`

Resolves all `{{data(...)}}` directives in chapter files by calling the appropriate preset resolver methods, then writes the updated content back to each file in place. With `--dry-run`, prints resolved output to stdout without modifying files.

**Usage:** `sdd-forge docs data [--dry-run]`

#### `docs text`

Fills `{{text(...)}}` directives in chapter files by invoking an AI agent per file with a system prompt derived from documentation style and analysis data. Operates concurrently across files according to `config.concurrency`. Requires `defaultAgent` to be configured.

**Usage:** `sdd-forge docs text [--dry-run]`

#### `docs readme`

Generates `README.md` (or a per-language README for multi-language projects) from the preset README template. Resolves `{{data}}` directives and optionally fills `{{text}}` blocks via AI. Skips writing if the generated content is identical to the existing file.

**Usage:** `sdd-forge docs readme [options]`

| Option | Description |
| --- | --- |
| `--lang <lang>` | Target language for template resolution |
| `--output <path>` | Custom output path (default: `README.md`) |
| `--dry-run` | Print generated content without writing |

#### `docs forge`

Runs an iterative AI-driven documentation authoring loop across all chapter files. In each round the agent writes content; then `docs review` is executed and any failures are fed back as `reviewFeedback` for the next round, up to `--max-runs`. Supports three modes: `local` (per-file concurrent agent calls), `assist`, and `agent`.

**Usage:** `sdd-forge docs forge --prompt "<text>" [options]`

| Option | Description |
| --- | --- |
| `--prompt <text>` | Instruction for the AI agent (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Load prompt text from a file |
| `--spec <path>` | Path to a `spec.md` file to include as context |
| `--max-runs <n>` | Maximum write-review rounds (default: 3) |
| `--mode <mode>` | `local`, `assist`, or `agent` (default: `local`) |
| `--review-cmd <cmd>` | Review command to run after each round (default: `sdd-forge docs review`) |
| `--dry-run` | Skip agent calls; print target file list and exit |

#### `docs review`

Validates generated documentation. For each chapter file, checks: minimum 15 lines, H1 heading presence, unfilled `{{text}}` directives, unfilled `{{data}}` directives, exposed directive syntax, broken HTML comments, and residual block tags. Also verifies `README.md` existence, translation directories for multi-language projects, and `analysis.json` entry coverage. The `docs-dir` argument defaults to `docs/`.

**Usage:** `sdd-forge docs review [docs-dir]`

#### `docs translate`

Translates existing chapter files and `README.md` into all configured target languages using an AI agent. Skips files where the target is newer than the source unless `--force` is set. Creates per-language subdirectories under `docs/` automatically. Concurrency is controlled by `config.concurrency`.

**Usage:** `sdd-forge docs translate [options]`

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate even when the target file is up to date |
| `--dry-run` | Show what would be translated without writing |

#### `docs changelog`

Scans `specs/` for numbered subdirectories (`NNN-name` or `bak.NNN-name`), reads each `spec.md`, and extracts title, status, created date, and description. Outputs a Markdown file with a latest-by-series index table and a full history table. Default output path is `docs/change_log.md`.

**Usage:** `sdd-forge docs changelog [out-file] [--dry-run]`

#### `docs agents`

Generates or updates `AGENTS.md` in the source root. Creates the file with directive stubs if absent. Resolves `{{data("agents.sdd")}}` (SDD template section) and `{{data("agents.project")}}` (project-specific section) directives, then calls an AI agent to refine the PROJECT section using `package.json` scripts, generated docs content, and `README.md` as context. Content outside directive blocks is preserved.

**Usage:** `sdd-forge docs agents [--dry-run]`

#### `flow prepare`

Initializes a new SDD flow by creating a spec file under `specs/`, writing the initial `flow.json` state, and optionally creating a feature branch or git worktree for isolated development. Requires `config.json` to be present.

**Usage:** `sdd-forge flow prepare [options]`

#### `flow get <key>`

Reads a value from the active flow state and emits a structured JSON envelope to stdout. Supported keys:

- **`status`** — Full flow state including phase, steps progress, requirements progress, branch info, metrics, and notes.
- **`prompt <kind>`** — Predefined choice prompts for a given phase/step key (e.g. `plan.approach`, `finalize.mode`, `impl.review-mode`).
- **`issue <number>`** — Fetch GitHub issue title, body, labels, and state via `gh issue view`.

**Usage:** `sdd-forge flow get status | prompt <kind> | issue <number>`

#### `flow set <key>`

Persists a value into the active `flow.json`. Supported keys:

- **`issue <number>`** — Associate a GitHub issue number with the current flow.
- **`step <id> <status>`** — Update the status of a named workflow step.
- **`metric <phase> <counter>`** — Increment a phase metric counter such as `docsRead`, `srcRead`, `question`, or `redo`.
- **`note <text>`** — Append a free-text note to the flow's notes array.
- **`auto on|off`** — Enable or disable autoApprove mode for the flow session.

**Usage:** `sdd-forge flow set <key> [args]`

#### `flow run <action>`

Executes a named flow pipeline action. Supported actions:

- **`finalize`** — Orchestrates commit, merge or PR creation, retrospective, docs sync, workspace cleanup, and session record. Accepts `--mode all|select`, `--steps <1,2,...>`, `--merge-strategy squash|pr`, and `--message`.
- **`lint`** — Runs guardrail lint checks on files changed relative to the base branch. Accepts `--base <branch>`.
- **`sync`** — Triggers `docs build`, runs `docs review`, stages docs files, and commits with `docs: sync documentation`.
- **`retro`** — Evaluates spec accuracy by comparing stated requirements against the actual git diff.
- **`review`** — Runs AI-driven code quality review: generates refactoring proposals, merges verdicts, and optionally applies approved patches.

**Usage:** `sdd-forge flow run <action> [options]`

All actions support `--dry-run` to preview operations without side effects.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Condition |
| --- | --- | --- |
| `0` | — | Command completed successfully, or `--help` was requested |
| `1` | `EXIT_ERROR` | Unknown subcommand, missing required argument, pipeline failure, or unrecoverable runtime error |

**stdout conventions:** Progress messages and generated content are written to stdout via `console.log`. `flow get`, `flow set`, and `flow run` commands emit a structured JSON envelope to stdout in the form `{"group":"<group>","command":"<cmd>","status":"ok"|"fail","data":{...}}`. Failure envelopes include a `code` string and a `message` field.

**stderr conventions:** Warning messages (prefixed `WARN:`) and error details (prefixed `ERROR:`) are written to stderr via `console.error`. Within `docs build`, skipped AI steps emit `WARN:` lines to stderr. The `--verbose` flag routes additional step-level output to stderr.

**`--dry-run` behavior:** All commands that accept `--dry-run` skip file writes and subprocess invocations, instead printing intended actions to stdout, and then exit with code 0.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
