# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 30 CLI commands organized into five namespaces: Project, Docs, Spec, Flow, and Info. Commands follow a three-level dispatch architecture (`sdd-forge <namespace> <subcommand>`) where the entry point (`sdd-forge.js`) routes to namespace dispatchers (`docs.js`, `spec.js`, `flow.js`), which in turn route to individual command implementations.

<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display all available commands with descriptions | — |
| `sdd-forge setup` | Interactive setup wizard; registers project and generates `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--purpose`, `--tone`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills) to match the installed sdd-forge version | `--dry-run` |
| `sdd-forge docs build` | Run the full documentation pipeline (scan → enrich → init → data → text → readme → agents → translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Analyze source code and generate `analysis.json` | — |
| `sdd-forge docs enrich` | Enrich analysis entries with AI-generated roles, summaries, and chapter assignments | — |
| `sdd-forge docs init` | Resolve and merge templates from the preset inheritance chain into `docs/` | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files using analysis data | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files using AI generation | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from docs chapter files and templates | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven iterative documentation improvement with review feedback loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Quality check for chapter files (structure, directives, integrity) | — |
| `sdd-forge docs translate` | Translate default-language docs to other configured languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `change_log.md` from the `specs/` directory | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` with resolved directives and AI-refined PROJECT section | `--dry-run` |
| `sdd-forge spec init` | Create a numbered feature branch and spec directory with template files | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `sdd-forge spec gate` | Pre-implementation gate check for unresolved items and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Manage project guardrail articles (init, show, update) | `--force` |
| `sdd-forge spec lint` | Mechanical lint check of changed files against guardrail RegExp patterns | `--base` |
| `sdd-forge flow start` | Start an SDD flow: spec init → gate → forge pipeline | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update flow progress, steps, and requirements | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--issue`, `--check`, `--list`, `--all`, `--dry-run` |
| `sdd-forge flow resume` | Output a context summary for resuming a flow after compaction | — |
| `sdd-forge flow review` | Code quality review with draft → final → apply phases | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | Squash-merge feature branch or create a GitHub PR | `--dry-run`, `--pr`, `--auto` |
| `sdd-forge flow cleanup` | Delete feature branch, worktree, and `.active-flow` entry | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |

<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

The following options are recognized across most commands via the shared `parseArgs()` utility in `lib/cli.js`:

| Option | Description |
| --- | --- |
| `--help`, `-h` | Display help text for the current command and exit |
| `--dry-run` | Preview what the command would do without writing any files or executing side effects |
| `--verbose`, `-v` | Enable detailed log output (supported by `build`, `forge`, and other pipeline commands) |

The top-level entry point (`sdd-forge.js`) also accepts:

| Option | Description |
| --- | --- |
| `-v`, `--version`, `-V` | Print the package version and exit |
| `-h`, `--help` | Display the full command list (equivalent to `sdd-forge help`) |

Note that `--dry-run` behavior varies by command: documentation commands skip file writes while still performing analysis, flow commands display the git and shell commands that would be executed, and review commands output results to stdout without modifying state.

<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge setup

Interactive setup wizard that registers a project and generates `.sdd-forge/config.json`. Creates the required directory structure (`.sdd-forge/`, `docs/`, `specs/`), configures preset type, output languages, document style, and agent settings. Supports both interactive (wizard) and non-interactive modes.

```
sdd-forge setup
sdd-forge setup --name myapp --type webapp --lang en --agent claude
```

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--work-root <path>` | Working root (defaults to source path) |
| `--type <type>` | Preset type (e.g. `cli`, `webapp`, `cakephp2`) |
| `--purpose <purpose>` | Document purpose (`user-guide` or `developer`) |
| `--tone <tone>` | Writing tone (`polite`, `formal`, `casual`) |
| `--agent <agent>` | Default AI agent name |
| `--lang <lang>` | Interface language code |
| `--dry-run` | Show configuration without writing files |

#### sdd-forge upgrade

Upgrades template-derived files (skills, agent config templates) to match the currently installed sdd-forge version. Safe to run repeatedly — only overwrites template-managed content. Does not modify `config.json`.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge docs build

Runs the full documentation generation pipeline in sequence: scan → enrich → init → data → text → readme → agents → translate. The `enrich` and `text` steps require a configured AI agent; if absent, they are skipped with a warning. The `--regenerate` flag skips `init` and assumes existing chapter files in `docs/`.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during init; regenerate text directives |
| `--regenerate` | Skip init step, use existing docs structure |
| `--verbose` | Show detailed progress for each pipeline step |
| `--dry-run` | Preview pipeline without writing files |

#### sdd-forge docs scan

Analyzes source code and generates `analysis.json` in `.sdd-forge/output/`. This is the first step of the documentation pipeline and provides the data foundation for all subsequent commands.

#### sdd-forge docs enrich

Enriches analysis entries by calling an AI agent to assign roles, summaries, details, and chapter classifications to each source file. Requires a configured agent.

#### sdd-forge docs init

Resolves templates from the preset inheritance chain (bottom-up) and writes chapter files to `docs/`. Performs AI-based chapter selection when an agent is configured, filtering out chapters whose topics have no data in the analysis. If `config.chapters` is defined, it takes precedence over AI selection.

```
sdd-forge docs init --type cli --force
sdd-forge docs init --lang ja --dry-run
```

| Option | Description |
| --- | --- |
| `--type <type>` | Override preset type |
| `--lang <lang>` | Output language |
| `--docs-dir <path>` | Custom docs directory |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

#### sdd-forge docs data

Resolves `{{data}}` directives in chapter files by calling DataSource methods through the preset-chain resolver. Skips `{{text}}` directives (counted but not processed). Only writes files that have actual changes.

```
sdd-forge docs data
sdd-forge docs data --stdout --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show changes without writing |
| `--stdout` | Print change summaries to stdout |
| `--docs-dir <path>` | Custom docs directory |

#### sdd-forge docs text

Fills `{{text}}` directives in chapter files using an AI agent. Requires a configured agent.

#### sdd-forge docs readme

Generates `README.md` from the preset template chain, resolving `{{data}}` and `{{text}}` directives. Performs diff checking and skips writing when content is unchanged.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| Option | Description |
| --- | --- |
| `--lang <lang>` | Output language |
| `--output <path>` | Custom output path |
| `--dry-run` | Preview without writing |

#### sdd-forge docs forge

Iterative AI-driven documentation improvement. Runs in a loop: AI updates docs → review checks quality → feedback drives next round. Supports three modes: `local` (manual), `assist`, and `agent` (fully automated). In `agent` mode with `systemPromptFlag`, files are processed in parallel with configurable concurrency.

```
sdd-forge docs forge --prompt "improve CLI docs" --mode agent
sdd-forge docs forge --spec specs/001-feature/spec.md --max-runs 5
```

| Option | Description |
| --- | --- |
| `--prompt <text>` | Improvement prompt |
| `--prompt-file <path>` | Read prompt from file |
| `--spec <path>` | Spec file for context |
| `--max-runs <n>` | Maximum iteration rounds (default: 3) |
| `--review-cmd <cmd>` | Custom review command (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--verbose` | Show agent output in real time |
| `--dry-run` | Preview without executing |

#### sdd-forge docs review

Quality check for documentation chapter files. Validates minimum line count (15 lines), H1 heading presence, unfilled `{{text}}` and `{{data}}` directives, output integrity (exposed directives, broken HTML comments, residual block directives), `analysis.json` existence, and `README.md` existence. Also checks multi-language directories when configured. Throws an error on failure, which is used by `forge` for its feedback loop.

#### sdd-forge docs translate

Translates default-language documents to other configured languages using AI. Compares file modification times and only re-translates when the source is newer than the target. Translation prompts include formatting preservation rules and quality guidelines (natural grammar, minimal loanwords, cultural conventions).

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Show which files would be translated |

#### sdd-forge docs changelog

Scans `specs/` directories and generates `change_log.md` with a Latest Index table (series, latest spec, status) and an All Specs table (directory, status, created date, title, summary, linked files). Preserves existing MANUAL blocks. Directory names are parsed for series and backup information (e.g., `001-feature`, `bak.001-feature`).

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Generates or updates `AGENTS.md` by resolving `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives. The PROJECT section is refined by an AI agent using generated docs, `package.json` scripts, and project configuration as context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge spec init

Creates a numbered feature branch and `specs/` directory with `spec.md` and `qa.md` template files. Supports three modes: worktree (isolated git worktree), branch (new branch), and spec-only (no branch creation). Auto-detects the next available sequence number from both `specs/` directories and `feature/` branches.

```
sdd-forge spec init --title "add-login"
sdd-forge spec init --title "refactor-auth" --worktree
sdd-forge spec init --title "fix-bug" --no-branch --allow-dirty
```

| Option | Description |
| --- | --- |
| `--title <title>` | Feature title (required); slugified for branch/directory names |
| `--base <branch>` | Base branch (defaults to current branch) |
| `--no-branch` | Create spec files only, no branch |
| `--worktree` | Create a git worktree for isolated development |
| `--allow-dirty` | Allow uncommitted changes in the working tree |
| `--dry-run` | Preview without creating files or branches |

#### sdd-forge spec gate

Pre-implementation gate check that detects unresolved items in a spec file: unresolved tokens (`[NEEDS CLARIFICATION]`, `TBD`, `TODO`, `FIXME`), unchecked tasks, missing required sections (`Clarifications`, `Open Questions`, `User Confirmation`, `Acceptance Criteria`), and unapproved User Confirmation. Optionally runs AI-powered guardrail compliance checking against project guardrail articles.

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| Option | Description |
| --- | --- |
| `--spec <path>` | Path to spec file (required) |
| `--phase <phase>` | Check phase: `pre` (default) or `post` |
| `--skip-guardrail` | Skip AI guardrail compliance check |

#### sdd-forge spec guardrail

Manages project guardrail articles (immutable principles for spec compliance). Supports `init` (generate `.sdd-forge/guardrail.md` from preset templates), `show` (display merged articles), and `update` (propose new articles via AI). Articles use `{%guardrail%}` block syntax with metadata for phase, scope, and lint patterns.

#### sdd-forge spec lint

Mechanically checks changed files against guardrail articles that have `phase: [lint]` and a `lint` RegExp pattern. Uses `git diff --name-only` to identify changed files, then applies each pattern line-by-line with scope matching.

```
sdd-forge spec lint --base main
```

| Option | Description |
| --- | --- |
| `--base <branch>` | Base branch for git diff (required) |

#### sdd-forge flow start

Starts a complete SDD flow by running the spec init → gate → forge pipeline. Requires `--request` to describe the feature. Automatically derives a title, creates the spec, checks the gate, saves flow state, and launches the forge process.

```
sdd-forge flow start --request "add user authentication"
sdd-forge flow start --request "fix pagination bug" --worktree --forge-mode agent
```

| Option | Description |
| --- | --- |
| `--request <text>` | Feature request description (required) |
| `--title <title>` | Override auto-derived title |
| `--spec <path>` | Use existing spec instead of creating one |
| `--agent <name>` | Override default agent |
| `--max-runs <n>` | Maximum forge iterations (default: 5) |
| `--forge-mode <mode>` | Forge mode: `local`, `assist`, or `agent` |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree for isolation |
| `--dry-run` | Preview without executing |

#### sdd-forge flow status

Displays or updates flow progress. Without options, shows the current flow's spec, branches, steps (with ✓/>/- icons), and requirements. Supports updating individual steps, setting requirements via JSON, appending notes, and linking GitHub issues.

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["implement auth", "add tests"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --list
sdd-forge flow status --all
```

| Option | Description |
| --- | --- |
| `--step <id> --status <val>` | Update a step's status |
| `--summary '<JSON>'` | Set requirements list as JSON array of strings |
| `--req <index> --status <val>` | Update a specific requirement's status |
| `--request <text>` | Set the original user request text |
| `--note <text>` | Append a decision or memo note |
| `--issue <number>` | Link a GitHub Issue number |
| `--check <phase>` | Check prerequisites for a phase (`impl`, `finalize`) |
| `--list` | List active (in-progress) flows |
| `--all` | List all specs including completed ones |

#### sdd-forge flow resume

Outputs a context summary for resuming a flow after context compaction. Reconstructs the current state from `flow.json` and `spec.md`, including request, progress, spec summary (Goal/Scope), requirements checklist, notes, and suggested next action with the appropriate skill name.

```
sdd-forge flow resume
```

#### sdd-forge flow review

Code quality review with three phases: draft (AI generates improvement proposals), final (AI validates proposals as APPROVED/REJECTED), and apply (approved changes are applied). Reviews the git diff of files listed in the spec's Scope section, falling back to the full branch diff.

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Show proposals without applying |
| `--skip-confirm` | Skip initial confirmation prompt |

#### sdd-forge flow merge

Merges the feature branch back into the base branch. Supports three routes: squash merge (default for branch and worktree modes), PR creation (`--pr`), and auto-detection (`--auto`, which selects PR if `commands.gh=enable` is configured and `gh` CLI is available).

```
sdd-forge flow merge
sdd-forge flow merge --pr
sdd-forge flow merge --auto --dry-run
```

| Option | Description |
| --- | --- |
| `--pr` | Create a GitHub pull request instead of squash merge |
| `--auto` | Auto-detect: PR if gh is configured and available, otherwise squash |
| `--dry-run` | Show commands without executing |

#### sdd-forge flow cleanup

Deletes the feature branch, worktree (if applicable), and `.active-flow` entry. Auto-detects the mode: spec-only (no cleanup needed), worktree (removes worktree then branch), or branch (deletes branch only). The `flow.json` file in `specs/` is preserved.

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

#### sdd-forge presets list

Displays the preset inheritance tree showing all available presets, their parent relationships, aliases, scan keys, and template directory availability. Uses tree-drawing characters (├──/└──) for visual hierarchy.

```
sdd-forge presets list
```

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Meaning | Used By |
| --- | --- | --- |
| `0` | Success or help displayed | All commands |
| `1` | General error: missing arguments, invalid configuration, no active flow, failed checks, review failures, unknown subcommand | Most commands (`sdd-forge.js`, `spec.js`, `flow.js`, `docs.js`, `review.js`, `status.js`, `lint.js`, `gate.js`) |
| `2` | Gate check failed with actionable feedback (e.g., user confirmation required) | `flow start` (when gate fails) |

**stdout/stderr conventions:**

| Stream | Content |
| --- | --- |
| `stdout` | Primary command output: generated content, status displays, help text, `--dry-run` previews, `flow resume` summaries, `presets list` tree |
| `stderr` | Progress indicators, warnings (`WARN:`), error messages, pipeline step labels (e.g., `[data]`, `[init]`, `[forge]`), agent activity dots, lint violations (`FAIL:`) |

Commands use the `createLogger()` utility for prefixed log output (e.g., `[data]`, `[readme]`, `[agents]`). The `--verbose` flag enables additional detail via `logger.verbose()`. Pipeline commands (`docs build`) use `createProgress()` for weighted step-based progress display. Agent invocations in `forge` show a dot-based ticker on stderr during execution unless `--verbose` is active, in which case agent stdout/stderr is streamed directly.

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
