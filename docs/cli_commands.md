# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge provides 25 CLI commands organized into four namespaces — `docs`, `spec`, `flow`, and top-level project commands — all routed through a three-level dispatch architecture (`sdd-forge.js` → namespace dispatcher → command implementation). Each command supports `--help` for usage information and follows consistent option conventions across the tool.

<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display all available commands with section-grouped layout | — |
| `sdd-forge setup` | Interactive setup wizard for project registration and config generation | `--name`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--path`, `--work-root`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills, AGENTS.md SDD section) to match installed version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree in a formatted tree view | — |
| `sdd-forge docs build` | Run the full docs pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Collect source files via glob patterns and generate analysis.json | `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | Add AI-generated summary/detail/chapter/role metadata to analysis entries | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Resolve template inheritance chain and initialize chapter files in docs/ | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files using DataSource resolvers | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files using AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate README.md from template with directive resolution | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative docs improvement loop with AI agent and review feedback | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Quality-check chapter files for structure, directives, and output integrity | — |
| `sdd-forge docs translate` | Translate default-language documents to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Scan specs/ directory and generate change_log.md | `--dry-run` |
| `sdd-forge docs agents` | Update AGENTS.md by resolving directives and refining PROJECT section with AI | `--dry-run` |
| `sdd-forge docs snapshot` | Create a snapshot of current documentation state | `--dry-run` |
| `sdd-forge spec init` | Create numbered feature branch and spec directory with template files | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Pre-implementation gate check for unresolved items and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Manage project guardrail (immutable design principles) | Subcommands: `init`, `update`; `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | Run full SDD flow: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update flow progress, requirements, and notes | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--check`, `--archive`, `--dry-run` |
| `sdd-forge flow resume` | Output context summary for resuming after compaction | — |
| `sdd-forge flow review` | AI-powered code quality review with draft → final validation phases | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | Squash-merge feature branch into base branch | `--dry-run` |
| `sdd-forge flow cleanup` | Delete feature branch and/or worktree after flow completion | `--dry-run` |

<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following options are recognized at the top level or shared across multiple commands via the `parseArgs()` utility in `src/lib/cli.js`:

| Option | Description |
|---|---|
| `-h`, `--help` | Display help text for the current command or subcommand. Available on every command and dispatcher. |
| `-v`, `--version`, `-V` | Print the sdd-forge package version and exit. Handled at the top-level entry point (`sdd-forge.js`). |
| `--dry-run` | Simulate execution without writing files or making changes. Supported by most commands that perform writes (init, data, text, readme, translate, changelog, agents, forge, scan, setup, upgrade, spec init, flow start, flow merge, flow cleanup, flow status). |

The `parseArgs()` function processes `flags` (boolean switches prefixed with `--`) and `options` (key-value pairs). Flag names are converted from `--kebab-case` to `camelCase` internally (e.g., `--dry-run` becomes `dryRun`, `--no-branch` becomes `noBranch`). Unrecognized arguments are collected in the `rest` array.

<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### sdd-forge help

Displays all available commands grouped into five sections: Project, Docs, Spec, Flow, and Info. Output includes the package version, usage line, and i18n-translated command descriptions with ANSI formatting.

```
sdd-forge help
```

#### sdd-forge setup

Interactive setup wizard that registers a project and generates `.sdd-forge/config.json`. In interactive mode, it prompts for language, project name, source path, architecture type, framework, documentation purpose, tone, and agent configuration. When all required options are provided via CLI flags, it runs in non-interactive mode.

```
sdd-forge setup
sdd-forge setup --name myapp --type webapp/cakephp2 --purpose developer --tone polite
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source directory path |
| `--work-root <path>` | Working root directory (defaults to source path) |
| `--type <type>` | Architecture type (e.g., `webapp/cakephp2`, `cli/node-cli`, `library`) |
| `--purpose <purpose>` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone <tone>` | Writing tone (`polite`, `formal`, `casual`) |
| `--agent <agent>` | Agent provider (`claude`, `codex`) |
| `--lang <lang>` | Interface language code |
| `--dry-run` | Show what would be created without writing |

Setup creates the `.sdd-forge/`, `docs/`, and `specs/` directories, generates `config.json`, initializes `AGENTS.md` and `CLAUDE.md`, and deploys skill templates.

#### sdd-forge upgrade

Upgrades template-derived files to match the currently installed sdd-forge version. Compares skill templates from the package with existing files and overwrites only when content differs. Also checks `config.json` for missing new settings and prints hints.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Displays the preset inheritance tree starting from `base`. Each node shows the preset key, label, axis, language, aliases, scan configuration keys, and whether a templates directory exists. The tree uses `├──`/`└──` connectors for hierarchy visualization.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the complete documentation generation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, with an optional `translate` step for multi-language configurations. Displays a progress bar with weighted steps. Skips `enrich` and `text` steps if no AI agent is configured.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during init |
| `--verbose` | Show detailed progress output |
| `--dry-run` | Simulate pipeline without writing files |

For multi-language projects, the pipeline either runs the `translate` command or re-executes `init` → `data` → `text` → `readme` per language, depending on the configured output mode.

#### sdd-forge docs scan

Collects source files using include/exclude glob patterns from the preset or config, dispatches them to DataSource `scan()` methods, and writes `analysis.json`. Supports incremental scanning: unchanged files (by hash) are reused from existing analysis, and enrichment metadata is preserved across re-scans.

```
sdd-forge docs scan
sdd-forge docs scan --stdout
```

| Option | Description |
|---|---|
| `--stdout` | Output analysis JSON to stdout instead of writing to file |
| `--dry-run` | Run scan without writing analysis.json |

#### sdd-forge docs enrich

Adds AI-generated metadata (`summary`, `detail`, `chapter`, `role`) to each entry in `analysis.json`. Processes entries in batches based on total line count (default 3000 lines per batch) or item count (default 20 items). Supports resume: entries that already have a `summary` field are skipped, and progress is saved after each batch.

```
sdd-forge docs enrich
```

| Option | Description |
|---|---|
| `--dry-run` | Run without saving to analysis.json |
| `--stdout` | Output enriched data to stdout |

#### sdd-forge docs init

Resolves the template inheritance chain (base → arch → leaf → project-local) using a bottom-up merge strategy, then writes chapter files to `docs/`. When an AI agent is configured and `config.chapters` is not defined, performs AI-based chapter selection to exclude irrelevant chapters based on analysis data.

```
sdd-forge docs init
sdd-forge docs init --type cli/node-cli --force
```

| Option | Description |
|---|---|
| `--type <type>` | Override the architecture type |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Show what would be written without creating files |

#### sdd-forge docs data

Resolves `{{data}}` directives in chapter files by invoking DataSource resolvers against `analysis.json`. Each directive specifies a source and method (e.g., `{{data: project.structure}}`), and the resolver generates the corresponding Markdown content.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Fills `{{text}}` directives in chapter files using an AI agent. Each directive contains an instruction prompt; the agent reads the analysis data and surrounding context to generate appropriate prose. Processes directives in batches with concurrency control.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

Generates `README.md` from a preset template by resolving `{{data}}` and `{{text}}` directives. Supports language-specific output, template translation via AI fallback, and custom output paths. Performs a diff check and skips writing if content is unchanged.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| Option | Description |
|---|---|
| `--lang <lang>` | Target language for README generation |
| `--output <path>` | Custom output file path |
| `--dry-run` | Print generated README to stdout |

#### sdd-forge docs forge

Iteratively improves documentation by combining AI agent generation with automated review. Runs up to `maxRuns` rounds: each round invokes the AI agent to update chapter files, then runs the review command. Failed files are fed back to the next round. Supports three modes: `local` (review feedback only), `assist` (agent with local fallback), and `agent` (agent required).

```
sdd-forge docs forge --prompt "improve overview section" --mode agent
sdd-forge docs forge --spec specs/042-feature/spec.md --max-runs 5
```

| Option | Description |
|---|---|
| `--prompt <text>` | Improvement instruction for the AI agent |
| `--prompt-file <path>` | Read prompt from a file |
| `--spec <path>` | Spec file to use for scope estimation |
| `--max-runs <n>` | Maximum iteration rounds (default: 3) |
| `--review-cmd <cmd>` | Custom review command (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--verbose` | Show detailed agent output |
| `--dry-run` | Simulate without writing changes |

#### sdd-forge docs review

Validates chapter files for documentation quality. Checks minimum line count (15 lines), H1 heading presence, unfilled `{{text}}` and `{{data}}` directives, output integrity (exposed directives, broken HTML comments, residual block directives), analysis.json existence, and README.md existence. For multi-language projects, validates non-default language directories as well.

```
sdd-forge docs review
sdd-forge docs review docs/ja
```

#### sdd-forge docs translate

Translates default-language documents to configured non-default languages using AI. Compares source and target file modification times to perform differential translation — only files where the source is newer are re-translated. Generates language-appropriate system prompts with tone instructions (e.g., です/ます style for Japanese).

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Show which files would be translated |

#### sdd-forge docs changelog

Scans the `specs/` directory for `spec.md` files and generates `change_log.md` with two tables: a latest-per-series index and a full spec listing. Extracts title, creation date, status, branch name, and input/scope from each spec. Preserves existing MANUAL blocks between `AUTO-GEN:START` and `AUTO-GEN:END` markers.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Updates `AGENTS.md` by resolving `{{data: agents.sdd}}` and `{{data: agents.project}}` directives. The SDD section is template-generated, while the PROJECT section is refined by an AI agent using generated docs, package.json scripts, and analysis data as context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge spec init

Creates a numbered feature branch and corresponding spec directory under `specs/`. Supports three branching strategies: default (git branch), `--worktree` (isolated git worktree), and `--no-branch` (spec files only). Writes `spec.md` and `qa.md` from templates and saves initial flow state to `flow.json`.

```
sdd-forge spec init --title "add-login-feature"
sdd-forge spec init --title "refactor-auth" --base development --worktree
```

| Option | Description |
|---|---|
| `--title <title>` | Feature title (required); used for branch name and directory naming |
| `--base <branch>` | Base branch to create feature branch from (defaults to current branch) |
| `--allow-dirty` | Skip worktree clean check |
| `--no-branch` | Create spec files without creating a new branch |
| `--worktree` | Create an isolated git worktree for the feature |
| `--dry-run` | Show what would be created without executing |

#### sdd-forge spec gate

Pre-implementation gate check that validates `spec.md` for completeness. Detects unresolved tokens (`TBD`, `TODO`, `FIXME`, `NEEDS CLARIFICATION`), unchecked tasks, missing required sections (`Clarifications`, `Open Questions`, `User Confirmation`, `Acceptance Criteria`), and unapproved user confirmation. Optionally runs AI-based guardrail compliance check.

```
sdd-forge spec gate --spec specs/042-feature/spec.md
sdd-forge spec gate --spec specs/042-feature/spec.md --phase post --skip-guardrail
```

| Option | Description |
|---|---|
| `--spec <path>` | Path to spec.md (required) |
| `--phase <phase>` | `pre` (default) skips status/acceptance unchecked items; `post` checks everything |
| `--skip-guardrail` | Skip AI guardrail compliance check |

#### sdd-forge spec guardrail

Manages the project guardrail file (`.sdd-forge/guardrail.md`). The `init` subcommand generates a guardrail from preset templates with layer merging (base → arch → leaf). The `update` subcommand uses an AI agent to propose additional project-specific articles based on analysis data.

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update --agent claude
```

#### sdd-forge flow start

Orchestrates the full SDD flow: runs `spec init` to create a branch and spec, executes `spec gate` to validate the spec, and launches `docs forge` for iterative documentation improvement. Saves flow state to `flow.json` after gate success.

```
sdd-forge flow start --request "add user authentication"
sdd-forge flow start --request "refactor API" --forge-mode agent --worktree
```

| Option | Description |
|---|---|
| `--request <text>` | Feature request description (required) |
| `--title <title>` | Branch/spec title (auto-derived from request if omitted) |
| `--spec <path>` | Use existing spec instead of creating a new one |
| `--agent <name>` | Agent to use for forge step |
| `--max-runs <n>` | Maximum forge iterations (default: 5) |
| `--forge-mode <mode>` | `local`, `assist`, or `agent` |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree for isolation |
| `--dry-run` | Simulate the entire flow |

#### sdd-forge flow status

Displays or updates flow progress. Without options, prints a formatted status view showing spec path, branches, step progress (with ✓/>/-/space icons), and requirement checklist. With update options, modifies flow state in `flow.json`.

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
| `--step <id> --status <val>` | Update a step's status (valid steps: approach, branch, spec, gate, test, impl, review, finalize, merge, branch-cleanup, archive) |
| `--summary <JSON>` | Set the requirements list as a JSON array of strings |
| `--req <index> --status <val>` | Update a specific requirement's status by index |
| `--request <text>` | Set the original user request text |
| `--note <text>` | Append a decision or memo note |
| `--check <phase>` | Check prerequisites for a phase (e.g., `impl` requires `gate` and `test` done) |
| `--archive` | Copy flow.json to spec directory and clear active flow |
| `--dry-run` | With `--check`: always exit 0 regardless of result |

#### sdd-forge flow resume

Outputs a structured context summary for resuming a flow after context compaction. Reads `flow.json` and `spec.md` to reconstruct the current phase, progress, spec goal/scope, requirements checklist, notes, and the recommended next action with the appropriate skill name.

```
sdd-forge flow resume
```

#### sdd-forge flow review

Runs a two-phase AI code quality review. The draft phase generates improvement proposals (duplicate elimination, naming, dead code, design consistency, simplification). The final phase validates each proposal with APPROVED/REJECTED verdicts. Outputs `review.md` in the spec directory.

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Show proposals without applying changes |
| `--skip-confirm` | Skip initial confirmation prompt |

#### sdd-forge flow merge

Squash-merges the feature branch into the base branch. Auto-detects the strategy from `flow.json`: spec-only (skip), worktree (merge via `-C mainRepoPath`), or branch (checkout + merge). Updates the merge step in flow state on completion.

```
sdd-forge flow merge
sdd-forge flow merge --dry-run
```

#### sdd-forge flow cleanup

Deletes the feature branch and/or worktree after flow completion. Auto-detects the cleanup strategy from `flow.json`: spec-only (skip), worktree (`git worktree remove` + `git branch -D`), or branch (`git branch -D` only). Updates the branch-cleanup step in flow state.

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| Exit Code | Meaning | Used By |
|---|---|---|
| `0` | Success or help displayed | All commands |
| `1` | General error — missing arguments, unknown subcommand, config not found, review failures, prerequisites not met | All commands; `sdd-forge.js` (unknown command), dispatchers (unknown subcommand), `review` (quality check failures), `status --check` (prerequisites failed) |
| `2` | Gate check failed — spec has unresolved items or requires user approval | `flow start` (gate failure) |

**stdout conventions:**

- Command output (generated content, status displays, dry-run previews) is written to stdout.
- `scan --stdout` outputs the full analysis JSON to stdout.
- `changelog --dry-run`, `readme --dry-run`, and `agents --dry-run` output the generated content to stdout.
- `flow resume` outputs the context summary markdown to stdout.
- `flow status` (display mode) outputs the formatted status table to stdout.

**stderr conventions:**

- Progress messages, warnings, and step labels are written to stderr (e.g., `[scan]`, `[enrich]`, `[forge]` prefixed log lines).
- Help text for dispatchers (`docs`, `spec`, `flow`) when invoked without a subcommand is written to stderr.
- The `forge` command writes agent progress tickers (dots) to stderr.
- Warning messages use the pattern `[command] WARN: <message>` on stderr.
- Error messages use the pattern `[command] ERROR: <message>` or `Error: <message>` on stderr before exiting with a non-zero code.

<!-- {{/text}} -->
