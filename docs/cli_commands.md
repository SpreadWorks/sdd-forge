<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes over 40 commands organized across three namespace dispatchers — `docs`, `flow`, and `check` — alongside four standalone commands (`help`, `setup`, `upgrade`, `presets`). The `docs` namespace covers the full documentation pipeline in twelve subcommands, `flow` manages the Spec-Driven Development lifecycle across `get`, `set`, and `run` subcommand groups, and `check` provides three validation and diagnostics commands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `help` | Display available commands and version info | — |
| `setup` | Interactive wizard for project initialization | `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Refresh project skills and configuration to latest templates | `--dry-run` |
| `presets list` | Display the full preset hierarchy as a tree | — |
| `docs build` | Full pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `docs scan` | Scan source files and produce `.sdd-forge/output/analysis.json` | — |
| `docs enrich` | AI-enrich analysis entries with summaries and keywords | — |
| `docs init` | Initialize `docs/` from preset chapter templates | `--type`, `--force`, `--dry-run` |
| `docs data` | Populate `{{data}}` directives in docs chapter files | `--dry-run` |
| `docs text` | AI-fill `{{text}}` directives in docs chapter files | `--force`, `--dry-run` |
| `docs readme` | Generate or update `README.md` from preset template | `--lang`, `--output`, `--dry-run` |
| `docs forge` | Multi-round AI document generation with integrated review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `docs review` | Validate generated docs for structural integrity and directive resolution | — |
| `docs changelog` | Generate `docs/change_log.md` from `specs/` directory entries | `--dry-run` |
| `docs agents` | Generate or update `AGENTS.md` with AI-refined project context | `--dry-run` |
| `docs translate` | Translate docs chapters into configured target languages | `--lang`, `--force`, `--dry-run` |
| `flow prepare` | Initialize a spec directory, feature branch, and optional worktree | `--title`, `--base`, `--issue`, `--request`, `--worktree`, `--no-branch`, `--dry-run` |
| `flow resume` | Discover and resume the active flow from current state | — |
| `flow get check` | Check prerequisites for a named gate target | positional: `impl`, `finalize`, `dirty`, `gh` |
| `flow get context` | Retrieve code context entries from analysis.json by query | `--query`, `--mode` |
| `flow get guardrail` | Return guardrail rules for a specified flow phase | positional: phase, `--format` |
| `flow get issue` | Fetch a GitHub issue's title, body, and metadata via gh CLI | positional: number |
| `flow get prompt` | Return a predefined structured prompt by kind and language | positional: kind |
| `flow get qa-count` | Return the count of Q&A interactions recorded in flow state | — |
| `flow get resolve-context` | Build full resume context including git state and spec sections | — |
| `flow get status` | Return current flow state object and derived phase | — |
| `flow set auto` | Toggle autoApprove mode on or off in flow state | positional: `on`\|`off` |
| `flow set issue` | Associate a GitHub issue number with the current flow | positional: number |
| `flow set note` | Append a free-text note to the flow state history | positional: text |
| `flow set req` | Update a requirement's completion status by index | positional: index, status |
| `flow set request` | Store the original user request text in flow state | positional: text |
| `flow set step` | Transition a workflow step to a new status | positional: id, status |
| `flow set summary` | Set requirements list from a JSON array of strings | positional: JSON |
| `flow set test-summary` | Record test counts by type in flow state | `--unit`, `--integration`, `--acceptance` |
| `flow run finalize` | Execute the multi-step finalize pipeline (commit, merge, sync, cleanup) | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `flow run gate` | Run structural and AI-driven gate validation at a specified phase | `--phase`, `--spec`, `--skip-guardrail` |
| `flow run impl-confirm` | Confirm implementation readiness against spec requirements | `--mode` |
| `flow run lint` | Run lint checks against merged guardrail rules | `--base` |
| `flow run report` | Generate and persist a flow activity and token-usage report | `--dry-run` |
| `check config` | Validate `.sdd-forge/config.json` schema and preset references | `--format` |
| `check freshness` | Compare docs/ and source modification timestamps | `--format` |
| `check scan` | Report scan coverage of source files against analysis.json | `--format`, `--list` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Short Form | Scope | Description |
|---|---|---|---|
| `--help` | `-h` | All commands | Display usage information for the current command and exit with code 0 |
| `--version` | `-v`, `-V` | Top-level only | Print the installed sdd-forge version number and exit |
| `--dry-run` | — | Most subcommands | Preview changes without writing files, committing, or invoking agents |
| `--format <value>` | — | `check` commands | Select output format; accepted values are `text`, `json`, or `md` depending on the command |
| `--verbose` | — | `docs build`, `docs forge` | Enable verbose logging to stderr for step-by-step progress detail |

`--help` is parsed uniformly across all namespaces and their subcommands. When passed as the first or only argument to a namespace dispatcher (`docs`, `flow`, `check`), it lists all available subcommands in that group. All error output is written to stderr regardless of the selected `--format` value.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Displays the full command list grouped by category along with the installed version. No options are accepted.

```
sdd-forge help
sdd-forge --help
```

#### setup

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, output language(s), preset type, documentation purpose, tone, and agent provider. Writes `.sdd-forge/config.json`, creates `docs/` and `specs/` directories, updates `.gitignore` and `.gitattributes`, deploys skills, and generates `AGENTS.md`. Re-running against an existing config pre-fills wizard defaults from the current configuration.

```
sdd-forge setup
sdd-forge setup --type hono --lang en --agent claude
```

| Option | Description |
|---|---|
| `--type` | Preset type key |
| `--lang` | Project language code (e.g. `en`, `ja`) |
| `--agent` | Default AI agent provider |
| `--dry-run` | Preview without writing files |

#### upgrade

Refreshes the project's deployed skills and configuration by diffing against the latest templates in the package. Deploys only changed files, removes obsolete skills from `.claude/skills/` and `.agents/skills/`, and migrates the `chapters` array format if needed.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### presets list

Displays all available presets as a tree rooted at `base/`, showing each preset's key, axis, language, aliases, scan config, and whether a `templates/` directory is present.

```
sdd-forge presets list
```

#### docs build

Composite pipeline that sequentially runs scan, enrich, init, data, text, readme, and agents in a single invocation. When the project is configured for multiple output languages, an additional translate step is appended. Progress is shown with weighted step indicators.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during the init step |
| `--regenerate` | Skip init; regenerate text in existing chapter files only |
| `--dry-run` | Preview without writing files or invoking agents |
| `--verbose` | Show detailed per-step progress to stderr |

#### docs scan

Walks the configured source root according to `scan.include` and `scan.exclude` patterns from `config.json` and produces `.sdd-forge/output/analysis.json` with categorized file entries. Must be run before any other `docs` command.

```
sdd-forge docs scan
```

#### docs enrich

Sends each analysis entry to the configured default AI agent to generate summaries, role assignments, and keyword lists. Requires a configured `agent.default` in `config.json`.

```
sdd-forge docs enrich
```

#### docs init

Resolves chapter templates from the preset inheritance chain and writes them as starting-point markdown files in `docs/`. Skips existing files unless `--force` is provided. When analysis data and an agent are available, can use AI to filter irrelevant chapters before writing.

```
sdd-forge docs init
sdd-forge docs init --type hono --force
sdd-forge docs init --dry-run
```

| Option | Description |
|---|---|
| `--type` | Override the preset type |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing files |

#### docs data

Resolves all `{{data(...)}}` directives in docs chapter files using project analysis data, then writes the populated content back to each file. Data directives are replaced in-place, preserving surrounding content.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### docs text

Sends each unfilled `{{text(...)}}` directive to an AI agent for content generation. Skips directives that already contain content unless `--force` is used. Processing is concurrent according to `config.json` concurrency settings.

```
sdd-forge docs text
sdd-forge docs text --force
```

#### docs readme

Generates or updates `README.md` by rendering the preset README template through data directive resolution and optional AI text filling. Skips writing if the rendered content is identical to the existing file. Supports multi-language output via `--output`.

```
sdd-forge docs readme
sdd-forge docs readme --output docs/ja/README.md
sdd-forge docs readme --dry-run
```

| Option | Description |
|---|---|
| `--lang` | Override output language |
| `--output` | Write to a custom path instead of the root `README.md` |
| `--dry-run` | Print rendered content to stdout without writing |

#### docs forge

Orchestrates multi-round AI document generation with an integrated review loop. Identifies relevant target files from a spec or prompt, invokes the AI agent per file concurrently, runs `docs review`, and feeds review feedback into subsequent rounds up to `--max-runs`. Supports three modes: `local` (direct AI calls), `assist` (user-in-the-loop), and `agent` (fully autonomous).

```
sdd-forge docs forge --prompt "Add API authentication docs"
sdd-forge docs forge --spec specs/001-auth/spec.md --max-runs 3 --mode local
```

| Option | Description |
|---|---|
| `--prompt` | Prompt text describing the desired content change (required) |
| `--prompt-file` | Path to a file containing the prompt |
| `--spec` | Path to a `spec.md` file for scoping relevant chapter files |
| `--max-runs` | Maximum review-and-fix rounds (default: 3) |
| `--review-cmd` | Review command to run between rounds (default: `sdd-forge docs review`) |
| `--mode` | Execution mode: `local`, `assist`, or `agent` |
| `--dry-run` | Preview target files without writing or invoking agents |

#### docs review

Validates all generated documentation for structural integrity. Checks each chapter for unresolved `{{data}}` and `{{text}}` directives, broken HTML comment syntax, residual block-directive markers, minimum line count (15 lines), and presence of an H1 heading. Also verifies that `analysis.json` and `README.md` exist and that multi-language directories are populated when configured. Exits with code 1 if any check fails.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### docs changelog

Generates `docs/change_log.md` by scanning `specs/` subdirectories for `spec.md` files. Extracts title, status, created date, branch, and scope metadata from each spec, then renders a latest-index table and a full sorted history table.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### docs agents

Generates or updates `AGENTS.md` by combining the SDD template directive block with AI-refined project context derived from docs chapters, `README.md`, and analysis data. Creates `AGENTS.md` from a template if the file does not yet exist.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### docs translate

Translates docs chapter files and `README.md` into all non-default languages configured in `docs.languages`. Skips file pairs whose target modification timestamp is newer than the source unless `--force` is passed. Concurrent translation calls respect the configured concurrency limit.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
sdd-forge docs translate --dry-run
```

| Option | Description |
|---|---|
| `--lang` | Translate into a single target language only |
| `--force` | Retranslate files even if the target is already up-to-date |
| `--dry-run` | Preview the task list without writing files |

#### flow prepare

Initializes a new Spec-Driven Development flow. Assigns a sequential three-digit numeric prefix, creates a feature branch (optionally as an isolated git worktree), writes `spec.md` and `qa.md` templates into `specs/<id>-<slug>/`, and initializes `flow.json` state with the standard step sequence.

```
sdd-forge flow prepare --title "Add user authentication"
sdd-forge flow prepare --title "Fix API bug" --issue 42 --worktree
sdd-forge flow prepare --title "Quick fix" --no-branch
```

| Option | Description |
|---|---|
| `--title` | Feature title (required); used to derive the branch name and spec directory slug |
| `--base` | Base branch to branch from (defaults to current branch) |
| `--issue` | GitHub issue number to link to this flow |
| `--request` | Original user request text to store in flow state |
| `--worktree` | Create an isolated git worktree instead of a plain branch |
| `--no-branch` | Skip branch creation and work in spec-only mode |
| `--dry-run` | Preview without creating files, branches, or worktrees |

#### flow resume

Discoveries the active flow by scanning `specs/` and worktree paths, reads `flow.json`, and returns a structured context snapshot including git status, current branch, commits ahead of base, spec goal and scope sections, current phase, and the recommended skill to invoke.

```
sdd-forge flow resume
```

#### flow get check

Validates named prerequisites before a gate transition. The `impl` target requires gate and test steps to be done; `finalize` requires the implement step. The `dirty` target checks for uncommitted changes; `gh` tests whether the gh CLI is available. Returns structured pass/fail details per check.

```
sdd-forge flow get check impl
sdd-forge flow get check dirty
sdd-forge flow get check gh
```

#### flow get context

Searches `analysis.json` for code entries relevant to a query string using n-gram similarity (default), keyword matching, or AI-assisted keyword selection (`--mode ai`). Returns file paths, summaries, keywords, and chapter assignments.

```
sdd-forge flow get context --query "authentication middleware"
sdd-forge flow get context --query "database" --mode ai
```

#### flow get guardrail

Loads merged guardrail rules from the preset chain and filters them by the specified phase. Returns a markdown-formatted checklist by default, or a structured JSON object when `--format json` is passed.

```
sdd-forge flow get guardrail spec
sdd-forge flow get guardrail impl --format json
```

#### flow get issue

Fetches a GitHub issue's title, body, state, and labels via the gh CLI and returns the data as structured JSON in the flow envelope.

```
sdd-forge flow get issue 42
```

#### flow get prompt

Returns a predefined structured prompt object (description, recommendation, choices) by kind identifier and configured project language. Used by skill prompts to present decision points.

```
sdd-forge flow get prompt plan.approach
```

#### flow get qa-count

Returns the number of Q&A interactions recorded under `metrics.draft.question` in the current flow state. Used by skills to determine how many clarification rounds have occurred.

```
sdd-forge flow get qa-count
```

#### flow get resolve-context

Builds the full resume context object for worktree-aware flow continuation, including spec goal, scope, git status, branch, commits ahead, last commit message, and recommended skill. Equivalent to `flow resume` but routed through the get-command registry.

```
sdd-forge flow get resolve-context
```

#### flow get status

Returns the full current flow state including spec path, base and feature branches, worktree flag, linked issue, derived phase, steps with statuses, requirements with progress, notes, and metrics.

```
sdd-forge flow get status
```

#### flow set auto

Toggles `autoApprove` mode on or off in the persistent flow state. When on, skills may skip interactive confirmation prompts.

```
sdd-forge flow set auto on
sdd-forge flow set auto off
```

#### flow set issue

Associates a GitHub issue number with the current flow by writing it to `flow.json`.

```
sdd-forge flow set issue 42
```

#### flow set note

Appends a free-text note string to the `notes` array in the current flow state for traceability.

```
sdd-forge flow set note "Decided to use JWT for session tokens"
```

#### flow set req

Updates the completion status of a specific requirement identified by its zero-based index. Valid statuses follow the flow step convention (e.g. `done`, `in_progress`, `pending`).

```
sdd-forge flow set req 0 done
sdd-forge flow set req 2 in_progress
```

#### flow set request

Stores the original user request text in flow state. This text is later used in PR body generation and report output.

```
sdd-forge flow set request "Add OAuth2 login support"
```

#### flow set step

Transitions a named workflow step to a new status and records the change in the logger. Used by skill automation hooks to advance or reset individual steps.

```
sdd-forge flow set step implement done
sdd-forge flow set step review in_progress
```

#### flow set summary

Parses a JSON array of strings and stores them as the requirements list in `flow.json`. Replaces any previously stored requirements.

```
sdd-forge flow set summary '["Implement login", "Add token refresh"]'
```

#### flow set test-summary

Records test counts by category (unit, integration, acceptance) in the flow state under `metrics.test.summary`. At least one count option must be provided.

```
sdd-forge flow set test-summary --unit 12 --integration 3
sdd-forge flow set test-summary --unit 8 --integration 2 --acceptance 1
```

#### flow run finalize

Executes the multi-step finalize pipeline. Step 1 commits staged changes, step 2 merges (squash merge or GitHub PR creation), step 3 syncs docs, and step 4 cleans up the worktree and branch. Generates a retro summary and activity report after the commit step and posts the report as a GitHub issue comment when configured.

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2
sdd-forge flow run finalize --mode all --merge-strategy pr --dry-run
```

| Option | Description |
|---|---|
| `--mode` | `all` to run every step, or `select` to choose individual steps |
| `--steps` | Comma-separated step numbers when mode is `select` (1=commit, 2=merge, 3=sync, 4=cleanup) |
| `--merge-strategy` | `squash`, `pr`, or `auto` (default). `auto` uses PR if gh is available and `commands.gh` is enabled |
| `--message` | Custom commit message for step 1 |
| `--dry-run` | Preview all steps without executing them |

#### flow run gate

Runs structural text validation and optional AI-driven guardrail checks against a spec or draft file at a specified phase. The `draft` phase checks draft format and approval checkbox; `pre` and `post` phases validate spec completeness and required sections; `impl` diffs the working tree against the base branch and checks implementation coverage.

```
sdd-forge flow run gate --phase pre
sdd-forge flow run gate --phase post
sdd-forge flow run gate --phase impl --skip-guardrail
```

| Option | Description |
|---|---|
| `--phase` | Gate phase: `draft`, `pre`, `post`, or `impl` |
| `--spec` | Explicit path to the spec file to validate |
| `--skip-guardrail` | Skip the AI-based guardrail evaluation |

#### flow run impl-confirm

Confirms whether all spec requirements are marked done. Returns `ready` when all requirements are complete or when none are defined, and `incomplete` otherwise. In `detail` mode, also lists changed files since the base branch.

```
sdd-forge flow run impl-confirm --mode overview
sdd-forge flow run impl-confirm --mode detail
```

#### flow run lint

Runs lint checks against the merged guardrail rules, testing the current diff from the base branch against each rule's pattern matchers. Throws with a formatted failure list if any violations are found.

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```

| Option | Description |
|---|---|
| `--base` | Base branch for the diff (defaults to the value in `flow.json`) |

#### flow run report

Generates a structured activity and token-usage report by combining git commit statistics since the base branch with the issue log. Saves the result as `report.json` in the spec directory.

```
sdd-forge flow run report
sdd-forge flow run report --dry-run
```

#### check config

Validates `.sdd-forge/config.json` for required fields, schema correctness (via the built-in validator), and valid preset references. Reports up to 50 schema errors to avoid terminal flooding. Exits with code 1 on any failure.

```
sdd-forge check config
sdd-forge check config --format json
```

| Option | Description |
|---|---|
| `--format` | Output format: `text` (default) or `json` |

#### check freshness

Compares the newest modification timestamp across the source tree against the newest timestamp in `docs/`. Reports one of three states: `fresh` (docs are current), `stale` (source is newer), or `never-built` (docs directory does not exist). Files are limited to 10,000 per tree; a warning is emitted if the limit is reached. Designed for use as a CI gate.

```
sdd-forge check freshness
sdd-forge check freshness --format json
```

| Option | Description |
|---|---|
| `--format` | Output format: `text` (default) or `json` |

#### check scan

Loads `analysis.json` and compares its catalogued files against all files matched by the project's `scan.include`/`scan.exclude` configuration. Reports coverage percentage, uncovered file count grouped by extension, and a list of uncovered paths. By default shows up to 10 uncovered files; `--list` reveals all.

```
sdd-forge check scan
sdd-forge check scan --format json --list
sdd-forge check scan --format md
```

| Option | Description |
|---|---|
| `--format` | Output format: `text` (default), `json`, or `md` |
| `--list` | Show all uncovered files instead of the default top 10 |
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Condition |
|---|---|---|
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Validation failure, missing required file, unknown command, agent error, or any unrecoverable runtime error |

**Stdout conventions**

| Scenario | Behavior |
|---|---|
| Default (text) output | Human-readable status lines, file paths, and counts written to stdout |
| `--format json` | A structured JSON object is written to stdout; human-readable text is suppressed |
| `flow` subcommands | Always emit a JSON envelope `{ "ok": true\|false, "type": "...", "key": "...", "result": {...} }` to stdout |
| `--dry-run` | Preview content or task lists are printed to stdout instead of being written to disk |
| Help (`-h`) | Usage text is printed to stdout and the process exits with code 0 |

**Stderr conventions**

- Warnings, deprecation notices, and agent progress tick indicators are written to stderr.
- All error messages for failed commands are written to stderr before the process exits with code 1.
- Verbose mode output (`--verbose`) is directed to stderr to keep stdout clean for piping and parsing.
- The `check freshness` command may emit file-limit warnings to stderr when either tree exceeds 10,000 files.
- Logger events and pipeline step labels in `docs build` are written to stderr when verbose mode is active.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
