# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge provides over 20 CLI commands organized into four namespaces (`docs`, `spec`, `flow`, and standalone commands) using a three-level dispatch architecture: the entry point (`sdd-forge.js`) routes to namespace dispatchers, which in turn delegate to individual command implementations. This chapter covers every command's usage, options, and behavior.

<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display all available commands grouped by section | — |
| `sdd-forge setup` | Interactive setup wizard for project registration and config generation | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills, etc.) to match the installed version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline (scan→enrich→init→data→text→readme→agents→translate) | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and generate analysis.json | — |
| `sdd-forge docs enrich` | AI-enrich analysis entries with summary, detail, chapter, and role metadata | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Merge preset templates and output chapter files to docs/ | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Resolve `{{text}}` directives via LLM agent | `--dry-run`, `--per-directive`, `--timeout`, `--id` |
| `sdd-forge docs readme` | Generate README.md from chapter files and templates | `--dry-run`, `--output`, `--lang` |
| `sdd-forge docs forge` | Iterative AI-driven documentation improvement with review feedback loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Run automated review checks on generated documentation | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate change_log.md from specs/ directory | `--dry-run` |
| `sdd-forge docs agents` | Update AGENTS.md by resolving directives and AI-refining the PROJECT section | `--dry-run` |
| `sdd-forge docs snapshot` | Create a documentation snapshot | — |
| `sdd-forge spec init` | Create a numbered feature branch and spec directory with template files | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Pre-implementation gate check for unresolved items and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Manage project guardrail (immutable principles) for spec compliance | Subcommands: `init`, `update`; `--dry-run`, `--force`, `--agent` |
| `sdd-forge flow start` | Start SDD flow: spec init → gate → forge pipeline | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update flow progress, requirements, and step states | `--step`, `--status`, `--summary`, `--req`, `--check`, `--archive`, `--dry-run` |
| `sdd-forge flow review` | AI-driven code quality review with draft→final validation phases | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | Squash-merge feature branch into base branch | `--dry-run` |
| `sdd-forge flow cleanup` | Delete feature branch and/or worktree after flow completion | `--dry-run` |

<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following options are recognized across most commands via the shared `parseArgs()` utility in `src/lib/cli.js`:

| Option | Description |
| --- | --- |
| `-h`, `--help` | Display the help message for the current command and exit. Available on every command and dispatcher. |
| `--dry-run` | Preview changes without writing files or executing side effects. Supported by the majority of commands including `build`, `init`, `data`, `text`, `readme`, `agents`, `translate`, `changelog`, `forge`, `spec init`, `flow start`, `flow merge`, `flow cleanup`, and `flow status`. |
| `-v`, `--version`, `-V` | Print the sdd-forge version number and exit. Recognized only at the top-level entry point (`sdd-forge -v`). |

Note that `parseArgs()` converts `--kebab-case` flags to camelCase properties (e.g., `--dry-run` becomes `dryRun`, `--no-branch` becomes `noBranch`). Boolean flags default to `false` unless explicitly passed. Option values are consumed as the next argument following the option name.

<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### sdd-forge help

Displays all available commands grouped into sections: Project, Docs, Spec, Flow, and Info. The output language is determined by the `lang` setting in `.sdd-forge/config.json`.

```
sdd-forge help
```

#### sdd-forge setup

Interactive setup wizard that registers a project and generates `.sdd-forge/config.json`. When all required values are provided via CLI options, it runs in non-interactive mode. The wizard covers: operation language, project name, source/output paths, output languages, project type (architecture → framework hierarchy), document style, and AI agent selection. It also deploys AGENTS.md, CLAUDE.md, and skill files.

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2
sdd-forge setup --name myapp --path . --agent claude --lang en --dry-run
```

| Option | Description |
| --- | --- |
| `--name` | Project name |
| `--path` | Path to the source directory |
| `--work-root` | Working root directory (defaults to source path) |
| `--type` | Project type preset (e.g., `cli/node-cli`, `webapp/laravel`) |
| `--purpose` | Document purpose (`user-guide` or `developer`) |
| `--tone` | Writing tone (`polite`, `formal`, `casual`) |
| `--agent` | Default AI agent name |
| `--lang` | Default language code |
| `--dry-run` | Preview without writing files |

#### sdd-forge upgrade

Updates template-derived files such as skill definitions to match the currently installed sdd-forge version. Safe to run repeatedly — only overwrites template-managed content. Also prints configuration hints for missing settings like `systemPromptFlag`.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Displays the preset inheritance tree showing base, architecture, and leaf presets with their labels, aliases, and scan keys. Each node indicates whether it has its own templates directory.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the full documentation generation pipeline: `scan → enrich → init → data → text → readme → agents → translate`. Displays a progress bar during execution. When no `defaultAgent` is configured, the `enrich` and `text` steps are skipped. For multi-language projects, additional translation or per-language generation steps are appended.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during init |
| `--verbose` | Show detailed progress output |
| `--dry-run` | Preview without writing files |

#### sdd-forge docs scan

Scans the project source code and generates `analysis.json` in `.sdd-forge/output/`. This is the first step in the documentation pipeline and provides the raw data consumed by subsequent commands.

```
sdd-forge docs scan
```

#### sdd-forge docs enrich

Uses an AI agent to annotate each entry in `analysis.json` with `summary`, `detail`, `chapter`, and `role` metadata. Processes entries in line-count-based batches (default: 3000 lines per batch, max 20 items). Supports resume: already-enriched entries are skipped, and progress is saved after each batch.

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run --stdout
```

| Option | Description |
| --- | --- |
| `--dry-run` | Preview without writing |
| `--stdout` | Output results to stdout |

#### sdd-forge docs init

Resolves the template inheritance chain (base → architecture → project-local) and outputs chapter files to `docs/`. When an AI agent is configured and `config.chapters` is not set, AI-based chapter filtering excludes irrelevant chapters based on project analysis.

```
sdd-forge docs init
sdd-forge docs init --type cli/node-cli --force
```

| Option | Description |
| --- | --- |
| `--type` | Override project type for template resolution |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

#### sdd-forge docs data

Resolves `{{data}}` directives in chapter files by loading DataSource modules and populating tables from analysis data.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Resolves `{{text}}` directives via LLM agent calls. Default mode is batch (one LLM call per file). The `--per-directive` flag switches to per-directive mode with concurrency control. Includes quality validation: rejects results with excessive content shrinkage (below 50% of original line count) and warns when fewer than half of directives are filled.

```
sdd-forge docs text
sdd-forge docs text --per-directive --timeout 60000
```

| Option | Description |
| --- | --- |
| `--per-directive` | Process each directive individually instead of per-file batch |
| `--timeout` | Agent call timeout in milliseconds |
| `--id` | Filter to a specific directive ID |
| `--dry-run` | Preview without writing |

#### sdd-forge docs readme

Generates `README.md` from chapter files using the README template from the preset inheritance chain. Resolves both `{{data}}` and `{{text}}` directives. Skips writing if the output is identical to the existing file.

```
sdd-forge docs readme
sdd-forge docs readme --dry-run --output docs/ja/README.md
```

| Option | Description |
| --- | --- |
| `--output` | Override output file path |
| `--lang` | Override output language |
| `--dry-run` | Preview without writing |

#### sdd-forge docs forge

Iterative AI-driven documentation improvement. Operates in three modes: `local` (deterministic patches only), `assist` (AI with local fallback), and `agent` (AI required). Runs up to `--max-runs` rounds, each consisting of an AI call followed by review. Failed reviews feed back into the next round.

```
sdd-forge docs forge --prompt "improve error handling docs" --mode assist
sdd-forge docs forge --spec specs/001-feature/spec.md --max-runs 5 --mode agent
```

| Option | Description |
| --- | --- |
| `--prompt` | Improvement instruction text |
| `--prompt-file` | Read instruction from a file |
| `--spec` | Path to spec file for context |
| `--max-runs` | Maximum iteration rounds (default: 3) |
| `--review-cmd` | Custom review command (default: `sdd-forge docs review`) |
| `--mode` | Operation mode: `local`, `assist`, or `agent` |
| `--verbose` | Show agent output in real time |
| `--dry-run` | Preview without writing |

#### sdd-forge docs translate

Translates default-language documentation to non-default languages using AI. Compares file modification times to re-translate only changed files. Supports tone-aware translation (e.g., polite/formal/casual for Japanese).

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
| --- | --- |
| `--lang` | Target language (translates only this language) |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Preview without writing |

#### sdd-forge docs changelog

Scans the `specs/` directory and generates `change_log.md` with two tables: a latest-per-series index and a full spec listing. Preserves content outside `AUTO-GEN:START/END` markers.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Updates AGENTS.md by resolving `{{data: agents.sdd}}` and `{{data: agents.project}}` directives. The PROJECT section is refined by an AI agent using generated docs and project metadata as context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge spec init

Creates a numbered feature branch and spec directory with `spec.md` and `qa.md` templates. Supports three branching strategies: standard branch creation, git worktree isolation, and spec-only mode (no branch).

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login-feature" --worktree
sdd-forge spec init --title "bugfix" --no-branch --allow-dirty
```

| Option | Description |
| --- | --- |
| `--title` | Feature title (required) — used for branch and directory naming |
| `--base` | Base branch (defaults to current branch) |
| `--no-branch` | Skip branch creation, create spec files only |
| `--worktree` | Create an isolated git worktree for the feature |
| `--allow-dirty` | Allow spec creation in a dirty worktree |
| `--dry-run` | Preview without creating files or branches |

#### sdd-forge spec gate

Pre-implementation gate check that verifies spec readiness. Detects unresolved tokens (TBD, TODO, FIXME), unchecked tasks, missing required sections (Clarifications, Open Questions, User Confirmation, Acceptance Criteria), and unapproved user confirmation. Optionally runs AI guardrail compliance checks.

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| Option | Description |
| --- | --- |
| `--spec` | Path to spec.md file (required) |
| `--phase` | Check phase: `pre` (default) skips status/acceptance items; `post` checks everything |
| `--skip-guardrail` | Skip AI guardrail compliance check |

#### sdd-forge spec guardrail

Manages project guardrail definitions (immutable principles for spec compliance). Has two subcommands: `init` generates guardrail.md from preset templates with inheritance (base → arch → leaf); `update` uses AI to propose project-specific additions.

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force --dry-run
sdd-forge spec guardrail update --agent claude
```

#### sdd-forge flow start

Starts the full SDD flow by executing spec init → gate → forge in sequence. Requires `--request` to describe the feature. Saves flow state to `flow.json` for progress tracking.

```
sdd-forge flow start --request "add login feature"
sdd-forge flow start --request "refactor API" --forge-mode agent --max-runs 5
sdd-forge flow start --request "fix bug" --worktree --title "bugfix-123"
```

| Option | Description |
| --- | --- |
| `--request` | Feature request description (required) |
| `--title` | Feature title for branch naming (auto-derived from request if omitted) |
| `--spec` | Use existing spec file instead of creating a new one |
| `--agent` | Override AI agent |
| `--max-runs` | Maximum forge iterations (default: 5) |
| `--forge-mode` | Forge mode: `local`, `assist`, or `agent` (default: `local`) |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree isolation |
| `--dry-run` | Preview without execution |

#### sdd-forge flow status

Displays current flow progress including spec path, branches, step completion, and requirements. Also supports updating individual steps, setting requirements lists, checking prerequisites, and archiving completed flows.

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["implement API", "write tests"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --check impl
sdd-forge flow status --archive
```

| Option | Description |
| --- | --- |
| `--step <id> --status <val>` | Update a specific step's status |
| `--summary '<JSON>'` | Set requirements list from a JSON array of strings |
| `--req <index> --status <val>` | Update a specific requirement's status |
| `--check <phase>` | Check phase prerequisites (e.g., `impl` requires gate and test) |
| `--archive` | Move flow.json to the spec directory and clear active state |
| `--dry-run` | With `--check`, always exit 0 |

#### sdd-forge flow review

Runs a two-phase AI code quality review. The draft phase generates improvement proposals focusing on duplicate code, naming, dead code, design consistency, and simplification. The final phase validates each proposal conservatively, producing APPROVED/REJECTED verdicts. Results are written to `review.md`.

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show proposals without applying |
| `--skip-confirm` | Skip initial confirmation prompt |

#### sdd-forge flow merge

Squash-merges the feature branch into the base branch. Auto-detects the strategy from `flow.json`: worktree mode (merge from main repo), branch mode (checkout + merge), or spec-only mode (skip).

```
sdd-forge flow merge
sdd-forge flow merge --dry-run
```

#### sdd-forge flow cleanup

Deletes the feature branch and/or worktree after flow completion. Auto-detects the cleanup strategy from `flow.json`: worktree removal + branch deletion, branch-only deletion, or skip for spec-only flows.

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| Exit Code | Meaning | Used By |
| --- | --- | --- |
| `0` | Success or help displayed | All commands |
| `1` | General error — missing arguments, unknown command, configuration failure, missing files, or gate check failure | Most commands; dispatchers on unknown subcommand; `flow status` on missing flow.json; `spec gate` on unresolved items |
| `2` | Gate check failed with actionable feedback — user confirmation needed or unresolved spec items | `flow start` when gate fails; indicates the spec requires user attention before proceeding |

**stdout/stderr conventions:**

| Stream | Content |
| --- | --- |
| `stdout` | Primary command output: generated file contents (in `--dry-run` mode), status displays, spec creation confirmations, and structured results |
| `stderr` | Progress indicators, warnings (`WARN:`), pipeline step labels (e.g., `[build]`, `[forge]`, `[text]`), error messages (`ERROR:`), agent activity tickers, and help text for missing/invalid subcommands |

Commands that write files typically print a confirmation message with the output path upon success. The `--dry-run` flag redirects the would-be file content to stdout while printing a dry-run notice to stderr. The `docs build` pipeline uses a progress bar on stderr showing weighted step completion. Agent-based commands print periodic dots to stderr as activity indicators during long-running AI calls.

<!-- {{/text}} -->
