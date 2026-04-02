<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides 23 named commands organised into four sections — Project (`setup`, `upgrade`), Docs (12 subcommands under `docs`), Flow (3 subcommands under `flow`), and Info (`presets list`). All `docs` and `flow` subcommands are dispatched via their respective namespace dispatchers (`docs.js`, `flow.js`), while `setup`, `upgrade`, `help`, and `presets` are dispatched directly as independent commands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge help` | Show command list | — |
| `sdd-forge setup` | Interactive project setup wizard; generates `.sdd-forge/config.json` | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Update template-derived files (skills, AGENTS.md SDD section) to match installed version | `--dry-run` |
| `sdd-forge docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Analyse source code and write `.sdd-forge/output/analysis.json` | `--reset [cats]`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Enrich analysis entries with AI-generated summary, detail, chapter, and role | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Copy preset templates into `docs/` | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files using analysis data | `--dry-run`, `--stdout` |
| `sdd-forge docs text` | Resolve `{{text}}` directives in chapter files using an AI agent | `--id`, `--dry-run`, `--per-directive`, `--timeout`, `--force`, `--files` |
| `sdd-forge docs readme` | Auto-generate `README.md` from docs and templates | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iteratively improve docs using an AI agent with review feedback loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `-v` |
| `sdd-forge docs review` | Validate chapter files for structure and completeness | optional `<docs-dir>` positional argument |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Scan `specs/` and generate `change_log.md` | `--dry-run`, optional `<output-file>` positional |
| `sdd-forge docs agents` | Update `AGENTS.md` by resolving `{{data}}` directives and refining with AI | `--dry-run` |
| `sdd-forge docs snapshot` | Save or check a docs snapshot for change detection (listed in help; implementation pending) | — |
| `sdd-forge flow get` | Read flow state: status, check, prompt, guardrail, resolve-context, qa-count, context, issue | subcommand required |
| `sdd-forge flow set` | Update flow state: step, request, issue, note, summary, req, metric, redo, auto, test-summary | subcommand required |
| `sdd-forge flow run` | Execute flow actions: prepare-spec, gate, review, impl-confirm, finalize, sync, lint, retro | subcommand required |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Type | Description |
| --- | --- | --- |
| `-h`, `--help` | flag | Show help for the command and exit |
| `-v`, `--version` | flag | Print the installed sdd-forge version and exit (top-level only) |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### setup

Interactive wizard that creates or updates `.sdd-forge/config.json` and deploys skill files. When all required options are supplied via CLI the wizard is skipped and the command runs non-interactively.

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source code path (default: cwd) |
| `--work-root <path>` | Output directory path |
| `--type <type>` | Preset type(s), comma-separated (e.g. `cakephp2`, `node-cli`) |
| `--purpose <purpose>` | Document purpose: `developer-guide`, `user-guide`, `api-reference` |
| `--tone <tone>` | Writing style: `polite`, `formal`, `casual` |
| `--agent <agent>` | Default AI agent: `claude` or `codex` |
| `--lang <lang>` | Operating language: `en` or `ja` |
| `--dry-run` | Show generated config without writing files |

Example: `sdd-forge setup --name myapp --type laravel --purpose developer-guide --tone polite --agent claude`

#### upgrade

Updates template-derived files (`.agents/skills/*/SKILL.md`, `.claude/skills/` symlinks) to match the currently installed sdd-forge version. Does not modify `config.json`.

| Option | Description |
| --- | --- |
| `--dry-run` | Show what would change without writing files |

Example: `sdd-forge upgrade --dry-run`

#### docs build

Runs the full document-generation pipeline in sequence: `scan → enrich → init → data → text → readme → agents`, with an optional `translate` step when multiple output languages are configured.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing `docs/` files during the `init` step |
| `--dry-run` | Run all steps without writing files |
| `--verbose` | Show detailed per-step output |

Example: `sdd-forge docs build --force`

#### docs scan

Parses source files matched by the preset's `scan.include` / `scan.exclude` glob patterns and writes `.sdd-forge/output/analysis.json`. Supports incremental updates using per-entry content hashes; unchanged files are preserved.

| Option | Description |
| --- | --- |
| `--reset [cats]` | Clear entry hashes for all categories, or a comma-separated list of category names |
| `--stdout` | Print JSON to stdout instead of writing to file |
| `--dry-run` | Same as `--stdout` |

Example: `sdd-forge docs scan --reset controllers,routes`

#### docs enrich

Reads `analysis.json` and calls an AI agent to add `summary`, `detail`, `chapter`, and `role` fields to each entry. Processes entries in token-sized batches and saves progress after each batch so the run can be resumed if interrupted.

| Option | Description |
| --- | --- |
| `--dry-run` | Print enriched JSON to stdout without writing |
| `--stdout` | Same as `--dry-run` |

Example: `sdd-forge docs enrich`

#### docs init

Resolves the preset template inheritance chain and writes merged chapter files into `docs/`. If an AI agent is configured and `config.chapters` is not set, an AI filter selects which chapters are relevant based on the analysis summary.

| Option | Description |
| --- | --- |
| `--type <type>` | Override the preset type from config |
| `--force` | Overwrite files that already exist in `docs/` |
| `--dry-run` | Report target files without writing |

Example: `sdd-forge docs init --force`

#### docs data

Scans all chapter files for `{{data("preset.source.method")}}` directives and replaces each with the rendered output from the corresponding DataSource method.

| Option | Description |
| --- | --- |
| `--dry-run` | Show line change counts per file without writing |
| `--stdout` | Same as `--dry-run` |

Example: `sdd-forge docs data --dry-run`

#### docs text

Fills `{{text}}` directives in chapter files by calling an AI agent. Default mode sends all directives in a file as a single batch call (one AI call per file). Use `--per-directive` for the legacy one-call-per-directive mode, or `--id` to target a single named directive.

| Option | Description |
| --- | --- |
| `--id <id>` | Process only the directive with this `id` parameter |
| `--dry-run` | Show prompt lengths without writing |
| `--per-directive` | One AI call per directive instead of batch-per-file |
| `--force` | Regenerate all chapters regardless of diff state |
| `--timeout <ms>` | Agent call timeout in milliseconds |
| `--files <list>` | Comma-separated list of chapter filenames to process |

Example: `sdd-forge docs text --id d3 --per-directive`

#### docs readme

Resolves the `README.md` template from the preset chain, applies `{{data}}` directives, fills any `{{text}}` directives with AI, and writes the result to `README.md` (or `--output` path). Skips the write if content is unchanged.

| Option | Description |
| --- | --- |
| `--lang <code>` | Template language (default: `config.docs.defaultLanguage`) |
| `--output <path>` | Output file path (default: `README.md`) |
| `--dry-run` | Print generated content to stdout without writing |

Example: `sdd-forge docs readme --dry-run`

#### docs forge

Iteratively improves chapter files using an AI agent. Each round applies the agent, runs `docs review`, captures failures as feedback, and retries. Stops when review passes or `--max-runs` is reached.

| Option | Description |
| --- | --- |
| `--prompt <text>` | Initial improvement prompt (required if `--prompt-file` not given) |
| `--prompt-file <path>` | Read initial prompt from a file |
| `--spec <path>` | Specification file to guide generation |
| `--max-runs <n>` | Maximum iteration count (default: 3) |
| `--review-cmd <cmd>` | Docs review command (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` (default: `local`) |
| `--dry-run` | Skip file writes, review, and agent calls (1 round) |
| `-v`, `--verbose` | Stream agent execution output |

Example: `sdd-forge docs forge --prompt "Add usage examples to all commands" --max-runs 5 --mode agent`

#### docs review

Validates chapter files for structural completeness. Checks that each file has a `#` heading, meets a minimum line count (15 lines), has no unfilled `{{text}}` or `{{data}}` directives, has no residual block directives, and has balanced HTML comments. Also verifies `analysis.json` and `README.md` exist, and checks multi-language directories when configured.

Usage: `sdd-forge docs review [<docs-dir>]` (defaults to `${SDD_WORK_ROOT}/docs`)

#### docs translate

Translates default-language chapter files and `README.md` to each non-default language configured in `docs.languages`. Skips files where the target is newer than the source unless `--force` is given.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of modification time |
| `--dry-run` | List files that would be translated without writing |

Example: `sdd-forge docs translate --lang ja --force`

#### docs changelog

Scans the `specs/` directory for spec subdirectories and generates a `change_log.md` table with title, status, created date, and links per spec.

Usage: `sdd-forge docs changelog [--dry-run] [<output-file>]` (default output: `docs/change_log.md`)

| Option | Description |
| --- | --- |
| `--dry-run` | Print generated content to stdout without writing |

#### docs agents

Updates `AGENTS.md` by resolving `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives. The `agents.project` section is subsequently refined by an AI agent using the generated docs as context. Creates `AGENTS.md` from a template if it does not exist.

| Option | Description |
| --- | --- |
| `--dry-run` | Print generated content to stdout without writing |

Example: `sdd-forge docs agents`

#### docs snapshot

Listed in the help output as a planned command for saving and checking docs snapshots for change detection. No implementation file is present in the current codebase.

#### flow get

Reads flow state. Requires one of the following subcommands:

| Subcommand | Description |
| --- | --- |
| `status` | Show current flow state (branch, step progress, requirements) |
| `check` | Evaluate a condition against flow state |
| `prompt` | Build the current step prompt |
| `guardrail` | Evaluate guardrail rules |
| `resolve-context` | Resolve context references |
| `qa-count` | Count unresolved QA items |
| `context` | Read enriched analysis context for a file or category |
| `issue` | Retrieve linked issue details |

Example: `sdd-forge flow get status`

#### flow set

Updates flow state. Requires one of the following subcommands:

| Subcommand | Description |
| --- | --- |
| `step` | Update the status of a flow step |
| `request` | Set the implementation request text |
| `issue` | Link a GitHub issue to the flow |
| `note` | Append a note to the flow state |
| `summary` | Set a summary for the current step |
| `req` | Record a requirement |
| `metric` | Increment a phase metric counter |
| `redo` | Mark current step for redo |
| `auto` | Enable or disable autoApprove mode |
| `test-summary` | Record test run summary |

Example: `sdd-forge flow set step implement done`

#### flow run

Executes flow actions. Requires one of the following subcommands:

| Subcommand | Description |
| --- | --- |
| `prepare-spec` | Create or update the spec file for the current flow |
| `gate` | Run the spec gate check |
| `review` | Run the docs review within the flow |
| `impl-confirm` | Confirm implementation readiness check |
| `finalize` | Commit, merge or create PR, and clean up |
| `sync` | Sync docs with code changes |
| `lint` | Run lint checks as part of implement phase |
| `retro` | Post-flow retrospective analysis |

Example: `sdd-forge flow run gate`

#### presets list

Displays the full preset inheritance tree, showing each preset key, label, aliases, scan patterns, and whether templates exist.

Usage: `sdd-forge presets list`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit code | Meaning |
| --- | --- |
| `0` | Success — command completed without errors |
| `1` | Error — command failed (invalid arguments, missing required files, AI agent error, review failure, etc.) |

All diagnostic messages (warnings, errors, step progress) are written to **stdout** via `console.log`. Fatal errors that cause a non-zero exit are reported with `console.error` or by throwing an uncaught exception. The `docs text` command sets `process.exitCode = 1` when one or more files fail but allows other files to continue processing before exit.

`flow` commands return a structured JSON envelope on stdout:

| Field | Description |
| --- | --- |
| `ok` | `true` on success, `false` on error |
| `group` | Command group (e.g. `"get"`, `"set"`, `"run"`) |
| `key` | Subcommand key (e.g. `"status"`, `"issue"`) |
| `data` | Result payload (present when `ok: true`) |
| `error.code` | Error code string (present when `ok: false`) |
| `error.message` | Human-readable error description (present when `ok: false`) |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
