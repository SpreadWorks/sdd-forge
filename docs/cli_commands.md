<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The `sdd-forge` CLI exposes 6 top-level entry points: `help`, `setup`, `upgrade`, `presets`, `docs`, and `flow`. The analyzed source defines 30 leaf subcommands beneath those entry points: 12 under `docs` and 18 under `flow`, with `flow` further split into `get`, `set`, and `run` families.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Main entry point that prints help, prints the version, or dispatches to top-level commands. | `-h`, `--help`, `-v`, `--version`, `-V` |
| `sdd-forge help` | Prints the top-level help screen with grouped command listings. | None |
| `sdd-forge setup` | Bootstraps a project, creates `.sdd-forge` assets, writes config, and deploys skills. | `--dry-run`, `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang` |
| `sdd-forge upgrade` | Refreshes template-managed files and migrates legacy chapter config format when needed. | `--dry-run` |
| `sdd-forge presets` | Prints the preset tree; `list` is the default subcommand. | `list`, `-h`, `--help` |
| `sdd-forge docs` | Namespace dispatcher for documentation commands. | `<command>`, `-h`, `--help` |
| `sdd-forge docs build` | Runs the documentation pipeline: scan, enrich, init, data, text, README, AGENTS, and optional translation. | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Builds or incrementally updates `.sdd-forge/output/analysis.json` from source files and scan data sources. | `--reset [categories]`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Routed docs subcommand for enrichment. | Routed by `src/docs.js`; option details are not present in the analyzed command module excerpt |
| `sdd-forge docs init` | Initializes `docs/` from resolved templates for the selected type and language. | `--force`, `--dry-run`, `--type`, `--lang`, `--docs-dir` |
| `sdd-forge docs data` | Resolves `{{data}}` directives in generated docs chapters from `analysis.json`. | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | Fills `{{text(...)}}` directives in docs chapters with an AI agent. | `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | Generates the root `README.md` from templates, data directives, and optional AI text filling. | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | Iteratively improves documentation from a prompt, optional spec context, review feedback, and optional agent assistance. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Routed docs subcommand for documentation review. | Routed by `src/docs.js`; option details are not present in the analyzed command module excerpt |
| `sdd-forge docs changelog` | Generates `docs/change_log.md` from spec directories and metadata extracted from `spec.md` files. | `--dry-run`, optional output path |
| `sdd-forge docs agents` | Creates or updates `AGENTS.md` by resolving directives and refining the project section with an AI agent. | `--dry-run` |
| `sdd-forge docs translate` | Translates generated docs and `README.md` from the default language into configured secondary languages. | `--dry-run`, `--force`, `--lang` |
| `sdd-forge flow` | Namespace dispatcher for Spec-Driven Development flow commands. | `<get|set|run>`, `-h`, `--help` |
| `sdd-forge flow get` | Dispatcher for read-only flow queries. | `<key>`, `-h`, `--help` |
| `sdd-forge flow get check` | Checks prerequisites, git cleanliness, or GitHub CLI availability. | `<impl|finalize|dirty|gh>` |
| `sdd-forge flow get guardrail` | Returns guardrail articles filtered by phase. | `<draft|spec|impl|lint>` |
| `sdd-forge flow get issue` | Fetches a GitHub issue through `gh issue view` and returns a JSON envelope. | `<number>` |
| `sdd-forge flow get prompt` | Returns localized prompt metadata for plan, implementation, or finalize steps. | `<kind>` |
| `sdd-forge flow get qa-count` | Returns the current draft-phase clarification-question count. | None |
| `sdd-forge flow get status` | Returns the normalized active flow state and progress counters. | None |
| `sdd-forge flow set` | Dispatcher for flow-state mutations. | `<key>`, `-h`, `--help` |
| `sdd-forge flow set issue` | Stores the current flow's GitHub issue number. | `<number>` |
| `sdd-forge flow set metric` | Increments one metric counter for a specific phase. | `<phase> <counter>` |
| `sdd-forge flow set note` | Appends a free-form note to the active flow. | `"<text>"` |
| `sdd-forge flow set redo` | Appends a redo entry to `redolog.json` for the active spec. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Updates one indexed requirement status in the active flow. | `<index> <status>` |
| `sdd-forge flow set request` | Stores the original user request text in the active flow. | `"<text>"` |
| `sdd-forge flow set step` | Updates one workflow step status in the active flow. | `<id> <status>` |
| `sdd-forge flow set summary` | Replaces the requirements list from a JSON array passed on the command line. | `'<json-array>'` |
| `sdd-forge flow run` | Dispatcher for executable flow actions. | `<action>`, `-h`, `--help` |
| `sdd-forge flow run finalize` | Runs finalization steps such as commit, merge or PR, docs sync, cleanup, and recording. | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run prepare-spec` | Creates a spec directory and, depending on flags, a branch or worktree for a new flow. | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Wraps the lower-level review command and returns review results in a JSON envelope. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Runs docs build, docs review, staging, and commit as a documentation sync pipeline. | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope | Behavior |
| --- | --- | --- |
| `-h`, `--help` | Supported by the top-level CLI, namespace dispatchers (`docs`, `flow`, `flow get`, `flow set`, `flow run`), `presets`, and commands that use `parseArgs()` | Prints usage or command help. In dispatcher commands, explicit help exits successfully, while omitting a required subcommand, key, or action prints help and exits with an error status. |

No other option is shared across all commands in the analyzed source. Flags such as `--dry-run`, `--force`, `--lang`, and `--verbose` are command-specific rather than global.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge [command]`.
It prints the version for `-v`, `--version`, or `-V`, prints help for `-h` or `--help`, and otherwise dispatches to `help`, `setup`, `upgrade`, `presets`, `docs`, or `flow`.
Example: `sdd-forge --help`

#### `sdd-forge help`
Usage: `sdd-forge help`.
This command prints the grouped top-level help screen, including Project, Docs, Flow, and Info sections.
Example: `sdd-forge help`

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`.
Options: `--dry-run`, `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, and `--lang`. Without a full option set, it runs an interactive setup wizard.
Example: `sdd-forge setup --dry-run --name my-project --path . --type base --lang en`

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`.
Option: `--dry-run`. It refreshes deployed skills and migrates legacy `chapters` arrays in `.sdd-forge/config.json` when needed.
Example: `sdd-forge upgrade --dry-run`

#### `sdd-forge presets`
Usage: `sdd-forge presets [list]`.
Without a subcommand, it prints the preset inheritance tree; `-h` or `--help` prints usage text.
Example: `sdd-forge presets list`

#### `sdd-forge docs`
Usage: `sdd-forge docs <command>`.
Available subcommands are `build`, `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `changelog`, `agents`, and `translate`.
Example: `sdd-forge docs build`

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [options]`.
Options: `--force`, `--regenerate`, `--verbose`, and `--dry-run`. It orchestrates scan, enrichment, initialization, data resolution, text generation, README generation, AGENTS generation, and optional translation.
Example: `sdd-forge docs build --verbose`

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`.
Options: `--reset [categories]`, `--stdout`, and `--dry-run`. It incrementally rebuilds `.sdd-forge/output/analysis.json` from source files and scan data sources.
Example: `sdd-forge docs scan --reset modules,config`

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`.
The analyzed router confirms this subcommand exists, but its option parser and help text are not included in the analyzed command module excerpt.
Example: `sdd-forge docs enrich --help`

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`.
Options: `--force`, `--dry-run`, `--type`, `--lang`, and `--docs-dir`. It resolves template inheritance for the selected project type and language, then writes initial chapter files into `docs/`.
Example: `sdd-forge docs init --type base --lang en --force`

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`.
Options: `--dry-run`, `--stdout`, and `--docs-dir`. It resolves `{{data}}` directives from `analysis.json` and writes rendered Markdown back to chapter files.
Example: `sdd-forge docs data --dry-run`

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`.
The analyzed source shows support for `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, and `--files`. It fills `{{text(...)}}` directives either in batch mode or per directive.
Example: `sdd-forge docs text --per-directive --id d0`

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`.
Options: `--dry-run`, `--lang`, and `--output`. It resolves the README template, fills data and optional text directives, and writes the result to the project root or an explicit output path.
Example: `sdd-forge docs readme --lang en --output README.md`

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge [options]`.
Options: `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, and `--dry-run`. Modes are `local`, `assist`, and `agent`.
Example: `sdd-forge docs forge --prompt "Improve the CLI chapter" --mode assist`

#### `sdd-forge docs review`
Usage: `sdd-forge docs review [options]`.
The analyzed router confirms this subcommand exists, but its option parser and help text are not included in the analyzed command module excerpt.
Example: `sdd-forge docs review --help`

#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output] [options]`.
Option: `--dry-run`. It scans `specs/`, extracts metadata from `spec.md`, and writes an auto-generated changelog document to `docs/change_log.md` or a user-supplied path.
Example: `sdd-forge docs changelog docs/change_log.md`

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [options]`.
Option: `--dry-run`. It creates or updates `AGENTS.md`, resolves embedded `{{data}}` directives, and optionally refines the project section with an AI agent.
Example: `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`.
Options: `--dry-run`, `--force`, and `--lang`. It translates generated chapter files and `README.md` from the default language into configured secondary languages.
Example: `sdd-forge docs translate --lang ja --force`

#### `sdd-forge flow`
Usage: `sdd-forge flow <get|set|run> <key> [options]`.
It is the top-level dispatcher for Spec-Driven Development workflow commands and prints examples in its help screen.
Example: `sdd-forge flow run merge --auto`

#### `sdd-forge flow get`
Usage: `sdd-forge flow get <key> [options]`.
Available keys in the analyzed source are `check`, `guardrail`, `issue`, `prompt`, `qa-count`, and `status`.
Example: `sdd-forge flow get status`

#### `sdd-forge flow get check`
Usage: `sdd-forge flow get check <target>`.
Valid targets are `impl`, `finalize`, `dirty`, and `gh`. It returns prerequisite or environment checks in a JSON envelope.
Example: `sdd-forge flow get check dirty`

#### `sdd-forge flow get guardrail`
Usage: `sdd-forge flow get guardrail <phase>`.
Valid phases are `draft`, `spec`, `impl`, and `lint`. It loads guardrail articles and filters them by the requested phase.
Example: `sdd-forge flow get guardrail spec`

#### `sdd-forge flow get issue`
Usage: `sdd-forge flow get issue <number>`.
It validates the issue number, runs `gh issue view`, and returns the issue title, body, labels, and state in a JSON envelope.
Example: `sdd-forge flow get issue 123`

#### `sdd-forge flow get prompt`
Usage: `sdd-forge flow get prompt <kind>`.
It returns localized prompt metadata for flow steps such as `plan.approach`, `impl.review-mode`, and finalize prompts defined in the prompt table.
Example: `sdd-forge flow get prompt plan.approach`

#### `sdd-forge flow get qa-count`
Usage: `sdd-forge flow get qa-count`.
It reads the active flow state and returns the current clarification-question count from `state.metrics?.draft?.question`.
Example: `sdd-forge flow get qa-count`

#### `sdd-forge flow get status`
Usage: `sdd-forge flow get status`.
It returns the active flow state, current phase, raw step and requirement arrays, and computed progress counters.
Example: `sdd-forge flow get status`

#### `sdd-forge flow set`
Usage: `sdd-forge flow set <key> [args]`.
Available keys in the analyzed source are `issue`, `metric`, `note`, `redo`, `req`, `request`, `step`, and `summary`.
Example: `sdd-forge flow set step gate done`

#### `sdd-forge flow set issue`
Usage: `sdd-forge flow set issue <number>`.
It validates a numeric argument and stores the current flow's GitHub issue number.
Example: `sdd-forge flow set issue 123`

#### `sdd-forge flow set metric`
Usage: `sdd-forge flow set metric <phase> <counter>`.
Valid phases are `draft`, `spec`, `gate`, `test`, and `impl`; valid counters are `question`, `redo`, `docsRead`, and `srcRead`.
Example: `sdd-forge flow set metric draft question`

#### `sdd-forge flow set note`
Usage: `sdd-forge flow set note "<text>"`.
It appends one free-form note to the active flow's `notes` array.
Example: `sdd-forge flow set note "Need to revisit the review results"`

#### `sdd-forge flow set redo`
Usage: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`.
`--step` and `--reason` are required. The command appends a structured redo entry to `redolog.json` under the active spec directory.
Example: `sdd-forge flow set redo --step implement --reason "Spec changed"`

#### `sdd-forge flow set req`
Usage: `sdd-forge flow set req <index> <status>`.
It updates one requirement entry by index in the active flow state.
Example: `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request`
Usage: `sdd-forge flow set request "<text>"`.
It stores the original request text in the active flow's `request` field.
Example: `sdd-forge flow set request "Generate a user guide for CLI commands"`

#### `sdd-forge flow set step`
Usage: `sdd-forge flow set step <id> <status>`.
It updates one workflow step status in the active flow state.
Example: `sdd-forge flow set step implement done`

#### `sdd-forge flow set summary`
Usage: `sdd-forge flow set summary '<json-array>'`.
It replaces the flow's requirements list from a JSON array supplied on the command line.
Example: `sdd-forge flow set summary '["Document commands","Review output"]'`

#### `sdd-forge flow run`
Usage: `sdd-forge flow run <action> [options]`.
Available actions in the analyzed source are `finalize`, `prepare-spec`, `review`, and `sync`.
Example: `sdd-forge flow run finalize --mode all`

#### `sdd-forge flow run finalize`
Usage: `sdd-forge flow run finalize [options]`.
Options: `--mode <all|select>`, `--steps <1,2,3,...>`, `--merge-strategy <squash|pr>`, `--message <msg>`, and `--dry-run`. It runs finalization steps and returns a structured JSON result.
Example: `sdd-forge flow run finalize --mode select --steps 1,2 --merge-strategy squash`

#### `sdd-forge flow run prepare-spec`
Usage: `sdd-forge flow run prepare-spec [options]`.
Options: `--title <name>`, `--base <branch>`, `--worktree`, `--no-branch`, and `--dry-run`. It creates a spec directory and optionally creates a feature branch or worktree.
Example: `sdd-forge flow run prepare-spec --title "Add changelog generation" --worktree`

#### `sdd-forge flow run review`
Usage: `sdd-forge flow run review [options]`.
Options: `--dry-run` and `--skip-confirm`. It runs the review wrapper and returns proposal counts, saved review paths, and the next recommended step in a JSON envelope.
Example: `sdd-forge flow run review --dry-run`

#### `sdd-forge flow run sync`
Usage: `sdd-forge flow run sync [options]`.
Option: `--dry-run`. It runs `docs build`, then `docs review`, and in non-dry-run mode stages and commits changed docs files.
Example: `sdd-forge flow run sync --dry-run`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit code | Where it appears | Meaning |
| --- | --- | --- |
| `0` | Top-level `sdd-forge`, `docs`, `flow`, and many direct commands | Successful execution, explicit help output, or version output. |
| `1` | Top-level dispatchers, `docs build`, `flow` dispatchers, several direct flow commands | General error status for unknown commands, missing required subcommands, invalid routing targets, missing active flow, unavailable dependencies such as `gh`, or command-specific failures. |
| `2` | `sdd-forge docs forge` | Review did not pass and the command could not continue automatically in local or non-agent-assisted mode. |
| `process.exitCode = 1` | Some command implementations and test fixtures | Non-throwing failure mode used when the command reports an error but does not immediately terminate with `process.exit(1)`. |

| Stream | Convention |
| --- | --- |
| `stdout` | Used for normal command results such as help text, generated Markdown or JSON, dry-run previews, version output, and structured flow envelopes from `flow get`, `flow set`, and `flow run`. |
| `stderr` | Used for router error messages, progress logs, warnings, verbose status messages, and progress-bar output from `createLogger()` and `createProgress()`. |
| Mixed output | Some commands deliberately split content and status: for example, `docs changelog --dry-run` prints generated Markdown to `stdout` and the destination notice to `stderr`, while review wrappers inspect both streams to summarize results. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
