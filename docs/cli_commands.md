<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes over 35 commands organized across three namespace groups — `docs`, `flow`, and `check` — plus four standalone top-level commands. Commands follow either a single-level format (`sdd-forge <command>`) or a two-level namespace format (`sdd-forge <namespace> <subcommand> [options]`), with each namespace dispatched to its own module.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `help` | Print the full command list with the current package version | — |
| `setup` | Interactive project initialization wizard; creates `config.json`, directories, `.gitignore`, `.gitattributes`, `AGENTS.md`, and deploys skills | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | Deploy updated skills from package templates; migrate `config.json` to the current format | `--dry-run` |
| `presets list` | Render the preset inheritance tree with axis, language, aliases, scan keys, and template presence | — |
| `docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `docs scan` | Walk the source tree using include/exclude from config and produce `.sdd-forge/output/analysis.json` | — |
| `docs enrich` | Enrich analysis entries with AI-generated summaries, keywords, and role classifications | — |
| `docs init` | Scaffold `docs/` from preset templates with optional AI chapter filtering and project-local overrides | `--type`, `--force`, `--dry-run` |
| `docs data` | Populate `{{data()}}` directives in docs files from analysis data | `--dry-run` |
| `docs text` | Fill `{{text()}}` directives in docs files via AI agent | `--dry-run`, `--force` |
| `docs readme` | Generate or update `README.md` from the preset's readme template | `--output`, `--lang`, `--dry-run` |
| `docs forge` | AI-driven multi-round doc generation loop with optional review gating | `--prompt` (required), `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | Static integrity checks on docs/; exits non-zero on any failure | — |
| `docs changelog` | Scan `specs/` for numbered directories and write `docs/change_log.md` | `--dry-run` |
| `docs agents` | Generate or update `AGENTS.md`; resolve `{{data}}` directives; AI refines PROJECT section | `--dry-run` |
| `docs translate` | Translate docs to configured target languages; incremental by mtime | `--lang`, `--force`, `--dry-run` |
| `flow prepare` | Create a spec directory, feature branch or worktree, `spec.md`, `qa.md`, and `flow.json` | `--title` (required), `--base`, `--issue`, `--request`, `--worktree`, `--no-branch`, `--dry-run` |
| `flow resume` | Assemble git and spec context to resume an active flow via the orchestrating skill | — |
| `flow get context` | Retrieve relevant analysis.json entries by query or file path | file path or query string; mode: `ngram`, `keyword`, `ai` |
| `flow get status` | Return current phase, step completion, requirements progress, and metrics | — |
| `flow get prompt` | Return a named prompt template by kind | kind arg |
| `flow get guardrail` | Return guardrail rules for a given phase | phase arg (required), `--format json` |
| `flow get issue` | Fetch GitHub issue details via `gh` CLI | issue number arg |
| `flow get check` | Check prerequisites for a target (`impl`, `finalize`, `dirty`, `gh`) | target arg |
| `flow set auto` | Toggle `autoApprove` mode in flow state | `on` or `off` |
| `flow set issue` | Store a GitHub issue number in flow state | number arg |
| `flow set note` | Append a note to flow state | text arg |
| `flow set req` | Update a requirement's status by index | index arg, status arg |
| `flow set request` | Store the initial feature request text | text arg |
| `flow set step` | Update a step's status by ID | id arg, status arg |
| `flow set summary` | Replace the requirements array from a JSON string | JSON array arg |
| `flow set test-summary` | Record unit/integration/acceptance test counts | `--unit N`, `--integration N`, `--acceptance N` |
| `flow run gate` | Run phase gate checks (draft, spec pre/post, impl) | `--phase`, `--skip-guardrail` |
| `flow run lint` | Run guardrail-based lint checks against changed files | `--base` |
| `flow run impl-confirm` | Confirm implementation readiness and requirement coverage | `--mode <overview\|detail>` |
| `flow run finalize` | Commit, merge or create PR, sync docs, and clean up | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `flow run retro` | AI retrospective comparing spec requirements to git diff; produces `retro.json` | `--force`, `--dry-run` |
| `flow run report` | Generate a structured flow report; produces `report.json` | `--dry-run` |
| `check config` | Validate `.sdd-forge/config.json` against schema; report up to 50 schema errors | `--format <text\|json>` |
| `check freshness` | Compare mtime of source files versus `docs/`; functions as a CI gate | `--format <text\|json>` |
| `check scan` | Show `analysis.json` coverage statistics against the source tree | `--format <text\|json\|md>`, `--list` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Short Form | Description | Commands |
|---|---|---|---|
| `--help` | `-h` | Print usage information for the current command and exit with code 0 | All commands |
| `--dry-run` | — | Simulate the operation without writing any files or making changes | `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs changelog`, `docs agents`, `docs translate`, `flow prepare`, `flow run finalize`, `flow run retro`, `flow run report`, `upgrade`, `setup` |
| `--force` | — | Overwrite existing output files that would otherwise be skipped | `docs build`, `docs init`, `docs translate` |
| `--format <text\|json\|md>` | — | Select output format; `json` produces a machine-parseable object with an `ok` field; `md` produces Markdown (where supported) | `check config`, `check freshness`, `check scan` |
| `--verbose` | — | Emit additional diagnostic output to stderr during execution | `docs build`, `docs forge` |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Usage: `sdd-forge help`

Prints a formatted list of all available commands grouped by section, together with the current package version. Takes no options other than `--help`.

#### setup

Usage: `sdd-forge setup [options]`

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, source path, output languages, preset type, AI agent provider, and documentation style. Creates `.sdd-forge/config.json`, required directories (`docs/`, `specs/`, `.sdd-forge/output/`), `.gitignore` and `.gitattributes` entries, `AGENTS.md`, and deploys skills. All prompts can be bypassed with CLI flags.

| Option | Description |
|---|---|
| `--name` | Project name |
| `--path` | Source directory path |
| `--work-root` | Working root directory |
| `--type` | Preset type key |
| `--purpose` | Documentation purpose |
| `--tone` | Documentation tone |
| `--agent` | AI agent provider |
| `--lang` | Project language (`en`, `ja`) |
| `--dry-run` | Preview without writing files |

Example: `sdd-forge setup --name my-app --type node --lang en --dry-run`

#### upgrade

Usage: `sdd-forge upgrade [--dry-run]`

Deploys skill files from the package's built-in templates directory into the project (`.claude/skills/`, `.agents/skills/`). Only files that differ from the current versions are updated. Also detects and migrates `config.json` from legacy formats, for example converting string-array `chapters` to object-array format.

Example: `sdd-forge upgrade --dry-run`

#### presets list

Usage: `sdd-forge presets list`

Renders the full preset inheritance tree. Each node shows the preset key, axis, language, aliases, scan configuration keys, and whether template files are present in that preset's directory.

Example: `sdd-forge presets list`

#### docs build

Usage: `sdd-forge docs build [options]`

Runs the complete documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate` (when multi-language is configured). AI-dependent steps (`enrich`, `text`) are skipped with a warning when no `defaultAgent` is configured. With `--regenerate`, the `init` step is skipped and text fill is forced on existing chapter files.

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during `init` |
| `--regenerate` | Skip `init`; force re-generation of text in existing docs |
| `--dry-run` | Preview without writing files |
| `--verbose` | Print per-step diagnostic output |

Example: `sdd-forge docs build --verbose`

#### docs scan

Usage: `sdd-forge docs scan`

Walks the source directory using include/exclude glob patterns from `config.json` and produces `.sdd-forge/output/analysis.json` containing per-file metadata categorized by role.

Example: `sdd-forge docs scan`

#### docs enrich

Usage: `sdd-forge docs enrich`

Sends each entry in `analysis.json` to an AI agent to generate enhanced summaries, keywords, and role classifications. Updates the file in place.

Example: `sdd-forge docs enrich`

#### docs init

Usage: `sdd-forge docs init [options]`

Scaffolds the `docs/` directory by resolving templates from the preset inheritance chain. Supports project-local template overrides in `.sdd-forge/templates/`. When an AI agent is configured and no `config.chapters` is defined, uses AI to filter out chapters not relevant to the project. Skips existing files unless `--force` is set.

| Option | Description |
|---|---|
| `--type` | Override preset type |
| `--force` | Overwrite existing files |
| `--dry-run` | Preview without writing |

Example: `sdd-forge docs init --force`

#### docs data

Usage: `sdd-forge docs data [--dry-run]`

Resolves all `{{data()}}` directives in docs chapter files by querying the preset resolver with `analysis.json` data. Writes updated content back in place.

Example: `sdd-forge docs data --dry-run`

#### docs text

Usage: `sdd-forge docs text [options]`

Fills all `{{text()}}` directives in docs chapter files by invoking an AI agent per directive. Existing content in a directive block is preserved unless `--force` is supplied. Parallel processing uses the `concurrency` value from config.

| Option | Description |
|---|---|
| `--dry-run` | Preview without writing files |
| `--force` | Overwrite already-filled directives |

Example: `sdd-forge docs text --force`

#### docs readme

Usage: `sdd-forge docs readme [options]`

Generates or updates `README.md` from the preset's readme template. Resolves `{{data}}` directives and fills any `{{text}}` directives via AI. Writes only when the computed content differs from the current file. The `--output` flag enables writing to a custom path, which is used for per-language README generation.

| Option | Description |
|---|---|
| `--output` | Output file path (default: `README.md` in repo root) |
| `--lang` | Language override |
| `--dry-run` | Preview without writing |

Example: `sdd-forge docs readme --output docs/ja/README.md`

#### docs forge

Usage: `sdd-forge docs forge --prompt <text> [options]`

Runs an AI-driven multi-round documentation generation loop. In each round the AI is invoked per target docs file, followed by a review command. Retries up to `--max-runs` rounds or until review passes. Requires `--prompt` or `--prompt-file`.

| Option | Description |
|---|---|
| `--prompt` | Generation instruction (required unless `--prompt-file` is used) |
| `--prompt-file` | Path to file containing the prompt |
| `--spec` | Path to a spec file to scope relevant chapters |
| `--max-runs` | Maximum generation rounds (default: `3`) |
| `--review-cmd` | Shell command used as review gate between rounds |
| `--mode` | Execution mode: `local`, `assist`, or `agent` (default: `local`) |
| `--dry-run` | Preview without writing or running agents |
| `--verbose` | Emit per-file agent output to stderr |

Example: `sdd-forge docs forge --prompt "Document the auth module" --mode local --max-runs 2`

#### docs review

Usage: `sdd-forge docs review [<dir>]`

Performs static integrity checks on the `docs/` directory and `README.md`. Verifies that all expected chapter files exist, each file meets a minimum of 15 lines and has an H1 heading, no unfilled `{{text}}` or `{{data}}` directives remain, no broken HTML comments or residual block markers are present, and that translated language subdirectories contain the expected files. Exits with a non-zero code on any failure.

Example: `sdd-forge docs review`

#### docs changelog

Usage: `sdd-forge docs changelog [<output-path>] [--dry-run]`

Scans `specs/` for numbered subdirectories, parses each `spec.md` for title, status, and creation date, and writes a Markdown change log to `docs/change_log.md` (or `<output-path>`). Uses the highest-numbered version of each spec series as the canonical entry in the index table.

Example: `sdd-forge docs changelog --dry-run`

#### docs agents

Usage: `sdd-forge docs agents [--dry-run]`

Generates or updates `AGENTS.md` in the source root. Creates a skeleton file if none exists. Resolves `{{data}}` directives for the SDD and PROJECT sections, then calls an AI agent to refine the PROJECT section content using analysis data and existing chapter docs.

Example: `sdd-forge docs agents`

#### docs translate

Usage: `sdd-forge docs translate [options]`

Translates docs chapter files and `README.md` into configured target language subdirectories (e.g., `docs/ja/`). Translation is incremental: only files whose source mtime is newer than the existing translation are processed, unless `--force` is set. Concurrency is controlled by the `concurrency` config value.

| Option | Description |
|---|---|
| `--lang` | Translate to a single target language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Preview without writing |

Example: `sdd-forge docs translate --lang ja --force`

#### flow prepare

Usage: `sdd-forge flow prepare --title <title> [options]`

Initializes a new development flow. Slugifies `--title` to derive the branch name and spec directory index. Creates `specs/<index>-<slug>/spec.md` and `qa.md` from templates (with support for project-local overrides in `.sdd-forge/templates/<lang>/specs/`). Saves `flow.json` with the initial step sequence, base branch, and metadata. Requires a clean working tree.

| Option | Description |
|---|---|
| `--title` | Feature title used to derive branch name and spec directory (required) |
| `--base` | Base branch (defaults to current branch) |
| `--issue` | GitHub issue number to link |
| `--request` | Initial feature request description |
| `--worktree` | Create an isolated git worktree instead of a plain branch |
| `--no-branch` | Create spec files only, without creating a branch |
| `--dry-run` | Preview without writing |

Example: `sdd-forge flow prepare --title "Add OAuth" --issue 12 --worktree`

#### flow resume

Usage: `sdd-forge flow resume`

Detects the active flow and assembles a rich context object including branch name, dirty state, commits ahead of base, last commit, spec Goal and Scope sections, and step progress. Returns a `recommendedSkill` field indicating which phase skill to invoke next. Takes no options.

Example: `sdd-forge flow resume`

#### flow get context

Usage: `sdd-forge flow get context [--query <text> | <file-path>]`

Retrieves analysis.json entries relevant to a search query or a specific file path. Defaults to ngram (bigram similarity) matching; falls back to keyword search, then AI-guided keyword selection when no matches are found.

Example: `sdd-forge flow get context --query "authentication"`

#### flow get status

Usage: `sdd-forge flow get status`

Returns the current flow phase, step array with completion status, requirements progress counts, linked issue, notes, metrics, and the configured merge strategy from `flow.json`.

Example: `sdd-forge flow get status`

#### flow get prompt

Usage: `sdd-forge flow get prompt <kind>`

Returns the named prompt template for the given kind. Available kinds are defined per language in the prompt registry (e.g., `plan.approach`, `impl.confirmation`, `finalize.mode`).

Example: `sdd-forge flow get prompt plan.approach`

#### flow get guardrail

Usage: `sdd-forge flow get guardrail <phase> [--format json]`

Returns the guardrail rules filtered for the specified phase. The phase argument is required and must be a valid phase name. Output is Markdown by default; `--format json` returns a structured array.

Example: `sdd-forge flow get guardrail pre --format json`

#### flow get issue

Usage: `sdd-forge flow get issue <number>`

Fetches title, body, labels, and state for the specified GitHub issue using `gh issue view`. Requires the `gh` CLI to be installed and authenticated.

Example: `sdd-forge flow get issue 42`

#### flow get check

Usage: `sdd-forge flow get check <target>`

Checks a prerequisite condition. `impl` verifies that `gate` and `test` steps are complete. `finalize` verifies that `implement` is complete. `dirty` checks whether the git working tree is clean. `gh` verifies that the `gh` CLI is available.

Example: `sdd-forge flow get check dirty`

#### flow set auto

Usage: `sdd-forge flow set auto <on|off>`

Enables or disables `autoApprove` mode in the current flow state.

Example: `sdd-forge flow set auto on`

#### flow set issue

Usage: `sdd-forge flow set issue <number>`

Stores a GitHub issue number in the current flow's `flow.json`. Validates that the argument is a positive integer.

Example: `sdd-forge flow set issue 42`

#### flow set note

Usage: `sdd-forge flow set note "<text>"`

Appends a note entry to the `notes` array in `flow.json`.

Example: `sdd-forge flow set note "Decided to use JWT tokens"`

#### flow set req

Usage: `sdd-forge flow set req <index> <status>`

Updates the `status` field of a requirement at the given numeric index in the `requirements` array.

Example: `sdd-forge flow set req 2 done`

#### flow set request

Usage: `sdd-forge flow set request "<text>"`

Stores or replaces the initial feature request description in `flow.json`.

Example: `sdd-forge flow set request "Add OAuth2 login support"`

#### flow set step

Usage: `sdd-forge flow set step <id> <status>`

Updates the `status` field of the step identified by `<id>` in the `steps` array.

Example: `sdd-forge flow set step implement done`

#### flow set summary

Usage: `sdd-forge flow set summary '<json-array>'`

Replaces the `requirements` array in `flow.json` with the parsed JSON array of strings.

Example: `sdd-forge flow set summary '["Implement login","Write tests"]'`

#### flow set test-summary

Usage: `sdd-forge flow set test-summary --unit <N> [--integration <N>] [--acceptance <N>]`

Records test result counts in the flow state metrics. At least `--unit` must be provided.

Example: `sdd-forge flow set test-summary --unit 35 --integration 8 --acceptance 3`

#### flow run gate

Usage: `sdd-forge flow run gate [--phase <draft|pre|post|impl>] [--skip-guardrail]`

Runs phase gate checks. Phases `pre` and `post` validate the structural completeness of `spec.md` including required sections and user confirmation. Phase `draft` checks `draft.md`. Phase `impl` diffs against the base branch and uses AI to verify requirement coverage. Optionally applies AI-based guardrail checks.

Example: `sdd-forge flow run gate --phase post`

#### flow run lint

Usage: `sdd-forge flow run lint [--base <branch>]`

Runs lint checks based on the project's merged guardrail rules against files changed relative to the base branch. Falls back to `flowState.baseBranch` when `--base` is not provided.

Example: `sdd-forge flow run lint --base main`

#### flow run impl-confirm

Usage: `sdd-forge flow run impl-confirm [--mode <overview|detail>]`

Returns the implementation confirmation state: requirement completion counts and, in `detail` mode, the list of changed files from the base branch diff.

Example: `sdd-forge flow run impl-confirm --mode detail`

#### flow run finalize

Usage: `sdd-forge flow run finalize --mode <all|select> [options]`

Orchestrates the finalization sequence. Step numbers: `1` = commit, `2` = merge or PR, `3` = docs sync, `4` = worktree/branch cleanup. All steps run when `--mode all` is used. Individual steps are selected with `--mode select --steps 1,2`.

| Option | Description |
|---|---|
| `--mode` | `all` or `select` (required) |
| `--steps` | Comma-separated step numbers when `--mode select` |
| `--merge-strategy` | `squash`, `pr`, or `auto` (default: `auto`) |
| `--message` | Commit message override |
| `--dry-run` | Preview without executing |

Example: `sdd-forge flow run finalize --mode select --steps 1,2 --merge-strategy pr`

#### flow run retro

Usage: `sdd-forge flow run retro [--force] [--dry-run]`

Runs an AI retrospective comparing spec requirements against the git diff. Writes `retro.json` in the spec directory with per-requirement verdicts, unplanned changes, and an overall completion score. Fails if `retro.json` already exists unless `--force` is set.

Example: `sdd-forge flow run retro --force`

#### flow run report

Usage: `sdd-forge flow run report [--dry-run]`

Generates a structured flow report by aggregating git summary and issue log data. Writes `report.json` adjacent to the spec file.

Example: `sdd-forge flow run report`

#### check config

Usage: `sdd-forge check config [--format <text|json>]`

Validates `.sdd-forge/config.json` for file existence, JSON parse validity, required fields, schema consistency, and preset key existence. Collects up to 50 schema errors. Text format prints errors to stderr; JSON format writes a `{ ok, checks }` object to stdout.

Example: `sdd-forge check config --format json`

#### check freshness

Usage: `sdd-forge check freshness [--format <text|json>]`

Compares the newest modification timestamp of source files against `docs/` files. Returns one of three result states: `fresh`, `stale`, or `never-built`. Exits with code 1 when not fresh, enabling use as a CI gate.

Example: `sdd-forge check freshness`

#### check scan

Usage: `sdd-forge check scan [options]`

Cross-references source files matched by `scan.include`/`scan.exclude` config against entries in `analysis.json`. Groups uncovered files by extension. Shows up to 10 uncovered files by default.

| Option | Description |
|---|---|
| `--format` | Output format: `text` (default), `json`, or `md` |
| `--list` | Show all uncovered files instead of the default 10 |

Example: `sdd-forge check scan --format md --list`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Condition |
|---|---|---|
| `0` | — | Command completed successfully; all checks passed |
| `1` | `EXIT_ERROR` | Command failed; covers unknown subcommands, missing required arguments, schema validation errors, file not found, AI agent errors, merge conflicts, and non-fresh state in `check freshness` |

Standard output (`stdout`) receives all primary command output: formatted tables, generated Markdown content, JSON payloads from `--format json`, and pipeline progress messages. Standard error (`stderr`) receives diagnostic output: warnings prefixed with `WARN:`, error descriptions, per-step progress tickers during AI calls, and verbose output when `--verbose` is active.

Commands that accept `--format json` write a JSON object to `stdout` containing at minimum an `ok` boolean field indicating overall success. The `check` commands always exit with code `1` when checks fail, regardless of `--format`, which makes them suitable for use as CI gates.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
