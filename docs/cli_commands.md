# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge provides over 20 commands organized into a three-level dispatch architecture (`sdd-forge <namespace> <subcommand>`), covering documentation generation, spec management, development flow orchestration, and project setup. Commands are grouped under four namespaces — `docs`, `spec`, `flow`, and standalone commands — each routing to dedicated implementation files.

<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display all available commands grouped by section | — |
| `sdd-forge setup` | Interactive setup wizard; registers project and generates `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Upgrade template-derived files (skills, etc.) to match the installed sdd-forge version | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
| `sdd-forge docs build` | Run full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and generate `analysis.json` | — |
| `sdd-forge docs enrich` | AI-enrich `analysis.json` entries with summary, detail, chapter, and role metadata | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | Initialize chapter files from preset templates | `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | AI-fill `{{text}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from chapter files and templates | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | Iteratively improve docs using AI agent and review feedback loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Run documentation quality review | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate changelog | — |
| `sdd-forge docs agents` | Update AGENTS.md by resolving `{{data: agents.*}}` directives and AI-refining the PROJECT section | `--dry-run` |
| `sdd-forge docs snapshot` | Create a documentation snapshot | — |
| `sdd-forge spec init` | Create a numbered feature branch and spec directory with `spec.md` / `qa.md` templates | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | Run pre-implementation gate check on a spec for completeness and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | Initialize or update project guardrail (`guardrail.md`) with immutable principles | Subcommands: `init`, `update`; `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | Run the full SDD flow: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | Display or update flow progress stored in `flow.json` | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `sdd-forge flow review` | Run code quality review after implementation (draft → final → apply) | `--dry-run`, `--skip-confirm` |

<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following options are recognized across most commands via the shared `parseArgs` utility in `src/lib/cli.js`:

| Option | Description |
|---|---|
| `--help`, `-h` | Display command-specific help text and exit |
| `--dry-run` | Execute the command without writing any files; preview output to stdout |
| `--verbose`, `-v` | Enable verbose output (available on `docs build` and `docs forge`) |

The top-level entry point (`sdd-forge.js`) also accepts:

| Option | Description |
|---|---|
| `--version`, `-v`, `-V` | Print the installed sdd-forge version and exit |

Note that `--help` and `--dry-run` are implemented per-command using the `parseArgs` function with command-specific `flags` and `options` arrays. Not every command supports every global option — refer to individual command details below for the exact set of accepted options.

<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### sdd-forge help

Displays all available commands organized into sections: Project, Docs, Spec, Flow, and Info. Output includes the package version, a usage line, and a formatted list of command names with brief descriptions sourced from the i18n locale files.

```
sdd-forge help
```

#### sdd-forge setup

Interactive setup wizard that registers a project and generates `.sdd-forge/config.json`. Prompts for project name, source path, output language(s), architecture type (webapp/cli/library with framework selection), document style, and default agent. Creates the required directory structure (`.sdd-forge/output/`, `docs/`, `specs/`), sets up `AGENTS.md`, `CLAUDE.md`, and skill templates.

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/laravel --agent claude
```

| Option | Description |
|---|---|
| `--name <name>` | Project name (skips interactive prompt) |
| `--path <path>` | Source directory path |
| `--work-root <path>` | Working root directory (defaults to source path) |
| `--type <type>` | Preset type (e.g., `webapp/cakephp2`, `cli/node-cli`, `library`) |
| `--purpose <purpose>` | Document purpose setting |
| `--tone <tone>` | Document tone (polite, formal, casual) |
| `--agent <agent>` | Default AI agent (claude, codex) |
| `--lang <lang>` | Operation language |
| `--dry-run` | Preview without writing files |

When all required options are provided via CLI arguments, the command runs in non-interactive mode.

#### sdd-forge upgrade

Upgrades template-derived files to match the currently installed sdd-forge version. Compares skill templates in `src/templates/skills/` with installed files in `.agents/skills/`, updating any that have changed. Recreates `.claude/skills/` symlinks and prints configuration hints for missing settings.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

Safe to run repeatedly — only template-managed content is overwritten.

#### sdd-forge presets list

Displays the preset inheritance tree in a visual tree format. Shows the base preset as root, with architecture layers (cli, webapp, library) and leaf presets (node-cli, cakephp2, laravel, symfony) as children. Each node displays its label, aliases, and scan keys.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the full documentation generation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate`. Displays a progress bar for each step. If no `defaultAgent` is configured, the `enrich` and `text` steps are skipped. For multi-language output, additional `translate` or `generate` steps are appended.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| Option | Description |
|---|---|
| `--force` | Force regeneration of chapter files during init |
| `--verbose` | Show detailed output for each pipeline step |
| `--dry-run` | Preview without writing files |

#### sdd-forge docs enrich

AI-enriches each entry in `analysis.json` with `summary`, `detail`, `chapter`, and `role` metadata. Entries are split into batches based on total line count (default 3000 lines) or item count (default 20 items). Supports resume — already-enriched entries are skipped, and progress is saved after each batch.

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Preview without modifying analysis.json |
| `--stdout` | Output enriched data to stdout |

#### sdd-forge docs init

Initializes chapter files in `docs/` from preset templates using bottom-up template resolution. Merges templates from the preset hierarchy (base → arch → leaf) and writes chapter files according to the order defined in `preset.json`.

```
sdd-forge docs init
sdd-forge docs init --force
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing files |

#### sdd-forge docs data

Resolves `{{data: source.method("labels")}}` directives in chapter files by invoking the corresponding DataSource methods with analysis data.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

AI-fills `{{text: instruction}}` directives in chapter files. Reads analysis data and chapter context, then calls the configured AI agent to generate prose content for each directive.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

Generates `README.md` from preset templates, resolving `{{data}}` directives (including `langSwitcher`) and optionally AI-filling `{{text}}` directives. Supports multi-language output by specifying a target language.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| Option | Description |
|---|---|
| `--dry-run` | Preview generated README to stdout |
| `--lang <lang>` | Target language for generation |
| `--output <path>` | Output file path |

#### sdd-forge docs forge

Iteratively improves documentation using an AI agent and a review feedback loop. Supports three modes: `local` (deterministic patching), `assist` (AI-guided), and `agent` (full AI autonomy). Each round runs the agent, then executes a review command; if review fails, feedback is extracted and fed into the next round.

```
sdd-forge docs forge --prompt "improve error handling docs"
sdd-forge docs forge --spec specs/001-feature/spec.md --mode agent --max-runs 5
```

| Option | Description |
|---|---|
| `--prompt <text>` | Improvement prompt text |
| `--prompt-file <path>` | Read prompt from file |
| `--spec <path>` | Spec file for context and file targeting |
| `--max-runs <n>` | Maximum iteration rounds (default: 3) |
| `--review-cmd <cmd>` | Review command to run (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--verbose` | Show agent output in real time |
| `--dry-run` | Preview without modifying files |

#### sdd-forge docs translate

Translates default-language docs to non-default languages via AI. Compares file modification times to perform differential translation — only files where the source is newer than the target are re-translated.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Preview translation targets without executing |

#### sdd-forge docs agents

Updates `AGENTS.md` by resolving `{{data: agents.sdd}}` and `{{data: agents.project}}` directives. The PROJECT section is refined by AI using generated docs, `package.json` scripts, and SDD context as input.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge spec init

Creates a numbered feature branch (`feature/NNN-slug`) and a `specs/NNN-slug/` directory containing `spec.md` and `qa.md` templates. Supports three branching modes: standard branch creation, git worktree isolation (`--worktree`), and spec-only without branching (`--no-branch`).

```
sdd-forge spec init --title "add login feature"
sdd-forge spec init --title "refactor auth" --base development --worktree
sdd-forge spec init --title "fix bug" --no-branch
```

| Option | Description |
|---|---|
| `--title <title>` | Feature title (required); used to generate branch name and directory slug |
| `--base <branch>` | Base branch (defaults to current branch) |
| `--allow-dirty` | Skip worktree cleanliness check |
| `--no-branch` | Create spec files without creating a branch |
| `--worktree` | Create an isolated git worktree for the feature |
| `--dry-run` | Preview without creating files or branches |

#### sdd-forge spec gate

Validates a spec file for implementation readiness. Checks for unresolved tokens (TBD, TODO, FIXME), unchecked tasks, missing required sections (Clarifications, Open Questions, User Confirmation, Acceptance Criteria), and user approval status. Optionally runs AI-powered guardrail compliance checks.

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| Option | Description |
|---|---|
| `--spec <path>` | Path to spec.md (required) |
| `--phase <phase>` | `pre` (default) skips Status/Acceptance Criteria unchecked items; `post` checks all |
| `--skip-guardrail` | Skip AI guardrail compliance check |

#### sdd-forge spec guardrail

Manages the project guardrail file (`.sdd-forge/guardrail.md`) containing immutable design principles. The `init` subcommand merges guardrail templates from the preset hierarchy (base → arch → leaf) with language fallback. The `update` subcommand uses AI to propose new project-specific articles based on `analysis.json`.

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update --agent claude
```

| Subcommand | Options |
|---|---|
| `init` | `--force`, `--dry-run` |
| `update` | `--agent <name>`, `--dry-run` |

#### sdd-forge flow start

Orchestrates the full SDD flow: creates a spec (via `spec init`), runs the gate check, and launches `docs forge`. The `--request` option is required and provides the feature description that is embedded into `spec.md`.

```
sdd-forge flow start --request "add user authentication"
sdd-forge flow start --request "refactor API layer" --forge-mode agent --max-runs 5
```

| Option | Description |
|---|---|
| `--request <text>` | Feature request description (required) |
| `--title <title>` | Override the auto-derived branch title |
| `--spec <path>` | Use an existing spec instead of creating one |
| `--agent <name>` | Override the default AI agent |
| `--max-runs <n>` | Maximum forge iterations (default: 5) |
| `--forge-mode <mode>` | Forge execution mode: `local`, `assist`, or `agent` |
| `--no-branch` | Skip branch creation |
| `--worktree` | Use git worktree for isolation |
| `--dry-run` | Preview without executing |

#### sdd-forge flow status

Displays or updates the SDD flow progress stored in `.sdd-forge/flow.json`. Without options, shows a formatted overview including spec path, branches, step progress (with status icons), and requirements.

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["implement auth", "add tests"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --archive
```

| Option | Description |
|---|---|
| `--step <id> --status <val>` | Update a specific step's status |
| `--summary '<JSON>'` | Set the requirements list (JSON array of strings) |
| `--req <index> --status <val>` | Update a specific requirement's status |
| `--archive` | Copy `flow.json` to the spec directory and remove the active state |

#### sdd-forge flow review

Runs a code quality review on the current flow's changes. Operates in three phases: **draft** (AI generates improvement proposals), **final** (AI validates each proposal as APPROVED or REJECTED), and **apply** (formats results as `review.md`). Review targets are derived from the spec's Scope section or fall back to a full `git diff` against the base branch.

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Show proposals without applying |
| `--skip-confirm` | Skip initial confirmation prompt |

<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| Exit Code | Meaning | Used By |
|---|---|---|
| `0` | Success | All commands on successful completion |
| `1` | General error | Unknown subcommand, missing required options, missing config, pipeline failure, no active flow |
| `2` | Gate check failure | `spec gate` when unresolved items are found or user confirmation is missing; `flow start` when gate fails |

**stdout / stderr conventions:**

| Stream | Content |
|---|---|
| **stdout** | Primary command output: generated content, status displays, `--dry-run` previews, `--help` text, and version information |
| **stderr** | Progress indicators (pipeline step labels, agent progress tickers), warnings (`WARN:` prefixed messages such as skipped steps or partial errors), and error messages (`ERROR:` prefixed) |

Key output patterns observed in the codebase:

- Pipeline progress is written to stderr via `createProgress()`, keeping stdout clean for piping.
- Warning messages follow the format `[command] WARN: <description>` (e.g., `[text] WARN: 3 file(s) had errors`).
- Error messages follow the format `[command] ERROR: <message>` before calling `process.exit(1)`.
- The `--dry-run` flag causes commands to output what *would* be written to stdout, prefixed with `[dry-run]` labels or separated by a `---` delimiter.
- Help output (`--help`) is printed to stdout and the process exits with code `0`.
- When no subcommand is given to a namespace dispatcher (`docs`, `spec`, `flow`), the usage message is printed to stderr and the process exits with code `1`.

<!-- {{/text}} -->
