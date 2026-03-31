<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The CLI exposes 6 top-level entry points: `help`, `setup`, `upgrade`, `presets`, `docs`, and `flow`, plus top-level version shortcuts. Below those entry points, the analyzed source defines 31 concrete subcommands: 12 under `docs`, 7 under `flow get`, 8 under `flow set`, and 4 under `flow run`, with `flow` acting as a nested command family and `docs build` orchestrating the full documentation pipeline.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Main entry point that dispatches top-level commands and supports help and version shortcuts. | `-h`, `--help`, `-v`, `-V`, `--version` |
| `sdd-forge help` | Prints the top-level help screen with grouped command listings. | None |
| `sdd-forge setup` | Initializes a project, writes `.sdd-forge/config.json`, prepares agent instruction files, and deploys bundled skills. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Refreshes template-managed project files, redeploys bundled skills, and migrates legacy `chapters` config format. | `--dry-run` |
| `sdd-forge presets list` | Prints the preset inheritance tree with aliases, scan metadata, and template availability. | None |
| `sdd-forge docs build` | Runs the full docs pipeline: scan, enrich, init, data, text, README, AGENTS, and optional translation. | `--agent`, `--force`, `--dry-run`, `--verbose`, `--regenerate` |
| `sdd-forge docs scan` | Scans source files into `.sdd-forge/output/analysis.json` with incremental hash-based reuse. | `--reset [categories]`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Uses an AI agent to add summaries, details, chapter assignment, and role metadata to analysis entries. | `--agent`, `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Initializes `docs/` chapter files from preset templates and optional AI chapter filtering. | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolves `{{data}}` directives in generated chapter files from `analysis.json`. | `--docs-dir`, `--stdout`, `--dry-run` |
| `sdd-forge docs text` | Fills `{{text}}` directives in docs chapters using an AI agent. | `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | Generates the project root `README.md` from templates, data directives, and optional AI text filling. | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iteratively improves docs from a user prompt, optional spec, and review feedback. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Runs documentation review checks after generation or editing. | Not detailed in the analyzed source |
| `sdd-forge docs changelog` | Builds `docs/change_log.md` from `specs/` metadata. | `--dry-run` |
| `sdd-forge docs agents` | Creates or updates `AGENTS.md` by resolving directives and refining the project section with an AI agent. | `--dry-run` |
| `sdd-forge docs translate` | Translates generated docs and README from the default language into configured target languages. | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow` | Dispatcher for the flow command family. | `-h`, `--help` |
| `sdd-forge flow get` | Dispatcher for read-only flow queries. | `-h`, `--help` |
| `sdd-forge flow get check` | Checks flow prerequisites, dirty worktree state, or `gh` availability. | Target argument: `impl`, `finalize`, `dirty`, `gh` |
| `sdd-forge flow get context` | Returns filtered analysis context or a file’s contents, with optional raw output. | `--raw` |
| `sdd-forge flow get guardrail` | Returns guardrail articles for a given phase. | Phase argument: `draft`, `spec`, `impl`, `lint` |
| `sdd-forge flow get issue` | Fetches a GitHub issue through `gh issue view`. | Issue number |
| `sdd-forge flow get prompt` | Returns structured prompt metadata for interactive flow steps. | Prompt kind argument |
| `sdd-forge flow get qa-count` | Returns the number of answered draft clarification questions. | None |
| `sdd-forge flow get status` | Returns the current flow state and progress in a JSON envelope. | None |
| `sdd-forge flow set` | Dispatcher for flow state updates. | `-h`, `--help` |
| `sdd-forge flow set issue` | Stores the current GitHub issue number in `flow.json`. | Issue number |
| `sdd-forge flow set metric` | Increments a named flow metric counter. | Phase and counter arguments |
| `sdd-forge flow set note` | Appends a free-form note to the active flow. | Note text |
| `sdd-forge flow set redo` | Appends a structured redo entry to `redolog.json` for the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Updates one requirement status by index. | Requirement index, status |
| `sdd-forge flow set request` | Stores the original user request text in the active flow. | Request text |
| `sdd-forge flow set step` | Updates the status of a named workflow step. | Step id, status |
| `sdd-forge flow set summary` | Replaces the requirements list from a JSON array argument. | JSON array argument |
| `sdd-forge flow run` | Dispatcher for executable flow actions. | `-h`, `--help` |
| `sdd-forge flow run prepare-spec` | Creates a branch or worktree if needed, scaffolds the spec directory, and writes initial flow state. | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Runs AI-assisted code review and returns a normalized JSON-envelope summary. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Runs docs sync as `build -> review -> add -> commit`. | `--dry-run` |
| `sdd-forge flow run finalize` | Executes finalization steps such as commit, merge or PR, docs sync, cleanup, and record. | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope | Meaning |
| --- | --- | --- |
| `-h`, `--help` | Shared across the top-level dispatcher, `docs`, `flow`, `flow get`, `flow set`, `flow run`, and most concrete commands that use the shared argument parser or explicit help handling | Prints command-specific usage information and exits without performing the main action. |
| `-v`, `-V`, `--version` | Top-level `sdd-forge` only | Prints the package version and exits successfully. |

There is no single operational option such as `--dry-run` or `--verbose` that is shared by every command. Those options are defined per command family and only appear where the source explicitly parses them.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge <command>`
Routes to `help`, `setup`, `upgrade`, `presets`, `docs`, or `flow`. It also accepts `-h`/`--help` and `-v`/`-V`/`--version`.
Examples: `sdd-forge help`, `sdd-forge docs build`, `sdd-forge flow get status`

#### `sdd-forge help`
Usage: `sdd-forge help`
Prints the grouped top-level help screen, including project, docs, flow, and info commands.
Example: `sdd-forge help`

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`
Initializes a project, creates `.sdd-forge` directories, writes config, optionally creates `AGENTS.md` or `CLAUDE.md`, and deploys bundled skills.
Options: `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run`
Examples: `sdd-forge setup --name my-project --type cli --purpose user-guide --tone formal`, `sdd-forge setup --dry-run`

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`
Refreshes template-managed project files by redeploying skills and migrating legacy `chapters` config entries when needed.
Options: `--dry-run`
Examples: `sdd-forge upgrade`, `sdd-forge upgrade --dry-run`

#### `sdd-forge presets list`
Usage: `sdd-forge presets list`
Prints the preset inheritance tree with metadata such as labels, aliases, scan keys, and missing-template markers.
Example: `sdd-forge presets list`

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [options]`
Runs the full documentation pipeline in order: `scan`, `enrich`, optional `init`, `data`, `text`, `readme`, `agents`, and optional translation handling.
Options: `--agent`, `--force`, `--dry-run`, `--verbose`, `--regenerate`
Examples: `sdd-forge docs build`, `sdd-forge docs build --verbose`, `sdd-forge docs build --regenerate`

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`
Scans source files into `.sdd-forge/output/analysis.json`, reuses unchanged entries by hash, and can reset stored hashes for selected categories.
Options: `--reset [categories]`, `--stdout`, `--dry-run`
Examples: `sdd-forge docs scan`, `sdd-forge docs scan --stdout`, `sdd-forge docs scan --reset`, `sdd-forge docs scan --reset modules,config`

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`
Uses a configured AI agent to add `summary`, `detail`, `chapter`, `role`, and optional app metadata to analysis entries.
Options: `--agent`, `--dry-run`, `--stdout`
Examples: `sdd-forge docs enrich`, `sdd-forge docs enrich --stdout`

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`
Initializes the `docs/` directory from resolved templates for the selected type and language, with optional AI-based chapter filtering when chapters are not fixed in config.
Options: `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run`
Examples: `sdd-forge docs init --type cli`, `sdd-forge docs init --force`, `sdd-forge docs init --lang ja`

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`
Resolves `{{data}}` directives inside docs chapter files from `analysis.json`, including file-aware link directives such as navigation and language switchers.
Options: `--docs-dir`, `--stdout`, `--dry-run`
Examples: `sdd-forge docs data`, `sdd-forge docs data --dry-run`, `sdd-forge docs data --docs-dir docs/ja`

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`
Fills `{{text}}` directives in generated chapters with AI-generated prose, using either batch file mode or per-directive mode.
Options: `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files`
Examples: `sdd-forge docs text`, `sdd-forge docs text --per-directive`, `sdd-forge docs text --id d1`, `sdd-forge docs text --files overview.md,cli_commands.md`

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`
Generates the root `README.md` from the resolved README template, populated data directives, and optional AI text fills.
Options: `--lang`, `--output`, `--dry-run`
Examples: `sdd-forge docs readme`, `sdd-forge docs readme --lang ja`, `sdd-forge docs readme --output docs/ja/README.md`

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [options]`
Runs an iterative docs-improvement loop from a prompt, optional spec, and review command, with modes `local`, `assist`, or `agent`.
Options: `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run`
Examples: `sdd-forge docs forge --prompt "Clarify the user workflow"`, `sdd-forge docs forge --prompt-file notes.txt --mode assist`, `sdd-forge docs forge --spec specs/001-example/spec.md`

#### `sdd-forge docs review`
Usage: `sdd-forge docs review`
This command is referenced by the help layout and by `docs forge` and `flow run sync`, where it serves as the validation step after doc generation. The analyzed source does not include its implementation details.
Example: `sdd-forge docs review`

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output-file] [options]`
Scans `specs/` and generates `docs/change_log.md`, including the latest spec in each series and an index of all spec files.
Options: `--dry-run`
Examples: `sdd-forge docs changelog`, `sdd-forge docs changelog docs/change_log.md --dry-run`

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [options]`
Creates or updates `AGENTS.md`, resolves embedded `{{data}}` directives, and optionally refines the project section with an AI agent.
Options: `--dry-run`
Examples: `sdd-forge docs agents`, `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`
Translates generated Markdown chapters and the root `README.md` from the default language into configured secondary languages.
Options: `--lang`, `--force`, `--dry-run`
Examples: `sdd-forge docs translate`, `sdd-forge docs translate --lang ja`, `sdd-forge docs translate --force`

#### `sdd-forge flow`
Usage: `sdd-forge flow <subcommand>`
Routes to the nested `get`, `set`, and `run` command families and prints family-level help when called without a subcommand.
Examples: `sdd-forge flow get status`, `sdd-forge flow set step implement done`, `sdd-forge flow run finalize --mode all`

#### `sdd-forge flow get`
Usage: `sdd-forge flow get <key> [options]`
Provides read-only access to flow state and helper data.
Keys in the analyzed source: `check`, `context`, `guardrail`, `issue`, `prompt`, `qa-count`, `status`
Example: `sdd-forge flow get status`

#### `sdd-forge flow get check`
Usage: `sdd-forge flow get check <impl|finalize|dirty|gh>`
Checks prerequisite steps for implementation or finalization, verifies whether the git worktree is clean, or confirms `gh` availability.
Examples: `sdd-forge flow get check impl`, `sdd-forge flow get check dirty`, `sdd-forge flow get check gh`

#### `sdd-forge flow get context`
Usage: `sdd-forge flow get context [path] [--raw]`
Without a path, returns filtered analysis entries. With a path, returns file content and records read metrics in `flow.json`.
Options: `--raw`
Examples: `sdd-forge flow get context`, `sdd-forge flow get context docs/overview.md --raw`

#### `sdd-forge flow get guardrail`
Usage: `sdd-forge flow get guardrail <draft|spec|impl|lint>`
Returns guardrail articles filtered to the requested phase.
Examples: `sdd-forge flow get guardrail draft`, `sdd-forge flow get guardrail impl`

#### `sdd-forge flow get issue`
Usage: `sdd-forge flow get issue <number>`
Fetches a GitHub issue through `gh issue view` and returns core fields as JSON-envelope output.
Example: `sdd-forge flow get issue 123`

#### `sdd-forge flow get prompt`
Usage: `sdd-forge flow get prompt <kind>`
Returns structured prompt definitions for interactive flow steps in the configured language.
Examples: `sdd-forge flow get prompt plan.approach`, `sdd-forge flow get prompt finalize.mode`

#### `sdd-forge flow get qa-count`
Usage: `sdd-forge flow get qa-count`
Returns how many clarification questions have been answered during the draft phase.
Example: `sdd-forge flow get qa-count`

#### `sdd-forge flow get status`
Usage: `sdd-forge flow get status`
Returns the current flow state, current phase, step progress, requirement progress, and metadata in a normalized JSON envelope.
Example: `sdd-forge flow get status`

#### `sdd-forge flow set`
Usage: `sdd-forge flow set <key> [args]`
Provides state-mutating subcommands for updating `flow.json` and related flow artifacts.
Keys in the analyzed source: `issue`, `metric`, `note`, `redo`, `req`, `request`, `step`, `summary`
Example: `sdd-forge flow set note "Need follow-up review"`

#### `sdd-forge flow set issue`
Usage: `sdd-forge flow set issue <number>`
Stores the current flow’s GitHub issue number.
Example: `sdd-forge flow set issue 123`

#### `sdd-forge flow set metric`
Usage: `sdd-forge flow set metric <phase> <counter>`
Increments a metric counter. Valid phases are `draft`, `spec`, `gate`, `test`, and `impl`; valid counters are `question`, `redo`, `docsRead`, and `srcRead`.
Examples: `sdd-forge flow set metric draft question`, `sdd-forge flow set metric impl docsRead`

#### `sdd-forge flow set note`
Usage: `sdd-forge flow set note "<text>"`
Appends a free-form note to the active flow.
Example: `sdd-forge flow set note "Review deferred until API settles"`

#### `sdd-forge flow set redo`
Usage: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`
Appends a structured redo entry to `specs/<spec>/redolog.json`.
Examples: `sdd-forge flow set redo --step implement --reason "Spec changed"`, `sdd-forge flow set redo --step test --reason "Coverage gap" --resolution "Add integration test"`

#### `sdd-forge flow set req`
Usage: `sdd-forge flow set req <index> <status>`
Updates the status of one requirement by index.
Example: `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request`
Usage: `sdd-forge flow set request "<text>"`
Stores the original user request text in the active flow state.
Example: `sdd-forge flow set request "Add docs synchronization support"`

#### `sdd-forge flow set step`
Usage: `sdd-forge flow set step <id> <status>`
Updates a workflow step status in the active flow.
Example: `sdd-forge flow set step implement done`

#### `sdd-forge flow set summary`
Usage: `sdd-forge flow set summary '<json-array>'`
Replaces the active flow’s requirements list from a JSON array argument.
Example: `sdd-forge flow set summary '["Requirement A","Requirement B"]'`

#### `sdd-forge flow run`
Usage: `sdd-forge flow run <action> [options]`
Executes flow actions. The analyzed source includes `prepare-spec`, `review`, `sync`, and `finalize`.
Example: `sdd-forge flow run prepare-spec --title "New feature"`

#### `sdd-forge flow run prepare-spec`
Usage: `sdd-forge flow run prepare-spec [options]`
Creates a branch or worktree when needed, scaffolds `spec.md` and `qa.md`, and writes the initial flow state.
Options: `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run`
Examples: `sdd-forge flow run prepare-spec --title "Export command"`, `sdd-forge flow run prepare-spec --title "Export command" --worktree`

#### `sdd-forge flow run review`
Usage: `sdd-forge flow run review [options]`
Wraps the lower-level AI review command, then returns a normalized JSON-envelope summary of proposals and verdict counts.
Options: `--dry-run`, `--skip-confirm`
Examples: `sdd-forge flow run review`, `sdd-forge flow run review --dry-run`

#### `sdd-forge flow run sync`
Usage: `sdd-forge flow run sync [options]`
Runs documentation synchronization as `build -> review -> add -> commit`.
Options: `--dry-run`
Examples: `sdd-forge flow run sync`, `sdd-forge flow run sync --dry-run`

#### `sdd-forge flow run finalize`
Usage: `sdd-forge flow run finalize [options]`
Executes finalization steps such as commit, merge or PR creation, docs sync, cleanup, and record.
Options: `--mode <all|select>`, `--steps <1,2,3,...>`, `--merge-strategy <squash|pr>`, `--message <msg>`, `--dry-run`
Examples: `sdd-forge flow run finalize --mode all`, `sdd-forge flow run finalize --mode select --steps 1,2,4`, `sdd-forge flow run finalize --mode all --merge-strategy pr`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Area | Exit code behavior | Output conventions |
| --- | --- | --- |
| Top-level `sdd-forge` | `0` for help and version, `1` for unknown commands | Help and version print to stdout; unknown-command errors print to stderr. |
| `sdd-forge docs` dispatcher | `0` for explicit help and successful `docs build`, `1` for missing subcommand, unknown subcommand, and build failures | Generic docs usage is printed to stderr; command help pages usually print to stdout; build progress and warnings use stderr through the progress logger. |
| `sdd-forge flow` dispatcher | `0` for explicit help, `1` for missing or unknown subcommands | Help prints to stdout; routing errors print to stderr. |
| `sdd-forge flow get`, `flow set`, `flow run` dispatchers | `0` for explicit help, `1` for missing or unknown keys/actions | Help prints to stdout; routing errors print to stderr. |
| Docs commands with `--dry-run` or `--stdout` | Usually keep a success exit unless an actual processing error occurs | Preview text or generated content is printed to stdout; status, progress, and warnings are typically logged to stderr. |
| Flow envelope commands (`flow get/*`, `flow set/*`, `flow run/*`) | Usually do not call `process.exit()` directly for normal validation failures; instead they return structured success or failure envelopes | Machine-readable envelope output is written to stdout. Wrapped failures use stable codes such as `NO_FLOW`, `INVALID_TARGET`, `INVALID_PHASE`, or `BUILD_FAILED`. |
| Commands that set `process.exitCode = 1` | Used by fixture CLI commands such as `parse`, `lint`, `toc`, and `format` when required input files are missing, and by `docs text` when file-level generation failures occur | User-facing error messages go to stderr in the fixture commands; `docs text` also logs warnings and per-file failures. |
| Commands with notable non-zero codes | `docs forge` uses exit code `2` when review fails in local-only mode and user input is required; multiple commands use exit code `1` for validation or runtime failures | Review summaries and follow-up guidance are printed to stdout; fatal errors are thrown or logged as errors. |
| GitHub and review helpers | Validation or execution failures are surfaced either as process exit `1` or as failure envelopes, depending on the wrapper | Human-readable progress messages often go to stderr, while final normalized results go to stdout. |

In general, human-readable help and generated document content are written to stdout, while progress logs, warnings, and routing errors are written to stderr. Commands built around the progress logger pin status updates to stderr so stdout can remain usable for generated content or structured output.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
