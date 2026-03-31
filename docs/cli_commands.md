<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The `sdd-forge` CLI exposes 6 top-level entry points: `help`, `setup`, `upgrade`, `presets`, `docs`, and `flow`, with version shortcuts handled directly by the main executable. Within that structure, the analyzed source defines 12 `docs` subcommands and three `flow` families (`get`, `set`, and `run`) with 19 analyzed nested keys or actions, so most behavior is organized under namespace-style subcommand trees rather than flat commands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Top-level dispatcher for version, help, namespace commands, and independent commands. | `-h`, `--help`, `-v`, `--version`, `-V` |
| `sdd-forge help` | Prints the formatted top-level help screen with grouped commands and localized descriptions. | None |
| `sdd-forge setup` | Initializes a project, writes `.sdd-forge/config.json`, prepares agent files, and deploys bundled skills. | `--dry-run`, `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang` |
| `sdd-forge upgrade` | Refreshes template-managed files, redeploys skills, and migrates legacy `chapters` config format. | `--dry-run` |
| `sdd-forge presets list` | Prints the preset inheritance tree with metadata such as aliases and scan keys. | None |
| `sdd-forge docs build` | Runs the full documentation pipeline: scan, enrich, init, data, text, README, AGENTS, and optional translation. | `--verbose`, `--dry-run`, `--force`, `--regenerate` |
| `sdd-forge docs scan` | Scans source files into `.sdd-forge/output/analysis.json` with incremental hash reuse and optional reset mode. | `--reset`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Uses an agent to add summaries, details, chapters, and roles to analysis entries. | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Initializes `docs/` from resolved templates for the selected type and language. | `--force`, `--dry-run`, `--type`, `--lang`, `--docs-dir` |
| `sdd-forge docs data` | Resolves `{{data}}` directives in chapter files using `analysis.json`. | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | Fills `{{text}}` directives in chapter files with agent-generated content. | `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | Generates `README.md` from the resolved template and current docs context. | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | Iteratively improves docs from a prompt, optional spec context, review feedback, and optional agent assistance. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Routed by the docs dispatcher and used by other commands as a review step. | Routed by `src/docs.js`; options are not shown in the analyzed source excerpt |
| `sdd-forge docs changelog` | Generates `docs/change_log.md` from `specs/` metadata. | `--dry-run` |
| `sdd-forge docs agents` | Creates or updates `AGENTS.md` by resolving directives and refining the project section with an agent. | `--dry-run` |
| `sdd-forge docs translate` | Translates generated chapter files and the root `README.md` into configured secondary languages. | `--dry-run`, `--force`, `--lang` |
| `sdd-forge flow` | Dispatcher for the `get`, `set`, and `run` flow families. | `-h`, `--help` |
| `sdd-forge flow get` | Lists readable flow keys and dispatches to a specific getter. | `-h`, `--help` |
| `sdd-forge flow get status` | Returns the active flow state in a normalized JSON envelope. | No extra options |
| `sdd-forge flow get check` | Checks prerequisites for implementation or finalization, dirty state, or `gh` availability. | Target argument: `impl`, `finalize`, `dirty`, or `gh` |
| `sdd-forge flow get context` | Returns filtered analysis entries or file content, with optional raw output. | `[path]`, `--raw` |
| `sdd-forge flow get guardrail` | Returns guardrail articles for a specific phase. | Phase argument: `draft`, `spec`, `impl`, `lint` |
| `sdd-forge flow get issue` | Fetches a GitHub issue through `gh issue view` and returns core fields as JSON. | Issue number argument |
| `sdd-forge flow get prompt` | Returns structured prompt definitions for plan, implementation, and finalize steps. | Prompt kind argument |
| `sdd-forge flow get qa-count` | Returns the current draft Q&A count from flow metrics. | No extra options |
| `sdd-forge flow set` | Lists writable flow keys and dispatches to a specific setter. | `-h`, `--help` |
| `sdd-forge flow set issue` | Stores the current GitHub issue number in flow state. | Issue number argument |
| `sdd-forge flow set metric` | Increments a named metric counter for a given phase. | Phase and counter arguments |
| `sdd-forge flow set note` | Appends a free-form note to `flow.json`. | Note text argument |
| `sdd-forge flow set redo` | Appends a structured redo entry to `redolog.json` for the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Updates one indexed requirement status in the active flow. | Requirement index and status |
| `sdd-forge flow set request` | Stores the original user request text in flow state. | Request text argument |
| `sdd-forge flow set step` | Updates the status of a workflow step in the active flow. | Step id and status |
| `sdd-forge flow set summary` | Replaces the active flow requirements list from a JSON array argument. | JSON array argument |
| `sdd-forge flow run` | Lists executable flow actions and dispatches to a specific runner. | `-h`, `--help` |
| `sdd-forge flow run prepare-spec` | Creates a branch or worktree when needed, scaffolds the spec directory, and writes initial flow state. | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Runs the review wrapper that executes the lower-level AI review command and returns a JSON envelope. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Runs the docs synchronization pipeline: build, review, stage, and commit. | `--dry-run` |
| `sdd-forge flow run finalize` | Executes selected finalization steps such as commit, merge or PR, sync, cleanup, and record. | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope | Behavior |
| --- | --- | --- |
| `-h`, `--help` | Top-level CLI, `docs`, `flow`, `flow get`, `flow set`, `flow run`, and many leaf commands that use `parseArgs()` | Marks `help: true` and causes the command to print usage text instead of running its normal action. |
| `-v`, `--version`, `-V` | Top-level `sdd-forge` only | Prints the package version and exits successfully. |
| `--` | Commands that use the shared `parseArgs()` helper | Ignored by the parser rather than treated as an option or positional separator. |

No other option is shared by all commands. Flags such as `--dry-run`, `--stdout`, `--force`, `--lang`, and `--verbose` recur across multiple commands, but they are command-specific rather than global.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge <command>`

This is the main entry point. It handles `-v`/`--version`/`-V`, routes help requests to `help.js`, dispatches `docs` and `flow` as namespace commands, and maps `setup`, `upgrade`, `presets`, and `help` to independent scripts.

Examples:
- `sdd-forge --help`
- `sdd-forge --version`
- `sdd-forge docs build`
- `sdd-forge flow get status`

#### `sdd-forge help`
Usage: `sdd-forge help`

Prints the formatted top-level help screen with grouped sections for Project, Docs, Flow, and Info. The output is localized through the translation layer and includes the package version.

Example:
- `sdd-forge help`

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`

Initializes a project for SDD Forge by creating `.sdd-forge/`, `docs/`, and `specs/`, writing `.sdd-forge/config.json`, updating `.gitignore` and `.gitattributes`, deploying skills, and optionally creating `AGENTS.md` or `CLAUDE.md`.

Options:
- `--dry-run`
- `--name <name>`
- `--path <path>`
- `--work-root <path>`
- `--type <preset[,preset...]>`
- `--purpose <purpose>`
- `--tone <tone>`
- `--agent <agent>`
- `--lang <lang>`

Examples:
- `sdd-forge setup`
- `sdd-forge setup --name my-project --type base,node-cli --purpose user-guide --tone formal --agent codex --lang en`

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`

Refreshes template-managed project files by redeploying bundled skills and migrating legacy `chapters` arrays from `string[]` to object form when needed.

Options:
- `--dry-run`

Examples:
- `sdd-forge upgrade`
- `sdd-forge upgrade --dry-run`

#### `sdd-forge presets list`
Usage: `sdd-forge presets list`

Prints the preset inheritance tree. Each node can show metadata such as label, axis, language, aliases, scan keys, and whether a preset has a `templates/` directory.

Examples:
- `sdd-forge presets list`
- `sdd-forge presets --help`

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [options]`

Runs the composite documentation pipeline. In the analyzed implementation, it executes scan, optional enrich, init unless `--regenerate` is used, data population, text generation, README generation, AGENTS generation, and optional translation or per-language generation.

Options:
- `--verbose`
- `--dry-run`
- `--force`
- `--regenerate`

Examples:
- `sdd-forge docs build`
- `sdd-forge docs build --dry-run --verbose`
- `sdd-forge docs build --force`

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`

Scans project files into `.sdd-forge/output/analysis.json` using preset data sources and incremental hash reuse. It also supports resetting stored hashes by category so entries are reparsed on the next scan.

Options:
- `--reset [category[,category...]]`
- `--stdout`
- `--dry-run`

Examples:
- `sdd-forge docs scan`
- `sdd-forge docs scan --stdout`
- `sdd-forge docs scan --reset`
- `sdd-forge docs scan --reset modules,commands`

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`

Reads `analysis.json` and asks a configured agent to add `summary`, `detail`, `chapter`, and `role` metadata. The command batches files, retries failed batches, applies chapter validation, and saves progress back into the analysis file.

Options:
- `--dry-run`
- `--stdout`

Examples:
- `sdd-forge docs enrich`
- `sdd-forge docs enrich --dry-run`
- `sdd-forge docs enrich --stdout`

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`

Initializes the `docs/` directory by resolving the preset template chain for the selected type and language. It can optionally filter chapters with an agent when `config.chapters` is not explicitly fixed.

Options:
- `--type <type>`
- `--lang <lang>`
- `--docs-dir <dir>`
- `--force`
- `--dry-run`

Examples:
- `sdd-forge docs init`
- `sdd-forge docs init --type node-cli --lang en`
- `sdd-forge docs init --force --dry-run`

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`

Resolves `{{data}}` directives in generated chapter files using `.sdd-forge/output/analysis.json`. It applies file-aware resolution rules for directives such as `lang.links`, `docs.langSwitcher`, and `docs.nav`.

Options:
- `--dry-run`
- `--stdout`
- `--docs-dir <dir>`

Examples:
- `sdd-forge docs data`
- `sdd-forge docs data --dry-run`
- `sdd-forge docs data --stdout --docs-dir docs/ja`

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`

Fills `{{text}}` directives in chapter files with agent-generated content. The implementation supports batch file-level generation, per-directive generation, selective regeneration, and filtering by directive id.

Options:
- `--dry-run`
- `--per-directive`
- `--force`
- `--timeout <ms>`
- `--id <directive-id>`
- `--docs-dir <dir>`
- `--files <file[,file...]>`

Examples:
- `sdd-forge docs text`
- `sdd-forge docs text --dry-run`
- `sdd-forge docs text --per-directive`
- `sdd-forge docs text --id d0 --files cli_commands.md`

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`

Generates the project root `README.md` from the resolved README template, the current docs context, and optional `{{text}}` fills. It supports language-aware output and no-op detection when the file content does not change.

Options:
- `--lang <lang>`
- `--output <path>`
- `--dry-run`

Examples:
- `sdd-forge docs readme`
- `sdd-forge docs readme --dry-run`
- `sdd-forge docs readme --lang ja --output docs/ja/README.md`

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [options]`

Runs an iterative documentation-improvement loop driven by a user prompt, optional spec context, review feedback, and optional agent assistance. The command can prepopulate directives, invoke an agent per file or in one combined pass, run a review command, and retry only failing files.

Options:
- `--prompt <text>`
- `--prompt-file <path>`
- `--spec <path>`
- `--max-runs <n>`
- `--review-cmd <command>`
- `--mode <local|assist|agent>`
- `--verbose`
- `--dry-run`

Examples:
- `sdd-forge docs forge --prompt "Improve the CLI chapter for end users"`
- `sdd-forge docs forge --prompt-file prompt.md --spec specs/001-example/spec.md`
- `sdd-forge docs forge --mode assist --max-runs 3 --review-cmd "sdd-forge docs review"`

#### `sdd-forge docs review`
Usage: `sdd-forge docs review`

This subcommand is routed by `src/docs.js` and is used by other workflows such as `docs forge` and `flow run sync`. The analyzed excerpt does not include its implementation, so only its routed presence and usage as a review step are visible here.

Examples:
- `sdd-forge docs review`

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output] [options]`

Scans `specs/` and generates `docs/change_log.md` by extracting titles, dates, status, and linked markdown files from each spec directory. The default output path is `docs/change_log.md` when no positional output file is supplied.

Options:
- `--dry-run`

Examples:
- `sdd-forge docs changelog`
- `sdd-forge docs changelog docs/change_log.md --dry-run`

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [options]`

Creates or updates `AGENTS.md`. It resolves embedded `{{data}}` directives, loads generated docs and README content, and refines the `agents.project` section through a configured agent while preserving the SDD section.

Options:
- `--dry-run`

Examples:
- `sdd-forge docs agents`
- `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`

Translates generated chapter files and the root `README.md` from the default language into configured secondary languages. Translation is skipped for up-to-date targets unless `--force` is used.

Options:
- `--lang <lang>`
- `--force`
- `--dry-run`

Examples:
- `sdd-forge docs translate`
- `sdd-forge docs translate --lang ja`
- `sdd-forge docs translate --force --dry-run`

#### `sdd-forge flow`
Usage: `sdd-forge flow <subcommand>`

The flow namespace routes to registered subcommands and prints help from the flow registry. The analyzed usage text shows the `get`, `set`, and `run` families.

Examples:
- `sdd-forge flow --help`
- `sdd-forge flow get status`
- `sdd-forge flow set step approach done`
- `sdd-forge flow run merge --auto`

#### `sdd-forge flow get`
Usage: `sdd-forge flow get <key> [options]`

Lists readable flow keys and dispatches to the corresponding implementation. The analyzed keys are `status`, `check`, `context`, `guardrail`, `issue`, `prompt`, and `qa-count`.

Keys and examples:
- `status`: `sdd-forge flow get status`
- `check <impl|finalize|dirty|gh>`: `sdd-forge flow get check impl`
- `context [path] [--raw]`: `sdd-forge flow get context docs/cli_commands.md --raw`
- `guardrail <draft|spec|impl|lint>`: `sdd-forge flow get guardrail impl`
- `issue <number>`: `sdd-forge flow get issue 123`
- `prompt <kind>`: `sdd-forge flow get prompt plan.approach`
- `qa-count`: `sdd-forge flow get qa-count`

#### `sdd-forge flow set`
Usage: `sdd-forge flow set <key> [args]`

Lists writable flow keys and dispatches to state-mutating subcommands. The analyzed keys are `issue`, `metric`, `note`, `redo`, `req`, `request`, `step`, and `summary`.

Keys and examples:
- `issue <number>`: `sdd-forge flow set issue 123`
- `metric <phase> <counter>`: `sdd-forge flow set metric draft question`
- `note "<text>"`: `sdd-forge flow set note "Checked branch strategy"`
- `redo --step <id> --reason <text> [...]`: `sdd-forge flow set redo --step test --reason "Spec changed"`
- `req <index> <status>`: `sdd-forge flow set req 0 done`
- `request "<text>"`: `sdd-forge flow set request "Add a new export command"`
- `step <id> <status>`: `sdd-forge flow set step implement done`
- `summary '<json-array>'`: `sdd-forge flow set summary '["CLI option parsing","README update"]'`

#### `sdd-forge flow run`
Usage: `sdd-forge flow run <action> [options]`

Lists executable flow actions and dispatches to runner commands. The analyzed actions are `prepare-spec`, `review`, `sync`, and `finalize`.

Actions and examples:
- `prepare-spec [--title <name>] [--base <branch>] [--worktree] [--no-branch] [--dry-run]`: `sdd-forge flow run prepare-spec --title "CLI docs update" --worktree`
- `review [--dry-run] [--skip-confirm]`: `sdd-forge flow run review --dry-run`
- `sync [--dry-run]`: `sdd-forge flow run sync`
- `finalize [--mode <all|select>] [--steps <1,2,...>] [--merge-strategy <squash|pr>] [--message <msg>] [--dry-run]`: `sdd-forge flow run finalize --mode select --steps 1,2,4 --merge-strategy squash`

#### Internal flow command modules used by runners
The analyzed source also includes lower-level flow command modules invoked directly by runners: `flow/commands/cleanup.js`, `flow/commands/merge.js`, and `flow/commands/review.js`. These modules implement cleanup, merge or PR creation, and AI-assisted code review logic, but the public namespace described by the analyzed dispatchers is `flow get`, `flow set`, and `flow run`.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Scope | Explicit exit code behavior | Output conventions |
| --- | --- | --- |
| `sdd-forge` top level | `0` for version and help; `1` for unknown commands. | Version and help go to stdout; unknown-command messages go to stderr with a help hint. |
| `sdd-forge help` | No explicit error path in the analyzed file. | Prints a formatted help screen to stdout, including ANSI styling. |
| `sdd-forge docs` dispatcher | Help exits `0` when requested explicitly and `1` when no subcommand is supplied; unknown subcommands exit `1`. | Usage/help text is printed to stderr in the dispatcher; unknown-command messages also go to stderr. |
| `sdd-forge docs build` | Explicit `0` on success and `1` on pipeline failure or invalid regenerate precondition. | Progress and warnings are logged through the progress logger, while terminal build errors are printed as `[build] ERROR: ...`. |
| `sdd-forge docs readme` | No explicit nonzero exit in the analyzed file. | Dry-run mode prints a separator and the generated README to stdout; status messages are logged through the command logger. |
| `sdd-forge docs changelog` | No explicit nonzero exit in the analyzed file. | Dry-run writes generated markdown to stdout and the dry-run path message to stderr; normal mode prints a generated message. |
| `sdd-forge flow` dispatcher | `0` for explicit help, `1` for missing subcommand, `1` for unknown subcommand. | Help goes to stdout; unknown-command errors go to stderr. |
| `sdd-forge flow get` / `set` / `run` dispatchers | `0` for explicit help, `1` for missing or unknown key/action. | Help goes to stdout; unknown-key or unknown-action messages go to stderr. |
| Envelope-based flow leaf commands | Most analyzed `flow get`, `flow set`, and `flow run` leaf commands do not call `process.exit()` directly for validation failures; instead they emit structured fail envelopes. | Success and failure are returned in a machine-readable envelope format through the shared `ok` / `fail` / `output` helpers. |
| `flow get context --raw` | Sets `process.exitCode = 1` when the requested file or `analysis.json` is missing in raw mode. | Raw mode writes plain text to stdout and plain error text to stderr; non-raw mode returns an envelope. |
| `flow/commands/cleanup.js` | Exits `1` when no active flow exists. | Dry-run prints the exact Git commands it would run; normal mode prints plain completion text. |
| `flow/commands/merge.js` | Exits `1` when no active flow exists or when `--pr` is requested without `gh`; spec-only mode prints a skip message and returns without merging. | Dry-run prints the exact Git or `gh` commands; live mode uses inherited stdio for Git and `gh` execution. |
| `flow/commands/review.js` | Exits `1` when there is no active flow or config cannot be loaded. | Progress counts are printed to stderr; approved proposals and user-facing guidance are printed to stdout; results are written to `review.md`. |
| `flow run review` wrapper | Returns a fail envelope when the wrapped review command exits nonzero. | Parses stderr from the wrapped command for proposal counts and saved path, and returns a normalized envelope on stdout. |
| Commands that rely on `parseArgs()` | Unknown options throw an `Unknown option` error unless a command handles that exception. | Help flags are normalized into `help: true`; option parsing itself does not print output. |

| Stream or pattern | Observed convention |
| --- | --- |
| Stdout for generated content | Used for rendered documents, dry-run document bodies, raw file content, and JSON or envelope responses. |
| Stderr for operational logs | Common for progress logs, warning logs, dry-run path notices, and unknown-command errors. |
| JSON or envelope output | Flow getter, setter, and runner commands favor structured output for automation. |
| Plain text output | Top-level help, docs help, preset tree output, review summaries, and raw-mode flow context output use plain text. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
