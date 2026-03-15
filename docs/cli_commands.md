# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
sdd-forge provides 20+ commands organized into four namespaces (`docs`, `spec`, `flow`, and standalone commands) through a three-level dispatch architecture. The CLI entry point (`sdd-forge`) routes to namespace dispatchers, which in turn delegate to individual command implementations under `commands/` directories.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display all available commands grouped by section | — |
| `sdd-forge setup` | Interactive project setup wizard; generates `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills, etc.) to match installed version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline (scan→enrich→init→data→text→readme→agents→translate) | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Scan source code and generate `analysis.json` | — |
| `sdd-forge docs enrich` | AI-enrich analysis entries with summary, detail, chapter, and role metadata | `--agent`, `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Initialize chapter files from preset templates | `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | AI-fill `{{text}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs readme` | Auto-generate `README.md` from chapter files and templates | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | Iteratively improve docs via AI agent and review cycles | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Review generated documentation for quality issues | — |
| `sdd-forge docs translate` | Translate default-language docs to configured non-default languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate changelog from commit history | — |
| `sdd-forge docs agents` | Update AGENTS.md by resolving directives and AI-refining the PROJECT section | `--dry-run` |
| `sdd-forge docs snapshot` | Create a snapshot of current documentation state | — |
| `sdd-forge spec init` | Create a numbered feature branch and spec directory with templates | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Pre-implementation gate check on spec completeness and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Initialize or update project guardrail rules | Subcommands: `init`, `update`; `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | Run the full SDD flow (spec init → gate → forge) | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update SDD flow progress | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `sdd-forge flow review` | Run code quality review (draft → final → apply) after implementation | `--dry-run`, `--skip-confirm` |
<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
The following options are recognized at the top level or shared across most subcommands via the common `parseArgs` utility:

| Option | Description |
|---|---|
| `-h`, `--help` | Display help information for the current command or subcommand. Available on all commands. |
| `-v`, `--version`, `-V` | Print the installed sdd-forge version and exit. Handled at the top-level entry point. |
| `--dry-run` | Simulate the command without writing any files to disk. Supported by `build`, `init`, `data`, `text`, `readme`, `translate`, `agents`, `forge`, `setup`, `upgrade`, `spec init`, `flow start`, and `flow review`. |
| `--verbose` | Enable verbose output with detailed progress information. Supported by `build` and `forge`. |

Note: sdd-forge uses a custom `parseArgs` function (in `src/lib/cli.js`) that supports flag normalization (e.g., `--dry-run` → `dryRun`), option aliases (e.g., `-v` → `--verbose`), and default values. Each command declares its own accepted flags and options independently.
<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### sdd-forge help

Displays all available commands organized into sections: Project, Docs, Spec, Flow, and Info. Uses ANSI formatting for terminal output. Language is determined by `.sdd-forge/config.json` `lang` setting.

```
sdd-forge help
sdd-forge --help
sdd-forge -h
```

#### sdd-forge setup

Interactive wizard that registers a project and generates `.sdd-forge/config.json`. Prompts for project name, source path, output language, architecture type, document style, and default agent. Creates required directories (`.sdd-forge/output`, `docs`, `specs`), sets up `AGENTS.md`, `CLAUDE.md`, and skill templates.

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2
```

When all required options (`--name`, `--path`, `--type`, `--purpose`, `--tone`) are provided, the wizard runs non-interactively.

#### sdd-forge upgrade

Upgrades template-derived files to match the currently installed sdd-forge version. Compares skill templates in `src/templates/skills/` with `.agents/skills/` and overwrites changed files. Converts symlinks to real files if needed. Also checks `config.json` for missing settings and prints configuration hints.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Displays the preset inheritance tree in a visual tree format. Shows base, architecture, and leaf presets with their labels, aliases, and scan keys. Indicates which architecture layers have templates directories.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the full documentation generation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate` (if multi-language is configured). Displays a progress bar during execution. Steps that require an AI agent (`enrich`, `text`) are skipped if no `defaultAgent` is configured.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --dry-run
```

| Option | Description |
|---|---|
| `--agent` | Override the default agent for AI-powered steps |
| `--force` | Force regeneration of chapter files even if they exist |
| `--dry-run` | Simulate the pipeline without writing files |
| `--verbose` | Show detailed progress output |

#### sdd-forge docs enrich

Uses AI to annotate each entry in `analysis.json` with `summary`, `detail`, `chapter`, and `role` metadata. Processes entries in batches based on total line count (default: 3000 lines per batch) or item count (default: 20 items). Supports resume — previously enriched entries are skipped, and progress is saved after each batch.

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run --stdout
```

#### sdd-forge docs readme

Generates `README.md` from preset templates using bottom-up template resolution. Resolves `{{data}}` and `{{text}}` directives, strips block directives, and normalizes formatting. Supports multi-language output by switching `docsDir` to language-specific directories.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
sdd-forge docs readme --dry-run
```

#### sdd-forge docs forge

Iteratively improves documentation through AI agent and review cycles. Operates in three modes: `local` (default), `assist`, and `agent`. Pre-populates `{{data}}` placeholders and `{{text}}` directives from analysis before running the AI. Supports spec-based file targeting via keyword matching.

```
sdd-forge docs forge --prompt "improve API documentation"
sdd-forge docs forge --spec specs/001-feature/spec.md --mode agent
sdd-forge docs forge --max-runs 5 --review-cmd "sdd-forge docs review"
```

| Option | Description |
|---|---|
| `--prompt` | Improvement prompt for the AI agent |
| `--prompt-file` | Read prompt from a file |
| `--spec` | Path to spec file for scoped file targeting |
| `--max-runs` | Maximum iteration rounds (default: 3) |
| `--review-cmd` | Review command to run after each round (default: `sdd-forge docs review`) |
| `--mode` | Agent mode: `local`, `assist`, or `agent` |

#### sdd-forge docs translate

Translates default-language documentation to configured non-default languages using AI. Compares `mtime` of source and target files for differential translation. Respects `documentStyle.tone` settings for language-appropriate style (e.g., です/ます for Japanese polite tone).

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
sdd-forge docs translate --dry-run
```

#### sdd-forge docs agents

Updates `AGENTS.md` by resolving `{{data: agents.sdd}}` and `{{data: agents.project}}` directives. The PROJECT section is refined by AI using generated docs, `package.json` scripts, and the SDD section as context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge spec init

Creates a numbered feature branch and spec directory with `spec.md` and `qa.md` templates. Supports three modes: default (creates a git branch), `--worktree` (creates an isolated git worktree), and `--no-branch` (spec files only). Automatically detects the next available sequence number from existing specs and branches.

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login-feature" --base development --worktree
sdd-forge spec init --title "quick-fix" --no-branch --allow-dirty
```

#### sdd-forge spec gate

Pre-implementation gate check that verifies spec completeness. Detects unresolved tokens (`TBD`, `TODO`, `FIXME`, `NEEDS CLARIFICATION`), unchecked tasks, missing required sections (`Clarifications`, `Open Questions`, `User Confirmation`, `Acceptance Criteria`), and unapproved user confirmation checkboxes. Optionally runs AI-powered guardrail compliance checking.

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post
sdd-forge spec gate --spec specs/001-feature/spec.md --skip-guardrail
```

| Option | Description |
|---|---|
| `--spec` | Path to spec.md file (required) |
| `--phase` | `pre` (default) or `post` — pre phase skips Status/Acceptance Criteria unchecked items |
| `--skip-guardrail` | Skip guardrail AI compliance check |

#### sdd-forge spec guardrail

Manages project guardrail rules (immutable principles for spec compliance). The `init` subcommand generates `guardrail.md` from preset templates with language fallback. The `update` subcommand uses AI to propose additional project-specific articles based on `analysis.json`.

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force --dry-run
sdd-forge spec guardrail update --agent claude
```

#### sdd-forge flow start

Runs the complete SDD flow: spec init → gate check → forge. Requires `--request` to describe the feature or fix. Automatically creates a spec, inserts the request text, runs gate validation, saves flow state to `flow.json`, and launches the forge process.

```
sdd-forge flow start --request "add login feature"
sdd-forge flow start --request "fix pagination bug" --forge-mode agent --max-runs 5
sdd-forge flow start --request "refactor auth" --worktree
```

Gate failure exits with code 2 and displays unresolved items. If user confirmation is missing, specific instructions are shown.

#### sdd-forge flow status

Displays or updates SDD flow progress stored in `.sdd-forge/flow.json`. Without options, shows spec path, branch info, step progress (with ✓/>/- icons), and requirements checklist. Supports step updates, requirement management, and flow archival.

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["implement auth", "add tests", "update docs"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --archive
```

#### sdd-forge flow review

Post-implementation code quality review with three phases: draft (generate improvement proposals), final (AI validation of each proposal as APPROVED/REJECTED), and apply. Extracts review targets from spec `## Scope` section or falls back to full `git diff` against the base branch. Generates `review.md` in the spec directory with checkbox-formatted results.

```
sdd-forge flow review
sdd-forge flow review --dry-run
sdd-forge flow review --skip-confirm
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| Exit Code | Meaning | Used By |
|---|---|---|
| `0` | Success | All commands on successful completion |
| `1` | General error | Unknown subcommands, missing required options, missing config, runtime errors, build pipeline failures |
| `2` | Gate failure | `flow start` when `spec gate` check fails (unresolved items or missing user confirmation) |

**stdout/stderr conventions:**

| Stream | Content |
|---|---|
| `stdout` | Primary command output: generated content (`--dry-run` previews), status displays (`flow status`), spec file paths (`spec init`), tree displays (`presets list`), and help text |
| `stderr` | Progress indicators, step labels (e.g., `[draft] Generating proposals...`), warning messages (prefixed with `WARN:`), error messages (prefixed with `ERROR:`), and build pipeline progress bars |

Commands that support `--dry-run` write the would-be output to `stdout` while logging dry-run notices to `stderr`. The `forge` command uses `stderr` for progress tickers (dots printed at regular intervals during agent calls) and verbose agent output when `--verbose` is enabled. The `build` command uses a structured progress bar on `stderr` that tracks each pipeline step with weighted progress values.
<!-- {{/text}} -->
