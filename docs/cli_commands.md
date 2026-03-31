<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides 31 CLI commands organized in a three-level hierarchy: 4 top-level commands (`help`, `setup`, `upgrade`, `presets list`) for project management, 12 `docs` subcommands (including `build` as a full-pipeline alias) covering the documentation generation workflow, and 15 `flow` subcommands split across `get`, `set`, and `run` groups for managing the Spec-Driven Development lifecycle.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display all available commands grouped by category | — |
| `sdd-forge setup` | Interactive wizard to register a project and write `config.json` | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Update skills and template-derived files to the installed version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree with labels and metadata | — |
| `sdd-forge docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents → [translate] | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and generate `.sdd-forge/output/analysis.json` | — |
| `sdd-forge docs enrich` | AI-enrich analysis entries with role, summary, and detail fields | — |
| `sdd-forge docs init` | Initialize chapter files from the preset template chain | `--force`, `--dry-run` |
| `sdd-forge docs data` | Populate `{{data}}` directives in chapter files from analysis | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files via AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from the preset template chain | `--output`, `--lang`, `--dry-run` |
| `sdd-forge docs forge` | Iterative AI-driven docs improvement loop with integrated review | `--prompt`, `--prompt-file`, `--spec`, `--mode`, `--max-runs`, `--dry-run` |
| `sdd-forge docs review` | Validate chapter files for structure, directives, and output integrity | — |
| `sdd-forge docs translate` | Translate docs to non-default languages via AI agent | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `docs/change_log.md` from entries in `specs/` | `--dry-run` |
| `sdd-forge docs agents` | Update `AGENTS.md` with an AI-refined project context section | `--dry-run` |
| `sdd-forge flow get issue` | Fetch a GitHub issue by number using the `gh` CLI | — |
| `sdd-forge flow set auto` | Enable or disable `autoApprove` mode in `flow.json` | — |
| `sdd-forge flow set issue` | Set the linked GitHub issue number in `flow.json` | — |
| `sdd-forge flow set metric` | Increment a named metric counter for a workflow phase | — |
| `sdd-forge flow set note` | Append a text note to `flow.json` | — |
| `sdd-forge flow set redo` | Record a redo entry in `redolog.json` in the spec directory | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Update a single requirement's status by index | — |
| `sdd-forge flow set request` | Set the user request text field in `flow.json` | — |
| `sdd-forge flow set step` | Update a workflow step's status by step ID | — |
| `sdd-forge flow set summary` | Replace the requirements list from a JSON array | — |
| `sdd-forge flow run prepare-spec` | Create a feature branch or worktree and initialize the spec directory | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run gate` | Run spec gate check with text validation and optional AI guardrail | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run impl-confirm` | Check implementation readiness against tracked requirements | `--mode` |
| `sdd-forge flow run lint` | Run guardrail lint patterns against files changed since the base branch | `--base` |
| `sdd-forge flow run finalize` | Execute the finalization pipeline: commit → merge → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applicable Commands | Description |
| --- | --- | --- |
| `-h`, `--help` | All commands | Print help text for the command and exit |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run prepare-spec`, `flow run finalize` | Preview actions without writing files or executing git and shell operations |
| `--verbose` | `docs build`, `docs forge` | Emit detailed per-step or per-file progress output |
| `-v`, `--version`, `-V` | Top-level `sdd-forge` only | Print the installed package version and exit |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge help

Displays all available commands grouped into sections (Project, Docs, Flow, Info) alongside the installed version number and a usage hint. Triggered by `sdd-forge help`, `sdd-forge`, or `sdd-forge --help`.

**Usage:** `sdd-forge help`

#### sdd-forge setup

Launches an interactive wizard that prompts for project name, output languages, preset type, document purpose, tone, and AI agent settings, then writes `.sdd-forge/config.json`. When all required options are supplied as CLI flags, interactive prompts are bypassed entirely. Also creates `docs/`, `specs/`, and `.sdd-forge/output/` directories, updates `.gitignore` and `.gitattributes`, deploys skill files to `.claude/skills/` and `.agents/skills/`, and generates `AGENTS.md`.

**Usage:** `sdd-forge setup [options]`

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--work-root <path>` | Work root directory (defaults to source root) |
| `--type <type>` | Preset type leaf name (e.g. `node-cli`, `laravel`) |
| `--lang <code>` | Project language code |
| `--agent <provider>` | AI agent provider (`claude`, `codex`) |
| `--purpose <text>` | Documentation style purpose |
| `--tone <text>` | Documentation style tone |
| `--dry-run` | Preview generated config without writing files |

#### sdd-forge upgrade

Redeploys skill template files from the installed package to `.claude/skills/` and `.agents/skills/`, reporting each file as `updated` or `unchanged`. Also detects when the `chapters` field in `config.json` uses the old string-array format and migrates it to the current object-array format.

**Usage:** `sdd-forge upgrade [--dry-run]`

#### sdd-forge presets list

Prints the preset inheritance tree using `├──` and `└──` connectors. Each line shows the preset key, label, axis, language, aliases, scan keys, and a `[no templates]` marker when the preset directory contains no templates.

**Usage:** `sdd-forge presets list`

#### docs build

Runs the full documentation pipeline in this sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`. If `docs.languages` lists more than one language, a `translate` step follows. The `enrich` and `text` steps are silently skipped when no `agent.default` is configured. Using `--regenerate` skips `init` and instead re-runs `data` and `text` on the existing chapter files.

**Usage:** `sdd-forge docs build [options]`

| Option | Description |
| --- | --- |
| `--force` | Force overwrite of existing chapter files during `init` |
| `--regenerate` | Skip `init`; regenerate text content in existing files |
| `--verbose` | Show detailed progress per pipeline step |
| `--dry-run` | Preview pipeline steps without writing any files |

#### docs scan

Analyzes the source directory using preset-defined patterns and writes categorized analysis data to `.sdd-forge/output/analysis.json`. The output contains entries grouped by category with file path, detected type, and extracted metadata.

**Usage:** `sdd-forge docs scan`

#### docs enrich

Passes the current `analysis.json` entries to the configured AI agent to add `role`, `summary`, and `detail` fields to each entry. Requires `agent.default` to be set in `config.json`. Already-enriched entries are preserved.

**Usage:** `sdd-forge docs enrich`

#### docs init

Creates chapter markdown files in `docs/` by resolving the preset template inheritance chain (`{%extends%}` / `{%block%}`) for the configured type. The set and order of chapter files is determined by `preset.json` chapters and any override defined in `config.json`. Existing files are left unchanged unless `--force` is given.

**Usage:** `sdd-forge docs init [--force] [--dry-run]`

#### docs data

Expands all `{{data(...)}}` directives found in chapter files by querying the analysis data through the type-based resolver. Rendered content is written between each directive's open and close tags in place.

**Usage:** `sdd-forge docs data [--dry-run]`

#### docs text

Fills `{{text(...)}}` directives in chapter files by submitting each directive's prompt and surrounding document context to the configured AI agent. Existing filled content is stripped before regeneration. Files are processed concurrently up to the limit configured in `config.concurrency`.

**Usage:** `sdd-forge docs text [--dry-run]`

#### docs readme

Generates `README.md` from the `README.md` template in the preset chain, resolving `{{data}}` directives via the type-based resolver and filling any `{{text}}` directives via AI in per-directive mode. Skips writing when the rendered content matches the existing file. Use `--output` to redirect to an alternative path.

**Usage:** `sdd-forge docs readme [--output <path>] [--lang <lang>] [--dry-run]`

#### docs forge

Runs an iterative docs improvement loop: first populates `{{data}}` and `{{text}}` directives, then in each round calls the AI agent with the `--prompt` as intent, runs the review command, and uses any review failures as feedback for the next round. The `--mode` flag controls agent involvement: `local` (review only, no agent), `assist` (agent with graceful fallback), `agent` (agent required). Maximum rounds is set by `--max-runs` (default: 3). When `--spec` is provided, target chapter files are narrowed to those whose filename keywords match the spec text.

**Usage:** `sdd-forge docs forge --prompt <text> [options]`

| Option | Description |
| --- | --- |
| `--prompt <text>` | User intent describing the desired documentation state (required unless `--prompt-file` is given) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Path to a spec file used to narrow target chapter files |
| `--mode <mode>` | `local`, `assist`, or `agent` (default: `local`) |
| `--max-runs <n>` | Maximum improvement iterations (default: 3) |
| `--review-cmd <cmd>` | Override the review command (default: `sdd-forge docs review`) |
| `--verbose` / `-v` | Stream agent output to stderr |
| `--dry-run` | List target files without executing agent calls or writes |

#### docs review

Validates every chapter file in `docs/` against the following checks: minimum 15 lines, presence of an H1 heading, no unfilled `{{text}}` directives, no unfilled `{{data}}` directives, no exposed directive syntax leaking into rendered output, no residual block-directive comments (`@block`, `@endblock`, `@extends`, `@parent`), and balanced HTML comment delimiters. Also verifies that `analysis.json` and `README.md` exist. For multi-language configs, all checks are repeated for each language subdirectory. Reports the analysis categories not referenced by any `{{data}}` directive. **Exits with code 1 if any check fails.**

**Usage:** `sdd-forge docs review [<docs-dir>]`

#### docs translate

Translates default-language chapter files and `README.md` to each non-default language in `docs.languages`. Compares source and target modification timestamps to skip already up-to-date files; `--force` bypasses this check. Translation is performed by the configured AI agent with tone and style rules derived from `docs.style`. Files are translated in parallel up to `config.concurrency`.

**Usage:** `sdd-forge docs translate [--lang <lang>] [--force] [--dry-run]`

#### docs changelog

Scans every subdirectory of `specs/`, parses each `spec.md` to extract title, created date, status, feature branch, and input summary, then writes `docs/change_log.md`. The output contains a latest-index table (one row per spec series, keyed by the highest sequential number) and an all-specs table sorted by directory name. Content between `<!-- AUTO-GEN:START -->` and `<!-- AUTO-GEN:END -->` markers is replaced on each run; content outside those markers is preserved.

**Usage:** `sdd-forge docs changelog [<output-path>] [--dry-run]`

#### docs agents

Resolves `{{data}}` directives in `AGENTS.md` to render the SDD template section and the PROJECT template section. Then calls the AI agent with the template-generated PROJECT content and the current generated docs as context; the AI-refined PROJECT section is written back into the `{{data("agents.project")}}` block. Creates `AGENTS.md` from a default template when the file does not exist.

**Usage:** `sdd-forge docs agents [--dry-run]`

#### flow get issue

Calls `gh issue view <number> --json title,body,labels,state` with a 15-second timeout and writes the result as a structured JSON envelope to stdout. Validates that the argument is a positive integer before invoking `gh`.

**Usage:** `sdd-forge flow get issue <number>`

**Example:** `sdd-forge flow get issue 42`

#### flow set (subcommands)

Each `flow set` subcommand mutates a specific field in the active `flow.json` and writes a JSON result envelope to stdout. All subcommands require an active flow (a `flow.json` must exist).

| Subcommand | Arguments | Effect |
| --- | --- | --- |
| `auto <on\|off>` | — | Set `state.autoApprove` to `true` or `false` |
| `issue <number>` | — | Set `state.issue` to the given integer |
| `note "<text>"` | — | Append an entry to `state.notes[]` |
| `request "<text>"` | — | Set `state.request` |
| `req <index> <status>` | — | Update `state.requirements[index].status` |
| `step <id> <status>` | — | Update the matching step's status in `state.steps[]` |
| `summary '<json>'` | — | Replace `state.requirements` from a JSON array |
| `metric <phase> <counter>` | — | Increment `state.metrics[phase][counter]` |
| `redo --step <id> --reason <text>` | `--trigger`, `--resolution`, `--guardrail-candidate` | Append a timestamped entry to `specs/<spec>/redolog.json` |

Valid phases for `metric`: `draft`, `spec`, `gate`, `test`, `impl`. Valid counters: `question`, `redo`, `docsRead`, `srcRead`.

#### flow run prepare-spec

Creates the feature branch or git worktree, initializes `specs/NNN-slug/` with `spec.md` and `qa.md`, writes the initial `flow.json` (with `approach`, `branch`, and `spec` steps pre-marked done), and registers the flow in `.active-flow`. The three-digit spec index is derived from the highest existing index found in `specs/` directories and `feature/*` branches. Requires a clean working tree.

**Usage:** `sdd-forge flow run prepare-spec --title <name> [options]`

| Option | Description |
| --- | --- |
| `--title <name>` | Feature title used to generate the branch name and spec slug (required) |
| `--base <branch>` | Base branch to branch from (default: current HEAD) |
| `--worktree` | Create an isolated git worktree instead of checking out a local branch |
| `--no-branch` | Spec-only mode: initialize the spec directory without creating a branch |
| `--dry-run` | Preview without executing git operations |

#### flow run gate

Validates `spec.md` for unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked task items outside skip-sections, and required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`). In `post` phase, also checks that `- [x] User approved this spec` is present in `## User Confirmation`. Optionally runs an AI guardrail compliance check using articles from `guardrail.md` filtered to the `spec` phase. Resolves the spec path from `flow.json` when `--spec` is omitted.

**Usage:** `sdd-forge flow run gate [--spec <path>] [--phase <pre|post>] [--skip-guardrail]`

#### flow run impl-confirm

Reads `state.requirements` from `flow.json` and reports counts of done, in-progress, and pending items. Returns `ready` when all requirements are marked done or no requirements are tracked, and `incomplete` otherwise. In `detail` mode, additionally lists files changed between the base branch and HEAD via `git diff <base>...HEAD --name-only`.

**Usage:** `sdd-forge flow run impl-confirm [--mode <overview|detail>]`

#### flow run lint

Loads merged guardrail articles from the project's `guardrail.md` files and runs lint patterns against files changed since the base branch. Each violation is reported as `FAIL: [article] file:line — match`. The base branch is resolved from `--base` or from the active `flow.json`. Returns a JSON envelope listing all violations.

**Usage:** `sdd-forge flow run lint [--base <branch>]`

#### flow run finalize

Executes the end-of-flow pipeline through up to five sequential steps. Use `--mode all` to run every step, or `--mode select --steps <numbers>` to run specific steps only. Each step result (done, skipped, failed, or dry-run) is reported in the JSON envelope.

**Usage:** `sdd-forge flow run finalize --mode <all|select> [options]`

| Option | Description |
| --- | --- |
| `--mode <all\|select>` | Step selection mode (required) |
| `--steps <1,2,...>` | Comma-separated step numbers for `select` mode |
| `--merge-strategy <strategy>` | `squash` or `pr` (default: auto-detect from `config.commands.gh`) |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview all steps without executing |

Step mapping: `1` = commit all staged changes, `2` = merge or create PR, `3` = sync docs (runs `docs build`, skipped on PR route), `4` = cleanup worktree and branch, `5` = record.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
| --- | --- | --- |
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | An error occurred: unknown subcommand, missing required argument, validation failure, or fatal runtime error |

Both constants are defined in `src/lib/exit-codes.js` and imported by every command file that calls `process.exit()` or sets `process.exitCode`.

**stdout conventions:**

| Output type | Commands | Format |
| --- | --- | --- |
| Human-readable messages | `docs *`, `setup`, `upgrade`, `help`, `presets` | Plain text via `console.log()` |
| JSON envelope | All `flow get`, `flow set`, `flow run` commands | Single JSON object (see below) |
| Dry-run preview | Any command with `--dry-run` | Rendered content or command preview printed to stdout instead of being written to disk |

**stderr conventions:**

Error messages, warnings, and verbose progress details are written to stderr via `console.error()`. In `docs forge`, agent progress is streamed to stderr as dots (normal mode) or raw agent output (`--verbose` mode).

**JSON envelope format (flow commands):**

All `flow get`, `flow set`, and `flow run` commands emit a single JSON object to stdout via the `output()` function in `src/lib/flow-envelope.js`:

| Field | Type | Description |
| --- | --- | --- |
| `ok` | boolean | `true` on success, `false` on failure |
| `op` | string | Subcommand group: `get`, `set`, or `run` |
| `key` | string | Subcommand name (e.g. `issue`, `step`, `gate`) |
| `data` | object or null | Result payload on success; `null` on failure |
| `error` | object or null | `{ code, message }` on failure; `null` on success |

**docs review exit behavior:**

`docs review` exits with code `1` when any individual check fails and prints a diagnostic line per failure. It exits with code `0` only when all checks pass across all chapter files, `README.md`, and every configured language subdirectory. This makes it suitable for use as a CI gate and as the built-in review step in `docs forge`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
