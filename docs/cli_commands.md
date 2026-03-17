# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge provides over 25 CLI commands organized into four namespaces — `docs`, `spec`, `flow`, and top-level project commands — following a three-level dispatch architecture (`sdd-forge.js` → dispatcher → command). Each namespace groups related functionality: documentation generation, specification management, development workflow automation, and project configuration.

<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display all available commands with descriptions | — |
| `sdd-forge setup` | Interactive setup wizard for project registration and config generation | `--name`, `--type`, `--purpose`, `--tone`, `--lang`, `--path`, `--work-root`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills, AGENTS.md) to match the installed version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline (scan→enrich→init→data→text→readme→agents→translate) | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and generate analysis.json using DataSource-based pipeline | `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Add AI-generated summary/detail/chapter/role metadata to analysis.json entries | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Initialize docs/ chapter files from preset templates with AI chapter filtering | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Resolve `{{text}}` directives in chapter files using AI | `--dry-run` |
| `sdd-forge docs readme` | Generate README.md from templates and chapter files | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iteratively improve docs using AI agent with review feedback loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Run quality checks on generated documentation | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate change_log.md from specs/ directory | `--dry-run` |
| `sdd-forge docs agents` | Update AGENTS.md by resolving directives and AI-refining the PROJECT section | `--dry-run` |
| `sdd-forge docs snapshot` | Save, check, or update deterministic output snapshots for regression detection | Subcommands: `save`, `check`, `update` |
| `sdd-forge spec init` | Create a numbered feature branch and spec directory with spec.md/qa.md templates | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Validate spec.md for unresolved items and guardrail compliance before implementation | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Manage project guardrail (init from template or update via AI) | Subcommands: `init`, `update`; `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | Run the full SDD flow: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update flow progress, requirements, and notes | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--check`, `--archive`, `--dry-run` |
| `sdd-forge flow resume` | Output a context summary for resuming after compaction | — |
| `sdd-forge flow review` | Run AI-powered code quality review (draft → final → apply) | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | Squash-merge feature branch into base branch | `--dry-run` |
| `sdd-forge flow cleanup` | Delete feature branch and/or worktree after merge | `--dry-run` |

<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following options are recognized globally or shared across most commands via the `parseArgs()` utility in `src/lib/cli.js`:

| Option | Description |
|---|---|
| `-h`, `--help` | Display help text for the current command. Supported by all commands and dispatchers. |
| `-v`, `--version`, `-V` | Display the sdd-forge package version. Handled at the top-level entry point (`sdd-forge.js`). |
| `--dry-run` | Simulate the command without writing files or making changes. Available on most commands that perform writes. |

The `parseArgs()` function processes `process.argv` and supports three parameter categories: `flags` (boolean switches like `--force`), `options` (key-value pairs like `--type webapp`), and `aliases` (short-form mappings like `-v` → `--verbose`). Flag names are automatically converted from kebab-case to camelCase (e.g., `--dry-run` becomes `dryRun` in code).

Environment variables used for project context resolution:

| Variable | Description |
|---|---|
| `SDD_SOURCE_ROOT` | Override the source root directory for analysis |
| `SDD_WORK_ROOT` | Override the working root directory for output |

<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### sdd-forge help

Displays all available commands grouped by section (Project, Docs, Spec, Flow, Info) with descriptions. The output language is determined by `.sdd-forge/config.json` lang setting.

```
sdd-forge help
```

#### sdd-forge setup

Interactive setup wizard that registers a project and generates `.sdd-forge/config.json`. Supports both interactive mode (readline-based prompts) and non-interactive mode (when all required options are provided).

```
sdd-forge setup
sdd-forge setup --name myapp --type webapp/cakephp2 --purpose developer --tone polite
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source directory path |
| `--work-root <path>` | Working root directory (defaults to source path) |
| `--type <type>` | Architecture type (e.g., `webapp/cakephp2`, `cli/node-cli`) |
| `--purpose <purpose>` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone <tone>` | Writing tone (`polite`, `formal`, `casual`) |
| `--agent <agent>` | Default agent (`claude`, `codex`) |
| `--lang <lang>` | Interface language |
| `--dry-run` | Show what would be created without writing files |

Setup creates the directory structure (`.sdd-forge/`, `output/`, `docs/`, `specs/`), updates `.gitignore`, generates AGENTS.md and CLAUDE.md, and deploys skill templates.

#### sdd-forge upgrade

Upgrades template-derived files to match the currently installed sdd-forge version. Safe to run repeatedly — only overwrites template-managed content. Does not touch `config.json` or `context.json`.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

Upgraded files include skill templates (`.agents/skills/`, `.claude/skills/`) and AGENTS.md SDD section content. Also prints configuration hints for missing settings such as `systemPromptFlag`.

#### sdd-forge presets list

Displays the preset inheritance tree showing all available presets with their properties (axis, lang, aliases, scan keys, template availability).

```
sdd-forge presets list
```

Output uses tree-style indentation (`├──`, `└──`, `│`) with `base/` as the root node.

#### sdd-forge docs build

Runs the full documentation generation pipeline with a progress bar. The pipeline executes in order: scan → enrich → init → data → text → readme → agents, with an optional translate step for multi-language projects.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during init |
| `--verbose` | Show detailed progress output |
| `--dry-run` | Simulate the pipeline without writing files |

The `enrich` and `text` steps are automatically skipped when no agent is configured. Monorepo projects (those with `config.projects`) are detected and skipped with a notification. Multi-language output supports two modes: `translate` (AI translation of existing docs) and `generate` (per-language pipeline re-execution).

#### sdd-forge docs scan

Scans the project source code using DataSource-based pipeline with include/exclude glob patterns from the preset configuration. Generates `analysis.json` in `.sdd-forge/output/`.

```
sdd-forge docs scan
sdd-forge docs scan --stdout
```

| Option | Description |
|---|---|
| `--stdout` | Output analysis JSON to stdout instead of writing to file |
| `--dry-run` | Run scan without writing analysis.json |

Supports incremental scanning: compares file hashes against existing analysis.json to skip unchanged categories. Preserves enrichment data (summary, detail, chapter, role) for files whose content hash has not changed.

#### sdd-forge docs enrich

Enriches analysis.json entries with AI-generated metadata including summary, detail, chapter assignment, and role classification. Processes entries in batches based on total line count (default: 3000 lines per batch) or item count (default: 20 items per batch).

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Show what would be enriched without calling AI |
| `--stdout` | Output enriched data to stdout |

Supports resume: entries that already have a `summary` field are skipped, and progress is saved after each batch completion. On error, partial progress is preserved before the exception is thrown.

#### sdd-forge docs init

Initializes docs/ chapter files from preset templates. Resolves the template inheritance chain (base → arch → leaf → project-local) using a bottom-up merge strategy.

```
sdd-forge docs init
sdd-forge docs init --type webapp/laravel --force
```

| Option | Description |
|---|---|
| `--type <type>` | Override the architecture type for template selection |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Show what files would be created without writing |

When `config.chapters` is defined, AI chapter filtering is skipped and the specified chapters are used directly. Otherwise, if an agent is configured, AI selects relevant chapters based on the analysis summary. Template translation is applied for non-default language output.

#### sdd-forge docs data

Resolves `{{data}}` directives in chapter files by invoking DataSource resolvers against analysis.json data.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Resolves `{{text}}` directives in chapter files using AI agents to generate documentation prose from enriched analysis data.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

Generates README.md from the README template with resolved `{{data}}` and `{{text}}` directives. Supports language-specific output and custom output paths.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| Option | Description |
|---|---|
| `--lang <lang>` | Target language for README generation |
| `--output <path>` | Custom output file path |
| `--dry-run` | Display generated content without writing |

Performs a diff check against the existing README.md and skips writing if content is unchanged.

#### sdd-forge docs forge

Iteratively improves documentation by combining AI agent calls with the review command in a feedback loop. Runs up to `maxRuns` rounds until the review passes.

```
sdd-forge docs forge --prompt "improve API documentation" --mode assist
sdd-forge docs forge --spec specs/042-feature/spec.md --max-runs 5
```

| Option | Description |
|---|---|
| `--prompt <text>` | Improvement prompt for the AI agent |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Spec file for context and file targeting |
| `--max-runs <n>` | Maximum iteration rounds (default: 3) |
| `--review-cmd <cmd>` | Custom review command (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--verbose` | Show detailed agent output |
| `--dry-run` | Simulate without writing files |

Three execution modes are available: `local` (no agent, display review feedback only), `assist` (agent with local fallback on failure), and `agent` (agent required). Supports per-file parallel processing when systemPromptFlag is configured.

#### sdd-forge docs review

Validates documentation quality by checking chapter files for structural requirements and content integrity.

```
sdd-forge docs review
sdd-forge docs review docs/
```

Checks performed include: minimum line count (15 lines), H1 heading presence, unfilled `{{text}}` and `{{data}}` directives, exposed directives outside code blocks, HTML comment open/close balance, residual block directives (`@block`, `@endblock`, `@extends`, `@parent`), analysis.json existence, and README.md existence. Multi-language mode extends checks to non-default language directories.

#### sdd-forge docs translate

Translates default-language documentation to non-default languages using AI. Uses mtime comparison for differential translation.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
|---|---|
| `--lang <lang>` | Target language (defaults to all non-default languages) |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Show which files would be translated |

Only operates when `docs.output.mode` is set to `translate`. Tone instructions are applied for Japanese output based on `documentStyle.tone` settings (polite → です/ます, formal → である, casual → 口語的).

#### sdd-forge docs changelog

Scans the `specs/` directory to generate `change_log.md` with two tables: a latest-per-series index and a complete spec listing.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
sdd-forge docs changelog docs/custom_changelog.md
```

| Option | Description |
|---|---|
| `--dry-run` | Output to stdout without writing file |

Extracts metadata (title, created date, status, branch, input) from each `spec.md` file. Recognizes numbered directory names (`NNN-slug`) and backup directories (`bak.NNN-slug`). Preserves existing MANUAL blocks outside the `AUTO-GEN:START/END` region.

#### sdd-forge docs agents

Updates AGENTS.md by resolving `{{data: agents.sdd}}` and `{{data: agents.project}}` directives. The PROJECT section is refined by an AI agent using generated docs and package.json as context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Display updated content without writing |

#### sdd-forge spec init

Creates a numbered feature branch and spec directory with `spec.md` and `qa.md` templates.

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login-feature" --base development --worktree
sdd-forge spec init --title "bugfix" --no-branch
```

| Option | Description |
|---|---|
| `--title <title>` | Feature title (required), used to generate branch name and directory |
| `--base <branch>` | Base branch (defaults to current branch) |
| `--dry-run` | Show what would be created without executing |
| `--allow-dirty` | Skip worktree clean check |
| `--no-branch` | Create spec files without creating a branch |
| `--worktree` | Use git worktree for isolated development |

Three branching strategies are auto-detected: default (new branch via `git checkout -b`), worktree (`git worktree add`), and spec-only (no branch when `--no-branch` or already inside a worktree). Saves initial flow state to `flow.json` with approach, branch, and spec steps marked as done.

#### sdd-forge spec gate

Validates that a spec is ready for implementation by checking for unresolved items and optionally running AI-based guardrail compliance checks.

```
sdd-forge spec gate --spec specs/042-feature/spec.md
sdd-forge spec gate --spec specs/042-feature/spec.md --phase post
sdd-forge spec gate --spec specs/042-feature/spec.md --skip-guardrail
```

| Option | Description |
|---|---|
| `--spec <path>` | Path to spec.md (required) |
| `--phase <phase>` | Check phase: `pre` (default) or `post` |
| `--skip-guardrail` | Skip AI guardrail compliance check |

Pre-phase skips unchecked items in Status, Acceptance Criteria, and User Scenarios sections. Checks for unresolved tokens (TBD, TODO, FIXME, NEEDS CLARIFICATION), unchecked tasks, required sections (Clarifications, Open Questions, User Confirmation, Acceptance Criteria), and user approval checkbox. On gate pass, updates the flow-state gate step to done.

#### sdd-forge spec guardrail

Manages the project guardrail file (`.sdd-forge/guardrail.md`) containing immutable design principles.

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update --agent claude
```

`init` generates guardrail.md from the preset hierarchy (base → arch → leaf) with language fallback. `update` uses AI to propose additional project-specific articles based on analysis.json, appending them to the existing file.

#### sdd-forge flow start

Runs the complete SDD flow: spec init → gate check → forge. This is the primary entry point for starting a new feature development cycle.

```
sdd-forge flow start --request "add login feature"
sdd-forge flow start --request "refactor auth" --forge-mode agent --worktree
sdd-forge flow start --request "fix bug" --spec specs/042-fix/spec.md
```

| Option | Description |
|---|---|
| `--request <text>` | Feature request description (required) |
| `--title <title>` | Custom title for branch/spec naming |
| `--spec <path>` | Use existing spec instead of creating a new one |
| `--agent <agent>` | Override default agent |
| `--max-runs <n>` | Maximum forge iterations (default: 5) |
| `--forge-mode <mode>` | Forge execution mode: `local`, `assist`, or `agent` |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree for isolation |
| `--dry-run` | Simulate the flow without executing |

If gate fails, the command exits with code 2 and displays up to 8 gate failure reasons. When user confirmation is missing, specific instructions for approval are shown.

#### sdd-forge flow status

Displays or updates the current SDD flow progress. Without options, shows a formatted status display including spec path, branches, step progress, and requirements.

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["implement auth", "add tests", "update docs"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --check impl
sdd-forge flow status --archive
```

| Option | Description |
|---|---|
| `--step <id> --status <val>` | Update a step's status |
| `--summary <json>` | Set requirements list (JSON array of strings) |
| `--req <index> --status <val>` | Update a specific requirement's status |
| `--request <text>` | Set the original user request text |
| `--note <text>` | Append a decision or memo note |
| `--check <phase>` | Check prerequisites for a phase (e.g., `impl` requires gate and test) |
| `--archive` | Copy flow.json to spec directory and clear active flow |
| `--dry-run` | With `--check`: always exit 0 |

Valid step IDs are defined in `FLOW_STEPS` and include: approach, branch, spec, gate, test, implement, review, finalize, merge, branch-cleanup, archive.

#### sdd-forge flow resume

Outputs a structured context summary for resuming work after context compaction. Reads flow.json and spec.md to reconstruct the current workflow state.

```
sdd-forge flow resume
```

Output includes: Request, Current Progress (phase, step completion, branch info), Spec Summary (Goal and Scope sections), Requirements checklist, Notes, and Next Action with the appropriate skill command to continue.

#### sdd-forge flow review

Runs a two-phase AI-powered code quality review on changes from the feature branch.

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Show proposals without applying changes |
| `--skip-confirm` | Skip initial confirmation prompt |

The draft phase generates improvement proposals focusing on duplicate code, naming, dead code, design patterns, and simplification. The final phase validates each proposal conservatively. Results are written to `review.md` in the spec directory with APPROVED/REJECTED verdicts.

#### sdd-forge flow merge

Squash-merges the feature branch into the base branch. Strategy is auto-detected from flow.json.

```
sdd-forge flow merge
sdd-forge flow merge --dry-run
```

Three modes: spec-only (skip when featureBranch equals baseBranch), worktree (merge via `git -C mainRepoPath`), and branch (checkout base → merge --squash → commit).

#### sdd-forge flow cleanup

Deletes the feature branch and/or worktree after merge. Strategy is auto-detected from flow.json.

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

Three modes: spec-only (no cleanup needed), worktree (`git worktree remove` + `git branch -D`), and branch (`git branch -D` only).

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| Exit Code | Meaning | Used By |
|---|---|---|
| `0` | Successful completion or help text displayed | All commands |
| `1` | General error — missing arguments, unknown command, configuration error, review failure, prerequisite check failure | `sdd-forge.js`, `docs.js`, `spec.js`, `flow.js`, `review`, `status --check`, dispatchers |
| `2` | Gate check failure — spec has unresolved items or failed guardrail compliance | `flow start` (gate failure) |

**stdout conventions:**

- Command results, generated content, and status displays are written to stdout.
- `--dry-run` mode outputs the content that would be written to files.
- `--stdout` mode (scan) outputs JSON data directly to stdout.
- `flow resume` outputs the context summary to stdout for piping.

**stderr conventions:**

- Progress indicators, step labels (e.g., `[scan]`, `[enrich]`, `[forge]`), and warnings (`WARN:`) are written to stderr.
- Help text for dispatchers (docs, spec, flow) is written to stderr when no subcommand is provided.
- Agent progress tickers (dots) are written to stderr during long-running AI calls.
- Error messages prefixed with `[build] ERROR:` or command-specific labels are written to stderr.

**Output formatting:**

- The `createLogger()` utility provides namespace-prefixed logging (e.g., `[init]`, `[agents]`).
- The `createProgress()` utility renders a weighted progress bar during the `build` pipeline with step labels and optional verbose output.
- Flow status display uses Unicode box-drawing characters (`────`) and status icons (`✓` done, `>` in_progress, `-` skipped).

<!-- {{/text}} -->
