<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The analyzed CLI exposes 38 documented command entry points: 6 top-level commands, 12 `docs` subcommands, 3 `flow` namespace commands, 5 `flow get` keys, 8 `flow set` keys, and 4 `flow run` actions. The structure is hierarchical: `sdd-forge` dispatches to top-level commands, `sdd-forge docs` dispatches documentation-generation commands, and `sdd-forge flow` dispatches nested `get`, `set`, and `run` command families.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Main entry point; dispatches top-level commands and handles help and version flags. | `-h`, `--help`, `-v`, `--version`, `-V` |
| `sdd-forge help` | Prints the top-level help screen with grouped command listings. | none |
| `sdd-forge setup` | Initializes `.sdd-forge/config.json`, workspace directories, skills, and optional agent instruction files. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Updates template-managed project files, mainly bundled skills. | `--dry-run` |
| `sdd-forge presets list` | Prints the preset inheritance tree. | none |
| `sdd-forge flow` | Dispatches workflow commands under `get`, `set`, and `run`. | `-h`, `--help` |
| `sdd-forge docs` | Dispatches documentation commands and runs the full `build` pipeline. | `-h`, `--help` |
| `sdd-forge docs build` | Runs the ordered docs pipeline: scan, enrich, init, data, text, readme, agents, and optional translation. | `--verbose`, `--dry-run`, `--force`, `--regenerate` |
| `sdd-forge docs scan` | Builds `.sdd-forge/output/analysis.json` from source files and DataSources. | `--reset`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Adds AI-generated summaries, details, chapter assignments, and roles to analysis entries. | agent option from help, `--stdout`, `--dry-run` |
| `sdd-forge docs init` | Initializes `docs/` from templates, with optional AI chapter filtering. | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolves `{{data}}` directives in chapter files. | `--docs-dir`, `--stdout`, `--dry-run` |
| `sdd-forge docs text` | Fills `{{text}}` directives with generated prose. | `--dry-run`, `--per-directive`, `--timeout`, `--id`, `--lang`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | Regenerates `README.md` from the resolved README template. | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iteratively improves docs from a prompt and review loop. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Routed docs subcommand listed by the dispatcher and help output. | not described in the analyzed source excerpt |
| `sdd-forge docs changelog` | Generates `docs/change_log.md` from `specs/` metadata. | `--dry-run` |
| `sdd-forge docs agents` | Generates or updates `AGENTS.md` from docs and analysis data. | `--dry-run` |
| `sdd-forge docs translate` | Translates generated docs and README into configured target languages. | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow get` | Dispatcher for read-only workflow queries. | `-h`, `--help` |
| `sdd-forge flow get status` | Returns the active flow state and progress as a JSON envelope. | none |
| `sdd-forge flow get check` | Checks prerequisites, dirty worktree state, or GitHub CLI availability. | target: `impl`, `finalize`, `dirty`, `gh` |
| `sdd-forge flow get guardrail` | Returns guardrail articles filtered by phase. | phase: `draft`, `spec`, `impl`, `lint` |
| `sdd-forge flow get issue` | Fetches GitHub issue metadata through `gh`. | issue number |
| `sdd-forge flow get qa-count` | Returns the answered-question count for the active flow. | none |
| `sdd-forge flow set` | Dispatcher for workflow state updates. | `-h`, `--help` |
| `sdd-forge flow set issue` | Stores the active GitHub issue number in flow state. | issue number |
| `sdd-forge flow set metric` | Increments a named flow metric counter. | phase, counter |
| `sdd-forge flow set note` | Appends a note to the active flow. | note text |
| `sdd-forge flow set redo` | Appends a redo-log entry to the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Updates the status of one requirement. | requirement index, status |
| `sdd-forge flow set request` | Stores the original user request in flow state. | request text |
| `sdd-forge flow set step` | Updates the status of one workflow step. | step id, status |
| `sdd-forge flow set summary` | Replaces the requirement list from a JSON array. | JSON array argument |
| `sdd-forge flow run` | Dispatcher for executable workflow actions. | `-h`, `--help` |
| `sdd-forge flow run prepare-spec` | Creates a new spec, branch or worktree, and initial flow state. | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Runs the review wrapper and returns normalized JSON-envelope results. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Runs docs build and review, stages doc files, and commits documentation updates. | `--dry-run` |
| `sdd-forge flow run finalize` | Executes the finalization pipeline for commit, merge, cleanup, sync, and record steps. | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope | Meaning |
| --- | --- | --- |
| `-h` | Top-level dispatchers and commands that use `parseArgs()` | Requests help output. |
| `--help` | Top-level dispatchers and commands that use `parseArgs()` | Requests help output. |

Only the help flags are implemented consistently across the analyzed command set. Other flags such as `--dry-run`, `--force`, `--lang`, and `--verbose` are command-specific rather than global.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge <command>`

This is the main dispatcher. It recognizes `docs` and `flow` as namespaces, routes `setup`, `upgrade`, `presets`, and `help` as independent commands, prints help when no subcommand or `-h`/`--help` is passed, and prints the package version for `-v`, `--version`, or `-V`.

Examples:
- `sdd-forge help`
- `sdd-forge docs build`
- `sdd-forge flow run prepare-spec --title "Add feature"`

#### `sdd-forge help`
Usage: `sdd-forge help`

Prints the top-level help screen with grouped command sections for Project, Docs, Flow, and Info. The output includes localized descriptions and a hint to request per-command help.

Example:
- `sdd-forge help`

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`

Options:
- `--name <name>`
- `--path <path>`
- `--work-root <path>`
- `--type <type>`
- `--purpose <purpose>`
- `--tone <tone>`
- `--agent <agent>`
- `--lang <lang>`
- `--dry-run`

This command initializes the project for sdd-forge, creates `.sdd-forge`, `docs`, and `specs`, updates `.gitignore`, writes merged config, deploys skills, and can generate `AGENTS.md` or `CLAUDE.md` content.

Examples:
- `sdd-forge setup`
- `sdd-forge setup --name my-project --type node-cli --lang en --dry-run`

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`

Options:
- `--dry-run`

Updates template-managed project files, mainly bundled skills, without rewriting runtime configuration. In dry-run mode it reports what would change.

Examples:
- `sdd-forge upgrade`
- `sdd-forge upgrade --dry-run`

#### `sdd-forge presets list`
Usage: `sdd-forge presets list`

Prints the preset inheritance tree, including labels and optional metadata such as axis, language, aliases, scan keys, and whether templates exist.

Example:
- `sdd-forge presets list`

#### `sdd-forge docs`
Usage: `sdd-forge docs <command>`

Available analyzed subcommands are `build`, `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `changelog`, `agents`, and `translate`. When called without a subcommand or with help, the dispatcher prints the available commands and a per-command help hint.

Examples:
- `sdd-forge docs --help`
- `sdd-forge docs build`
- `sdd-forge docs data --dry-run`

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [options]`

Options:
- `--verbose`
- `--dry-run`
- `--force`
- `--regenerate`

Runs the full documentation pipeline. Depending on configuration, it performs scanning, enrichment, initialization, data filling, text generation, README generation, AGENTS generation, and either translation or per-language generation.

Examples:
- `sdd-forge docs build`
- `sdd-forge docs build --verbose --dry-run`
- `sdd-forge docs build --force --regenerate`

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`

Options:
- `--reset [category1,category2,...]`
- `--stdout`
- `--dry-run`

Scans source files, matches them against DataSources, and writes `.sdd-forge/output/analysis.json`. With `--reset`, it clears stored hashes for all categories or selected categories.

Examples:
- `sdd-forge docs scan`
- `sdd-forge docs scan --stdout`
- `sdd-forge docs scan --reset commands,modules`

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`

Options shown in help include an agent-selection option, `--dry-run`, `--stdout`, and `--help`.

This command sends batches of analysis entries to the configured agent and adds summaries, detailed descriptions, chapter assignments, roles, and optional app names. It supports resumable processing by skipping entries already marked as enriched.

Examples:
- `sdd-forge docs enrich`
- `sdd-forge docs enrich --stdout`
- `sdd-forge docs enrich --dry-run`

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`

Options:
- `--type <type>`
- `--lang <lang>`
- `--docs-dir <path>`
- `--force`
- `--dry-run`

Initializes chapter files in `docs/` from the resolved template chain. When analysis and an agent are available, it can filter chapters by audience fit unless `config.chapters` is explicitly defined.

Examples:
- `sdd-forge docs init`
- `sdd-forge docs init --type node-cli --force`
- `sdd-forge docs init --dry-run --lang ja`

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`

Options:
- `--docs-dir <path>`
- `--stdout`
- `--dry-run`

Resolves `{{data}}` directives in generated docs using `analysis.json` and preset-aware resolvers. It adjusts some directive calls with file-relative context so language links and navigation are rendered correctly for each file.

Examples:
- `sdd-forge docs data`
- `sdd-forge docs data --dry-run`
- `sdd-forge docs data --stdout --docs-dir docs/ja`

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`

Options:
- `--dry-run`
- `--per-directive`
- `--timeout <ms>`
- `--id <directive-id>`
- `--lang <lang>`
- `--docs-dir <path>`
- `--files <file-list>`

Fills `{{text}}` directives by calling the configured agent. It supports both batch file mode and per-directive mode, strips stale generated content before regeneration, and can target one directive by id.

Examples:
- `sdd-forge docs text`
- `sdd-forge docs text --per-directive --id d3`
- `sdd-forge docs text --dry-run --files cli_commands.md`

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`

Options:
- `--lang <lang>`
- `--output <path>`
- `--dry-run`

Regenerates `README.md` from the resolved README template, fills data directives, and processes README text directives in per-directive mode. It writes the file only when the content changes.

Examples:
- `sdd-forge docs readme`
- `sdd-forge docs readme --lang ja --output docs/ja/README.md`
- `sdd-forge docs readme --dry-run`

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [options]`

Options:
- `--prompt <text>`
- `--prompt-file <path>`
- `--spec <path>`
- `--max-runs <n>`
- `--review-cmd <command>`
- `--mode <local|assist|agent>`
- `--verbose`
- `--dry-run`

Runs an iterative docs-improvement loop. It can prefill `{{data}}` and `{{text}}`, invoke the agent in whole-project or per-file mode, run the review command after each round, and narrow later rounds to the files that still fail review.

Examples:
- `sdd-forge docs forge --prompt "Clarify the user guide"`
- `sdd-forge docs forge --prompt-file prompt.md --mode assist`
- `sdd-forge docs forge --spec specs/001-feature/spec.md --dry-run`

#### `sdd-forge docs review`
Usage: `sdd-forge docs review [options]`

This subcommand is routed by the `docs` dispatcher and is referenced by other commands such as `docs forge` and `flow run sync`. The analyzed source excerpt does not include its local option parser or help text.

Example:
- `sdd-forge docs review`

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output-file] [options]`

Options:
- `--dry-run`

Builds `docs/change_log.md` from `specs/*/spec.md` metadata and produces both a latest-series index and a complete spec list.

Examples:
- `sdd-forge docs changelog`
- `sdd-forge docs changelog docs/change_log.md --dry-run`

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [options]`

Options:
- `--dry-run`

Creates or updates `AGENTS.md`, resolves `{{data}}` directives, preserves the generated SDD section, and uses an agent to refine the project-specific section from docs and README content.

Examples:
- `sdd-forge docs agents`
- `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`

Options:
- `--lang <lang>`
- `--force`
- `--dry-run`

Translates generated chapter files and README from the default language to configured target languages. It skips targets that are already newer unless `--force` is used.

Examples:
- `sdd-forge docs translate`
- `sdd-forge docs translate --lang ja`
- `sdd-forge docs translate --dry-run --force`

#### `sdd-forge flow`
Usage: `sdd-forge flow <get|set|run> <key> [options]`

This namespace dispatcher routes to workflow query, mutation, and execution commands. Its help screen prints the registered subcommands and example invocations.

Examples:
- `sdd-forge flow get status`
- `sdd-forge flow set step approach done`
- `sdd-forge flow run finalize --mode all`

#### `sdd-forge flow get`
Usage: `sdd-forge flow get <key> [options]`

Keys available in the analyzed source are `status`, `check`, `guardrail`, `issue`, and `qa-count`. The command prints dynamically generated help when no key or help is supplied.

Examples:
- `sdd-forge flow get --help`
- `sdd-forge flow get status`
- `sdd-forge flow get check dirty`

#### `sdd-forge flow get status`
Usage: `sdd-forge flow get status`

Returns the active flow state, derived phase, progress counts for steps and requirements, notes, metrics, merge strategy, and branch metadata in a normalized JSON envelope.

Example:
- `sdd-forge flow get status`

#### `sdd-forge flow get check`
Usage: `sdd-forge flow get check <impl|finalize|dirty|gh>`

Checks prerequisites for implementation or finalization, checks whether the working tree is clean, or checks whether GitHub CLI is available.

Examples:
- `sdd-forge flow get check impl`
- `sdd-forge flow get check dirty`
- `sdd-forge flow get check gh`

#### `sdd-forge flow get guardrail`
Usage: `sdd-forge flow get guardrail <draft|spec|impl|lint>`

Loads merged guardrail articles, filters them by phase, and returns the matching articles in a JSON envelope.

Examples:
- `sdd-forge flow get guardrail spec`
- `sdd-forge flow get guardrail impl`

#### `sdd-forge flow get issue`
Usage: `sdd-forge flow get issue <number>`

Fetches issue metadata through `gh issue view` and returns the title, body, labels, and state in JSON form.

Example:
- `sdd-forge flow get issue 123`

#### `sdd-forge flow get qa-count`
Usage: `sdd-forge flow get qa-count`

Returns the current `draft.question` metric count from the active flow state.

Example:
- `sdd-forge flow get qa-count`

#### `sdd-forge flow set`
Usage: `sdd-forge flow set <key> [args]`

Keys available in the analyzed source are `issue`, `metric`, `note`, `redo`, `req`, `request`, `step`, and `summary`. The dispatcher prints per-key help when requested.

Examples:
- `sdd-forge flow set issue 123`
- `sdd-forge flow set step implement done`
- `sdd-forge flow set note "Checked docs"`

#### `sdd-forge flow set issue`
Usage: `sdd-forge flow set issue <number>`

Stores the GitHub issue number in the active flow state.

Example:
- `sdd-forge flow set issue 42`

#### `sdd-forge flow set metric`
Usage: `sdd-forge flow set metric <phase> <counter>`

Valid phases are `draft`, `spec`, `gate`, and `test`. Valid counters are `question`, `redo`, `docsRead`, and `srcRead`.

Examples:
- `sdd-forge flow set metric draft question`
- `sdd-forge flow set metric test redo`

#### `sdd-forge flow set note`
Usage: `sdd-forge flow set note "<text>"`

Appends the given note text to the active flow state.

Example:
- `sdd-forge flow set note "Need follow-up review"`

#### `sdd-forge flow set redo`
Usage: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`

Appends a timestamped redo-log entry to `redolog.json` in the active spec directory.

Examples:
- `sdd-forge flow set redo --step test --reason "Acceptance criteria changed"`
- `sdd-forge flow set redo --step gate --reason "Spec incomplete" --trigger "review"`

#### `sdd-forge flow set req`
Usage: `sdd-forge flow set req <index> <status>`

Updates one requirement status in the active flow.

Example:
- `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request`
Usage: `sdd-forge flow set request "<text>"`

Stores the original user request text in the active flow state.

Example:
- `sdd-forge flow set request "Add translation support"`

#### `sdd-forge flow set step`
Usage: `sdd-forge flow set step <id> <status>`

Updates the status of a named workflow step.

Example:
- `sdd-forge flow set step implement done`

#### `sdd-forge flow set summary`
Usage: `sdd-forge flow set summary '<json-array>'`

Replaces the active flow's requirement list from a JSON array.

Example:
- `sdd-forge flow set summary '["Requirement A", "Requirement B"]'`

#### `sdd-forge flow run`
Usage: `sdd-forge flow run <action> [options]`

Actions available in the analyzed source are `prepare-spec`, `review`, `sync`, and `finalize`. The dispatcher prints dynamically generated help when no action is supplied.

Examples:
- `sdd-forge flow run prepare-spec --title "Add feature"`
- `sdd-forge flow run review --dry-run`
- `sdd-forge flow run finalize --mode all`

#### `sdd-forge flow run prepare-spec`
Usage: `sdd-forge flow run prepare-spec [options]`

Options:
- `--title <name>`
- `--base <branch>`
- `--worktree`
- `--no-branch`
- `--dry-run`

Creates a new spec directory, optional feature branch, optional worktree, initial `flow.json`, and `qa.md` file. The mode can be worktree, branch, or spec-only.

Examples:
- `sdd-forge flow run prepare-spec --title "Add docs command"`
- `sdd-forge flow run prepare-spec --title "Add docs command" --worktree`
- `sdd-forge flow run prepare-spec --title "Research only" --no-branch --dry-run`

#### `sdd-forge flow run review`
Usage: `sdd-forge flow run review [options]`

Options:
- `--dry-run`
- `--skip-confirm`

Runs the review wrapper, which invokes the underlying review command, captures its output, and returns proposal counts, approval counts, rejection counts, and next-step advice in a JSON envelope.

Examples:
- `sdd-forge flow run review`
- `sdd-forge flow run review --dry-run`

#### `sdd-forge flow run sync`
Usage: `sdd-forge flow run sync [options]`

Options:
- `--dry-run`

Runs `docs build`, then `docs review`, then stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`, and commits them when changes are staged.

Examples:
- `sdd-forge flow run sync`
- `sdd-forge flow run sync --dry-run`

#### `sdd-forge flow run finalize`
Usage: `sdd-forge flow run finalize [options]`

Options:
- `--mode <all|select>`
- `--steps <3,4,5,...>`
- `--merge-strategy <merge|squash|pr>`
- `--message <msg>`
- `--dry-run`

Runs the finalization pipeline. Step numbers map to `commit` (3), `merge` (4), `cleanup` (5), `sync` (6), and `record` (7).

Examples:
- `sdd-forge flow run finalize --mode all`
- `sdd-forge flow run finalize --mode select --steps 3,6 --dry-run`
- `sdd-forge flow run finalize --mode all --merge-strategy pr --message "feat: finalize flow"`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Scope | Success / normal codes | Failure / special codes | Stdout conventions | Stderr conventions |
| --- | --- | --- | --- | --- |
| `sdd-forge` dispatcher | `0` for help and version output | `1` for unknown command | Help and version text are printed to stdout. | Unknown-command messages are printed to stderr. |
| `sdd-forge docs` dispatcher | `0` for explicit help; `0` after successful subcommand execution | `1` when no subcommand is provided or when the subcommand is unknown | Subcommand help is printed by the selected command to stdout. | The dispatcher prints usage and available commands to stderr when no subcommand is given, and prints unknown-command errors to stderr. |
| `sdd-forge docs build` | `0` on success; `0` for `--help` | `1` on pipeline exceptions or when `--regenerate` is used before chapter files exist | Progress logs may include pipeline information; normal generated file content is written to files rather than stdout. | Progress, warnings, and the final `[build] ERROR: ...` message are written through the progress/logger layer to stderr. |
| `sdd-forge docs scan` / `data` / `changelog` / `agents` / `readme` / `translate` / `init` / `forge` / `enrich` | No explicit nonzero success code is set in the analyzed implementations; normal completion uses the process default | Errors are raised as exceptions or handled by command-specific failures; `docs text` explicitly sets a nonzero process status when any file fails | Many commands support `--dry-run` or `--stdout` modes that print generated content or summaries to stdout. | Logger and progress output is primarily written to stderr. |
| `sdd-forge docs text` | Normal completion uses the process default | The analyzed implementation sets a nonzero process exit code when one or more files fail during text generation | Dry-run previews and some file summaries can be printed to stdout. | Validation warnings and per-file failure logs are written through the logger. |
| `sdd-forge flow` / `flow get` / `flow set` / `flow run` dispatchers | `0` for explicit help | `1` for missing or unknown subcommands in the dispatchers | Help text is printed to stdout. | Unknown-command errors are printed to stderr. |
| `flow get/*`, `flow set/*`, `flow run/*` wrapper commands | These commands emit structured JSON envelopes on stdout for normal results | Validation and operational failures are returned as failure envelopes; the analyzed modules do not rely on plain-text success output | Output is JSON on stdout via the shared envelope helpers. | Command-specific helpers may still write progress or delegated tool output to stderr before the envelope is emitted. |
| `flow commands/cleanup` | Normal completion uses the process default | `1` when no active flow exists | Dry-run prints the git commands that would be run to stdout. | Error message `no active flow` is printed to stderr. |
| `flow commands/merge` | Normal completion uses the process default | `1` when no active flow exists or when `--pr` is requested without `gh` available | Dry-run prints merge or PR commands to stdout; successful completion prints a status line to stdout. | Missing-flow and missing-`gh` errors are printed to stderr. |
| `flow commands/review` | Normal completion uses the process default | `1` when there is no active flow or config cannot be loaded | Approved proposal lists and user-facing review guidance are printed to stdout. | Draft/final progress messages and the saved review path are printed to stderr. |
| Fixture CLI commands in acceptance presets | Normal completion leaves the process at the default success status | Validation failures and lint error conditions set `process.exitCode = 1` | Command output, formatted content, diagnostics, and usage text are printed to stdout. | Missing-input and unknown-command messages are printed to stderr. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
