<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 30 CLI commands organized into four namespaces: `docs` (documentation generation), `spec` (specification management), `flow` (SDD workflow orchestration), and top-level project commands. The main entry point `sdd-forge` routes subcommands through namespace dispatchers (`docs.js`, `spec.js`, `flow.js`) or directly to independent scripts (`setup.js`, `upgrade.js`, `help.js`, `presets-cmd.js`).
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display all available commands and usage information | — |
| `setup` | Interactive project setup wizard; generates `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--lang`, `--dry-run` |
| `upgrade` | Upgrade template-derived files (skills, AGENTS.md) to match installed version | `--dry-run` |
| `presets list` | Display the preset inheritance tree | — |
| `docs build` | Run full pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan source code and generate `analysis.json` | — |
| `docs enrich` | AI-enrich analysis entries with roles, summaries, and chapter assignments | — |
| `docs init` | Initialize `docs/` chapter files from preset templates | `--type`, `--force`, `--dry-run` |
| `docs data` | Resolve `{{data}}` directives in chapter files using `analysis.json` | `--dry-run`, `--stdout`, `--docs-dir` |
| `docs text` | Fill `{{text}}` directives using AI agent | `--dry-run` |
| `docs readme` | Generate `README.md` from template with directive resolution | `--lang`, `--output`, `--dry-run` |
| `docs forge` | AI-driven iterative docs improvement with review feedback loop | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `docs review` | Quality check on chapter files (structure, directives, integrity) | — |
| `docs changelog` | Generate `change_log.md` from `specs/` directory | `--dry-run` |
| `docs agents` | Generate/update `AGENTS.md` with AI-refined PROJECT section | `--dry-run` |
| `docs translate` | Translate documentation to non-default languages | `--dry-run` |
| `spec init` | Create numbered feature branch and spec directory | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `spec gate` | Pre-implementation gate check on spec quality | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | Manage guardrail articles (init, update, show) | `--phase`, `--force` |
| `spec lint` | Mechanical lint check of changed files against guardrail patterns | `--base` |
| `flow start` | Automated SDD flow: spec init → gate → forge | `--request`, `--title`, `--forge-mode`, `--worktree`, `--dry-run` |
| `flow status` | Display or update flow progress, requirements, and notes | `--step`, `--status`, `--list`, `--all` |
| `flow resume` | Output context summary for resuming after compaction | — |
| `flow review` | AI code quality review (draft → final → approve) | `--dry-run`, `--skip-confirm` |
| `flow merge` | Squash merge or PR creation from flow state | `--pr`, `--auto`, `--dry-run` |
| `flow cleanup` | Remove worktree, branch, and `.active-flow` entry | `--dry-run` |
| `flow set step` | Update a workflow step's status | `<id> <status>` |
| `flow set req` | Update a single requirement's status | `<index> <status>` |
| `flow set summary` | Set requirements list from JSON array | `'<json-array>'` |
| `flow set request` | Set the user request text in `flow.json` | `"<text>"` |
| `flow set note` | Append a note to the notes array | `"<text>"` |
| `flow set issue` | Set the GitHub Issue number | `<number>` |
| `flow set metric` | Increment a metric counter | `<phase> <counter>` |
| `flow set redo` | Record a redo entry in `redolog.json` | `--step`, `--reason`, `--trigger` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

The following options are shared across multiple commands through the common `parseArgs` utility:

| Option | Type | Description |
| --- | --- | --- |
| `--dry-run` | flag | Preview changes without writing to disk. Supported by most commands that modify files. |
| `--help`, `-h` | flag | Display command-specific help message and exit. Available on all commands. |
| `--verbose`, `-v` | flag | Enable detailed logging output. Used by `docs build` and `docs forge`. |
| `--force` | flag | Overwrite existing files without confirmation. Used by `docs init` and `docs build`. |
| `--type` | string | Specify the project preset type (e.g., `node-cli`, `cakephp2`). Used by `docs init`. |
| `--lang` | string | Specify the output language code (e.g., `en`, `ja`). Used by `docs readme` and `setup`. |

All commands resolve the project root automatically using `repoRoot()`, which searches upward for `.sdd-forge/config.json` or falls back to environment variables (`SDD_SOURCE_ROOT`, `SDD_WORK_ROOT`).
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Displays all available commands grouped by section (Project, Docs, Spec, Flow, Info). Command descriptions are loaded via i18n.

```
sdd-forge help
sdd-forge --help
sdd-forge -h
```

#### `sdd-forge setup`

Interactive wizard that registers a project and generates `.sdd-forge/config.json`. Creates directory structure (`.sdd-forge/`, `docs/`, `specs/`), updates `.gitignore`, deploys skill files, and sets up `AGENTS.md`/`CLAUDE.md`.

| Option | Description |
| --- | --- |
| `--name <name>` | Project name (skips interactive prompt) |
| `--path <path>` | Source root path |
| `--work-root <path>` | Working root path (defaults to source root) |
| `--type <type>` | Preset type (e.g., `node-cli`, `webapp`) |
| `--lang <code>` | Language code |
| `--purpose <text>` | Documentation purpose |
| `--tone <text>` | Documentation tone |
| `--agent <name>` | Default agent provider |
| `--dry-run` | Preview without writing |

```
sdd-forge setup
sdd-forge setup --name myapp --type node-cli --lang en
```

#### `sdd-forge upgrade`

Upgrades template-derived files (skills, AGENTS.md SDD section) to match the currently installed sdd-forge version. Safe to run repeatedly.

| Option | Description |
| --- | --- |
| `--dry-run` | Show what would be updated without writing |

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `sdd-forge presets list`

Displays the preset inheritance tree showing key, label, aliases, scan keys, and template availability for each preset.

```
sdd-forge presets list
```

#### `sdd-forge docs build`

Runs the full documentation generation pipeline: scan → enrich → init → data → text → readme → agents, with optional translate step for multi-language projects. Displays a progress bar during execution.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during init |
| `--regenerate` | Skip init step, regenerate existing docs |
| `--verbose` | Show detailed step output |
| `--dry-run` | Preview without writing |

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate
```

#### `sdd-forge docs init`

Generates chapter files in `docs/` from preset template inheritance chains. Supports AI-based chapter filtering when an agent is configured, and respects `config.chapters` when defined.

| Option | Description |
| --- | --- |
| `--type <type>` | Override preset type |
| `--force` | Overwrite existing files |
| `--dry-run` | Preview without writing |

```
sdd-forge docs init
sdd-forge docs init --type node-cli --force
```

#### `sdd-forge docs data`

Resolves `{{data}}` directives in chapter files using data from `analysis.json` and the preset resolver chain. Skips `{{text}}` directives.

| Option | Description |
| --- | --- |
| `--dry-run` | Preview changes without writing |
| `--stdout` | Print change summaries to stdout |
| `--docs-dir <path>` | Override docs directory |

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### `sdd-forge docs readme`

Generates `README.md` from a preset template, resolving both `{{data}}` and `{{text}}` directives. Supports multi-language output.

| Option | Description |
| --- | --- |
| `--lang <code>` | Output language |
| `--output <path>` | Custom output path |
| `--dry-run` | Preview to stdout |

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

#### `sdd-forge docs forge`

AI-driven iterative documentation improvement. Runs multiple rounds of AI generation followed by review checks, feeding back failures for the next round.

| Option | Description |
| --- | --- |
| `--prompt <text>` | User prompt for the AI |
| `--prompt-file <path>` | Load prompt from file |
| `--spec <path>` | Spec file for context |
| `--max-runs <n>` | Maximum iteration rounds (default: 3) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--dry-run` | Preview without execution |
| `--verbose` | Show agent output |

```
sdd-forge docs forge --prompt "Improve CLI documentation" --mode agent
sdd-forge docs forge --spec specs/042-feature/spec.md --max-runs 5
```

#### `sdd-forge docs review`

Validates documentation quality: minimum line count (15), H1 presence, unfilled `{{text}}`/`{{data}}` directives, output integrity (exposed directives, broken HTML comments, residual block directives), analysis coverage, and multi-language completeness.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### `sdd-forge docs changelog`

Scans `specs/` directories to generate `change_log.md` with Latest Index and All Specs tables.

| Option | Description |
| --- | --- |
| `--dry-run` | Print to stdout without writing |

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` by resolving `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives. The PROJECT section is refined by an AI agent using generated docs as context.

| Option | Description |
| --- | --- |
| `--dry-run` | Print result to stdout without writing |

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### `sdd-forge spec init`

Creates a numbered feature branch and spec directory with `spec.md` and `qa.md` templates. Supports branch, worktree, and spec-only modes.

| Option | Description |
| --- | --- |
| `--title <name>` | Feature title (required) |
| `--base <branch>` | Base branch (defaults to current branch) |
| `--no-branch` | Skip branch creation, create spec files only |
| `--worktree` | Create an isolated git worktree |
| `--allow-dirty` | Allow uncommitted changes |
| `--dry-run` | Preview without writing |

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "api-v2" --worktree
sdd-forge spec init --title "bugfix" --no-branch
```

#### `sdd-forge spec gate`

Pre-implementation gate check that validates spec quality: unresolved tokens, unchecked tasks, required sections, user confirmation, and AI-powered guardrail compliance.

| Option | Description |
| --- | --- |
| `--spec <path>` | Path to spec.md (required) |
| `--phase <pre\|post>` | Gate phase (default: `pre`) |
| `--skip-guardrail` | Skip AI guardrail compliance check |

```
sdd-forge spec gate --spec specs/042-feature/spec.md
sdd-forge spec gate --spec specs/042-feature/spec.md --phase post
```

#### `sdd-forge spec guardrail`

Manages guardrail articles (immutable project principles). Supports `init` (create from preset chain), `update` (AI-suggest new articles), and `show` (display articles filtered by phase).

| Option | Description |
| --- | --- |
| `--phase <phase>` | Filter by phase (`spec`, `impl`, `lint`) |
| `--force` | Overwrite existing guardrail file |

```
sdd-forge spec guardrail init
sdd-forge spec guardrail show --phase spec
sdd-forge spec guardrail update
```

#### `sdd-forge spec lint`

Mechanical check of changed files against guardrail lint patterns (RegExp). Compares against the base branch diff.

| Option | Description |
| --- | --- |
| `--base <branch>` | Base branch for diff (required) |

```
sdd-forge spec lint --base main
```

#### `sdd-forge flow start`

Automated SDD flow execution: spec init → gate check → forge. The primary entry point for starting a new feature development flow.

| Option | Description |
| --- | --- |
| `--request <text>` | User request description (required) |
| `--title <name>` | Override branch/spec title |
| `--spec <path>` | Use existing spec instead of creating new |
| `--forge-mode <mode>` | `local`, `assist`, or `agent` |
| `--max-runs <n>` | Maximum forge iterations (default: 5) |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree isolation |
| `--dry-run` | Preview without execution |

```
sdd-forge flow start --request "Add user authentication"
sdd-forge flow start --request "Fix login bug" --worktree --forge-mode agent
```

#### `sdd-forge flow status`

Displays current flow progress or updates flow state. Shows spec path, branches, step completion, and requirements.

| Option | Description |
| --- | --- |
| `--step <id> --status <val>` | Update a step's status |
| `--summary '<JSON>'` | Set requirements from JSON array |
| `--req <index> --status <val>` | Update a single requirement |
| `--request <text>` | Set user request text |
| `--note <text>` | Append a note |
| `--issue <number>` | Link a GitHub Issue |
| `--check <phase>` | Check prerequisites (`impl`, `finalize`) |
| `--list` | Show active flows |
| `--all` | Show all specs including completed |

```
sdd-forge flow status
sdd-forge flow status --list
sdd-forge flow status --step implement --status done
```

#### `sdd-forge flow resume`

Outputs a context summary for resuming a flow after context compaction. Includes request, progress, spec summary, requirements, and suggested next action.

```
sdd-forge flow resume
```

#### `sdd-forge flow review`

AI-powered code quality review in three phases: draft (generate proposals), final (validate proposals), and output `review.md`.

| Option | Description |
| --- | --- |
| `--dry-run` | Show proposals without applying |
| `--skip-confirm` | Skip initial confirmation |

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

#### `sdd-forge flow merge`

Squash-merges the feature branch into base or creates a GitHub PR. Strategy is auto-detected from flow state.

| Option | Description |
| --- | --- |
| `--pr` | Create a pull request instead of squash merge |
| `--auto` | Auto-detect: PR if `commands.gh=enable` and `gh` available, else squash |
| `--dry-run` | Show commands without executing |

```
sdd-forge flow merge
sdd-forge flow merge --pr
sdd-forge flow merge --auto
```

#### `sdd-forge flow cleanup`

Removes the feature branch, worktree (if used), and `.active-flow` entry. Preserves `flow.json` in the specs directory.

| Option | Description |
| --- | --- |
| `--dry-run` | Show commands without executing |

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

#### `sdd-forge flow set step`

Updates a workflow step's status in `flow.json`. Output is JSON envelope format.

```
sdd-forge flow set step implement done
sdd-forge flow set step gate in_progress
```

#### `sdd-forge flow set req`

Updates a single requirement's status by index.

```
sdd-forge flow set req 0 done
sdd-forge flow set req 2 in_progress
```

#### `sdd-forge flow set summary`

Sets the requirements list from a JSON string array. Each element becomes a requirement with `pending` status.

```
sdd-forge flow set summary '["Add login form", "Add validation", "Write tests"]'
```

#### `sdd-forge flow set request`

Sets the user request text field in `flow.json`.

```
sdd-forge flow set request "Implement user authentication"
```

#### `sdd-forge flow set note`

Appends a text note to the notes array in `flow.json`.

```
sdd-forge flow set note "Decided to use JWT tokens"
```

#### `sdd-forge flow set issue`

Sets the linked GitHub Issue number in `flow.json`.

```
sdd-forge flow set issue 42
```

#### `sdd-forge flow set metric`

Increments a metric counter. Valid phases: `draft`, `spec`, `gate`, `test`. Valid counters: `question`, `redo`, `docsRead`, `srcRead`.

```
sdd-forge flow set metric spec question
sdd-forge flow set metric gate redo
```

#### `sdd-forge flow set redo`

Records a redo entry in `specs/<spec>/redolog.json` with timestamp.

| Option | Description |
| --- | --- |
| `--step <id>` | Step where redo occurred (required) |
| `--reason <text>` | Why the redo was needed (required) |
| `--trigger <text>` | What triggered the redo |
| `--resolution <text>` | How the redo was resolved |
| `--guardrail-candidate <text>` | Potential guardrail to add |

```
sdd-forge flow set redo --step spec --reason "Missing acceptance criteria" --trigger "gate failure"
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Meaning | Used By |
| --- | --- | --- |
| `0` | Success or help displayed | All commands |
| `1` | General error: unknown command, missing arguments, validation failure, no active flow, review failure | `sdd-forge.js`, `flow.js`, `spec gate`, `docs review`, `flow status`, `spec lint` |
| `2` | Gate check failed (spec not ready for implementation) | `flow start` |

sdd-forge follows these output conventions:

| Stream | Content |
| --- | --- |
| **stdout** | Primary command output: generated content, `--dry-run` previews, JSON envelopes from `flow set` commands (`{"ok": true, ...}` / `{"ok": false, ...}`), flow status displays, and help messages |
| **stderr** | Progress indicators, step labels (e.g., `[data]`, `[init]`, `[forge]`), warnings (prefixed with `WARN:`), error messages, and agent ticker dots during AI calls |

The `flow set` family of commands uses a structured JSON envelope for output via the `flow-envelope.js` module. Success responses use the `ok()` format with result data, while failures use the `fail()` format with error code and message. The `docs review` command throws an `Error` when any check fails, causing a non-zero exit. Commands that accept `--dry-run` produce the same stdout output as a normal run but skip all file writes.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
