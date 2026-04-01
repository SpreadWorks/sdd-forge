<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 28 commands organized under three top-level namespaces: `docs` (13 subcommands covering the full documentation pipeline from source scanning through AI-driven translation), `flow` (three second-level dispatchers — `get`, `set`, and `run` — each exposing multiple keys and actions for Spec-Driven Development workflow control), and standalone commands (`setup`, `upgrade`, `presets`, `help`). All commands follow the pattern `sdd-forge <namespace> <subcommand> [options]`, and the `flow` namespace extends to a third level for operations such as `sdd-forge flow run finalize`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display the versioned help screen listing all commands grouped by section | — |
| `sdd-forge setup` | Interactive wizard to register a project and generate `.sdd-forge/config.json`, deploy skills, and create `AGENTS.md` | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Update deployed skills and migrate `config.json` format to the current installed version | `--dry-run` |
| `sdd-forge presets list` | Print the preset inheritance tree with axis, language, alias, and scan key metadata | — |
| `sdd-forge docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source files and produce `.sdd-forge/output/analysis.json` | — |
| `sdd-forge docs enrich` | Enrich `analysis.json` entries with AI-generated `role`, `summary`, and `detail` fields | — |
| `sdd-forge docs init` | Initialize chapter markdown files in `docs/` from the preset template chain | `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data(...)}}` directives in chapter files using `analysis.json` | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text(...)}}` directives in chapter files using an AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` by resolving preset templates and `{{data}}`/`{{text}}` directives | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Run an iterative AI documentation improvement loop with review-feedback cycles | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Validate chapter files for structure, content completeness, and directive fill status | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default language directories via an AI agent | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Scan `specs/` directories and generate `docs/change_log.md` with two summary tables | `--dry-run` |
| `sdd-forge docs agents` | Generate and update `AGENTS.md` by resolving `{{data}}` directives and refining the PROJECT section via AI | `--dry-run` |
| `sdd-forge flow get status` | Return the active SDD flow state (phase, steps, requirements, metrics) as a JSON envelope | — |
| `sdd-forge flow get issue <n>` | Fetch a GitHub issue by number as a JSON envelope using the `gh` CLI | — |
| `sdd-forge flow get check <target>` | Check a flow prerequisite or environment condition (`impl`, `finalize`, `dirty`, `gh`) as a JSON envelope | — |
| `sdd-forge flow set` | Update step status, requirement fields, or metadata in the active `flow.json` | — |
| `sdd-forge flow run gate` | Validate `spec.md` completeness and optional AI guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run lint` | Run guardrail lint pattern checks against files changed since the base branch | `--base` |
| `sdd-forge flow run prepare-spec` | Create a numbered feature branch or git worktree and initialize the spec directory with templates | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run impl-confirm` | Check implementation readiness by summarizing requirement statuses from flow state | `--mode` |
| `sdd-forge flow run finalize` | Execute the finalization pipeline: commit → merge → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run merge` | Squash-merge the feature branch into the base branch or create a GitHub Pull Request | `--pr`, `--auto`, `--dry-run` |
| `sdd-forge flow run review` | Run a two-phase AI code quality review (draft proposals + final verdicts) and save results to `review.md` | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run cleanup` | Remove the feature branch and/or git worktree and clear the active-flow registry entry | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Alias | Applicable Commands | Description |
| --- | --- | --- | --- |
| `--help` | `-h` | All commands | Print usage information for the command and exit with code `0` |
| `--dry-run` | — | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run prepare-spec`, `flow run finalize`, `flow run merge`, `flow run cleanup` | Preview the command's effect without writing any files or executing destructive operations |
| `--verbose` | `-v` | `docs build`, `docs forge` | Stream AI agent output to stderr and display detailed pipeline progress |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Displays the versioned help screen grouped into sections (Project, Docs, Flow, Info). Command descriptions are resolved via i18n. No arguments are required; the screen also appears when `sdd-forge` is invoked without a subcommand or with `-h`/`--help`.

#### `sdd-forge setup`

Interactive wizard that registers a project and generates `.sdd-forge/config.json`. Runs a sequential prompt flow: project name, output languages (multi-select), default output language, preset selection (tree-based multi-select with ancestor auto-selection), document purpose, tone, and agent provider. All values can be supplied as CLI options for non-interactive use. Also deploys skills, creates directory structure (`docs/`, `specs/`, `.sdd-forge/output/`), adds `.gitignore` entries, and creates or updates `AGENTS.md` with the SDD directive block.

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--type <type>` | Preset type leaf name (e.g., `node-cli`, `laravel`) |
| `--lang <lang>` | UI and default output language |
| `--agent <provider>` | Agent provider (`claude` or `codex`) |
| `--dry-run` | Print the generated config without writing |

#### `sdd-forge upgrade`

Idempotent command that deploys updated skill files from the installed package version and migrates `config.json` `chapters` arrays from the legacy string format (`["overview.md"]`) to the current object format (`[{"chapter": "overview.md"}]`). Safe to run after any package update.

| Option | Description |
| --- | --- |
| `--dry-run` | Show what would change without applying |

#### `sdd-forge presets list`

Prints the full preset inheritance tree rooted at `base`, using tree connectors (`├──`, `└──`). Each node shows its label, axis, language, aliases, and scan category keys. Presets with no template directory are marked `[no templates]`. Children within each level are sorted alphabetically.

#### `sdd-forge docs build`

Orchestrates the full documentation pipeline tracked by a progress bar. Steps run in order: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate`. If no agent is configured, `enrich` and `text` are skipped with a warning. In `--regenerate` mode, `init` is skipped and only text-generation steps are re-run against existing chapter files.

| Option | Description |
| --- | --- |
| `--force` | Force re-initialization of chapter files during `init` |
| `--regenerate` | Skip `init`; re-generate text content in existing chapter files |
| `--verbose` | Stream AI agent output to stderr during `enrich` and `text` steps |
| `--dry-run` | Skip all file writes across all pipeline steps |

#### `sdd-forge docs scan`

Scans the source directory according to the configured preset type and writes structured data to `.sdd-forge/output/analysis.json`. This step must be completed before any other `docs` subcommand can run.

#### `sdd-forge docs enrich`

Passes `analysis.json` entries to an AI agent to generate `role`, `summary`, and `detail` fields for each entry. Requires a configured default agent. Writes the enriched result back to `.sdd-forge/output/`.

#### `sdd-forge docs init`

Creates chapter markdown files in `docs/` by resolving the preset template inheritance chain. Existing files are not overwritten unless `--force` is specified. Chapter order is defined by the `chapters` array in `config.json`.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Print resolved templates without writing |

#### `sdd-forge docs data`

Resolves all `{{data(...)}}` directives in chapter files by querying the resolver with the enriched `analysis.json` for the configured preset type. Writes resolved content back to each file in place.

| Option | Description |
| --- | --- |
| `--dry-run` | Print resolved content without writing |

#### `sdd-forge docs text`

Fills all unfilled `{{text(...)}}` directives in chapter files using an AI agent. Files are processed at the configured concurrency level. Directives that already contain content between their open and close tags are skipped.

| Option | Description |
| --- | --- |
| `--dry-run` | Print without writing |

#### `sdd-forge docs readme`

Generates `README.md` by merging the preset template chain, resolving `{{data}}` directives, and optionally filling `{{text}}` directives via an AI agent. Performs a diff check against the existing file and skips write if the content is unchanged.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Target output language |
| `--output <path>` | Output path (default: `README.md` in the project root) |
| `--dry-run` | Print without writing |

#### `sdd-forge docs forge`

Runs an iterative AI documentation improvement loop for up to `--max-runs` rounds. Each round calls the AI agent on target chapter files, then executes the review command. Failed chapters are narrowed and passed as feedback for the next round. Supports three modes: `local` (no agent, stop on failure), `assist` (agent optional), and `agent` (agent required). The `--spec` flag restricts target files to chapters whose name matches keywords in the spec text.

| Option | Description |
| --- | --- |
| `--prompt <text>` | Improvement prompt describing the desired changes (required) |
| `--prompt-file <path>` | Read the prompt from a file instead |
| `--spec <path>` | Spec file used to narrow which chapter files are targeted |
| `--max-runs <n>` | Maximum improvement rounds (default: `3`) |
| `--mode <local/assist/agent>` | Operating mode (default: `local`) |
| `--review-cmd <cmd>` | Review command to run after each round (default: `sdd-forge docs review`) |
| `--verbose` | Stream AI agent output to stderr |
| `--dry-run` | Skip agent calls and file writes; list target files only |

#### `sdd-forge docs review`

Validates all chapter files in `docs/` for: minimum line count (15 lines), presence of an H1 heading, unfilled `{{text}}` directives, unfilled `{{data}}` directives, exposed directive syntax in rendered output, residual block directives, and unbalanced HTML comments. Also verifies that `analysis.json` and `README.md` exist. For multi-language configurations, validates each non-default language subdirectory. Reports coverage of analysis categories not referenced by any `{{data}}` directive. Exits with code `1` on any failure.

#### `sdd-forge docs translate`

Translates chapter files and `README.md` from the default language to each configured non-default language using an AI agent. Uses file modification time (mtime) to skip files already up to date unless `--force` is set. Tasks run in parallel at the configured concurrency level. Output is written to `docs/<lang>/`.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate only to this specific target language |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Show what would be translated without writing |

#### `sdd-forge docs changelog`

Scans every `NNN-name/spec.md` entry in `specs/`, parses title, created date, status, feature branch, and input summary from each file, then generates `docs/change_log.md`. Produces two tables: a latest-index table (one row per spec series, showing the highest-numbered entry) and an all-specs table (every entry sorted by directory name). Output is wrapped in `AUTO-GEN:START/END` comment markers.

| Option | Description |
| --- | --- |
| `--dry-run` | Print generated content without writing |

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` in the project source root. Resolves `{{data("agents.sdd")}}` and `{{data("agents.project")}}` block directives via the configured resolver, then refines the PROJECT section content using an AI agent with the existing chapter files as context. Creates `AGENTS.md` from a built-in template if the file does not yet exist.

| Option | Description |
| --- | --- |
| `--dry-run` | Print generated content without writing |

#### `sdd-forge flow get status`

Returns the complete active flow state as a machine-readable JSON envelope to stdout. The payload includes: `spec`, `baseBranch`, `featureBranch`, `worktree`, `issue`, `phase`, `steps[]`, `stepsProgress`, `requirements[]`, `requirementsProgress`, `request`, `notes[]`, `metrics`, `mergeStrategy`, and `autoApprove`. Returns a `fail` envelope with code `NO_FLOW` when no flow is active.

#### `sdd-forge flow get issue <number>`

Fetches a GitHub issue by number using the `gh` CLI and returns its `title`, `body`, `labels`, and `state` wrapped in an `ok` JSON envelope. The argument must be a positive integer. Returns a `fail` envelope with code `GH_ERROR` on any retrieval failure.

#### `sdd-forge flow get check <target>`

Checks a specific readiness condition and returns a JSON envelope containing `pass`, `summary`, and `checks[]` fields.

| Target | Description |
| --- | --- |
| `impl` | Verifies that `gate` and `test` steps are `done` or `skipped` in flow state |
| `finalize` | Verifies that the `implement` step is `done` or `skipped` in flow state |
| `dirty` | Checks for uncommitted changes via `git status --short` |
| `gh` | Checks whether the `gh` CLI is available and returns its version string |

#### `sdd-forge flow set`

Updates one or more fields in the active `flow.json`. Used primarily by skill scripts to record step completions, update requirement statuses, set notes, and write flow metadata fields such as `mergeStrategy` and `autoApprove`.

#### `sdd-forge flow run gate`

Validates `spec.md` for completeness before implementation begins. Text-based checks include: unresolved tokens (`TBD`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked task items, and required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`). In `--phase post` mode, additionally verifies that the user-approval checkbox (`- [x] User approved this spec`) is checked. Optionally runs an AI guardrail compliance check against project rules. Resolves the spec path automatically from active flow state if `--spec` is omitted.

| Option | Description |
| --- | --- |
| `--spec <path>` | Path to `spec.md`; auto-resolved from `flow.json` if omitted |
| `--phase <pre/post>` | Gate phase (default: `pre`) |
| `--skip-guardrail` | Skip the AI guardrail compliance check |

#### `sdd-forge flow run lint`

Runs guardrail lint pattern checks against files changed since the base branch (`git diff baseBranch`). Loads rules from merged guardrail articles and reports violations in the format `FAIL: [article] file:line — match`. Returns a JSON envelope containing `lintArticleCount`, `fileCount`, `warnings[]`, and `failures[]`.

| Option | Description |
| --- | --- |
| `--base <branch>` | Base branch for `git diff`; auto-resolved from `flow.json` if omitted |

#### `sdd-forge flow run prepare-spec`

Creates a sequentially numbered feature branch (e.g., `feature/042-my-feature`) or git worktree and initializes a `specs/NNN-name/` directory with `spec.md` and `qa.md` templates. Writes the initial `flow.json` with `approach`, `branch`, and `spec` steps marked `done`. Aborts if the working tree is dirty. Registers the new flow in the active-flow index and cleans stale entries.

| Option | Description |
| --- | --- |
| `--title <name>` | Feature title used to derive the branch name and directory (required) |
| `--base <branch>` | Base branch (default: current HEAD) |
| `--worktree` | Use `git worktree` to isolate the feature in a separate directory |
| `--no-branch` | Spec-only mode — create the spec directory without a new branch |
| `--dry-run` | Preview without creating branches or files |

#### `sdd-forge flow run impl-confirm`

Summarizes implementation readiness from the `requirements[]` array in `flow.json`, counting `done`, `pending`, and `in_progress` statuses. In `detail` mode, also lists files changed since the base branch via `git diff baseBranch...HEAD --name-only`. Returns `result: "ready"` when all requirements are done or no requirements are tracked.

| Option | Description |
| --- | --- |
| `--mode <overview/detail>` | Check mode (default: `overview`) |

#### `sdd-forge flow run finalize`

Executes the five-step finalization pipeline. Steps: **1** commit (`git add -A` + `git commit`), **2** merge (squash or PR), **3** sync (`sdd-forge docs build` + commit docs changes to `docs/`, `AGENTS.md`, `README.md`), **4** cleanup (remove branch or worktree), **5** record. Step 3 is automatically skipped when the PR merge route was used. Returns a JSON envelope with per-step `status` and flow artifacts.

| Option | Description |
| --- | --- |
| `--mode <all/select>` | Run all five steps or a specific subset (required) |
| `--steps <1,2,3,...>` | Comma-separated step numbers when using `select` mode |
| `--merge-strategy <squash/pr>` | Merge strategy override (default: auto-detect) |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview all steps without executing |

#### `sdd-forge flow run merge`

Merges the feature branch into the base branch using squash merge, or creates a GitHub Pull Request. In `--auto` mode, selects PR if `config.commands.gh === 'enable'` and the `gh` CLI is available, otherwise falls back to squash merge. PR title and body are derived from the `## Goal`, `## Requirements`, and `## Scope` sections of `spec.md`. Handles both branch mode and worktree mode layouts.

| Option | Description |
| --- | --- |
| `--pr` | Always create a Pull Request instead of squash merge |
| `--auto` | Auto-detect strategy from config and `gh` availability |
| `--dry-run` | Print commands without executing |

#### `sdd-forge flow run review`

Runs a two-phase AI code quality review. The **draft** phase sends the current diff to an agent that produces numbered improvement proposals focused on duplicate elimination, naming, dead code, design patterns, and simplification. The **final** phase validates each proposal and assigns `APPROVED` or `REJECTED` verdicts. Results are saved to `review.md` in the spec directory. Approved proposals are listed for optional manual application.

| Option | Description |
| --- | --- |
| `--dry-run` | Show proposals without applying them |
| `--skip-confirm` | Skip the initial confirmation prompt |

#### `sdd-forge flow run cleanup`

Auto-detects the cleanup mode from flow state: **spec-only** (no cleanup when `featureBranch === baseBranch`), **worktree** (runs `git worktree remove` then `git branch -D`), or **branch** (runs `git branch -D` only). Clears the `.active-flow` registry entry before executing destructive git operations. The `flow.json` file in `specs/` is always preserved after cleanup.

| Option | Description |
| --- | --- |
| `--dry-run` | Print commands without executing |
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Code | Constant | Meaning |
| --- | --- | --- |
| `0` | `EXIT_SUCCESS` | The command completed successfully |
| `1` | `EXIT_ERROR` | An error occurred: unknown subcommand, missing required argument, validation failure, agent call failure, file not found, or any unrecoverable runtime exception |

**stdout conventions**

| Command group | Output format |
| --- | --- |
| `flow get *`, `flow run *`, `flow set` | Machine-readable JSON envelopes (`{"ok": true, ...}` or `{"ok": false, ...}`) intended for consumption by skill scripts |
| All `docs` commands and standalone commands | Human-readable progress messages and results (e.g., `[agents] updated AGENTS.md`, `[readme] no changes`) |
| `docs review` | Per-check pass/fail lines; exits with code `1` on any failure, making it suitable for use in CI pipelines |

**stderr conventions**

- Warning messages are written to stderr from any command (e.g., `[text] WARN: no defaultAgent configured, skipping`)
- Pipeline error details are written to stderr before exiting with code `1` (e.g., `[build] ERROR: <message>`)
- `--verbose` mode in `docs forge` and `docs build` streams the AI agent's stdout and stderr to process stderr
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
