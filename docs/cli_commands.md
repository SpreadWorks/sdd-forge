<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter covers 37 concrete command forms exposed by the analyzed CLI: 6 top-level commands, 12 `docs` subcommands, and 19 analyzed `flow` operations under the `get`, `set`, and `run` groups. The CLI is organized around the `sdd-forge` entry point, with namespace dispatchers for `docs` and `flow`, plus standalone commands such as `setup`, `upgrade`, `presets`, and `help`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Main entry point that dispatches top-level commands. | `-h`, `--help`, `-v`, `--version`, `-V` |
| `sdd-forge help` | Prints the localized top-level help screen. | None |
| `sdd-forge setup` | Initializes `.sdd-forge/config.json`, project directories, skills, and optional agent instruction files. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Updates bundled skill and template-managed assets for an existing project. | `--dry-run` |
| `sdd-forge presets [list]` | Prints the preset inheritance tree. | `-h`, `--help` |
| `sdd-forge docs` | Namespace dispatcher for documentation commands. | `<command>`, `-h`, `--help` |
| `sdd-forge docs build` | Runs the full docs pipeline: scan, enrich, init, data, text, readme, agents, and optional translation. | `--verbose`, `--dry-run`, `--force`, `--regenerate`, `-h`, `--help` |
| `sdd-forge docs scan` | Listed in the docs dispatcher as an available scan stage. | Routed subcommand |
| `sdd-forge docs enrich` | Enriches `analysis.json` with AI-generated summaries, detail, chapter, role, and optional app metadata. | `--agent`, `--dry-run`, `--stdout`, `-h`, `--help` |
| `sdd-forge docs init` | Initializes `docs/` from merged preset templates, with optional AI chapter filtering. | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run`, `-h`, `--help` |
| `sdd-forge docs data` | Resolves `{{data}}` directives in docs from `analysis.json`. | `--dry-run`, `--stdout`, `--docs-dir`, `-h`, `--help` |
| `sdd-forge docs text` | Fills `{{text}}` directives in chapter files using an agent. | `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--lang`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | Regenerates `README.md` from the README template and fills `{{data}}` and `{{text}}` directives. | `--lang`, `--output`, `--dry-run`, `-h`, `--help` |
| `sdd-forge docs forge` | Iteratively improves docs from a user prompt and review loop. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run`, `-h`, `--help` |
| `sdd-forge docs review` | Listed in the docs dispatcher and used by forge/sync as the review stage. | Routed subcommand |
| `sdd-forge docs changelog` | Generates `docs/change_log.md` from the `specs/` directory. | `--dry-run`, `-h`, `--help` |
| `sdd-forge docs agents` | Creates or updates `AGENTS.md` from directive output plus agent refinement. | `--dry-run`, `-h`, `--help` |
| `sdd-forge docs translate` | Translates generated docs and README into configured target languages. | `--lang`, `--force`, `--dry-run`, `-h`, `--help` |
| `sdd-forge flow` | Namespace dispatcher for workflow commands. | `<get|set|run>`, `-h`, `--help` |
| `sdd-forge flow get` | Dispatcher for read-only workflow queries. | `<key>`, `-h`, `--help` |
| `sdd-forge flow get status` | Returns the active flow state and progress as a normalized JSON envelope. | None |
| `sdd-forge flow get check <impl|finalize|dirty|gh>` | Checks prerequisite completion, dirty-worktree state, or GitHub CLI availability. | Target argument |
| `sdd-forge flow get guardrail <phase>` | Returns merged guardrail articles filtered by phase. | `draft`, `spec`, `impl`, `lint` |
| `sdd-forge flow get issue <number>` | Fetches GitHub issue data through `gh issue view`. | Issue number |
| `sdd-forge flow get qa-count` | Reports the answered draft-question count from active flow metrics. | None |
| `sdd-forge flow set` | Dispatcher for workflow state mutations. | `<key>`, `-h`, `--help` |
| `sdd-forge flow set issue <number>` | Stores the active flow's GitHub issue number. | Issue number |
| `sdd-forge flow set metric <phase> <counter>` | Increments a metric counter in `flow.json`. | Phase and counter arguments |
| `sdd-forge flow set note "<text>"` | Appends a note to the active flow. | Note text |
| `sdd-forge flow set redo` | Appends a redo event to `redolog.json` for the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req <index> <status>` | Updates one requirement status in the active flow. | Requirement index and status |
| `sdd-forge flow set request "<text>"` | Stores the original user request text. | Request text |
| `sdd-forge flow set step <id> <status>` | Updates one workflow step status. | Step id and status |
| `sdd-forge flow set summary '<json-array>'` | Replaces the active requirement list from a JSON array. | JSON array argument |
| `sdd-forge flow run` | Dispatcher for executable workflow actions. | `<action>`, `-h`, `--help` |
| `sdd-forge flow run prepare-spec` | Creates a new spec, branch or worktree, and initial flow state. | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Wrapper around the review command that returns a JSON envelope. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Rebuilds docs, reviews them, stages known doc files, and commits the result. | `--dry-run` |
| `sdd-forge flow run finalize` | Runs finalization steps such as commit, merge/PR, sync, cleanup, and record. | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow merge` | Merges the active feature branch or creates a PR, depending on flags and config. | `--dry-run`, `--pr`, `--auto` |
| `sdd-forge flow cleanup` | Removes active-flow state and deletes the associated branch and optional worktree. | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope | Meaning |
| --- | --- | --- |
| `-h`, `--help` | Broadly supported across top-level dispatchers and most concrete commands that use `parseArgs()` | Shows usage/help text and stops normal execution. Namespace dispatchers treat missing commands as an error case, while explicit help exits successfully. |
| `--dry-run` | Widely used across setup, upgrade, many `docs` commands, and many `flow run` commands | Previews actions or generated output without writing files, mutating state, or running destructive steps. |
| `--force` | `docs build`, `docs init`, `docs translate`, `docs text` | Forces overwrite, regeneration, or translation even when existing output is present or considered up to date. |
| `--lang` | `docs init`, `docs readme`, `docs text`, `docs translate`, `setup` | Selects the language used for generated output or command configuration. |
| `--verbose` / `-v` | `docs build`, `docs forge`; `-v` is also an alias in forge | Enables more detailed progress and agent logging. |
| `--stdout` | `docs enrich`, `docs data` | Sends generated or transformed content to standard output instead of only updating files. |
| Positional subcommand/action keys | `sdd-forge`, `docs`, `flow`, `flow get`, `flow set`, `flow run` | These dispatchers require a command key and reject unknown keys before loading the target module. |

There is no single non-help option that is accepted by every command in the CLI. The only near-universal convention is help handling, while most other flags are shared only within a command family such as `docs` or `flow run`.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge <command>`
Recognized top-level commands are `docs`, `flow`, `setup`, `upgrade`, `presets`, and `help`; version flags `-v`, `--version`, and `-V` print the package version.
Example: `sdd-forge docs build`

#### `sdd-forge help`
Usage: `sdd-forge help`
Prints the top-level help screen with grouped command descriptions for Project, Docs, Flow, and Info commands.
Example: `sdd-forge help`

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`
Options: `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run`.
It can run non-interactively when required values are supplied, or launch an interactive wizard that writes `.sdd-forge/config.json`, prepares directories, and optionally creates `AGENTS.md` or `CLAUDE.md`.
Example: `sdd-forge setup --name my-project --type base --purpose user-guide --agent codex --lang en`

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`
Option: `--dry-run`.
Upgrades bundled skill assets for the current project and reports whether each deployed skill changed.
Example: `sdd-forge upgrade --dry-run`

#### `sdd-forge presets`
Usage: `sdd-forge presets [list]`
With no subcommand or with `list`, it prints the preset inheritance tree; `-h` and `--help` print usage text.
Example: `sdd-forge presets list`

#### `sdd-forge docs`
Usage: `sdd-forge docs <command>`
The dispatcher accepts `build`, `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `changelog`, `agents`, and `translate`.
Example: `sdd-forge docs enrich --stdout`

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [--verbose] [--dry-run] [--force] [--regenerate]`
Runs the full documentation pipeline in order, including optional AI enrichment/text generation and optional multilingual output handling.
Examples: `sdd-forge docs build`, `sdd-forge docs build --dry-run --verbose`

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`
Options: `--agent`, `--dry-run`, `--stdout`, `-h`, `--help`.
Processes unanalyzed entries from `analysis.json` in batches, asks the configured agent for structured metadata, and saves progress incrementally so interrupted runs can resume.
Example: `sdd-forge docs enrich --stdout`

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`
Options: `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run`.
Initializes `docs/` from resolved preset templates, with optional AI filtering when chapter order is not fixed in config.
Example: `sdd-forge docs init --type base --force`

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`
Options: `--dry-run`, `--stdout`, `--docs-dir`.
Resolves `{{data}}` directives in generated docs using `analysis.json` and file-aware resolver context for navigation and language links.
Example: `sdd-forge docs data --dry-run`

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`
Options include `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--lang`, `--docs-dir`, and `--files`.
It fills `{{text}}` directives either in batch mode per file or in per-directive mode, and can selectively regenerate only changed chapters.
Example: `sdd-forge docs text --per-directive --id intro`

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`
Options: `--lang`, `--output`, `--dry-run`.
Generates `README.md` from the resolved README template, fills data directives, and then fills README text directives with a dedicated agent flow when needed.
Example: `sdd-forge docs readme --output docs/en/README.md`

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [options]`
Options: `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run`.
It combines prompt-driven editing, optional spec-based file targeting, repeated review runs, and optional assist or full-agent generation.
Example: `sdd-forge docs forge --prompt-file specs/001-demo/spec.md --mode assist`

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output-file] [--dry-run]`
Scans `specs/`, parses each `spec.md`, and writes `docs/change_log.md` by default unless an explicit output file is provided.
Example: `sdd-forge docs changelog --dry-run`

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [--dry-run]`
Creates `AGENTS.md` if it is missing, resolves embedded `{{data}}` directives, and refines the project-specific block with the configured `docs.agents` agent.
Example: `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`
Options: `--lang`, `--force`, `--dry-run`.
Translates generated docs and `README.md` from the default language into other configured languages when multilingual output mode is `translate`.
Example: `sdd-forge docs translate --lang ja --force`

#### `sdd-forge flow`
Usage: `sdd-forge flow <get|set|run> <key> [options]`
This namespace dispatches workflow status queries, state updates, and executable workflow actions.
Example: `sdd-forge flow get status`

#### `sdd-forge flow get`
Usage: `sdd-forge flow get <key> [options]`
Available analyzed keys are `status`, `check`, `guardrail`, `issue`, and `qa-count`.
Example: `sdd-forge flow get check impl`

#### `sdd-forge flow get status`
Usage: `sdd-forge flow get status`
Returns the active flow's state, step progress, requirement progress, request text, notes, metrics, merge strategy, and branch metadata in a normalized JSON envelope.
Example: `sdd-forge flow get status`

#### `sdd-forge flow get check`
Usage: `sdd-forge flow get check <impl|finalize|dirty|gh>`
Checks step prerequisites for implementation or finalization, or reports dirty-worktree or GitHub CLI status.
Example: `sdd-forge flow get check finalize`

#### `sdd-forge flow get guardrail`
Usage: `sdd-forge flow get guardrail <draft|spec|impl|lint>`
Loads merged guardrail articles and filters them by workflow phase.
Example: `sdd-forge flow get guardrail spec`

#### `sdd-forge flow get issue`
Usage: `sdd-forge flow get issue <number>`
Uses GitHub CLI to fetch one issue's title, body, labels, and state and wraps the result in the standard envelope.
Example: `sdd-forge flow get issue 42`

#### `sdd-forge flow get qa-count`
Usage: `sdd-forge flow get qa-count`
Returns the current value of `state.metrics.draft.question` for the active flow.
Example: `sdd-forge flow get qa-count`

#### `sdd-forge flow set`
Usage: `sdd-forge flow set <key> [args]`
Available analyzed keys are `issue`, `metric`, `note`, `redo`, `req`, `request`, `step`, and `summary`.
Example: `sdd-forge flow set step spec done`

#### `sdd-forge flow set issue`
Usage: `sdd-forge flow set issue <number>`
Stores the GitHub issue number in the active flow state.
Example: `sdd-forge flow set issue 42`

#### `sdd-forge flow set metric`
Usage: `sdd-forge flow set metric <phase> <counter>`
Valid phases are `draft`, `spec`, `gate`, and `test`; valid counters are `question`, `redo`, `docsRead`, and `srcRead`.
Example: `sdd-forge flow set metric draft question`

#### `sdd-forge flow set note`
Usage: `sdd-forge flow set note "<text>"`
Appends a free-form note string to the active flow.
Example: `sdd-forge flow set note "Need to confirm edge cases"`

#### `sdd-forge flow set redo`
Usage: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`
Adds a timestamped redo entry to `specs/<spec>/redolog.json` for the active spec.
Example: `sdd-forge flow set redo --step gate --reason "Spec needs clarification"`

#### `sdd-forge flow set req`
Usage: `sdd-forge flow set req <index> <status>`
Updates one requirement status in `flow.json`.
Example: `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request`
Usage: `sdd-forge flow set request "<text>"`
Stores the original request text for the active flow.
Example: `sdd-forge flow set request "Add multilingual docs generation"`

#### `sdd-forge flow set step`
Usage: `sdd-forge flow set step <id> <status>`
Mutates the status of one named workflow step.
Example: `sdd-forge flow set step implement done`

#### `sdd-forge flow set summary`
Usage: `sdd-forge flow set summary '<json-array>'`
Replaces the active requirement list from a JSON array of descriptions.
Example: `sdd-forge flow set summary '["Generate docs", "Review output"]'`

#### `sdd-forge flow run`
Usage: `sdd-forge flow run <action> [options]`
The analyzed runnable actions are `prepare-spec`, `review`, `sync`, and `finalize`.
Example: `sdd-forge flow run prepare-spec --title "Improve docs pipeline"`

#### `sdd-forge flow run prepare-spec`
Usage: `sdd-forge flow run prepare-spec [options]`
Options: `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run`.
Creates the initial spec directory, optional feature branch or worktree, and initial `flow.json` state.
Example: `sdd-forge flow run prepare-spec --title "Improve docs pipeline" --worktree`

#### `sdd-forge flow run review`
Usage: `sdd-forge flow run review [options]`
Options: `--dry-run`, `--skip-confirm`.
Runs the review wrapper, captures the underlying review command output, and returns proposal statistics in a JSON envelope.
Example: `sdd-forge flow run review --dry-run`

#### `sdd-forge flow run sync`
Usage: `sdd-forge flow run sync [--dry-run]`
Executes `docs build` and `docs review`, stages known documentation files, and commits them with `docs: sync documentation` when there are staged changes.
Example: `sdd-forge flow run sync`

#### `sdd-forge flow run finalize`
Usage: `sdd-forge flow run finalize --mode <all|select> [options]`
Options: `--steps`, `--merge-strategy <squash|pr>`, `--message`, `--dry-run`.
Runs selected finalization steps across commit, merge, sync, cleanup, and record, and emits per-step results in a JSON envelope.
Example: `sdd-forge flow run finalize --mode select --steps 3,4,6 --merge-strategy squash`

#### `sdd-forge flow merge`
Usage: `sdd-forge flow merge [--dry-run] [--pr] [--auto]`
Merges the active feature branch by squash, or creates a pull request when `--pr` is used or `--auto` chooses the PR path.
Example: `sdd-forge flow merge --auto`

#### `sdd-forge flow cleanup`
Usage: `sdd-forge flow cleanup [--dry-run]`
Deletes the active feature branch and optional worktree, and clears the `.active-flow` entry while leaving `flow.json` in the spec directory.
Example: `sdd-forge flow cleanup --dry-run`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Area | Exit code behavior | Standard output | Standard error |
| --- | --- | --- | --- |
| Top-level `sdd-forge` | `0` for help and version, `1` for unknown commands. | Help text and version string. | Unknown-command messages. |
| `sdd-forge docs` dispatcher | Missing subcommand exits `1`; explicit help exits `0`; unknown subcommand exits `1`; `docs build` exits `0` on success and `1` on pipeline error. | Help text and command help output; success messages from subcommands. | Usage errors, unknown-command errors, and build error messages. |
| `docs build` logging | Success exits `0`; thrown pipeline exceptions exit `1`. | Help text only. | Progress bar, step logs, warnings, and final build errors are written through the progress/logger layer. |
| `docs data`, `docs enrich`, `docs agents`, `docs changelog`, `docs readme`, `docs translate` | These commands generally complete with normal process exit unless they throw; several dry-run modes print preview content instead of writing files. | Generated content, dry-run previews, and completion messages. | Logger output, warnings, and some dry-run notices such as changelog target-path reporting. |
| `sdd-forge flow`, `flow get`, `flow set`, `flow run` dispatchers | Missing command/key exits `1`; explicit help exits `0`; unknown key/action exits `1`. | Help text. | Unknown-key and unknown-action errors. |
| Flow envelope commands (`flow get ...`, `flow set ...`, `flow run ...`) | Most analyzed commands report success and failure through structured JSON envelopes rather than explicit `process.exit()` calls. | JSON `ok(...)` or `fail(...)` envelopes are emitted on stdout. | The wrapper scripts themselves usually reserve stderr for underlying tool output, not envelope transport. |
| Standalone `flow merge` and `flow cleanup` | Exit `1` when no active flow exists or when required external tools are unavailable; otherwise they print results and return normally. | Dry-run command previews and completion messages. | Missing-flow and unavailable-tool errors. |
| Progress/logger subsystem | Does not define exit codes directly. | None. | When no progress bar is active, scoped loggers write messages to stderr; with a progress bar, progress updates and step logs are also rendered on stderr. |

In practice, user-facing data is usually printed to stdout, while dispatcher errors and progress-oriented logs are sent to stderr. The main exception is the `flow` command family, which standardizes both success and failure responses as JSON envelopes on stdout.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
