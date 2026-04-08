<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents all CLI commands provided by `sdd-forge`, covering 5 command namespaces — `docs`, `flow`, `check`, `presets`, and standalone project commands — with a total of over 35 individual commands and subcommands. Commands are organized into top-level standalone entries (`setup`, `upgrade`, `help`, `presets`) and three dispatcher namespaces (`docs` with 11 subcommands, `flow` with 3 subcommand groups and 20+ actions, and `check` with 3 subcommands).
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Show available commands and brief descriptions | — |
| `sdd-forge setup` | Interactive project registration and configuration wizard | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files to match installed version | `--dry-run` |
| `sdd-forge presets list` | Show preset inheritance tree | — |
| `sdd-forge docs build` | Full documentation pipeline (scan → enrich → init → data → text → readme → agents → translate) | `--agent`, `--force`, `--dry-run`, `--regenerate`, `--verbose` |
| `sdd-forge docs scan` | Analyze source code and write `analysis.json` | `--reset`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | AI-enrich analysis entries with summary, detail, chapter, and role | `--agent`, `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Copy chapter templates to `docs/` directory | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives with analysis data | `--dry-run`, `--stdout` |
| `sdd-forge docs text` | Resolve `{{text}}` directives using an AI agent | `--agent`, `--id`, `--dry-run`, `--force`, `--timeout`, `--per-directive` |
| `sdd-forge docs readme` | Auto-generate `README.md` from docs chapters | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative AI-driven docs improvement loop | `--prompt`, `--spec`, `--max-runs`, `--agent`, `--mode`, `--dry-run` |
| `sdd-forge docs review` | Validate docs chapter files for structural integrity | — |
| `sdd-forge docs agents` | Update AGENTS.md PROJECT section from analysis | `--dry-run` |
| `sdd-forge docs translate` | Translate docs to non-default languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `change_log.md` from `specs/` | `--dry-run` |
| `sdd-forge flow prepare` | Initialize spec, branch, or worktree for a feature | `--title`, `--base`, `--worktree`, `--issue`, `--request`, `--dry-run` |
| `sdd-forge flow resume` | Discover and display active flow for recovery | — |
| `sdd-forge flow get <key>` | Read flow state and derived values (status, prompt, guardrail, context, etc.) | `--raw`, `--search`, `--format` |
| `sdd-forge flow set <key>` | Update flow state (step, request, issue, note, summary, metric, etc.) | varies by subkey |
| `sdd-forge flow run <action>` | Execute flow actions (gate, review, impl-confirm, finalize, sync, lint, retro, report) | varies by action |
| `sdd-forge check config` | Validate `.sdd-forge/config.json` schema and preset references | `--format` |
| `sdd-forge check freshness` | Compare modification timestamps of `docs/` and source files | `--format` |
| `sdd-forge check scan` | Generate a scan coverage report showing analyzed vs. uncovered files | `--format`, `--list` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Alias | Description |
|---|---|---|
| `--version` | `-v`, `-V` | Print the installed package version and exit |
| `--help` | `-h` | Show help for the current command or subcommand and exit |

In addition to CLI flags, two environment variables influence command resolution at startup:

| Variable | Description |
|---|---|
| `SDD_SOURCE_ROOT` | Overrides the source code root directory used by scan and analysis |
| `SDD_WORK_ROOT` | Overrides the working directory where `.sdd-forge/`, `docs/`, and `specs/` are resolved |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge setup`

Interactively registers a project and writes the initial configuration file.

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source code root path (default: current directory) |
| `--work-root <path>` | Output directory path |
| `--type <type>` | Project type key matching an available preset (e.g., `cli`, `hono`, `nextjs`) |
| `--purpose <purpose>` | Document purpose: `developer-guide`, `user-guide`, or `api-reference` |
| `--tone <tone>` | Writing style: `polite`, `formal`, or `casual` |
| `--agent <agent>` | Default AI agent: `claude` or `codex` |
| `--lang <lang>` | Operating language: `en` or `ja` (default: `en`) |
| `--dry-run` | Show what would be created without writing any files |

Creates `.sdd-forge/config.json`, output directories, deploys skills to `.agents/skills/` and `.claude/skills/`, and initializes `AGENTS.md`.

```
sdd-forge setup --name my-project --type hono --lang en --agent claude
```

#### `sdd-forge upgrade`

Updates template-derived files (skills, configuration schemas) to match the currently installed version of sdd-forge.

| Option | Description |
|---|---|
| `--dry-run` | Show which files would change without writing them |

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `sdd-forge presets list`

Prints the full preset inheritance tree, showing how presets chain from the `base` root through namespace directories to leaf presets.

```
sdd-forge presets list
```

#### `sdd-forge docs build`

Runs the full documentation pipeline from source analysis through to final output. Each stage is weighted; if no AI agent is configured, enrichment and text generation stages are skipped automatically.

| Option | Description |
|---|---|
| `--agent <name>` | AI agent to use (overrides `config.json` default) |
| `--force` | Overwrite existing `docs/` files during `init` |
| `--dry-run` | Run all steps without writing any output |
| `--verbose` | Show per-step detailed output |
| `--regenerate` | Skip `init`; reuse existing `docs/` chapter files |

```
sdd-forge docs build
sdd-forge docs build --agent claude --verbose
sdd-forge docs build --regenerate --dry-run
```

#### `sdd-forge docs scan`

Analyzes source code using the preset-defined DataSources and writes the result to `.sdd-forge/output/analysis.json`. Incremental by default — entries with unchanged hashes are preserved.

| Option | Description |
|---|---|
| `--reset [cats]` | Clear entry hashes (all categories, or a comma-separated subset) |
| `--stdout` | Print the result to stdout instead of writing to file |
| `--dry-run` | Alias for `--stdout` |

```
sdd-forge docs scan
sdd-forge docs scan --reset
sdd-forge docs scan --stdout
```

#### `sdd-forge docs enrich`

Sends analysis entries to an AI agent to add structured metadata fields (`summary`, `detail`, `chapter`, `role`). Processes in batches and skips already-enriched entries, supporting resumption after interruption.

| Option | Description |
|---|---|
| `--agent <name>` | AI agent (required if not set in `config.json`) |
| `--dry-run` | Print enriched result to stdout |
| `--stdout` | Alias for `--dry-run` |

```
sdd-forge docs enrich --agent claude
```

#### `sdd-forge docs init`

Copies chapter template files from the preset inheritance chain into the `docs/` directory.

| Option | Description |
|---|---|
| `--type <type>` | Template type to use (default: value from `config.json`) |
| `--force` | Overwrite files that already exist in `docs/` |
| `--dry-run` | List target files without writing |

```
sdd-forge docs init
sdd-forge docs init --force
```

#### `sdd-forge docs data`

Resolves all `{{data(...)}}` directives in `docs/**/*.md` by substituting values from `analysis.json` and built-in data providers.

| Option | Description |
|---|---|
| `--dry-run` | Show changes without writing |
| `--stdout` | Print line change counts per file |

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### `sdd-forge docs text`

Resolves all `{{text(...)}}` directives in `docs/**/*.md` using an AI agent. By default, all directives in a file are batched into a single agent call per file.

| Option | Description |
|---|---|
| `--agent <name>` | AI agent to use (`claude` or `codex`) |
| `--id <id>` | Process only the directive with this id |
| `--dry-run` | Show changes without writing |
| `--force` | Force regeneration even if directives already have content |
| `--per-directive` | One AI call per directive instead of batching per file |
| `--timeout <ms>` | Agent call timeout in milliseconds (default: 180000) |

```
sdd-forge docs text --agent claude
sdd-forge docs text --agent claude --id d0 --dry-run
```

#### `sdd-forge docs readme`

Generates `README.md` by assembling content from `docs/` chapter files according to the preset template.

| Option | Description |
|---|---|
| `--lang <code>` | Source language code (default: `docs.defaultLanguage`) |
| `--output <path>` | Output file path (default: `README.md`) |
| `--dry-run` | Print the result without writing |

```
sdd-forge docs readme
sdd-forge docs readme --output docs/README.md --dry-run
```

#### `sdd-forge docs forge`

Runs an iterative improvement loop: the AI agent updates docs, a review step validates them, and the feedback is fed back into the next iteration.

| Option | Description |
|---|---|
| `--prompt <text>` | Initial improvement prompt (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Load prompt from a file |
| `--spec <path>` | Input specification file to guide improvements |
| `--max-runs <n>` | Number of iterations (default: 3) |
| `--agent <name>` | AI agent to use |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` (default: `local`) |
| `--dry-run` | Preview without writing |

```
sdd-forge docs forge --prompt "Improve clarity of the API reference section"
sdd-forge docs forge --prompt-file improve.txt --max-runs 5 --agent claude
```

#### `sdd-forge docs review`

Validates all `docs/` chapter files for structural integrity. Checks for required headings, unexpanded directives, broken HTML comment blocks, and residual template markers.

```
sdd-forge docs review
sdd-forge docs review docs/en
```

Exits `0` if all checks pass, `1` if any file fails.

#### `sdd-forge docs agents`

Regenerates the PROJECT section of `AGENTS.md` from the current analysis data.

| Option | Description |
|---|---|
| `--dry-run` | Print generated content without writing |

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### `sdd-forge docs translate`

Translates the default-language `docs/` files into all non-default languages listed in `config.json`. Only re-translates files where the source is newer than the existing translation unless `--force` is set.

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of modification time |
| `--dry-run` | Show what would be translated without writing |

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

#### `sdd-forge docs changelog`

Generates `docs/change_log.md` (or a specified file) as a table of spec entries from the `specs/` directory, including title, status, branch, and creation date.

| Option | Description |
|---|---|
| `--dry-run` | Print the result without writing |

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run changelog.md
```

#### `sdd-forge flow prepare`

Initializes a new development flow by creating a spec file, feature branch, and optionally a git worktree.

| Option | Description |
|---|---|
| `--title <name>` | Feature title (required) |
| `--base <branch>` | Base branch (default: current HEAD) |
| `--worktree` | Use git worktree mode for isolated development |
| `--no-branch` | Create spec only, without a branch |
| `--issue <number>` | GitHub issue number to link |
| `--request <text>` | User request text to record in flow state |
| `--dry-run` | Show what would be created without writing |

```
sdd-forge flow prepare --title "Add export feature"
sdd-forge flow prepare --title "Fix login bug" --issue 42 --worktree
```

#### `sdd-forge flow resume`

Discovers and reports the currently active flow, outputting its context as a JSON envelope. Used by skill scripts to recover flow state across sessions.

```
sdd-forge flow resume
```

#### `sdd-forge flow get <key>`

Reads values from the active flow state. The `<key>` selects the type of data to retrieve.

| Key | Description | Notable Options |
|---|---|---|
| `status` | Current flow state as JSON | — |
| `resolve-context` | Worktree and repo paths | — |
| `check <target>` | Evaluate conditions: `dirty`, `gh`, `impl`, `finalize` | — |
| `prompt <kind>` | Return a prompt template by kind | — |
| `qa-count` | Number of answered questions in the draft phase | — |
| `guardrail <phase>` | Guardrail rules for a phase (`draft`, `pre`, `post`, `impl`) | `--format json` |
| `issue <number>` | Fetch GitHub issue content | — |
| `context [path]` | List analysis entries or read file content | `--raw`, `--search <query>` |

```
sdd-forge flow get status
sdd-forge flow get guardrail draft --format json
sdd-forge flow get context src/cli.js
sdd-forge flow get context --search "routing"
```

#### `sdd-forge flow set <key>`

Updates values in the active flow state. Each subkey targets a specific field.

| Key | Arguments | Description |
|---|---|---|
| `step <id> <status>` | Step id, status string | Update a workflow step status |
| `request <text>` | Free text | Set the user request field |
| `issue <number>` | Issue number | Link a GitHub issue |
| `note <text>` | Free text | Append a note to the notes array |
| `summary <json>` | JSON array | Set the requirements list |
| `req <index> <status>` | Index, status string | Update a single requirement status |
| `metric <phase> <counter>` | Phase, counter name | Increment a metric counter |
| `issue-log` | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` | Record an issue-log entry |
| `auto on\|off` | `on` or `off` | Enable or disable autoApprove |
| `test-summary` | `--unit N`, `--integration N`, `--acceptance N` | Record test counts |

```
sdd-forge flow set step plan done
sdd-forge flow set request "Add CSV export to the reports page"
sdd-forge flow set metric draft question
sdd-forge flow set issue-log --step impl --reason "Missed edge case" --resolution "Added null check"
```

#### `sdd-forge flow run <action>`

Executes a flow action as part of the SDD workflow lifecycle.

| Action | Description | Key Options |
|---|---|---|
| `gate` | Run a gate check (pass/fail) against spec compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `review` | Run AI code review on changes | `--phase`, `--dry-run`, `--skip-confirm` |
| `impl-confirm` | Check implementation readiness | `--mode overview\|detail` |
| `finalize` | Commit, merge, sync docs, and clean up | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sync` | Build and commit updated docs | `--dry-run` |
| `lint` | Check changed files against guardrail lint rules | `--base <branch>` |
| `retro` | Evaluate spec accuracy against implementation | `--force`, `--dry-run` |
| `report` | Generate a work report from flow state | `--dry-run` |

```
sdd-forge flow run gate --phase pre
sdd-forge flow run finalize --merge-strategy squash
sdd-forge flow run retro --dry-run
```

#### `sdd-forge check config`

Validates `.sdd-forge/config.json` against the expected schema, checking required fields, value types, and whether the declared preset type exists.

| Option | Description |
|---|---|
| `--format <text\|json>` | Output format (default: `text`) |

```
sdd-forge check config
sdd-forge check config --format json
```

#### `sdd-forge check freshness`

Compares the modification timestamps of `docs/` files against source files to determine whether documentation is up to date.

| Option | Description |
|---|---|
| `--format <text\|json>` | Output format (default: `text`) |

Returns `fresh` (exit `0`), `stale` (exit `1`), or `never-built` (exit `1`).

```
sdd-forge check freshness
sdd-forge check freshness --format json
```

#### `sdd-forge check scan`

Reports scan coverage: how many source files are matched by scan configuration and how many are analyzed by DataSources, with a breakdown of uncovered files by extension.

| Option | Description |
|---|---|
| `--format <text\|json\|md>` | Output format (default: `text`) |
| `--list` | Show all uncovered files (default: up to 10) |

```
sdd-forge check scan
sdd-forge check scan --format md --list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | Command failed due to an error, validation failure, or unmet condition |

Specific commands use exit `1` to signal a meaningful negative result in addition to errors:

| Command | Exit `0` | Exit `1` |
|---|---|---|
| `docs review` | All chapter files pass structural checks | One or more files fail |
| `check config` | Configuration is valid | Validation fails |
| `check freshness` | `docs/` is up to date (`fresh`) | Source is newer (`stale`) or docs never built (`never-built`) |
| `flow run gate` | Gate check passes | Gate check fails (also records issue-log entry) |
| All other commands | Success | Any execution or I/O error |

**Stdout conventions**

Human-readable output (progress messages, tables, formatted reports) is written to stdout. Commands that support machine-readable output accept a `--format json` option and write a structured JSON object or envelope instead of plain text. `flow get` and `flow run` commands always write a JSON envelope to stdout:

```json
{ "ok": true,  "type": "get", "key": "status", "result": { ... } }
{ "ok": false, "type": "get", "key": "status", "code": "NO_FLOW", "message": "..." }
```

When `ok` is `false`, the envelope code field contains a short error key such as `NO_FLOW`, `NO_CONFIG`, or `ERROR`. Flow commands with JSON envelopes always exit `0`; callers must inspect the `ok` field to detect failures.

**Stderr conventions**

Error and warning messages are written to stderr using the patterns `[command] ERROR: <message>` and `[command] WARN: <message>`. Help text triggered by invalid usage or missing required arguments is also written to stderr.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
