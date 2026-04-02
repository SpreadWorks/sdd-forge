<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes more than 25 CLI commands organized under a three-tier dispatch structure: four top-level standalone commands (`help`, `setup`, `upgrade`, `presets`), twelve `docs` subcommands covering the full documentation pipeline (scan through agents), and a `flow` namespace with `prepare` plus `get`, `set`, and `run` subcommand groups for Spec-Driven Development workflow management.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Print all available commands grouped by section | — |
| `sdd-forge setup` | Interactive wizard to initialize a new project | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Re-deploy skill files and apply config schema migrations | `--dry-run` |
| `sdd-forge presets list` | Print the preset inheritance tree with box-drawing characters | — |
| `sdd-forge docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source files and write `analysis.json` | `--reset [categories]`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | AI-enrich analysis entries with role, summary, and chapter labels | `--agent`, `--stdout`, `--dry-run` |
| `sdd-forge docs init` | Create chapter template files in `docs/` | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--docs-dir`, `--stdout`, `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives via AI agent | `--id`, `--timeout`, `--per-directive`, `--force`, `--lang`, `--docs-dir`, `--files`, `--dry-run` |
| `sdd-forge docs readme` | Generate or update `README.md` from the preset template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven docs authoring with iterative write-review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Validate docs quality: directives, structure, README, analysis coverage | — |
| `sdd-forge docs changelog` | Generate a Markdown changelog from `specs/` directory | `--dry-run` |
| `sdd-forge docs agents` | Generate and refine `AGENTS.md` / `CLAUDE.md` using AI | `--dry-run` |
| `sdd-forge docs translate` | Translate chapter files and README into configured target languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow prepare` | Initialize a spec file and create a feature branch or worktree | — |
| `sdd-forge flow get issue` | Fetch a GitHub issue by number via `gh` CLI | — |
| `sdd-forge flow get status` | Return current flow phase, steps, and requirements progress | — |
| `sdd-forge flow set issue` | Associate a GitHub issue number with the active flow | — |
| `sdd-forge flow run finalize` | Execute commit → merge → sync → cleanup → record pipeline | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run lint` | Check changed files against guardrail lint patterns | `--base` |
| `sdd-forge flow run review` | Run two-stage AI code review on current branch diff | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Build docs, run review, stage, and commit documentation changes | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Description | Applies to |
|---|---|---|
| `--help` / `-h` | Print usage information for the command and exit | All commands |
| `--dry-run` | Preview changes without writing any files to disk | Most `docs` and `flow` commands |
| `--verbose` / `-v` | Emit detailed step-level progress logs to stderr | `docs build`, `docs forge` |
| `--version` / `-v` / `-V` | Print the installed sdd-forge version and exit | Top-level entry point only |
| `--stdout` | Write output to stdout instead of to the target file | `docs scan`, `docs enrich`, `docs data` |

The `--dry-run` flag is the most broadly shared option. When present, commands log what they would do and either print the result to stdout or skip file writes entirely, without modifying any files on disk.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Prints a formatted list of all commands grouped by section (Project, Docs, Flow, Info) alongside localized descriptions. Reads the package version from `package.json` for the header line. Accepts no options. Invoked automatically when no subcommand is provided.

```
sdd-forge help
sdd-forge --help
```

#### `sdd-forge setup`

Interactive setup wizard that collects configuration via terminal prompts and writes `.sdd-forge/config.json`. Also creates `docs/` and `specs/` directories, updates `.gitignore` (adding `.tmp` and `.sdd-forge/worktree`) and `.gitattributes` (adding an `analysis.json merge=ours` strategy), deploys skill files, and generates or updates `AGENTS.md`. All prompts can be bypassed with CLI flags for non-interactive use.

```
sdd-forge setup [options]
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--type <type>` | Preset type |
| `--agent <provider>` | AI agent provider |
| `--lang <lang>` | Project language |
| `--dry-run` | Preview configuration without writing files |

#### `sdd-forge upgrade`

Re-deploys skill files from the current package version and applies any pending `config.json` schema migrations. Currently detects and migrates `chapters` entries from a plain string array to an object array format. Reports each skill as `updated` or `unchanged`.

```
sdd-forge upgrade [--dry-run]
```

#### `sdd-forge presets list`

Prints the full preset inheritance tree to stdout using box-drawing characters. Each node displays the preset key, axis, lang, aliases, scan keys, and a `[no templates]` marker when no `templates/` directory exists alongside `preset.json`.

```
sdd-forge presets list
```

#### `sdd-forge docs build`

Runs the complete documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, with an optional `translate` step when multi-language output is configured. Displays a weighted progress bar. When `--regenerate` is passed, the `init` step is skipped and existing chapter files are reused. The `enrich` and `text` steps require a configured AI agent and are silently skipped when none is available.

```
sdd-forge docs build [options]
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during `init` |
| `--regenerate` | Skip `init`; regenerate text in existing chapter files |
| `--verbose` | Show step-level progress logs |
| `--dry-run` | Run pipeline without writing files |

#### `sdd-forge docs scan`

Scans source files and writes a structured `analysis.json` to `.sdd-forge/output/`. The output drives all subsequent pipeline steps. The `--reset` flag accepts a comma-separated list of category names to force re-scanning of specific categories, or no value to reset all.

```
sdd-forge docs scan [--reset [categories]] [--stdout] [--dry-run]
```

#### `sdd-forge docs enrich`

Passes `analysis.json` to an AI agent to annotate each entry with a `role`, `summary`, `detail`, and chapter classification labels. Requires `agent.default` to be configured in `config.json`. Writes enriched data back to `.sdd-forge/output/`.

```
sdd-forge docs enrich [--agent <name>] [--stdout] [--dry-run]
```

#### `sdd-forge docs init`

Resolves the template chain for the project's preset type, merges chapter lists, and writes chapter Markdown files into `docs/`. When an AI agent is configured and no `config.chapters` override is present, uses AI to filter chapters based on analysis content and documentation purpose (`docs.style.purpose`). Existing files are skipped unless `--force` is given.

```
sdd-forge docs init [options]
```

| Option | Description |
|---|---|
| `--type <type>` | Override the preset type |
| `--lang <lang>` | Override the output language |
| `--docs-dir <path>` | Override the docs directory path |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing files |

#### `sdd-forge docs data`

Reads each chapter file in `docs/` and resolves all `{{data(...)}}` directives by calling the resolver for the project's preset type against `analysis.json`. Writes the populated content back in place.

```
sdd-forge docs data [--docs-dir <path>] [--stdout] [--dry-run]
```

#### `sdd-forge docs text`

Scans chapter files for `{{text(...)}}` directives and calls an AI agent to fill each block with generated prose. The `--id` flag restricts processing to a single named directive. The `--per-directive` flag processes each directive in a separate agent call instead of batching within a file. The `--force` flag bypasses change detection and regenerates all directives unconditionally.

```
sdd-forge docs text [options]
```

| Option | Description |
|---|---|
| `--id <id>` | Process only the directive with this ID |
| `--timeout <ms>` | Agent timeout in milliseconds (default: 300000) |
| `--per-directive` | One agent call per directive instead of per file |
| `--force` | Regenerate all directives regardless of change detection |
| `--lang <lang>` | Override the output language |
| `--docs-dir <path>` | Override the docs directory path |
| `--files <list>` | Comma-separated list of chapter files to process |
| `--dry-run` | Preview without writing files |

#### `sdd-forge docs readme`

Resolves the `README.md` template from the preset chain, applies `{{data}}` directives using a path-aware resolver, and fills any `{{text}}` blocks via AI. Skips the write if the generated content is identical to the existing file. Handles both root `README.md` and per-language files via `--output`.

```
sdd-forge docs readme [options]
```

| Option | Description |
|---|---|
| `--lang <lang>` | Target output language |
| `--output <path>` | Write to a custom path instead of `README.md` |
| `--dry-run` | Print result to stdout without writing |

#### `sdd-forge docs forge`

Orchestrates AI-driven documentation authoring with an iterative write-review loop across chapter files. Supports three modes: `local` (per-file agent calls), `assist`, and `agent`. After each round the review command is run and its failure output is fed back as context for the next round, up to `--max-runs` iterations. Finalizes by regenerating `README.md` and any translations.

```
sdd-forge docs forge --prompt "<instruction>" [options]
```

| Option | Description |
|---|---|
| `--prompt <text>` | User instruction for the agent (required) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Path to a `spec.md` file providing additional context |
| `--max-runs <n>` | Maximum write-review iterations (default: 3) |
| `--review-cmd <cmd>` | Review command between rounds (default: `sdd-forge docs review`) |
| `--mode <local\|assist\|agent>` | Execution mode (default: `local`) |
| `--dry-run` | List target files without running the agent |
| `--verbose` / `-v` | Stream agent output to stderr |

#### `sdd-forge docs review`

Validates the generated documentation by checking every chapter file for: minimum line count (15 lines), presence of an H1 heading, unfilled `{{text}}` or `{{data}}` directives, broken HTML comment pairs, and residual block tags. Also verifies `README.md` exists, configured translation language directories are populated, and `analysis.json` is present. Exits with `EXIT_ERROR` on any failure, making it suitable as a CI gate.

```
sdd-forge docs review [docs-dir]
```

#### `sdd-forge docs changelog`

Scans the `specs/` directory for numbered subdirectories, reads each `spec.md`, and extracts title, status, created date, and description. Produces a Markdown file with a latest-series index table and a full spec history table. Defaults to writing `docs/change_log.md`.

```
sdd-forge docs changelog [output-path] [--dry-run]
```

#### `sdd-forge docs agents`

Reads or creates `AGENTS.md` in the source root, resolves `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives, then calls an AI agent with a refine prompt built from `package.json` scripts, docs chapter content, and README. Replaces only the PROJECT block, preserving the SDD section and any content written outside directive blocks.

```
sdd-forge docs agents [--dry-run]
```

#### `sdd-forge docs translate`

Translates chapter files and `README.md` into each configured target language using an AI agent. Builds a task list of source/target pairs, skipping files where the target is newer than the source unless `--force` is set. Runs translation tasks concurrently according to `config.agent.concurrency`. Creates per-language subdirectories under `docs/` automatically.

```
sdd-forge docs translate [options]
```

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate even when the target file is up to date |
| `--dry-run` | List tasks without translating |

#### `sdd-forge flow prepare`

Initializes a spec file and creates a feature branch or git worktree for a new Spec-Driven Development flow. Writes `flow.json` to track state across subsequent flow commands. Requires a valid `config.json` to be present.

```
sdd-forge flow prepare [options]
```

#### `sdd-forge flow get issue`

Fetches a GitHub issue by number using the `gh` CLI and returns its `title`, `body`, `labels`, and `state` as a structured JSON envelope on stdout. Requires a positive integer argument.

```
sdd-forge flow get issue <number>
```

#### `sdd-forge flow get status`

Returns the current flow phase, full step list with statuses, requirements progress, branch names, worktree flag, issue reference, notes, and metrics from `flow.json` as a JSON envelope. The `phase` field is derived by `derivePhase()` from the list of completed steps.

```
sdd-forge flow get status
```

#### `sdd-forge flow set issue`

Associates a GitHub issue number with the active flow by writing the number to `flow.json`. Intended for use after `gh issue create` to link an issue to an in-progress spec.

```
sdd-forge flow set issue <number>
```

#### `sdd-forge flow run finalize`

Executes the finalization pipeline in order: (1) commit, (2) merge, (3) docs sync, (4) worktree cleanup, (5) record. Run all steps with `--mode all` or a subset with `--mode select --steps <n,...>`. The merge step auto-detects PR vs. squash strategy based on `config.commands.gh` and `gh` availability unless `--merge-strategy` overrides it. Each step result is reported in the output envelope.

```
sdd-forge flow run finalize --mode <all|select> [options]
```

| Option | Description |
|---|---|
| `--mode <all\|select>` | Run all steps or a selected subset (required) |
| `--steps <1,2,...>` | Comma-separated step numbers for select mode |
| `--merge-strategy <squash\|pr>` | Override the merge strategy |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview steps without executing |

#### `sdd-forge flow run lint`

Loads guardrail articles from the project and runs pattern-based lint checks against the git diff of changed files relative to the base branch. Reports violations as failures and warnings in a JSON envelope. The base branch is read from `flow.json` when `--base` is not provided.

```
sdd-forge flow run lint [--base <branch>]
```

#### `sdd-forge flow run review`

Delegates to `flow/commands/review.js` to run a two-stage AI code review: a draft pass that generates numbered refactoring proposals, followed by a final validation pass that approves or rejects each one. Results are written to `specs/<id>/review.md`. The output envelope includes proposal counts, verdict tallies, and a `next` field (`finalize` or `apply`) for downstream skill routing.

```
sdd-forge flow run review [--dry-run] [--skip-confirm]
```

#### `sdd-forge flow run sync`

Runs `sdd-forge docs build`, then `sdd-forge docs review`, stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`, and commits them with the message `docs: sync documentation`. Skips the commit when there are no staged changes. Reports the list of changed files in the output envelope.

```
sdd-forge flow run sync [--dry-run]
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
|---|---|---|
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | Command failed: unknown subcommand, missing config, pipeline error, lint violation, or review failure |

Both constants are defined in `src/lib/exit-codes.js` and imported by all command modules.

**stdout** — Used for primary command output: generated file content (with `--dry-run` or `--stdout`), pipeline completion messages, and all `flow get` / `flow set` / `flow run` JSON envelopes.

**stderr** — Used for progress logs, warnings, and error messages. All progress prefixes follow the pattern `[command] MESSAGE` (e.g., `[forge] start: docs/overview.md`, `[build] ERROR: ...`).

**Flow envelope format** — All `flow get`, `flow set`, and `flow run` commands write a structured JSON object to stdout via the `output()` helper from `lib/flow-envelope.js`. Success envelopes use `status: "ok"` with a `data` payload; failure envelopes use `status: "fail"` with a `code` and `message` field.

**`docs review`** — Exits with `EXIT_ERROR` (`1`) when any validation check fails (short files, unfilled directives, broken comments, missing README, missing analysis). Intended for use as a CI gate.

**Pipeline commands** — `docs build` and `flow run finalize` catch errors internally, log them to stderr with an `[command] ERROR:` prefix, and exit with `EXIT_ERROR` on fatal failures while allowing non-fatal step warnings to continue the pipeline.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
