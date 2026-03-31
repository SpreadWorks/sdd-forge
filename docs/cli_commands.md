<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 40 commands organized into two namespace dispatchers — `docs` (12 subcommands covering the full documentation pipeline) and `flow` (commands accessed through `get`, `set`, and `run` sub-dispatchers with 8, 9, and 8 leaf commands respectively) — plus 4 standalone commands: `help`, `setup`, `upgrade`, and `presets`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display the help screen with all commands grouped by section | — |
| `sdd-forge setup` | Interactive wizard to register a project and write `.sdd-forge/config.json` | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Update deployed skill files and migrate config format to the current version | `--dry-run` |
| `sdd-forge presets list` | Render the preset inheritance tree with metadata annotations | — |
| `sdd-forge docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and write `analysis.json` | — |
| `sdd-forge docs enrich` | Annotate analysis entries with AI-generated role, summary, and detail | — |
| `sdd-forge docs init` | Initialize chapter markdown files from the preset template chain | `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files via AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from the preset README template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative docs improvement loop with AI agent and review feedback | `--prompt`, `--prompt-file`, `--spec`, `--mode`, `--max-runs`, `--review-cmd`, `--dry-run` |
| `sdd-forge docs review` | Validate documentation quality (structure, completeness, directives) | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI agent | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Scan `specs/` and generate `docs/change_log.md` | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` using `{{data}}` directives and AI refinement | `--dry-run` |
| `sdd-forge flow get status` | Return the current SDD flow state as a JSON envelope | — |
| `sdd-forge flow get check <target>` | Check prerequisites for a flow phase (`impl`, `finalize`, `dirty`, `gh`) | — |
| `sdd-forge flow get issue <number>` | Fetch GitHub issue details via `gh` CLI | — |
| `sdd-forge flow get prompt <step>` | Return a structured agent prompt for a given flow step | — |
| `sdd-forge flow get qa-count` | Return the count of answered clarification questions | — |
| `sdd-forge flow get guardrail` | Return guardrail articles filtered by phase | — |
| `sdd-forge flow get context` | Return filtered project context derived from analysis | — |
| `sdd-forge flow get resolve-context` | Resolve worktree and repo paths for context recovery | — |
| `sdd-forge flow set step` | Update a step's status in the active flow | — |
| `sdd-forge flow set request` | Set the user request field | — |
| `sdd-forge flow set issue` | Set the linked GitHub issue number | — |
| `sdd-forge flow set note` | Append a note to the flow state | — |
| `sdd-forge flow set summary` | Set the requirements list | — |
| `sdd-forge flow set req` | Update a requirement's status | — |
| `sdd-forge flow set metric` | Increment a metric counter | — |
| `sdd-forge flow set redo` | Record a redo entry | — |
| `sdd-forge flow set auto` | Enable or disable autoApprove mode | — |
| `sdd-forge flow run prepare-spec` | Create branch/worktree and initialize `spec.md` / `qa.md` | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run gate` | Validate `spec.md` for completeness and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run lint` | Run guardrail lint pattern checks against changed files | `--base` |
| `sdd-forge flow run impl-confirm` | Summarize requirements status and report implementation readiness | `--mode` |
| `sdd-forge flow run review` | AI-driven two-phase code quality review | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run finalize` | Execute the finalization pipeline: commit → merge → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run sync` | Sync documentation after implementation | `--dry-run` |
| `sdd-forge flow run retro` | Run spec retrospective evaluation | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `--help` / `-h` | All commands | Print the command's help text and exit with code `0`; exits `1` when invoked with no subcommand |
| `--dry-run` | Most commands | Preview changes without writing any files to disk; affected commands print would-be output to stdout |
| `-v` / `-V` / `--version` | Top-level only | Print the installed sdd-forge version string and exit |
| `--verbose` / `-v` | `docs build`, `docs forge` | Stream agent output to stderr and show detailed step-by-step progress |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`
Prints the full command list grouped by section (Project, Docs, Flow, Info) with the package version number. Uses ANSI bold and dim escapes for formatting and calculates column width dynamically. Invoked automatically when no subcommand is given or when `-h` / `--help` is passed at the top level.

#### `sdd-forge setup`
Runs an interactive wizard to register a project and write `.sdd-forge/config.json`. All prompts can be bypassed by supplying the corresponding flags, activating non-interactive mode.

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--type <type>` | Preset type (e.g. `node-cli`, `laravel`) |
| `--lang <lang>` | UI and documentation language |
| `--agent <agent>` | Default AI provider (`claude` or `codex`) |
| `--dry-run` | Print resolved config without writing files |

The wizard creates `.sdd-forge/`, `docs/`, `specs/`, and `output/` directories, adds `.gitignore` entries (`.tmp`, `.sdd-forge/worktree`), writes a `.gitattributes` merge strategy for `analysis.json`, deploys skill files, and creates or updates `AGENTS.md`.

#### `sdd-forge upgrade`
Updates deployed skill files and migrates `config.json` to the latest format. Safe to run repeatedly. Reports each skill as `updated` or `unchanged`. Automatically converts a legacy `chapters` array of strings to the current object-array format (`[{chapter: 'name.md'}]`).

| Option | Description |
|---|---|
| `--dry-run` | Show what would change without writing |

#### `sdd-forge presets list`
Renders the preset inheritance tree starting from the `base` root using `├──` / `└──` connectors. Each node displays its label, optional `axis`, `lang`, `aliases`, available `scan` keys, and a `[no templates]` marker when the templates directory is absent. Children are sorted alphabetically.

#### `sdd-forge docs build`
Orchestrates the full documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → (optionally) `translate`. Steps are tracked with a weighted progress bar. The `enrich` and `text` steps are skipped when no AI agent is configured. The `init` step is skipped when `--regenerate` is passed and docs files already exist. For multi-language setups, the pipeline iterates over non-default languages after completing the default-language pass.

| Option | Description |
|---|---|
| `--force` | Force overwrite of existing chapter files during `init` |
| `--regenerate` | Skip `init` and re-run `data` and `text` on existing files |
| `--verbose` | Stream agent output to stderr |
| `--dry-run` | Run the pipeline without writing any files |

#### `sdd-forge docs scan`
Scans the project source directory according to the active preset's `scan` configuration and writes `.sdd-forge/output/analysis.json`. This is the first step of the documentation pipeline and must be completed before any other `docs` command.

#### `sdd-forge docs enrich`
Reads `analysis.json` and calls an AI agent to annotate each entry with structured `role`, `summary`, and `detail` fields. The enriched data is written back to `analysis.json` and is consumed by the subsequent `data` and `text` steps.

#### `sdd-forge docs init`
Creates chapter markdown files in `docs/` by resolving the preset template inheritance chain for the configured `type`. Skips files that already exist unless `--force` is passed.

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Show which files would be created or updated |

#### `sdd-forge docs data`
Resolves all `{{data(...)}}` directives in chapter files by invoking the resolver for the project's preset type and writing the expanded content back in-place.

| Option | Description |
|---|---|
| `--dry-run` | Print resolved content without writing |

#### `sdd-forge docs text`
Fills each `{{text(...)}}` directive in chapter files by calling an AI agent with the directive's prompt and surrounding context. Processes files at the concurrency level defined in config.

| Option | Description |
|---|---|
| `--dry-run` | Run without writing filled content |

#### `sdd-forge docs readme`
Generates `README.md` by merging preset README templates through the inheritance chain, resolving `{{data}}` directives, and optionally filling any `{{text}}` directives via an AI agent. Skips the write if the output is identical to the existing file.

| Option | Description |
|---|---|
| `--lang <lang>` | Target output language |
| `--output <path>` | Write to a custom path instead of the root `README.md` |
| `--dry-run` | Print resolved content without writing |

#### `sdd-forge docs forge`
Runs an iterative docs improvement loop. Populates `{{data}}` and `{{text}}` directives first, then alternates between AI agent calls and `docs review` checks for up to `--max-runs` rounds. On review failure, narrows the target file set to only the failed chapters and feeds review output back to the agent as context for the next round. Supports per-file agent mode when `agent.systemPromptFlag` is set, running files concurrently via `mapWithConcurrency()`.

| Option | Description |
|---|---|
| `--prompt <text>` | User prompt passed to the agent (required) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Spec file used to estimate relevant chapter files |
| `--mode <local\|assist\|agent>` | Operation mode (`local` skips AI, `agent` requires a configured provider) |
| `--max-runs <n>` | Maximum improvement rounds (default: 3) |
| `--review-cmd <cmd>` | Review command to run after each agent call (default: `sdd-forge docs review`) |
| `--dry-run` | List target files and exit without running |

#### `sdd-forge docs review`
Validates all chapter files in `docs/` against a set of quality checks: minimum line count (15), presence of an H1 heading, no unfilled `{{text}}` or `{{data}}` directives, no exposed directive syntax in rendered output, no residual template block comments (`@block`, `@endblock`, `@extends`, `@parent`), and balanced HTML comments. Also verifies that `analysis.json` and `README.md` exist. For multi-language configs, validates each non-default language subdirectory. Reports analysis coverage gaps where categories are not referenced by any `{{data}}` directive. Exits with code `1` if any check fails.

#### `sdd-forge docs translate`
Translates default-language chapter files and `README.md` to each non-default language configured in `docs.languages`. Uses mtime comparison to skip files already up to date, unless `--force` is set. Tasks run concurrently at the configured concurrency level. Language subdirectories are created automatically.

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | List translation tasks without executing |

#### `sdd-forge docs changelog`
Scans the `specs/` directory for numerically prefixed subdirectories (`NNN-name/spec.md`), extracts metadata (title, status, created date, branch, input summary), deduplicates per series keeping the highest number, and writes two markdown tables to `docs/change_log.md`: a latest-per-series index and a full chronological listing with file links.

| Option | Description |
|---|---|
| `--dry-run` | Print generated content without writing |

#### `sdd-forge docs agents`
Resolves `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives in `AGENTS.md`. Creates `AGENTS.md` from a built-in template if it does not exist. Calls an AI agent to refine the PROJECT section content using the generated docs and project config as context.

| Option | Description |
|---|---|
| `--dry-run` | Print resolved content without writing |

#### `sdd-forge flow get status`
Returns the active flow state as a JSON envelope to stdout. Reported fields: `spec`, `baseBranch`, `featureBranch`, `worktree`, `issue`, `phase`, `steps[]`, `stepsProgress`, `requirements[]`, `requirementsProgress`, `request`, `notes[]`, `metrics`, `mergeStrategy`, and `autoApprove`. Returns a `fail` envelope with code `NO_FLOW` when no active flow is found.

#### `sdd-forge flow get check <target>`
Checks a specific prerequisite condition and returns a structured JSON envelope with `pass`, `summary`, and `checks[]` fields.

| Target | Description |
|---|---|
| `impl` | Verifies that `gate` and `test` steps are `done` or `skipped` |
| `finalize` | Verifies that the `implement` step is `done` or `skipped` |
| `dirty` | Runs `git status --short` and reports whether the working tree is clean |
| `gh` | Checks whether the `gh` CLI is available and returns its version |

#### `sdd-forge flow get issue <number>`
Fetches GitHub issue details by running `gh issue view <number> --json title,body,labels,state` with a 15-second timeout. Returns an `ok` envelope with `number`, `title`, `body`, `labels`, and `state`, or a `fail` envelope with code `GH_ERROR` on any failure.

#### `sdd-forge flow get prompt <step>` / `flow get guardrail` / `flow get context` / `flow get resolve-context` / `flow get qa-count`
Utility read commands used by skill scripts. `prompt` returns a structured agent prompt for a named flow step. `guardrail` returns merged guardrail articles filtered by phase. `context` returns filtered project context derived from analysis. `resolve-context` resolves worktree and main-repo paths for context recovery. `qa-count` returns the number of answered clarification questions in the active flow.

#### `sdd-forge flow set <key>`
Updates a single field in the active flow state stored in `flow.json`. Each key maps to a dedicated script.

| Key | Description |
|---|---|
| `step` | Update a step's status (`done`, `skipped`, `in_progress`) |
| `request` | Set the user request description |
| `issue` | Link a GitHub issue number |
| `note` | Append a note to the notes array |
| `summary` | Set or replace the requirements list |
| `req` | Update the status of a specific requirement |
| `metric` | Increment a named metric counter |
| `redo` | Record a redo entry with reason |
| `auto` | Enable or disable `autoApprove` mode |

#### `sdd-forge flow run prepare-spec`
Creates the feature branch (or git worktree) and initializes `spec.md` and `qa.md` in `specs/NNN-slug/`. Determines the next sequential 3-digit index by scanning existing spec directories and `feature/NNN-*` branches. Writes initial `flow.json` with `approach`, `branch`, and `spec` steps marked as done, and registers the flow in the active-flow index. Aborts early if the working tree is dirty.

| Option | Description |
|---|---|
| `--title <name>` | Feature title, slugified into the branch and directory name (required) |
| `--base <branch>` | Base branch (default: current HEAD) |
| `--worktree` | Create a git worktree instead of a regular branch |
| `--no-branch` | Spec-only mode — create spec files without a branch |
| `--dry-run` | Show what would happen without executing |

#### `sdd-forge flow run gate`
Validates `spec.md` for completeness. Text checks include: unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked task items (`- [ ]`), and required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`). In `post` phase, additionally requires `- [x] User approved this spec` inside `## User Confirmation`. Optionally runs an AI guardrail compliance check against merged project articles.

| Option | Description |
|---|---|
| `--spec <path>` | Path to `spec.md` (auto-resolved from active flow if omitted) |
| `--phase <pre\|post>` | Gate phase (default: `pre`) |
| `--skip-guardrail` | Skip AI guardrail compliance check |

#### `sdd-forge flow run lint`
Runs guardrail lint pattern checks against files changed since the base branch (`git diff base...HEAD`). Loads merged guardrail articles, applies lint rules from articles with lint patterns, and reports each violation as `FAIL: [article] file:line — match`. Returns a JSON envelope.

| Option | Description |
|---|---|
| `--base <branch>` | Base branch for git diff (auto-resolved from active flow if omitted) |

#### `sdd-forge flow run impl-confirm`
Checks implementation readiness by summarizing requirement statuses (`done`, `in_progress`, `pending`) from the active flow state. In `detail` mode, also lists files changed since the base branch via `git diff baseBranch...HEAD --name-only`. Sets `next` to `review` when all requirements are done or none are tracked, and to `fix` otherwise.

| Option | Description |
|---|---|
| `--mode <overview\|detail>` | Check mode (default: `overview`) |

#### `sdd-forge flow run review`
Orchestrates a two-phase AI code review. The draft phase generates numbered improvement proposals (duplicate elimination, naming, dead code, design patterns, simplification). The final phase validates each proposal with an `APPROVED` / `REJECTED` verdict. Results are saved to `review.md` in the spec directory. Approved proposals are presented for optional application.

| Option | Description |
|---|---|
| `--dry-run` | Show proposals without applying them |
| `--skip-confirm` | Skip the initial confirmation prompt |

#### `sdd-forge flow run finalize`
Orchestrates the five-step finalization pipeline. In `all` mode all steps run in order; in `select` mode only the specified step numbers execute.

| Step | Name | Action |
|---|---|---|
| 1 | commit | `git add -A` followed by `git commit -m` |
| 2 | merge | Squash-merge or PR creation via `flow/commands/merge.js` |
| 3 | sync | `sdd-forge docs build` then commit docs changes (skipped on PR route) |
| 4 | cleanup | Delete feature branch or worktree via `flow/commands/cleanup.js` |
| 5 | record | Placeholder step, always succeeds |

| Option | Description |
|---|---|
| `--mode <all\|select>` | Execution mode (required) |
| `--steps <1,2,3,...>` | Comma-separated step numbers (required for `select` mode) |
| `--merge-strategy <squash\|pr>` | Override merge strategy (default: auto-detect) |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview all steps without executing |
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Code | Constant | When raised |
|---|---|---|
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | Unknown subcommand, missing required argument, file not found, pipeline error, or unrecoverable runtime error |

stdout and stderr conventions:

| Stream | Content |
|---|---|
| stdout | Human-readable command output, generated file content (dry-run), and all JSON envelopes from `flow get` and `flow run` commands |
| stderr | Progress logs, agent ticker dots (dots printed every second during `docs forge` agent calls), dry-run notices, and warning messages |

All `flow get` and `flow run` commands emit a structured JSON envelope to stdout with the shape `{op, cmd, ok, data}`, making them suitable for consumption by skill scripts and automation pipelines. The `ok` field is `true` on success and `false` on failure; the `data` field carries command-specific result fields. Human-readable commands write to stdout and route errors and progress information to stderr. When `--dry-run` is active, would-be file writes are redirected to stdout for inspection without modifying the filesystem.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
