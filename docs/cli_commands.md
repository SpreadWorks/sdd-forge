<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 25 CLI commands organized into four namespaces — **docs** (12 subcommands), **spec** (4 subcommands), **flow** (6 subcommands), and **project** (2 top-level commands) — plus informational commands like `help` and `presets list`. The entry point `sdd-forge` routes top-level subcommands through a three-level dispatch architecture: `sdd-forge.js` → namespace dispatchers (`docs.js`, `spec.js`, `flow.js`) → individual command scripts under `commands/`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display all available commands with descriptions | — |
| `setup` | Interactive project setup wizard; generates `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Upgrade template-derived files (skills) to match installed sdd-forge version | `--dry-run` |
| `docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Analyze source code and generate `analysis.json` | — |
| `docs enrich` | AI-enrich analysis entries with roles, summaries, and chapter assignments | — |
| `docs init` | Initialize chapter files from preset templates | `--force`, `--dry-run` |
| `docs data` | Resolve `{{data}}` directives in chapter files using analysis data | `--dry-run`, `--stdout`, `--docs-dir` |
| `docs text` | Fill `{{text}}` directives with AI-generated prose | `--dry-run` |
| `docs readme` | Generate `README.md` from templates with directive resolution | `--lang`, `--output`, `--dry-run` |
| `docs forge` | AI-driven iterative documentation improvement with review feedback loop | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `docs review` | Quality-check chapter files for structure, directives, and integrity | — |
| `docs translate` | Translate default-language docs to configured target languages | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate `change_log.md` from specs directory | `--dry-run` |
| `docs agents` | Generate and update `AGENTS.md` with AI-refined project section | `--dry-run` |
| `spec init` | Create a numbered feature branch and spec directory with templates | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `spec gate` | Pre-implementation gate check for unresolved items and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | Manage guardrail articles (immutable project principles) | Subcommands: `init`, `show`, `update` |
| `spec lint` | Run guardrail lint patterns against changed files | `--base` |
| `flow start` | Start an SDD flow: spec init → gate → forge pipeline | `--request`, `--title`, `--spec`, `--forge-mode`, `--worktree`, `--dry-run` |
| `flow status` | Display or update flow progress, steps, and requirements | `--step`, `--status`, `--summary`, `--req`, `--check`, `--all`, `--list` |
| `flow resume` | Output context summary for resuming a flow after compaction | — |
| `flow review` | Code quality review: draft proposals → validate → apply | `--dry-run`, `--skip-confirm` |
| `flow merge` | Squash-merge feature branch or create a GitHub PR | `--pr`, `--auto`, `--dry-run` |
| `flow cleanup` | Delete feature branch, worktree, and `.active-flow` entry | `--dry-run` |
| `presets list` | Display the preset inheritance tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

The following options are recognized across multiple commands through the shared `parseArgs()` utility in `lib/cli.js`:

| Option | Description |
| --- | --- |
| `--dry-run` | Preview changes without writing to disk. Supported by nearly all commands that modify files or state. |
| `--help`, `-h` | Display command-specific usage information and exit. Available on every command and namespace dispatcher. |
| `--verbose`, `-v` | Enable detailed logging output. Used by `docs build` and `docs forge`. |

Namespace dispatchers (`docs`, `spec`, `flow`) display a subcommand list when invoked with no arguments or with `--help`. The top-level entry point supports `-v`, `--version`, and `-V` to print the package version.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge setup`

Interactive wizard that registers a project and generates `.sdd-forge/config.json`. Creates required directories (`.sdd-forge/`, `output/`, `docs/`, `specs/`), configures presets, languages, documentation style, and agent providers. Supports both interactive and non-interactive (all flags specified) modes.

```
sdd-forge setup [--name <name>] [--path <path>] [--work-root <dir>] [--type <preset>]
               [--purpose <text>] [--tone <text>] [--agent <provider>] [--lang <code>] [--dry-run]
```

| Option | Description |
| --- | --- |
| `--name` | Project name |
| `--path` | Source root path |
| `--work-root` | Working root (defaults to source path) |
| `--type` | Preset type (e.g., `node-cli`, `cakephp2`, `laravel`) |
| `--lang` | Interface language code |
| `--agent` | Default AI agent provider |
| `--dry-run` | Show generated config without writing |

#### `sdd-forge upgrade`

Upgrades template-derived files (skills, agent config sections) to match the currently installed sdd-forge version. Safe to run repeatedly — only overwrites template-managed content.

```
sdd-forge upgrade [--dry-run]
```

#### `sdd-forge docs build`

Executes the full documentation pipeline in order: scan → enrich → init → data → text → readme → agents → translate. Enrich and text steps require an AI agent configuration; they are skipped with a warning if no agent is set. Multi-language support runs translation or per-language pipelines for non-default languages.

```
sdd-forge docs build [--force] [--regenerate] [--verbose] [--dry-run]
```

| Option | Description |
| --- | --- |
| `--force` | Force overwrite of existing chapter files during init |
| `--regenerate` | Skip init step; assume existing chapter files |
| `--verbose` | Show detailed progress output |
| `--dry-run` | Preview all pipeline steps without writing |

#### `sdd-forge docs data`

Resolves `{{data}}` directives in chapter files by calling DataSource methods through the preset-chain resolver. Skips `{{text}}` directives (counted and logged). Only writes files that actually changed.

```
sdd-forge docs data [--dry-run] [--stdout] [--docs-dir <path>]
```

#### `sdd-forge docs readme`

Generates `README.md` from preset templates with full directive resolution. Resolves `{{data}}` directives first, then fills `{{text}}` directives via AI in per-directive mode. Performs a diff check and skips writing if content is unchanged.

```
sdd-forge docs readme [--lang <code>] [--output <path>] [--dry-run]
```

#### `sdd-forge docs forge`

Iteratively improves documentation using AI, with a review feedback loop. Supports three modes: `local` (manual), `assist`, and `agent` (AI-driven). In per-file mode, processes chapter files concurrently. Each round runs a review command; on failure, feedback is extracted and fed to the next round.

```
sdd-forge docs forge --prompt <text> [--spec <path>] [--max-runs <n>] [--mode local|assist|agent]
                     [--review-cmd <cmd>] [--verbose] [--dry-run]
```

| Option | Default | Description |
| --- | --- | --- |
| `--prompt` | — | Improvement instructions for the AI |
| `--spec` | — | Path to spec.md for context |
| `--max-runs` | 3 | Maximum review-feedback iterations |
| `--mode` | `local` | Execution mode (`local`, `assist`, `agent`) |
| `--review-cmd` | `sdd-forge docs review` | Command used for quality checks |

#### `sdd-forge docs review`

Validates chapter files for quality: minimum line count (15 lines), H1 heading presence, unfilled `{{text}}`/`{{data}}` directives, exposed directive syntax, broken HTML comments, and residual block directives. Also checks `analysis.json` and `README.md` existence, and validates multi-language directories.

```
sdd-forge docs review [<target-dir>]
```

#### `sdd-forge docs translate`

Translates default-language documents to non-default languages using AI. Compares mtime of source and target files; only re-translates when the source is newer. Respects `documentStyle.tone` for target-language writing style.

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

#### `sdd-forge docs changelog`

Scans `specs/` directories and generates `change_log.md` with a Latest Index table (per series) and an All Specs table. Preserves content outside the `AUTO-GEN:START/END` markers.

```
sdd-forge docs changelog [<output-path>] [--dry-run]
```

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` by resolving `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives. The PROJECT section is refined via AI using generated docs, package.json scripts, and project config as context.

```
sdd-forge docs agents [--dry-run]
```

#### `sdd-forge spec init`

Creates a numbered feature branch and spec directory with `spec.md` and `qa.md` templates. Supports three modes: worktree (isolated working copy), branch (new git branch), and spec-only (no branch creation). Automatically detects the next available sequence number from both `specs/` directories and `feature/` branches.

```
sdd-forge spec init --title <text> [--base <branch>] [--no-branch] [--worktree]
                    [--allow-dirty] [--dry-run]
```

#### `sdd-forge spec gate`

Pre-implementation gate check that detects unresolved tokens (`TBD`, `TODO`, `FIXME`), unchecked tasks, missing required sections (`Clarifications`, `Open Questions`, `User Confirmation`, `Acceptance Criteria`), and unapproved User Confirmation. Optionally runs AI-based guardrail compliance checking.

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

#### `sdd-forge spec lint`

Mechanically checks changed files (via `git diff`) against RegExp patterns defined in guardrail articles with `phase: [lint]`. Respects scope patterns for file targeting.

```
sdd-forge spec lint --base <branch>
```

#### `sdd-forge flow start`

Starts an SDD flow by running spec init → gate → forge in sequence. Requires `--request` to describe the feature. Saves flow state with steps and registers an active flow entry.

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>] [--forge-mode local|assist|agent]
                     [--max-runs <n>] [--worktree] [--no-branch] [--dry-run]
```

#### `sdd-forge flow status`

Displays detailed flow progress (steps with status icons, requirements checklist) or updates flow state. Supports listing active and all flows with `--list` and `--all`.

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --request <text>
sdd-forge flow status --note <text>
sdd-forge flow status --issue <number>
sdd-forge flow status --check <phase>
sdd-forge flow status --list | --all
```

#### `sdd-forge flow resume`

Outputs a context summary for resuming a flow after context compaction. Reads `flow.json` and `spec.md` to reconstruct the current state, including progress, spec summary, requirements, and the recommended next action skill.

```
sdd-forge flow resume
```

#### `sdd-forge flow review`

Runs a three-phase code quality review: draft (AI generates improvement proposals), final (senior reviewer validates each proposal as APPROVED/REJECTED), and apply (approved changes are applied). Outputs results to `review.md`.

```
sdd-forge flow review [--dry-run] [--skip-confirm]
```

#### `sdd-forge flow merge`

Completes a flow by squash-merging the feature branch or creating a GitHub PR. Auto-detects strategy with `--auto` (PR if `commands.gh=enable` and `gh` CLI is available).

```
sdd-forge flow merge [--pr] [--auto] [--dry-run]
```

#### `sdd-forge flow cleanup`

Deletes the feature branch and/or worktree, and removes the `.active-flow` entry. Auto-detects mode (worktree, branch, or spec-only) from flow state. The `flow.json` in `specs/` is preserved.

```
sdd-forge flow cleanup [--dry-run]
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Meaning |
| --- | --- |
| `0` | Command completed successfully |
| `1` | General error: missing arguments, unknown commands, failed validation, missing prerequisites, or lint violations detected |
| `2` | Gate check failed with actionable feedback (e.g., unapproved User Confirmation section in `flow start`) |

**stdout conventions:**

- Command output and generated content are written to stdout. Commands like `docs data --stdout`, `docs readme --dry-run`, and `docs changelog --dry-run` print the rendered document to stdout for preview.
- `flow resume` writes the context summary to stdout for consumption by AI agents.
- `spec init` outputs the created spec path in the format `created spec: <path>` (parsed by `flow start`).
- `flow status` and `flow status --list` print formatted status tables to stdout.

**stderr conventions:**

- Progress messages, warnings, and step-by-step logs are written to stderr (via `createLogger` and `console.error`).
- Help text for namespace dispatchers (`docs`, `spec`, `flow`) with no subcommand is written to stderr.
- Agent progress tickers (dots) during AI calls are written to stderr.
- Review warnings (e.g., unfilled directives, integrity issues) are written to stdout as structured check results, while the final `Error` throw propagates to the caller.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
