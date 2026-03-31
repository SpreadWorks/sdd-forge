<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This reference covers 43 analyzed command entry points across the `sdd-forge` CLI: 6 top-level commands, 11 `docs` subcommands, and a nested `flow` command family with direct subcommands plus `get`, `set`, and `run` namespaces. The structure is hierarchical: `sdd-forge` dispatches to top-level commands, `sdd-forge docs` routes to documentation-generation commands, and `sdd-forge flow` routes to workflow commands and machine-readable state accessors.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Top-level entry point that dispatches to namespaced and independent commands. | `-h`, `--help`, `-v`, `--version`, `-V` |
| `sdd-forge help` | Prints the top-level help screen with grouped command listings. | None |
| `sdd-forge setup` | Initializes a project, writes `.sdd-forge/config.json`, prepares agent instruction files, and deploys bundled skills. | `--dry-run`, `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang` |
| `sdd-forge upgrade` | Refreshes template-managed files, deploys skills, and migrates legacy `chapters` config format. | `--dry-run` |
| `sdd-forge presets` | Prints the preset inheritance tree or localized help. | `list`, `-h`, `--help` |
| `sdd-forge docs` | Namespace dispatcher for documentation commands. | `<command>`, `-h`, `--help` |
| `sdd-forge docs build` | Runs the full docs pipeline: scan, enrich, init, data, text, README, AGENTS, and optional translation. | `--agent`, `--force`, `--dry-run`, `--verbose`, `--regenerate` |
| `sdd-forge docs scan` | Scans source files into `.sdd-forge/output/analysis.json` with incremental reuse and reset support. | `--reset`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Uses an AI agent to add summaries, details, chapter assignments, and roles to analysis entries. | `--agent`, `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Initializes the `docs/` directory from resolved templates, with optional AI chapter filtering. | `--force`, `--dry-run`, `--type`, `--lang`, `--docs-dir` |
| `sdd-forge docs data` | Resolves `{{data}}` directives in docs chapters from `analysis.json`. | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | Fills `{{text(...)}}` directives in docs chapters using an AI agent. | `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | Generates the project root `README.md` from templates, docs context, and optional AI-filled text blocks. | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | Runs an iterative documentation improvement loop with optional AI editing and review feedback. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs changelog` | Generates `docs/change_log.md` from `specs/` metadata. | `--dry-run` |
| `sdd-forge docs agents` | Creates or updates `AGENTS.md` by resolving directives and refining the project section with an AI agent. | `--dry-run` |
| `sdd-forge docs translate` | Translates generated docs and README into configured secondary languages. | `--dry-run`, `--force`, `--lang` |
| `sdd-forge flow` | Namespace dispatcher for workflow commands. | `<subcommand>`, `-h`, `--help` |
| `sdd-forge flow get` | Second-level dispatcher for read-only flow accessors. | `<key>`, `-h`, `--help` |
| `sdd-forge flow get check` | Checks step prerequisites, dirty worktree state, or `gh` availability. | `impl`, `finalize`, `dirty`, `gh` |
| `sdd-forge flow get context` | Returns filtered analysis entries or file contents, with optional raw output. | `[path]`, `--raw` |
| `sdd-forge flow get guardrail` | Returns guardrail articles filtered by workflow phase. | `<draft|spec|impl|lint>` |
| `sdd-forge flow get issue` | Fetches a GitHub issue through `gh issue view`. | `<number>` |
| `sdd-forge flow get prompt` | Returns structured prompt definitions for flow steps in the configured language. | `<kind>` |
| `sdd-forge flow get qa-count` | Returns the stored clarification-question count for the active flow. | None |
| `sdd-forge flow get status` | Returns the current flow state in a normalized JSON envelope. | None |
| `sdd-forge flow set` | Second-level dispatcher for state-mutating flow commands. | `<key>`, `-h`, `--help` |
| `sdd-forge flow set issue` | Stores the current GitHub issue number in `flow.json`. | `<number>` |
| `sdd-forge flow set metric` | Increments a named metric counter for a phase. | `<phase> <counter>` |
| `sdd-forge flow set note` | Appends a free-form note to the active flow. | `"<text>"` |
| `sdd-forge flow set redo` | Appends a structured redo record to `redolog.json` for the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Updates the status of one indexed requirement. | `<index> <status>` |
| `sdd-forge flow set request` | Stores the original user request text in the active flow. | `"<text>"` |
| `sdd-forge flow set step` | Updates the status of a workflow step. | `<id> <status>` |
| `sdd-forge flow set summary` | Replaces the active flow requirements list from a JSON array. | `'<json-array>'` |
| `sdd-forge flow run` | Second-level dispatcher for executable workflow actions. | `<action>`, `-h`, `--help` |
| `sdd-forge flow run finalize` | Executes the finalization pipeline: commit, merge or PR, docs sync, cleanup, and record. | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run prepare-spec` | Creates a new spec, branch or worktree, and initial flow state. | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Runs the review wrapper and returns a JSON-envelope summary. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Runs docs build, review, staging, and optional commit. | `--dry-run` |
| `sdd-forge flow cleanup` | Removes the active flow entry and deletes the associated branch and optional worktree. | `--dry-run` |
| `sdd-forge flow merge` | Finalizes a feature branch by squash-merge or PR creation. | `--dry-run`, `--pr`, `--auto` |
| `sdd-forge flow review` | Runs the interactive AI-assisted code review command and writes `review.md`. | `--dry-run`, `--skip-confirm` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope | Meaning |
| --- | --- | --- |
| `-h` | Top-level dispatchers and commands using the shared parser | Marks the invocation as a help request. Commands typically print usage text and return without running their main action. |
| `--help` | Top-level dispatchers and commands using the shared parser | Same behavior as `-h`; this is the only consistently shared option across the CLI surface. |
| `-v` | `sdd-forge` only | Prints the package version and exits. |
| `--version` | `sdd-forge` only | Prints the package version and exits. |
| `-V` | `sdd-forge` only | Alias for version output at the top level. |
| `--` | Commands parsed with `parseArgs()` | Recognized by the shared parser and ignored as a standalone separator. It is not treated as a value-bearing option. |

The source does not define any other universal global flag. Options such as `--dry-run`, `--stdout`, and `--force` are command-specific and are only available where each command explicitly declares them.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge <command>`
Routes `docs` and `flow` to namespace dispatchers, and routes `setup`, `upgrade`, `presets`, and `help` to standalone modules.
Options: `-h`, `--help`, `-v`, `--version`, `-V`.
Examples: `sdd-forge help`, `sdd-forge docs build`, `sdd-forge flow get status`.

#### `sdd-forge help`
Usage: `sdd-forge help`
Prints the formatted top-level help screen with grouped sections for Project, Docs, Flow, and Info.
Examples: `sdd-forge help`.

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`
Runs an interactive or non-interactive setup wizard, creates `.sdd-forge/config.json`, prepares agent files, and deploys skills.
Options: `--dry-run`, `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`.
Examples: `sdd-forge setup`, `sdd-forge setup --name "My Project" --type base --purpose user-guide --tone polite --agent codex --lang en`.

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`
Refreshes template-managed assets, redeploys skills, and migrates legacy `chapters` arrays to object form when needed.
Options: `--dry-run`.
Examples: `sdd-forge upgrade`, `sdd-forge upgrade --dry-run`.

#### `sdd-forge presets`
Usage: `sdd-forge presets [list]`
Prints the preset inheritance tree. With `-h` or `--help`, it prints localized command help.
Examples: `sdd-forge presets`, `sdd-forge presets list`, `sdd-forge presets --help`.

#### `sdd-forge docs`
Usage: `sdd-forge docs <command>`
Dispatches documentation commands. When invoked without a subcommand or with help flags, it prints the available docs command list.
Examples: `sdd-forge docs build`, `sdd-forge docs scan --dry-run`.

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [options]`
Runs the composite docs pipeline: scan, optional enrich, optional init, data resolution, text generation, README generation, AGENTS generation, and optional translation or per-language regeneration.
Options: `--agent`, `--force`, `--dry-run`, `--verbose`, `--help`, `--regenerate`.
Examples: `sdd-forge docs build`, `sdd-forge docs build --verbose`, `sdd-forge docs build --regenerate --dry-run`.

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`
Scans source files into `.sdd-forge/output/analysis.json`, reuses unchanged entries by file hash, and supports hash reset by category.
Options: `--reset [categories]`, `--stdout`, `--dry-run`, `--help`.
Examples: `sdd-forge docs scan`, `sdd-forge docs scan --stdout`, `sdd-forge docs scan --reset modules,config`.

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`
Calls the configured AI agent to add `summary`, `detail`, `chapter`, `role`, and optional app metadata to analysis entries.
Options: `--agent`, `--dry-run`, `--stdout`, `--help`.
Examples: `sdd-forge docs enrich`, `sdd-forge docs enrich --stdout`.

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`
Builds the initial `docs/` chapter files from resolved templates for the selected type and language, with optional AI chapter filtering.
Options: `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run`, `--help`.
Examples: `sdd-forge docs init --type base`, `sdd-forge docs init --force --dry-run`.

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`
Resolves `{{data}}` directives inside chapter files using `.sdd-forge/output/analysis.json`.
Options: `--dry-run`, `--stdout`, `--docs-dir`, `--help`.
Examples: `sdd-forge docs data`, `sdd-forge docs data --stdout`, `sdd-forge docs data --docs-dir docs/ja`.

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`
Fills `{{text(...)}}` directives with AI-generated body text, either per file in batch mode or per directive when requested.
Options: `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files`.
Examples: `sdd-forge docs text`, `sdd-forge docs text --per-directive`, `sdd-forge docs text --id d3 --files cli_commands.md`.

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`
Generates the project `README.md` from the resolved README template and current docs context.
Options: `--dry-run`, `--lang`, `--output`, `--help`.
Examples: `sdd-forge docs readme`, `sdd-forge docs readme --lang ja --output docs/ja/README.md`.

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [options]`
Runs an iterative docs improvement loop, optionally using spec context, an agent, and a review command to converge on accepted documentation changes.
Options: `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run`, `--help`.
Examples: `sdd-forge docs forge --prompt "Clarify the CLI guide"`, `sdd-forge docs forge --prompt-file request.md --mode assist --max-runs 3`.

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output-file] [options]`
Scans `specs/` and generates a Markdown change log summarizing the latest spec in each series and indexing all known specs.
Options: `--dry-run`, `--help`.
Examples: `sdd-forge docs changelog`, `sdd-forge docs changelog docs/change_log.md --dry-run`.

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [options]`
Creates or updates `AGENTS.md`, resolves `{{data}}` directives, and refines the project-specific section with the configured `docs.agents` agent.
Options: `--dry-run`, `--help`.
Examples: `sdd-forge docs agents`, `sdd-forge docs agents --dry-run`.

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`
Translates chapter files and README from the default docs language into configured secondary languages when output mode is `translate`.
Options: `--dry-run`, `--force`, `--lang`, `--help`.
Examples: `sdd-forge docs translate`, `sdd-forge docs translate --lang ja`, `sdd-forge docs translate --force`.

#### `sdd-forge flow`
Usage: `sdd-forge flow <subcommand>`
Dispatches workflow commands and prints the registered flow subcommands when called without one.
Examples: `sdd-forge flow get status`, `sdd-forge flow run finalize --mode all`.

#### `sdd-forge flow get`
Usage: `sdd-forge flow get <key> [options]`
Dispatches read-only flow accessors.
Examples: `sdd-forge flow get status`, `sdd-forge flow get context --raw`.

#### `sdd-forge flow get check`
Usage: `sdd-forge flow get check <impl|finalize|dirty|gh>`
Checks prerequisite steps, Git dirty state, or GitHub CLI availability and returns a JSON envelope.
Examples: `sdd-forge flow get check impl`, `sdd-forge flow get check dirty`.

#### `sdd-forge flow get context`
Usage: `sdd-forge flow get context [path] [--raw]`
Without a path, returns filtered analysis entries. With a path, returns that file's content and records read metrics.
Options: `--raw`.
Examples: `sdd-forge flow get context`, `sdd-forge flow get context docs/cli_commands.md --raw`.

#### `sdd-forge flow get guardrail`
Usage: `sdd-forge flow get guardrail <phase>`
Returns guardrail articles filtered to one of `draft`, `spec`, `impl`, or `lint`.
Examples: `sdd-forge flow get guardrail spec`.

#### `sdd-forge flow get issue`
Usage: `sdd-forge flow get issue <number>`
Fetches a GitHub issue through `gh issue view` and returns core fields in a JSON envelope.
Examples: `sdd-forge flow get issue 42`.

#### `sdd-forge flow get prompt`
Usage: `sdd-forge flow get prompt <kind>`
Returns prompt metadata, descriptions, and choices for interactive flow steps in the configured language.
Examples: `sdd-forge flow get prompt plan.approach`, `sdd-forge flow get prompt finalize.mode`.

#### `sdd-forge flow get qa-count`
Usage: `sdd-forge flow get qa-count`
Returns the current draft-phase clarification-question count from flow metrics.
Examples: `sdd-forge flow get qa-count`.

#### `sdd-forge flow get status`
Usage: `sdd-forge flow get status`
Returns the normalized active flow state, including phase, branches, steps, requirements, notes, and metrics.
Examples: `sdd-forge flow get status`.

#### `sdd-forge flow set`
Usage: `sdd-forge flow set <key> [args]`
Dispatches state-mutating flow commands.
Examples: `sdd-forge flow set step spec done`, `sdd-forge flow set note "Confirmed with user"`.

#### `sdd-forge flow set issue`
Usage: `sdd-forge flow set issue <number>`
Stores the active GitHub issue number in `flow.json`.
Examples: `sdd-forge flow set issue 42`.

#### `sdd-forge flow set metric`
Usage: `sdd-forge flow set metric <phase> <counter>`
Increments one metric counter for one phase. Valid phases are `draft`, `spec`, `gate`, `test`, and `impl`; valid counters are `question`, `redo`, `docsRead`, and `srcRead`.
Examples: `sdd-forge flow set metric draft question`, `sdd-forge flow set metric impl docsRead`.

#### `sdd-forge flow set note`
Usage: `sdd-forge flow set note "<text>"`
Appends a free-form note to the active flow's notes list.
Examples: `sdd-forge flow set note "User requested a smaller scope"`.

#### `sdd-forge flow set redo`
Usage: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`
Adds a structured redo entry to `redolog.json` for the active spec.
Examples: `sdd-forge flow set redo --step test --reason "Acceptance criteria changed"`, `sdd-forge flow set redo --step gate --reason "Spec too broad" --resolution "Split into two specs"`.

#### `sdd-forge flow set req`
Usage: `sdd-forge flow set req <index> <status>`
Updates one requirement entry by numeric index.
Examples: `sdd-forge flow set req 0 done`.

#### `sdd-forge flow set request`
Usage: `sdd-forge flow set request "<text>"`
Stores the original request text in the active flow.
Examples: `sdd-forge flow set request "Add multilingual docs support"`.

#### `sdd-forge flow set step`
Usage: `sdd-forge flow set step <id> <status>`
Updates the status of a named workflow step.
Examples: `sdd-forge flow set step spec done`, `sdd-forge flow set step implement in_progress`.

#### `sdd-forge flow set summary`
Usage: `sdd-forge flow set summary '<json-array>'`
Replaces the requirements collection from a JSON array passed on the command line.
Examples: `sdd-forge flow set summary '["Generate docs", "Review output"]'`.

#### `sdd-forge flow run`
Usage: `sdd-forge flow run <action> [options]`
Dispatches executable flow actions.
Examples: `sdd-forge flow run prepare-spec --title "CLI cleanup"`, `sdd-forge flow run sync`.

#### `sdd-forge flow run finalize`
Usage: `sdd-forge flow run finalize [options]`
Runs the finalization pipeline. In `all` mode it executes commit, merge, sync, cleanup, and record; in `select` mode it runs only the chosen numbered steps.
Options: `--mode <all|select>`, `--steps <1,2,3,...>`, `--merge-strategy <squash|pr>`, `--message <msg>`, `--dry-run`.
Examples: `sdd-forge flow run finalize --mode all`, `sdd-forge flow run finalize --mode select --steps 1,2 --merge-strategy pr`.

#### `sdd-forge flow run prepare-spec`
Usage: `sdd-forge flow run prepare-spec [options]`
Creates a new spec directory, initializes `spec.md` and `qa.md`, and optionally creates a branch or worktree.
Options: `--title <name>`, `--base <branch>`, `--worktree`, `--no-branch`, `--dry-run`.
Examples: `sdd-forge flow run prepare-spec --title "Improve docs build"`, `sdd-forge flow run prepare-spec --title "Add command guide" --worktree`.

#### `sdd-forge flow run review`
Usage: `sdd-forge flow run review [options]`
Runs the review wrapper, forwards to the lower-level review command, and returns a JSON-envelope summary.
Options: `--dry-run`, `--skip-confirm`.
Examples: `sdd-forge flow run review`, `sdd-forge flow run review --dry-run`.

#### `sdd-forge flow run sync`
Usage: `sdd-forge flow run sync [options]`
Runs docs build, docs review, staging, and optional commit as a documentation sync pipeline.
Options: `--dry-run`.
Examples: `sdd-forge flow run sync`, `sdd-forge flow run sync --dry-run`.

#### `sdd-forge flow cleanup`
Usage: `sdd-forge flow cleanup [options]`
Deletes the active flow's feature branch and optional worktree and removes the active-flow entry.
Options: `--dry-run`.
Examples: `sdd-forge flow cleanup`, `sdd-forge flow cleanup --dry-run`.

#### `sdd-forge flow merge`
Usage: `sdd-forge flow merge [options]`
Finalizes a feature branch by squash merge or by creating a pull request, depending on flags and flow state.
Options: `--dry-run`, `--pr`, `--auto`.
Examples: `sdd-forge flow merge`, `sdd-forge flow merge --pr`, `sdd-forge flow merge --auto --dry-run`.

#### `sdd-forge flow review`
Usage: `sdd-forge flow review [options]`
Runs the lower-level AI-assisted code review command, generates proposals, validates them, and writes `review.md`.
Options: `--dry-run`, `--skip-confirm`.
Examples: `sdd-forge flow review`, `sdd-forge flow review --dry-run`.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Area | Condition | Exit code | Output behavior |
| --- | --- | --- | --- |
| `sdd-forge` | Version requested with `-v`, `--version`, or `-V` | `0` | Prints the version to stdout. |
| `sdd-forge` | No command or explicit help | `0` | Dispatches to the help screen and prints formatted help to stdout. |
| `sdd-forge` | Unknown top-level command | `1` | Prints an error and help hint to stderr. |
| `sdd-forge docs` | Explicit help | `0` | Prints docs command usage to stderr. |
| `sdd-forge docs` | No subcommand | `1` | Prints docs command usage to stderr. |
| `sdd-forge docs` | Unknown subcommand | `1` | Prints an error and help hint to stderr. |
| `sdd-forge docs build` | Successful pipeline completion | `0` | Progress and log output go through the progress/logger system, which writes to stderr; some step messages and warnings are logged without aborting. |
| `sdd-forge docs build` | Build error or invalid `--regenerate` precondition | `1` | Prints `[build] ERROR: ...` or `[regenerate] ERROR: ...`; failures are surfaced on stderr. |
| `sdd-forge flow` | Explicit help | `0` | Prints subcommand help to stdout. |
| `sdd-forge flow` | No subcommand | `1` | Prints help text to stdout, then exits non-zero. |
| `sdd-forge flow` | Unknown subcommand | `1` | Prints an error and help hint to stderr. |
| `sdd-forge flow get` / `set` / `run` | Explicit help | `0` | Prints usage to stdout. |
| `sdd-forge flow get` / `set` / `run` | Missing key or action | `1` | Prints usage to stdout. |
| `sdd-forge flow get` / `set` / `run` | Unknown key or action | `1` | Prints an error and help hint to stderr. |
| `sdd-forge flow cleanup` | No active flow | `1` | Prints `no active flow` to stderr. |
| `sdd-forge flow merge` | No active flow or `gh` unavailable for PR mode | `1` | Prints a human-readable error to stderr. |
| `sdd-forge flow get context --raw` | Missing file or missing `analysis.json` in raw mode | `1` via `process.exitCode` | Writes the error message to stderr; raw mode avoids the JSON envelope. |
| Flow envelope commands | Normal success or validation failure | Process code not explicitly changed in the command | Emit JSON envelopes on stdout using `ok(...)` or `fail(...)`; callers should inspect the envelope content rather than rely only on the process code. |
| Commands using `parseArgs()` | Help requested | Usually `0` with printed usage | Most commands print help text to stdout and return without running the main action. |
| Progress-based docs commands | Normal logging | Not an exit code rule | `createLogger()` and `createProgress()` write progress bars, logs, and verbose messages to stderr. |
| Human-oriented command output | Normal operational messages | Varies by command | Commands such as `setup`, `upgrade`, `readme`, `translate`, and direct flow commands print status messages to stdout. |
| Error reporting pattern | Fatal command errors | Usually `1` when `process.exit()` is used, otherwise exception-driven | Dispatcher errors and many direct command errors go to stderr; some flow commands instead return structured failure envelopes on stdout. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
