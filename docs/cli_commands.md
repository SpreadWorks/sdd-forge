<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The CLI is organized around the top-level `sdd-forge` entry point, which routes to three namespaces (`docs`, `spec`, and `flow`) plus standalone commands such as `setup`, `upgrade`, `presets list`, and `help`. In the analyzed sources, 34 concrete command forms are explicitly defined: 12 `docs` commands, 7 `spec` forms including `spec guardrail` actions, 11 `flow` operation and `flow set` forms, and 4 standalone commands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge help` | Show the full command catalog grouped by category. | None |
| `sdd-forge setup` | Run the project setup wizard and generate `.sdd-forge/config.json`. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Update template-derived files such as deployed skills to the installed `sdd-forge` version. | `--dry-run` |
| `sdd-forge presets list` | Print the preset inheritance tree. | No command-specific options in the analyzed source |
| `sdd-forge docs build` | Run the documentation build pipeline: `scan -> enrich -> init -> data -> text -> readme -> agents -> [translate]`. | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Run the `docs` scan subcommand through the dispatcher. | Routed by `src/docs.js`; options are defined in `docs/commands/scan.js` |
| `sdd-forge docs enrich` | Run the `docs` enrich subcommand through the dispatcher. | Routed by `src/docs.js`; options are defined in `docs/commands/enrich.js` |
| `sdd-forge docs init` | Generate initial chapter files in `docs/` from merged templates, with optional AI chapter filtering. | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in documentation files from `analysis.json`. | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | Run the `docs` text-generation subcommand through the dispatcher. | Routed by `src/docs.js`; options are defined in `docs/commands/text.js` |
| `sdd-forge docs readme` | Generate or refresh `README.md` from documentation templates and resolved docs content. | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iteratively improve generated docs with an AI agent and review loop. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Validate generated docs for structure, unresolved directives, and output integrity. | Positional target directory only; no named options in analyzed source |
| `sdd-forge docs changelog` | Generate `change_log.md` from `specs/` metadata. | `--dry-run` |
| `sdd-forge docs agents` | Create or update `AGENTS.md`, resolve `{{data}}` directives, and refine the project section with AI. | `--dry-run` |
| `sdd-forge docs translate` | Run the translation subcommand through the dispatcher. | Routed by `src/docs.js`; options are defined in `docs/commands/translate.js` |
| `sdd-forge spec init` | Create a numbered spec directory and optionally a feature branch or worktree. | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Check a spec for unresolved items and optionally run guardrail compliance review. | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail init` | Initialize project guardrail content from the preset chain. | Subcommand handled by `spec/commands/guardrail.js`; detailed flags are outside the analyzed excerpt |
| `sdd-forge spec guardrail update` | Propose or append project-specific guardrail content using analysis and AI. | Subcommand handled by `spec/commands/guardrail.js`; detailed flags are outside the analyzed excerpt |
| `sdd-forge spec guardrail show` | Print merged guardrail articles, optionally filtered by phase. | Subcommand handled by `spec/commands/guardrail.js`; detailed flags are outside the analyzed excerpt |
| `sdd-forge spec lint` | Run regex-based lint checks from guardrail articles against changed files. | `--base` |
| `sdd-forge flow cleanup` | Remove the active flow entry and delete the related branch and/or worktree. | `--dry-run` |
| `sdd-forge flow merge` | Squash-merge the feature branch or create a pull request from flow state. | `--dry-run`, `--pr`, `--auto` |
| `sdd-forge flow review` | Run the post-implementation code review flow with draft and validation phases. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow set issue` | Set the GitHub issue number in `flow.json`. | Positional issue number |
| `sdd-forge flow set metric` | Increment a metric counter in `flow.json`. | Positional `phase` and `counter` |
| `sdd-forge flow set note` | Append a free-form note to the flow state. | Positional note text |
| `sdd-forge flow set redo` | Append a redo entry to `redolog.json` for the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Update the status of one requirement in `flow.json`. | Positional requirement index and status |
| `sdd-forge flow set request` | Store the original user request text in `flow.json`. | Positional request text |
| `sdd-forge flow set step` | Update the status of one workflow step. | Positional step ID and status |
| `sdd-forge flow set summary` | Replace the requirements list from a JSON string array. | Positional JSON array |
| `sdd-forge flow` / `docs` / `spec` dispatchers | Route second-level subcommands to registered scripts and show subcommand help when invoked without a valid subcommand. | `-h`, `--help` at dispatcher level |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope in analyzed sources | Description |
| --- | --- | --- |
| `-h`, `--help` | Top-level entry point, namespace dispatchers, and many concrete commands | Show usage or command help and exit without running the main operation. |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs readme`, `docs forge`, `docs changelog`, `docs agents`, `spec init`, `flow cleanup`, `flow merge`, `flow review` | Preview work or print generated output without writing files or running destructive actions. |
| `--verbose` | `docs build`, `docs forge` | Enable more detailed progress or agent output. |
| Positional subcommand routing | `sdd-forge`, `docs`, `flow`, `flow set`, `presets` | The CLI relies heavily on positional subcommands such as `docs build`, `spec gate`, and `flow set issue`. |
| No universal named flag beyond help | Whole CLI | The analyzed sources do not define one named option that every concrete command accepts. Shared behavior is implemented mainly through subcommand dispatch and per-command `--help`. |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`
Usage: `sdd-forge help`
Shows the command catalog using the translated help layout.
Example: `sdd-forge help`

#### `sdd-forge setup`
Usage: `sdd-forge setup [--name <name>] [--path <path>] [--work-root <path>] [--type <preset>] [--purpose <purpose>] [--tone <tone>] [--agent <agent>] [--lang <lang>] [--dry-run]`
Collects project settings interactively or from CLI options, creates the working directories, updates `.gitignore`, and writes `.sdd-forge/config.json`.
Example: `sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 --lang en`

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [--dry-run]`
Refreshes template-managed files to the installed package version without changing `config.json` or project state.
Example: `sdd-forge upgrade --dry-run`

#### `sdd-forge presets list`
Usage: `sdd-forge presets list`
Prints the preset inheritance tree; `list` is the default subcommand handled by `src/presets-cmd.js`.
Example: `sdd-forge presets list`

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [--force] [--regenerate] [--verbose] [--dry-run]`
Runs the documentation pipeline in order and optionally adds a translation stage for non-default languages. `--regenerate` skips `init` and expects existing chapter files in `docs/`.
Example: `sdd-forge docs build --verbose`

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`
This subcommand is routed by the `docs` dispatcher, but its own option definitions are not included in the analyzed excerpt.
Example: `sdd-forge docs scan --help`

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`
This subcommand is routed by the `docs` dispatcher, but its own option definitions are not included in the analyzed excerpt.
Example: `sdd-forge docs enrich --help`

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [--type <type>] [--lang <lang>] [--docs-dir <dir>] [--force] [--dry-run]`
Resolves template inheritance, merges chapter templates, optionally filters chapters with AI, and writes initial docs files while skipping existing files unless `--force` is set.
Example: `sdd-forge docs init --type cli --force`

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [--dry-run] [--stdout] [--docs-dir <dir>]`
Loads `analysis.json`, resolves `{{data}}` directives, and updates chapter files. `--stdout` and `--dry-run` report changes without writing files.
Example: `sdd-forge docs data --dry-run`

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`
This subcommand is routed by the `docs` dispatcher, but its own option definitions are not included in the analyzed excerpt.
Example: `sdd-forge docs text --help`

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [--lang <lang>] [--output <path>] [--dry-run]`
Builds `README.md` from the README template, resolved chapter data, and optional AI-filled `{{text}}` directives.
Example: `sdd-forge docs readme --output docs/ja/README.md --dry-run`

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [--prompt <text> | --prompt-file <file>] [--spec <file>] [--max-runs <n>] [--review-cmd <cmd>] [--mode <local|assist|agent>] [--dry-run] [--verbose]`
Runs an iterative AI-assisted docs editing loop. It can narrow the target chapters from a spec and re-run review until the review command passes or the max run count is reached.
Example: `sdd-forge docs forge --prompt "Tighten the user guide" --mode agent --max-runs 3`

#### `sdd-forge docs review`
Usage: `sdd-forge docs review [targetDir]`
Checks chapter structure, unresolved `{{text}}` and `{{data}}` directives, README existence, and output integrity across the docs tree.
Example: `sdd-forge docs review`

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output-file] [--dry-run]`
Scans `specs/`, extracts metadata from each `spec.md`, and generates a changelog with a latest-series index and a full spec table.
Example: `sdd-forge docs changelog --dry-run`

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [--dry-run]`
Creates `AGENTS.md` when missing, resolves `agents.sdd` and `agents.project` directives, and refines the project section with the configured agent.
Example: `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`
This subcommand is routed by the `docs` dispatcher, but its own option definitions are not included in the analyzed excerpt.
Example: `sdd-forge docs translate --help`

#### `sdd-forge spec init`
Usage: `sdd-forge spec init --title <title> [--base <branch>] [--dry-run] [--allow-dirty] [--no-branch] [--worktree]`
Creates a numbered spec directory and `qa.md`, and optionally creates a feature branch or worktree. It initializes flow state and marks the early workflow steps as done.
Example: `sdd-forge spec init --title "contact form" --worktree`

#### `sdd-forge spec gate`
Usage: `sdd-forge spec gate --spec <path> [--phase <pre|post>] [--skip-guardrail]`
Validates that the spec has the required sections, has user approval, and has no unresolved placeholders or unchecked items outside exempt sections. It can also run an AI guardrail check.
Example: `sdd-forge spec gate --spec specs/001-example/spec.md --phase pre`

#### `sdd-forge spec guardrail init`
Usage: `sdd-forge spec guardrail init [options]`
Initializes project guardrail content from the preset chain. The analyzed excerpt confirms the subcommand exists, but not its full option list.
Example: `sdd-forge spec guardrail init`

#### `sdd-forge spec guardrail update`
Usage: `sdd-forge spec guardrail update [options]`
Updates project guardrail content using analysis data and AI-generated additions. The analyzed excerpt confirms the subcommand exists, but not its full option list.
Example: `sdd-forge spec guardrail update`

#### `sdd-forge spec guardrail show`
Usage: `sdd-forge spec guardrail show [options]`
Prints merged guardrail articles, with filtering handled inside the guardrail command implementation. The analyzed excerpt does not include its full help output.
Example: `sdd-forge spec guardrail show`

#### `sdd-forge spec lint`
Usage: `sdd-forge spec lint --base <branch>`
Checks files changed against the base branch using regex lint rules defined in lint-phase guardrail articles.
Example: `sdd-forge spec lint --base main`

#### `sdd-forge flow cleanup`
Usage: `sdd-forge flow cleanup [--dry-run]`
Removes the active-flow entry and deletes the related branch and/or worktree depending on the current flow mode.
Example: `sdd-forge flow cleanup --dry-run`

#### `sdd-forge flow merge`
Usage: `sdd-forge flow merge [--dry-run] [--pr] [--auto]`
Performs a squash merge or creates a pull request from the current flow state. `--auto` switches to PR mode only when GitHub CLI is available and enabled in config.
Example: `sdd-forge flow merge --auto`

#### `sdd-forge flow review`
Usage: `sdd-forge flow review [--dry-run] [--skip-confirm]`
Builds a diff from the spec scope or git history, asks an agent for refactoring proposals, validates them, and writes `review.md` in the spec directory.
Example: `sdd-forge flow review --dry-run`

#### `sdd-forge flow set issue`
Usage: `sdd-forge flow set issue <number>`
Stores the issue number in `flow.json` and returns a JSON envelope.
Example: `sdd-forge flow set issue 42`

#### `sdd-forge flow set metric`
Usage: `sdd-forge flow set metric <phase> <counter>`
Increments a metric counter in `flow.json`. Valid phases are `draft`, `spec`, `gate`, and `test`; valid counters are `question`, `redo`, `docsRead`, and `srcRead`.
Example: `sdd-forge flow set metric spec docsRead`

#### `sdd-forge flow set note`
Usage: `sdd-forge flow set note "<text>"`
Appends a note to the flow state's `notes` array and returns a JSON envelope.
Example: `sdd-forge flow set note "Need user confirmation on deployment timing"`

#### `sdd-forge flow set redo`
Usage: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`
Adds a timestamped redo entry to `redolog.json` under the active spec directory.
Example: `sdd-forge flow set redo --step gate --reason "Spec approval changed"`

#### `sdd-forge flow set req`
Usage: `sdd-forge flow set req <index> <status>`
Updates one requirement entry in `flow.json` by numeric index.
Example: `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request`
Usage: `sdd-forge flow set request "<text>"`
Stores the original user request text in `flow.json` and returns a JSON envelope.
Example: `sdd-forge flow set request "Add multilingual docs generation"`

#### `sdd-forge flow set step`
Usage: `sdd-forge flow set step <id> <status>`
Updates the status of a named workflow step and returns a JSON envelope.
Example: `sdd-forge flow set step approach done`

#### `sdd-forge flow set summary`
Usage: `sdd-forge flow set summary '<json-array>'`
Replaces the requirements list from a JSON string array and initializes each item with `pending` status.
Example: `sdd-forge flow set summary '["Add docs build", "Write review step"]'`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Topic | Value or convention | Evidence from analyzed sources |
| --- | --- | --- |
| Success exit | `0` | Help and version paths explicitly exit with success in dispatchers such as `src/sdd-forge.js`, `src/docs.js`, and `src/flow.js`. |
| Generic command failure | `1` | Unknown commands and missing required subcommands explicitly call `process.exit(1)` in `src/sdd-forge.js`, `src/docs.js`, `src/flow.js`, `src/flow/set.js`, `src/flow/commands/cleanup.js`, and `src/flow/commands/merge.js`. |
| Validation failure | Non-zero, typically `1` | `docs review` throws on failure, `spec lint` sets `process.exitCode = 1` when violations are found, and several commands throw errors for missing required inputs or files. |
| Dry-run output | Printed to `stdout` | Commands such as `docs agents`, `docs changelog`, `docs data`, `docs readme`, `spec init`, `flow cleanup`, and `flow merge` print previews or generated text instead of writing files. |
| Structured machine-readable output | JSON on `stdout` | `flow set issue`, `metric`, `note`, `redo`, `req`, `request`, `step`, and `summary` emit JSON envelopes via `output(ok(...))` or `output(fail(...))`. |
| Human-readable success output | `stdout` | Commands report normal completion with `console.log`, for example generated file paths, merge completion, lint pass, and review summaries. |
| Error and warning output | Mostly `stderr` for dispatcher errors and some warnings | Unknown-command messages and some warnings use `console.error`, including top-level routing errors, docs dispatcher usage, merge prerequisites, guardrail warnings, and lint warnings. |
| Progress output | Mixed, command-specific | `docs build` and `docs forge` emit progress logs during long-running steps; `docs forge` writes ticker dots to `stderr` when not in verbose mode. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
