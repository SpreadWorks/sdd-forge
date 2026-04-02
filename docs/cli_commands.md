<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents all 24 sdd-forge CLI commands, organized into four top-level groups: independent commands (`help`, `setup`, `upgrade`, `presets`), the `docs` namespace (12 subcommands covering the full documentation pipeline), and the `flow` namespace (8 subcommands for the Spec-Driven Development workflow). The `docs` and `flow` groups act as namespace dispatchers that rewrite `process.argv` before dynamically importing their respective handler modules.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `help` | Prints the full command list and current version. | — |
| `setup` | Interactive wizard that creates `.sdd-forge/config.json`, directories, `.gitignore`, `.gitattributes`, skill files, and `AGENTS.md`. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | Re-deploys skill files and applies `config.json` schema migrations. | `--dry-run` |
| `presets list` | Prints the preset inheritance tree using box-drawing characters. | — |
| `docs build` | Runs the full documentation pipeline: scan → enrich → init → data → text → readme → agents (with optional translate for multi-language projects). | `--force`, `--regenerate`, `--verbose` / `-v`, `--dry-run` |
| `docs scan` | Analyses source files and writes `analysis.json` to `.sdd-forge/output/`. | — |
| `docs enrich` | Uses an AI agent to enrich each entry in `analysis.json` with role, summary, and chapter classification. | — |
| `docs init` | Writes chapter `.md` files from preset templates; applies an AI chapter filter when an agent is configured. | `--type`, `--force`, `--dry-run` |
| `docs data` | Resolves `{{data(...)}}` directives in chapter files. | `--dry-run` |
| `docs text` | Fills `{{text(...)}}` directive slots via an AI agent. | `--dry-run` |
| `docs readme` | Generates `README.md` from the preset template, resolving data and text directives. | `--lang`, `--output`, `--dry-run` |
| `docs forge` | Runs an iterative write-review loop driven by a prompt. | `--prompt` (required), `--prompt-file`, `--spec`, `--max-runs` (default 3), `--review-cmd`, `--mode` (`local`/`assist`/`agent`), `--dry-run`, `--verbose` / `-v` |
| `docs review` | Validates documentation quality: minimum line counts, H1 presence, unfilled directives, broken comments, residual blocks, README existence, and multi-language directory completeness. Exits non-zero on failure. | — |
| `docs translate` | Translates chapter files into non-default languages using an AI agent; skips files that are already up to date. | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generates `docs/change_log.md` from specs metadata. | `--dry-run`, optional output-file positional argument |
| `docs agents` | Generates or refines `AGENTS.md` using an AI agent. | `--dry-run` |
| `flow prepare` | Initialises the spec file and creates the feature branch or worktree for a new flow. Requires `config.json`. | — |
| `flow get issue <number>` | Fetches a GitHub issue via the `gh` CLI and returns a JSON envelope. | — |
| `flow get status` | Returns current flow state (phase, steps, requirements, branch, worktree, issue) as a JSON envelope. | — |
| `flow set issue <number>` | Associates a GitHub issue number with the active `flow.json`. | — |
| `flow run finalize` | Executes the end-of-flow sequence: commit → merge → sync → cleanup → record. | `--mode` (`all`\|`select`, required), `--steps`, `--merge-strategy` (`squash`\|`pr`), `--message`, `--dry-run` |
| `flow run lint` | Checks changed files against guardrail articles defined in the spec. | `--base` (auto-resolved from `flow.json`) |
| `flow run review` | Runs a two-stage AI review (draft proposals then verdict pass) and writes `specs/<id>/review.md`. | `--dry-run`, `--skip-confirm` |
| `flow run sync` | Runs `docs build` + `docs review`, then stages and commits documentation files. | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run finalize`, `flow run review`, `flow run sync` | Simulates all operations without writing files, creating branches, or calling external services. |
| `--verbose` / `-v` | `docs build`, `docs forge` | Enables detailed progress output; in `docs forge`, streams full agent stdout/stderr instead of progress dots. |
| `--force` | `docs build`, `docs init`, `docs translate` | Overwrites existing output files instead of skipping them. |
| `--help` / `-h` | All commands | Displays usage information for the command and exits. |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

**Usage:** `sdd-forge help`

Prints the full list of available commands grouped by category (Project, Docs, Flow, Info) along with the current package version. No options.

#### setup

**Usage:** `sdd-forge setup [options]`

Interactive wizard that initialises a project for sdd-forge. Creates `.sdd-forge/config.json`, required directories, `.gitignore`, `.gitattributes`, skill files, and `AGENTS.md`. All options can be supplied non-interactively to skip individual prompts.

| Option | Description |
|---|---|
| `--name` | Project name. |
| `--path` | Source root path. |
| `--work-root` | Work root path (defaults to the source root). |
| `--type` | Preset type identifier (e.g. `node-cli`, `laravel`). |
| `--purpose` | Short project purpose for documentation style context. |
| `--tone` | Documentation tone (e.g. `polite`, `formal`, `casual`). |
| `--agent` | AI agent provider to configure. |
| `--lang` | Default documentation language. |
| `--dry-run` | Simulate without writing files. |

#### upgrade

**Usage:** `sdd-forge upgrade [--dry-run]`

Re-deploys skill files to `.claude/skills/` and `.agents/skills/` from the current package, and applies any pending `config.json` schema migrations (for example, converting the `chapters` field to object-array format). Reports each skill as updated or unchanged.

| Option | Description |
|---|---|
| `--dry-run` | Show what would change without writing files. |

#### presets list

**Usage:** `sdd-forge presets list`

Prints the full preset inheritance tree using box-drawing characters, showing parent–child relationships, axis, aliases, scan categories, and whether each preset includes template files.

#### docs build

**Usage:** `sdd-forge docs build [options]`

Runs the complete documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`. For multi-language configurations a `translate` step is appended automatically. Progress is displayed as a step-by-step progress bar. AI-dependent steps (`enrich`, `text`) are skipped if no `defaultAgent` is configured.

| Option | Description |
|---|---|
| `--force` | Force-overwrite existing chapter files during the `init` step. |
| `--regenerate` | Skip `init` and re-run AI text generation for existing files. |
| `--verbose` / `-v` | Stream detailed output from each pipeline step. |
| `--dry-run` | Simulate all steps without writing files. |

#### docs scan

**Usage:** `sdd-forge docs scan`

Analyses the project source tree and writes `analysis.json` to `.sdd-forge/output/`. This file is the primary input for all subsequent pipeline steps.

#### docs enrich

**Usage:** `sdd-forge docs enrich`

Passes the full `analysis.json` to an AI agent, which annotates each entry with a role label, prose summary, detailed description, and chapter classification. The enriched result is written back to `.sdd-forge/output/`.

#### docs init

**Usage:** `sdd-forge docs init [options]`

Writes initial chapter `.md` files to the `docs/` directory from preset templates. When an AI agent is configured, a filter step removes chapters not relevant to the project analysis or documentation purpose. Existing files are skipped unless `--force` is set.

| Option | Description |
|---|---|
| `--type` | Override the preset type used for template selection. |
| `--force` | Overwrite existing chapter files. |
| `--dry-run` | Simulate without writing files. |

#### docs data

**Usage:** `sdd-forge docs data [--dry-run]`

Resolves all `{{data(...)}}` directives in chapter files by querying the preset's data sources and replacing each slot with generated markdown tables or structured content derived from `analysis.json`.

| Option | Description |
|---|---|
| `--dry-run` | Resolve directives and report output without writing. |

#### docs text

**Usage:** `sdd-forge docs text [--dry-run]`

Fills all `{{text(...)}}` directive slots in chapter files by invoking an AI agent for each slot with a prompt built from the analysis context. Slots that already contain content are skipped.

| Option | Description |
|---|---|
| `--dry-run` | Generate text and report without writing to files. |

#### docs readme

**Usage:** `sdd-forge docs readme [options]`

Generates or updates `README.md` from the preset's readme template, resolving `{{data}}` directives and filling any `{{text}}` blocks with AI. Skips writing if the generated content is identical to the existing file.

| Option | Description |
|---|---|
| `--lang` | Target language for the generated README. |
| `--output` | Output file path (defaults to `README.md` in the project root). |
| `--dry-run` | Simulate without writing. |

#### docs forge

**Usage:** `sdd-forge docs forge --prompt <text> [options]`

Runs an iterative write-review loop: the AI agent improves documentation guided by the prompt, then a review command validates the result. The loop repeats up to `--max-runs` times. Progress dots are written to stderr during AI calls; `--verbose` streams the full agent output instead.

| Option | Description |
|---|---|
| `--prompt` | Instruction prompt for the AI agent (required unless `--prompt-file` is set). |
| `--prompt-file` | Path to a file containing the prompt. |
| `--spec` | Path to a spec file to include as additional context. |
| `--max-runs` | Maximum iteration count (default: `3`). |
| `--review-cmd` | Review command to run after each iteration (default: `sdd-forge docs review`). |
| `--mode` | Agent mode: `local`, `assist`, or `agent` (default: `local`). |
| `--dry-run` | Simulate without writing or invoking agents. |
| `--verbose` / `-v` | Stream agent stdout/stderr instead of progress dots. |

#### docs review

**Usage:** `sdd-forge docs review`

Validates the current state of the `docs/` directory. Checks include minimum line counts, presence of an H1 heading, no unfilled `{{text}}` or `{{data}}` slots, no broken HTML comment markers, no residual template block tags, README existence, and completeness of multi-language subdirectories. Exits with code `1` on any failure, making it suitable as a CI gate.

#### docs translate

**Usage:** `sdd-forge docs translate [options]`

Translates chapter files into all non-default languages declared in `config.json`. Files whose source has not been modified since the last translation are skipped unless `--force` is set. Translated files are written to `docs/<lang>/` subdirectories.

| Option | Description |
|---|---|
| `--lang` | Translate only into this specific language code. |
| `--force` | Re-translate even files that appear up to date. |
| `--dry-run` | Simulate without writing translated files. |

#### docs changelog

**Usage:** `sdd-forge docs changelog [out-file] [--dry-run]`

Scans the `specs/` directory for numbered spec subdirectories, reads each `spec.md`, and generates a Markdown changelog table at `docs/change_log.md`. An alternative output path may be provided as a positional argument.

| Option | Description |
|---|---|
| `--dry-run` | Render the changelog to stdout without writing to disk. |

#### docs agents

**Usage:** `sdd-forge docs agents [--dry-run]`

Generates or refines `AGENTS.md` (and the associated `CLAUDE.md` symlink). The SDD template section is updated to the current package version; the PROJECT section is produced or revised by an AI agent using the current source analysis and docs content.

| Option | Description |
|---|---|
| `--dry-run` | Simulate without writing `AGENTS.md`. |

#### flow prepare

**Usage:** `sdd-forge flow prepare`

Initialises a new Spec-Driven Development flow by creating the spec file under `specs/`, writing `flow.json`, and setting up the feature branch or git worktree. Requires `config.json` to be present.

#### flow get issue

**Usage:** `sdd-forge flow get issue <number>`

Fetches the specified GitHub issue using the `gh` CLI and writes a JSON flow envelope to stdout containing the issue title, body, labels, and state.

#### flow get status

**Usage:** `sdd-forge flow get status`

Returns the current flow state as a JSON envelope, including `phase`, step and requirement progress counts, `baseBranch`, `featureBranch`, `worktree`, associated `issue`, and any `notes` or `metrics`.

#### flow set issue

**Usage:** `sdd-forge flow set issue <number>`

Writes the given GitHub issue number into the active `flow.json`, associating it with the current flow for downstream commands such as `flow run finalize`.

#### flow run finalize

**Usage:** `sdd-forge flow run finalize --mode <all|select> [options]`

Executes the end-of-flow sequence in up to five steps: (1) commit changed files, (2) merge or open a PR, (3) run `flow run sync`, (4) clean up the worktree and branch, (5) record the flow result. The `--mode select` variant accepts explicit step numbers.

| Option | Description |
|---|---|
| `--mode` | `all` to run every step, `select` to choose specific steps (required). |
| `--steps` | Comma-separated step numbers when using `select` mode (e.g. `1,2`). |
| `--merge-strategy` | `squash` for a local squash merge or `pr` to open a GitHub pull request. |
| `--message` | Custom commit message for step 1. |
| `--dry-run` | Simulate all steps without writing, committing, or cleaning up. |

#### flow run lint

**Usage:** `sdd-forge flow run lint [--base <ref>]`

Checks all files changed since the base ref against the guardrail articles loaded from the project. Violations are reported to stdout. The base ref is auto-resolved from the active `flow.json` if not provided.

| Option | Description |
|---|---|
| `--base` | Git ref to diff against. Auto-resolved from `flow.json` when omitted. |

#### flow run review

**Usage:** `sdd-forge flow run review [options]`

Runs a two-stage AI code review against the current branch diff. The first stage drafts improvement proposals; the second stage validates each proposal with an APPROVED or REJECTED verdict. Results are written to `specs/<id>/review.md`.

| Option | Description |
|---|---|
| `--dry-run` | Run the review without writing `review.md`. |
| `--skip-confirm` | Skip the interactive confirmation prompt between stages. |

#### flow run sync

**Usage:** `sdd-forge flow run sync [--dry-run]`

Runs `docs build` followed by `docs review`, then stages and commits `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md` to the current branch. Skips the commit if there are no staged changes.

| Option | Description |
|---|---|
| `--dry-run` | Simulate the build, review, and commit without writing or staging anything. |
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
|---|---|---|
| `0` | *(success)* | Command completed successfully. |
| `1` | `EXIT_ERROR` | An error occurred — validation failure, AI agent error, missing or invalid configuration, `docs review` violations, unknown subcommand, or pipeline step failure. |

**stdout conventions**

Most commands write human-readable progress messages and results to stdout. The `docs build` command emits a step-by-step progress bar as each pipeline stage completes. The `docs changelog` and `docs data` commands print generated content to stdout when `--dry-run` is active.

All `flow get`, `flow set`, and `flow run` subcommands write a structured JSON envelope to stdout rather than prose:

```json
{"group": "flow", "command": "<name>", "status": "ok" | "error", "data": { ... }}
```

This allows skill scripts and orchestration tools to consume flow output without text parsing.

**stderr conventions**

Warning and error messages from all commands are written to stderr via `console.error`, keeping them separate from structured or human-readable stdout content. During AI agent calls in `docs forge`, a progress indicator (periodic dots emitted via `setInterval`) is written to stderr; passing `--verbose` / `-v` replaces those dots with the full streamed stdout and stderr from the agent subprocess.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
