<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter covers **49 routed CLI command forms** in `sdd-forge`, organized as top-level commands (`help`, `setup`, `upgrade`, `presets`, `docs`, `flow`, `check`) with nested subcommands under `docs`, `flow`, and `check`. The deepest hierarchy is under `flow`, which splits into `prepare`/`resume` plus `get`, `set`, and `run` groups with individual keys/actions.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge` | Root entry point; routes to command dispatchers, prints help when no command is given, and prints version with version flags. | `-h`, `--help`, `-v`, `-V`, `--version` |
| `sdd-forge help` | Show command overview. | none |
| `sdd-forge setup` | Interactive/non-interactive project setup and config generation. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files and skill files. | `--dry-run` |
| `sdd-forge presets list` | Print preset inheritance tree. | none |
| `sdd-forge docs build` | Run docs pipeline (`scan -> enrich -> [init] -> data -> text -> readme -> agents -> [translate]`). | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Analyze source code and write `analysis.json`; supports hash reset mode. | `--reset [cats]`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Enrich analysis entries with AI metadata. | `--stdout`, `--dry-run` |
| `sdd-forge docs init` | Initialize `docs/` from merged templates. | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data(...)}}` directives in docs files. | `--docs-dir`, `--stdout`, `--dry-run` |
| `sdd-forge docs text` | Resolve `{{text(...)}}` directives with AI. | `--timeout`, `--id`, `--lang`, `--docs-dir`, `--files`, `--per-directive`, `--force`, `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from templates/docs context. | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative docs improvement loop with optional AI and review command execution. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review [<docs-dir>]` | Validate docs output quality and integrity checks. | positional docs directory |
| `sdd-forge docs changelog [<output-file>]` | Generate `change_log.md` from `specs/`. | `--dry-run` |
| `sdd-forge docs agents` | Update `AGENTS.md` by resolving directives and refining PROJECT section with AI. | `--dry-run` |
| `sdd-forge docs translate` | Translate default-language docs/README to non-default languages. | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow prepare` | Initialize spec and branch/worktree context. | `--title`, `--base`, `--issue`, `--request`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow resume` | Discover and return active flow context. | none |
| `sdd-forge flow get status` | Return current flow state envelope. | none |
| `sdd-forge flow get resolve-context` | Resolve worktree/repo/active-flow context. | none |
| `sdd-forge flow get check <target>` | Check flow condition (`dirty`, `gh`, `impl`, `finalize`). | positional `target` |
| `sdd-forge flow get prompt <kind>` | Return prompt template by kind. | positional `kind` |
| `sdd-forge flow get qa-count` | Return draft-phase answered-question count. | none |
| `sdd-forge flow get guardrail <phase>` | Return guardrails filtered by phase. | `--format` |
| `sdd-forge flow get issue <number>` | Fetch GitHub issue content. | positional `number` |
| `sdd-forge flow get context [path]` | Read/search context data; supports raw output. | `--raw`, `--search <query>` |
| `sdd-forge flow set step <id> <status>` | Update flow step status. | positional args |
| `sdd-forge flow set request "<text>"` | Set request field in flow state. | positional text |
| `sdd-forge flow set issue <number>` | Set issue number in flow state. | positional number |
| `sdd-forge flow set note "<text>"` | Append note to flow state. | positional text |
| `sdd-forge flow set summary '<json-array>'` | Set requirements summary array. | positional JSON string |
| `sdd-forge flow set req <index> <status>` | Update single requirement status. | positional args |
| `sdd-forge flow set metric <phase> <counter>` | Increment metric counter. | positional args |
| `sdd-forge flow set issue-log ...` | Append issue-log entry. | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set redo` | Deprecated key; returns renamed-to-`issue-log` failure envelope. | none |
| `sdd-forge flow set auto on|off` | Toggle autoApprove mode. | positional value |
| `sdd-forge flow set test-summary` | Set test-count summary values. | `--unit`, `--integration`, `--acceptance` |
| `sdd-forge flow run gate` | Run gate checks for spec/phase. | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run review` | Run AI review on current changes. | `--phase`, `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run impl-confirm` | Check implementation readiness. | `--mode <overview|detail>` |
| `sdd-forge flow run finalize` | Execute finalize pipeline (commit/merge/sync/cleanup). | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run sync` | Run docs sync pipeline. | `--dry-run` |
| `sdd-forge flow run lint` | Run guardrail lint on changed files. | `--base` |
| `sdd-forge flow run retro` | Evaluate requirement/spec accuracy after implementation. | `--force`, `--dry-run` |
| `sdd-forge flow run report` | Generate work report from flow state. | `--dry-run` |
| `sdd-forge check config` | Validate `.sdd-forge/config.json` (file/schema/preset checks). | `--format <text|json>` |
| `sdd-forge check freshness` | Compare source/docs freshness by mtime. | `--format <text|json>` |
| `sdd-forge check scan` | Report scan/include coverage and uncovered files. | `--format <text|json|md>`, `--list` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Global option | Scope | Behavior |
| --- | --- | --- |
| `-h`, `--help` | All commands that use `parseArgs`, plus top-level/namespace dispatchers (`sdd-forge`, `docs`, `flow`, `check`, `presets`) | Sets `help=true` in parser-based commands or triggers dispatcher help screens. |
| `-v`, `-V`, `--version` | Root command only (`sdd-forge`) | Prints package version and exits successfully. |
| `--` | Commands using `parseArgs` | Explicitly ignored token in argument parsing. |

No other true global flags are inherited across all commands; most options are command-specific.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge`
Usage: `sdd-forge <command> [options]`.
Behavior: with no command or `-h/--help`, it runs the help command; with `-v/-V/--version`, it prints the package version.
Top-level routed commands: `help`, `setup`, `upgrade`, `presets`, `docs`, `flow`, `check`.
Example: `sdd-forge --version`.

#### `sdd-forge help`
Usage: `sdd-forge help`.
Behavior: prints categorized command list from the help layout and localized descriptions.
Example: `sdd-forge help`.

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`.
Options: `--name`, `--path`, `--work-root`, `--type` (comma-separated allowed in non-interactive mode), `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run`.
Behavior: interactive wizard unless required fields are supplied non-interactively; validates and writes `.sdd-forge/config.json`, prepares project dirs, and deploys skills.
Examples: `sdd-forge setup`; `sdd-forge setup --name myapp --type node-cli --purpose user-guide --tone polite --agent codex --lang en --dry-run`.

#### `sdd-forge upgrade`
Usage: `sdd-forge upgrade [options]`.
Options: `--dry-run`.
Behavior: upgrades skill templates, optional experimental workflow skills, and migrates legacy chapters format in config.
Example: `sdd-forge upgrade --dry-run`.

#### `sdd-forge presets list`
Usage: `sdd-forge presets list`.
Behavior: prints preset inheritance tree with metadata (`axis`, `lang`, `aliases`, `scan`) and template availability marker.
Example: `sdd-forge presets list`.

#### `sdd-forge docs build`
Usage: `sdd-forge docs build [options]`.
Options: `--force`, `--regenerate`, `--verbose`, `--dry-run`.
Behavior: orchestrates docs pipeline steps; `--regenerate` skips `init` and requires existing docs chapter files.
Examples: `sdd-forge docs build`; `sdd-forge docs build --force --verbose`; `sdd-forge docs build --regenerate --dry-run`.

#### `sdd-forge docs scan`
Usage: `sdd-forge docs scan [options]`.
Options: `--reset [cats]`, `--stdout`, `--dry-run`.
Behavior: scans source files via preset DataSources and writes/prints `analysis.json`; reset mode clears stored hashes by category.
Examples: `sdd-forge docs scan`; `sdd-forge docs scan --reset`; `sdd-forge docs scan --reset controllers,models`.

#### `sdd-forge docs enrich`
Usage: `sdd-forge docs enrich [options]`.
Options: `--stdout`, `--dry-run`.
Behavior: enriches analysis entries in batches (summary/detail/chapter/role/keywords) using the configured agent.
Examples: `sdd-forge docs enrich`; `sdd-forge docs enrich --dry-run`.

#### `sdd-forge docs init`
Usage: `sdd-forge docs init [options]`.
Options: `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run`.
Behavior: resolves merged templates by type/language and writes chapter files into docs directory.
Examples: `sdd-forge docs init`; `sdd-forge docs init --force`; `sdd-forge docs init --lang ja --dry-run`.

#### `sdd-forge docs data`
Usage: `sdd-forge docs data [options]`.
Options: `--docs-dir`, `--stdout`, `--dry-run`.
Behavior: resolves `{{data(...)}}` directives in chapter files using resolver output and filtered analysis.
Examples: `sdd-forge docs data`; `sdd-forge docs data --dry-run`; `sdd-forge docs data --docs-dir docs/ja`.

#### `sdd-forge docs text`
Usage: `sdd-forge docs text [options]`.
Options: `--timeout`, `--id`, `--lang`, `--docs-dir`, `--files`, `--per-directive`, `--force`, `--dry-run`.
Behavior: fills `{{text(...)}}` directives (batch-per-file by default; per-directive mode available).
Examples: `sdd-forge docs text --force`; `sdd-forge docs text --id d3`; `sdd-forge docs text --files overview.md,cli_commands.md --timeout 180000`.

#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [options]`.
Options: `--lang`, `--output`, `--dry-run`.
Behavior: merges README template, resolves directives, optionally fills text directives, and writes README output.
Examples: `sdd-forge docs readme`; `sdd-forge docs readme --output docs/ja/README.md`; `sdd-forge docs readme --dry-run`.

#### `sdd-forge docs forge`
Usage: `sdd-forge docs forge --prompt "..." [options]`.
Options: `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode <local|assist|agent>`, `--verbose`, `--dry-run`.
Behavior: iterative improvement loop that can call agent(s), run review command, and retry using feedback.
Examples: `sdd-forge docs forge --prompt "Improve command examples"`; `sdd-forge docs forge --prompt-file .tmp/prompt.md --spec specs/123/spec.md --max-runs 5 --mode assist`.

#### `sdd-forge docs review [<docs-dir>]`
Usage: `sdd-forge docs review [<docs-dir>]`.
Options: positional docs directory only.
Behavior: validates chapter presence/length/H1/unfilled directives/output integrity/multilang consistency/analysis coverage.
Examples: `sdd-forge docs review`; `sdd-forge docs review docs/ja`.

#### `sdd-forge docs changelog [<output-file>]`
Usage: `sdd-forge docs changelog [--dry-run] [<output-file>]`.
Options: `--dry-run`.
Behavior: scans `specs/*/spec.md`, extracts metadata, and generates change-log markdown.
Examples: `sdd-forge docs changelog`; `sdd-forge docs changelog --dry-run`; `sdd-forge docs changelog docs/change_log.md`.

#### `sdd-forge docs agents`
Usage: `sdd-forge docs agents [--dry-run]`.
Options: `--dry-run`.
Behavior: resolves AGENTS directives and refines PROJECT section via configured AI agent.
Examples: `sdd-forge docs agents`; `sdd-forge docs agents --dry-run`.

#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [options]`.
Options: `--lang`, `--force`, `--dry-run`.
Behavior: translates default-language docs/README into non-default language directories based on mtime and mode.
Examples: `sdd-forge docs translate`; `sdd-forge docs translate --lang ja`; `sdd-forge docs translate --force --dry-run`.

#### `sdd-forge flow prepare`
Usage: `sdd-forge flow prepare [options]`.
Options: `--title`, `--base`, `--issue`, `--request`, `--worktree`, `--no-branch`, `--dry-run`.
Behavior: initializes flow metadata and optionally creates branch/worktree.
Examples: `sdd-forge flow prepare --title add-auth --base main`; `sdd-forge flow prepare --title add-auth --worktree --issue 42`.

#### `sdd-forge flow resume`
Usage: `sdd-forge flow resume`.
Behavior: discovers active flow context for recovery/resumption.
Example: `sdd-forge flow resume`.

#### `sdd-forge flow get <key>`
Usage: `sdd-forge flow get <key> [args/options]`.
Keys: `status`, `resolve-context`, `check <target>`, `prompt <kind>`, `qa-count`, `guardrail <phase> [--format <fmt>]`, `issue <number>`, `context [path] [--raw] [--search <query>]`.
Examples: `sdd-forge flow get status`; `sdd-forge flow get check dirty`; `sdd-forge flow get prompt plan.approach`; `sdd-forge flow get guardrail impl --format json`; `sdd-forge flow get context --search gate`.

#### `sdd-forge flow set <key>`
Usage: `sdd-forge flow set <key> [args/options]`.
Keys: `step <id> <status>`, `request <text>`, `issue <number>`, `note <text>`, `summary '<json-array>'`, `req <index> <status>`, `metric <phase> <counter>`, `issue-log --step ... --reason ...`, `redo`, `auto on|off`, `test-summary [--unit N] [--integration N] [--acceptance N]`.
Examples: `sdd-forge flow set step gate in_progress`; `sdd-forge flow set issue-log --step gate --reason "missing tests"`; `sdd-forge flow set auto on`; `sdd-forge flow set test-summary --unit 24 --integration 6`.

#### `sdd-forge flow run <action>`
Usage: `sdd-forge flow run <action> [options]`.
Actions: `gate`, `review`, `impl-confirm`, `finalize`, `sync`, `lint`, `retro`, `report`.
Representative options: `gate --spec --phase --skip-guardrail`, `review --phase --dry-run --skip-confirm`, `impl-confirm --mode`, `finalize --mode --steps --merge-strategy --message --dry-run`, `sync --dry-run`, `lint --base`, `retro --force --dry-run`, `report --dry-run`.
Examples: `sdd-forge flow run gate --phase pre`; `sdd-forge flow run review --phase test`; `sdd-forge flow run finalize --mode select --steps 1,2`; `sdd-forge flow run lint --base main`.

#### `sdd-forge check config`
Usage: `sdd-forge check config [options]`.
Options: `--format <text|json>`.
Behavior: validates config file existence/parsing/schema/preset references.
Examples: `sdd-forge check config`; `sdd-forge check config --format json`.

#### `sdd-forge check freshness`
Usage: `sdd-forge check freshness [options]`.
Options: `--format <text|json>`.
Behavior: compares newest source/docs timestamps and reports `fresh`, `stale`, or `never-built`.
Examples: `sdd-forge check freshness`; `sdd-forge check freshness --format json`.

#### `sdd-forge check scan`
Usage: `sdd-forge check scan [options]`.
Options: `--format <text|json|md>`, `--list`.
Behavior: computes scan include coverage and reports uncovered files (by extension and file list).
Examples: `sdd-forge check scan`; `sdd-forge check scan --format md`; `sdd-forge check scan --list --format json`.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit code | Where used | Meaning |
| --- | --- | --- |
| `0` | Root version/help, command help paths, successful command runs, flow envelopes with `ok: true` (`flow-envelope.output`) | Success. |
| `1` | `EXIT_ERROR` constant in `src/lib/exit-codes.js`; used for unknown commands, invalid options/formats, failed checks, dispatcher errors, thrown command errors, and flow envelopes with `ok: false` | Error/failure condition. |
| `1` (status signal) | `check freshness` for `stale` and `never-built` results | Intentional non-fresh state signaling that rebuild is required. |

| Stream/convention | Observed pattern |
| --- | --- |
| `stdout` | Normal outputs: help text, successful reports, JSON results (`check ... --format json`), generated content in dry-run modes, and flow JSON envelopes (`output(...)`). |
| `stderr` | Error diagnostics and invalid-option/invalid-format messages (`process.stderr.write`/`console.error`), plus some warnings (for example freshness file-limit warnings, logger-init warnings). |
| Flow output contract | `flow` commands return a common JSON envelope: `{ ok, type, key, data, errors[] }`; `process.exitCode` is set from `ok` (`0` for success, `1` for failure). |
| Help-and-usage failure style | Namespace dispatchers (`docs`, `flow`, `check`) print usage/help and exit non-zero when required subcommand/key is omitted; explicit help flags exit zero. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
