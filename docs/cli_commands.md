# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge provides 20+ CLI commands organized into four namespaces — `docs`, `spec`, `flow`, and standalone commands — accessed through a three-level dispatch architecture (`sdd-forge.js` → dispatcher → command). All commands follow a consistent pattern of `sdd-forge <namespace> <subcommand> [options]`, with each subcommand supporting `--help` for usage details.

<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display all available commands grouped by section | — |
| `sdd-forge setup` | Interactive project setup wizard; generates `.sdd-forge/config.json` | `--name`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills, AGENTS.md SDD section) to the installed version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source files using DataSource-based pipeline and generate `analysis.json` | `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | AI-enrich `analysis.json` entries with summary, detail, chapter, and role metadata | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Merge preset template chain and output chapter files to `docs/` | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files using DataSource resolvers | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files using AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from template with `{{data}}` and `{{text}}` resolution | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative docs improvement loop combining AI agent and review | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Quality checks on chapter files: structure, directives, output integrity | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `change_log.md` from specs directory | `--dry-run` |
| `sdd-forge docs agents` | Update AGENTS.md by resolving `{{data}}` directives and AI-refining the PROJECT section | `--dry-run` |
| `sdd-forge spec init` | Create a numbered feature branch, spec directory, and template files | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Pre-implementation gate check on spec.md for unresolved items and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Manage project guardrail (immutable design principles) | Subcommands: `init`, `update`; `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | Start the SDD flow: spec init → gate → forge | `--request`, `--title`, `--spec`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update flow progress, requirements, and notes | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--check`, `--archive`, `--dry-run` |
| `sdd-forge flow resume` | Output a context summary for resuming after compaction | — |
| `sdd-forge flow review` | AI-driven code quality review: draft (propose) → final (validate) | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | Squash-merge feature branch into base branch | `--dry-run` |
| `sdd-forge flow cleanup` | Delete feature branch and/or worktree after flow completion | `--dry-run` |

<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following options are recognized at the top level or shared across most subcommands via the `parseArgs()` utility in `src/lib/cli.js`:

| Option | Description |
| --- | --- |
| `-h`, `--help` | Display usage information for the current command or subcommand. Every dispatcher and command handler checks for this flag and prints a localized help message. |
| `-v`, `--version`, `-V` | Print the sdd-forge package version and exit. Handled at the top-level entry point (`sdd-forge.js`) before any routing occurs. |
| `--dry-run` | Supported by nearly all commands. Prevents file writes and destructive operations, instead printing what would be done to stdout or stderr. |

The `parseArgs()` function processes `process.argv` with a declarative schema of `flags` (boolean switches), `options` (key-value pairs), `aliases` (short-to-long mappings), and `defaults`. It automatically maps `--kebab-case` flags to `camelCase` properties (e.g., `--dry-run` → `dryRun`, `--no-branch` → `noBranch`). The `--help` flag is always recognized and exposed as `cli.help`.

<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### sdd-forge help

Displays all available commands grouped into five sections: Project, Docs, Spec, Flow, and Info. Output includes the package version, a usage line, and ANSI-formatted command descriptions loaded via i18n.

```
sdd-forge help
```

#### sdd-forge setup

Interactive wizard that registers a project and generates `.sdd-forge/config.json`. Creates required directories (`.sdd-forge/`, `output/`, `docs/`, `specs/`), sets up `.gitignore` entries, generates AGENTS.md and CLAUDE.md templates, and deploys skill files. Non-interactive mode is available when all required options are provided.

```
sdd-forge setup
sdd-forge setup --name myapp --type webapp/laravel --purpose developer-guide --tone polite
```

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source directory path |
| `--work-root <path>` | Working root directory (defaults to source path) |
| `--type <type>` | Architecture type (e.g., `webapp/laravel`, `cli/node-cli`) |
| `--purpose <purpose>` | Documentation purpose: `developer-guide`, `user-guide`, `api-reference` |
| `--tone <tone>` | Writing tone: `polite`, `formal`, `casual` |
| `--agent <agent>` | Agent provider: `claude`, `codex` |
| `--lang <lang>` | Interface language code (e.g., `en`, `ja`) |
| `--dry-run` | Show what would be created without writing files |

#### sdd-forge upgrade

Upgrades template-derived files to match the currently installed sdd-forge version. Compares skill templates from the package against installed files and updates any that differ. Also checks `config.json` for missing recommended settings and prints hints.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show changes without applying |

#### sdd-forge presets list

Displays the preset inheritance tree starting from `base/`. Each node shows its label, axis, language, aliases, scan configuration keys, and whether it has a templates directory.

```
sdd-forge presets list
```

#### sdd-forge docs build

Orchestrates the full documentation generation pipeline. Steps are weighted for progress display: scan (1) → enrich (2) → init (1) → data (1) → text (3) → readme (1) → agents (1) → translate (2, if multi-language). Enrich and text steps are skipped when no agent is configured. In multi-language mode, either translates existing docs or regenerates per language depending on the output mode setting.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during init |
| `--verbose` | Show detailed progress output |
| `--dry-run` | Run pipeline without writing files |

#### sdd-forge docs scan

Collects source files using include/exclude glob patterns from preset or config, distributes them across DataSources via `match()`, and runs `scan()` on each. Supports incremental scanning: compares file hashes against existing `analysis.json` and skips unchanged categories. Preserves enrichment metadata (summary, detail, chapter, role) for files whose hashes have not changed.

```
sdd-forge docs scan
sdd-forge docs scan --stdout
```

| Option | Description |
| --- | --- |
| `--stdout` | Print analysis JSON to stdout instead of writing to file |
| `--dry-run` | Skip writing `analysis.json` |

#### sdd-forge docs enrich

Uses AI to add `summary`, `detail`, `chapter`, and `role` fields to each entry in `analysis.json`. Entries are batched by total line count (default 3000 lines per batch, max 20 items) and processed with resume support — completed batches are saved immediately, and already-enriched entries are skipped on re-run.

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Skip writing enriched data |
| `--stdout` | Print results to stdout |

#### sdd-forge docs init

Resolves the template inheritance chain (base → type → project-local) and outputs chapter files to `docs/`. When an AI agent is configured and `config.chapters` is not explicitly defined, uses AI to filter out irrelevant chapters based on analysis data and documentation purpose.

```
sdd-forge docs init
sdd-forge docs init --type webapp/laravel --force
```

| Option | Description |
| --- | --- |
| `--type <type>` | Override project type for template resolution |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Show output without writing files |

#### sdd-forge docs data

Resolves `{{data}}` directives in chapter files by invoking DataSource resolvers against `analysis.json`. Each directive specifies a source and method (e.g., `{{data: docs.chapters}}`), and the resolver returns formatted Markdown content.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Fills `{{text}}` directives in chapter files using an AI agent. Each directive contains an instruction prompt that guides the AI to generate documentation content based on the analysis data and surrounding context.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

Generates `README.md` from a preset template. Resolves `{{data}}` directives (including language switcher with relative path handling) and `{{text}}` directives. Performs diff checking against the existing README and skips writing if content is unchanged.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| Option | Description |
| --- | --- |
| `--lang <lang>` | Target language for template resolution |
| `--output <path>` | Custom output file path |
| `--dry-run` | Print generated content without writing |

#### sdd-forge docs forge

Iterative documentation improvement loop. Supports three modes: `local` (review feedback only, no agent), `assist` (agent with local fallback), and `agent` (agent required). Each round calls the AI agent to update docs, runs `docs review`, and feeds failures back for the next round. Supports per-file concurrent processing when `systemPromptFlag` is available.

```
sdd-forge docs forge --prompt "Improve error handling docs" --mode agent
sdd-forge docs forge --spec specs/042-feature/spec.md --max-runs 5
```

| Option | Description |
| --- | --- |
| `--prompt <text>` | Improvement instruction for the AI agent |
| `--prompt-file <path>` | Read prompt from a file |
| `--spec <path>` | Spec file for scoping relevant chapter files |
| `--max-runs <n>` | Maximum iteration rounds (default: 3) |
| `--review-cmd <cmd>` | Custom review command (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--dry-run` | Run without writing files |
| `--verbose` | Show agent stdout/stderr |

#### sdd-forge docs review

Validates documentation quality across all chapter files. Checks include: minimum line count (15 lines), H1 heading presence, unfilled `{{text}}` and `{{data}}` directives, exposed directives outside code blocks, broken HTML comments, residual block directives (`@block`, `@endblock`, `@extends`, `@parent`), `analysis.json` existence, and `README.md` existence. In multi-language mode, applies the same checks to non-default language directories.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### sdd-forge docs translate

Translates default-language documentation to non-default languages using AI. Uses mtime comparison for incremental translation — only re-translates files where the source is newer than the target. Tone instructions are adapted per target language (e.g., Japanese です/ます, である, or casual styles).

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Show what would be translated |

#### sdd-forge docs changelog

Scans the `specs/` directory and generates `change_log.md` with two tables: a latest-per-series index and a full spec listing. Parses `spec.md` files for title, creation date, status, branch, and input metadata. Preserves content outside `AUTO-GEN:START/END` markers.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Print output to stdout without writing |

#### sdd-forge docs agents

Updates AGENTS.md by resolving `{{data: agents.sdd}}` and `{{data: agents.project}}` directives. The PROJECT section is refined by an AI agent using generated docs, `package.json` scripts, and the SDD section as context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Print result without writing |

#### sdd-forge spec init

Creates a numbered feature branch and spec directory with template files (`spec.md`, `qa.md`). Supports three branching strategies: default (new branch via `git checkout -b`), worktree (isolated via `git worktree add`), and spec-only (no branch, files only). Writes initial flow state to `flow.json`.

```
sdd-forge spec init --title "add-login-feature"
sdd-forge spec init --title "refactor-auth" --base main --worktree
```

| Option | Description |
| --- | --- |
| `--title <title>` | Feature title (required); slugified for branch/directory naming |
| `--base <branch>` | Base branch (defaults to current HEAD) |
| `--no-branch` | Create spec files without a new branch |
| `--worktree` | Create an isolated git worktree |
| `--allow-dirty` | Skip clean worktree check |
| `--dry-run` | Show what would be created |

#### sdd-forge spec gate

Pre-implementation gate check that validates spec completeness. Detects unresolved tokens (TBD, TODO, FIXME, NEEDS CLARIFICATION), unchecked tasks, missing required sections (Clarifications, Open Questions, User Confirmation, Acceptance Criteria), and unapproved user confirmation. Optionally runs AI guardrail compliance checking.

```
sdd-forge spec gate --spec specs/042-feature/spec.md
sdd-forge spec gate --spec specs/042-feature/spec.md --phase post
```

| Option | Description |
| --- | --- |
| `--spec <path>` | Path to spec.md (required) |
| `--phase <phase>` | `pre` (default) skips status/acceptance unchecked items; `post` checks all |
| `--skip-guardrail` | Skip AI guardrail compliance check |

#### sdd-forge spec guardrail

Manages the project guardrail file (`.sdd-forge/guardrail.md`).

**init** subcommand: Generates guardrail from preset template chain (base → arch → leaf) with language fallback.

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
```

**update** subcommand: Uses AI to analyze the project and propose additional guardrail articles.

```
sdd-forge spec guardrail update
sdd-forge spec guardrail update --agent claude
```

#### sdd-forge flow start

Starts the full SDD flow by executing spec init → gate → forge in sequence. The `--request` option is required and provides the feature description. If gate fails, displays unresolved items and exits with code 2.

```
sdd-forge flow start --request "add user authentication"
sdd-forge flow start --request "refactor API layer" --forge-mode agent --worktree
```

| Option | Description |
| --- | --- |
| `--request <text>` | Feature request description (required) |
| `--title <title>` | Custom spec title (auto-derived from request if omitted) |
| `--spec <path>` | Use existing spec instead of creating a new one |
| `--agent <name>` | Override agent for forge step |
| `--max-runs <n>` | Maximum forge iterations (default: 5) |
| `--forge-mode <mode>` | Forge mode: `local`, `assist`, or `agent` |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree for isolation |
| `--dry-run` | Show what would be executed |

#### sdd-forge flow status

Displays current flow state or performs updates. Without options, prints a formatted status view showing spec path, branches, step progress, and requirements. Supports multiple mutation operations via options.

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["Implement login API", "Add tests"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --archive
```

| Option | Description |
| --- | --- |
| `--step <id>` | Step ID to update (used with `--status`) |
| `--status <val>` | New status value (`pending`, `in_progress`, `done`, `skipped`) |
| `--summary <json>` | Set requirements list as a JSON array of strings |
| `--req <index>` | Requirement index to update (used with `--status`) |
| `--request <text>` | Set the original user request text |
| `--note <text>` | Append a decision/memo note |
| `--check <phase>` | Check prerequisites for a phase (e.g., `impl` requires `gate` and `test` done) |
| `--archive` | Copy flow.json to spec directory and clear active flow |
| `--dry-run` | With `--check`: always exit 0 |

#### sdd-forge flow resume

Outputs a structured context summary for resuming a flow after context compaction. Reads `flow.json` and `spec.md` to reconstruct the current state, including request, progress, spec summary (Goal/Scope), requirements checklist, notes, and the recommended next action with the appropriate skill name.

```
sdd-forge flow resume
```

#### sdd-forge flow review

AI-driven code quality review in two phases. The draft phase generates improvement proposals (duplicate code, naming, dead code, design patterns, simplification). The final phase validates each proposal with a conservative APPROVED/REJECTED verdict. Results are written to `review.md` in the spec directory.

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show proposals without applying |
| `--skip-confirm` | Skip initial confirmation prompt |

#### sdd-forge flow merge

Squash-merges the feature branch into the base branch. Auto-detects the strategy from `flow.json`: spec-only (skip), worktree (merge via `-C mainRepoPath`), or branch (checkout + merge).

```
sdd-forge flow merge
sdd-forge flow merge --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show git commands without executing |

#### sdd-forge flow cleanup

Deletes the feature branch and/or worktree after flow completion. Strategy is auto-detected from `flow.json`: spec-only mode skips cleanup, worktree mode removes both the worktree and branch, branch mode deletes the branch only.

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show commands without executing |

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| Exit Code | Meaning | Used By |
| --- | --- | --- |
| `0` | Success or help displayed | All commands |
| `1` | General error: missing arguments, unknown subcommand, missing config, failed validation, no active flow, prerequisite check failure | `sdd-forge.js`, `docs.js`, `spec.js`, `flow.js`, `setup.js`, `review.js`, `status.js`, `start.js`, `gate.js` |
| `2` | Gate check failed — spec has unresolved items or unapproved confirmation | `flow start` (when gate fails) |

**stdout/stderr conventions:**

| Stream | Content |
| --- | --- |
| **stdout** | Primary command output: generated content (`--dry-run`, `--stdout`), status displays, success messages, `flow resume` context summary, `presets list` tree output |
| **stderr** | Progress indicators, step labels (`[scan]`, `[enrich]`, `[forge]`), warnings (`WARN:`), error messages (`ERROR:`), help text (when invoked without subcommand), agent progress tickers (`.` dots) |

Commands use a `createLogger(label)` utility that prefixes output with `[label]` for consistent identification. The `--verbose` flag (where supported) enables additional stderr output including agent stdout/stderr streams. The `docs build` pipeline uses a weighted progress bar displayed on stderr, with step labels shown as each phase begins and completes.

<!-- {{/text}} -->
