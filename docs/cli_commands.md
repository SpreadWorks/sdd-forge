<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The CLI Command Reference covers the full set of commands provided by the `sdd-forge` binary, organized into two namespace dispatchers (`docs` and `flow`) and four independent top-level commands, totalling more than 20 distinct operations that span source code scanning, AI-driven documentation generation, and Spec-Driven Development workflow management.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Print all available commands with descriptions and version | — |
| `sdd-forge setup` | Interactive wizard to initialize a new project and write `config.json` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Re-deploy skill files and migrate `config.json` schema to the current version | `--dry-run` |
| `sdd-forge presets list` | Display the full preset inheritance tree with scan categories and template status | — |
| `docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents (→ translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan source files and write structured `analysis.json` | `--dry-run` |
| `docs enrich` | AI-annotate each analysis entry with role, summary, detail, and chapter classification | `--dry-run` |
| `docs init` | Initialize `docs/` directory from the resolved preset template chain | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `docs data` | Populate `{{data(...)}}` directives in chapter files from analysis | `--dry-run` |
| `docs text` | Fill `{{text(...)}}` directives in chapter files using an AI agent | `--dry-run` |
| `docs readme` | Generate or update `README.md` from the preset template | `--lang`, `--output`, `--dry-run` |
| `docs forge` | Iterative AI documentation authoring with an automatic write–review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--verbose`, `--dry-run` |
| `docs review` | Validate documentation quality: unfilled directives, broken HTML comments, coverage | — |
| `docs translate` | Translate chapter files and README into configured target languages via AI | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate a Markdown changelog table from `specs/` subdirectories | `--dry-run` |
| `docs agents` | Generate and AI-refine `AGENTS.md` / `CLAUDE.md` | `--dry-run` |
| `flow prepare` | Initialize spec file, feature branch or git worktree, and `flow.json` | — |
| `flow get status` | Return current phase, step list, progress counters, and metrics | — |
| `flow get issue` | Fetch GitHub issue metadata (title, body, labels, state) via `gh` | — |
| `flow get prompt` | Retrieve a predefined flow prompt by language and kind | — |
| `flow set issue` | Associate a GitHub issue number with the active flow | — |
| `flow set test-summary` | Persist test result counts (unit/integration/acceptance) into flow state | `--unit`, `--integration`, `--acceptance` |
| `flow run finalize` | Execute finalization pipeline: commit → merge → retro → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `flow run sync` | Run `docs build`, review, and commit updated documentation files | `--dry-run` |
| `flow run retro` | Evaluate spec accuracy against git diff and save `retro.json` | `--force`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `-h`, `--help` | All commands | Print usage information and available options, then exit with code `0` |
| `--dry-run` | `build`, `init`, `data`, `text`, `readme`, `forge`, `translate`, `changelog`, `agents`, `upgrade`, `flow run finalize`, `flow run sync`, `flow cleanup`, `flow run retro` | Preview operations without writing files or executing git or `gh` commands |
| `--verbose` / `-v` | `docs build`, `docs forge` | Enable detailed per-step progress logging to stderr |
| `-v`, `-V`, `--version` | `sdd-forge` (top level only) | Print the installed package version string and exit with code `0` |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Prints the full command reference with the installed version number and a one-line description of each command, grouped into sections (Project, Docs, Flow, Info). Descriptions are resolved through the i18n system using `ui:help.commands.*` keys.

**Usage:** `sdd-forge help`

#### `sdd-forge setup`

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, source path, output language(s), default language, preset type, documentation purpose, writing tone, and AI agent provider. Writes `config.json` to `.sdd-forge/`, creates `docs/` and `specs/` directories, updates `.gitignore` and `.gitattributes`, deploys skill files to `.claude/skills/` and `.agents/skills/`, and generates or updates `AGENTS.md`.

**Usage:** `sdd-forge setup [options]`

| Option | Description |
|---|---|
| `--name <name>` | Project name (skips interactive prompt) |
| `--path <path>` | Source root path |
| `--work-root <path>` | Working root if different from source path |
| `--type <type>` | Preset type (e.g. `node-cli`, `laravel`) |
| `--lang <lang>` | Interface language (`en`, `ja`) |
| `--purpose <purpose>` | Documentation purpose (`developer-guide`, `user-guide`) |
| `--tone <tone>` | Writing tone (`polite`, `formal`, `casual`) |
| `--agent <provider>` | Default AI agent provider |
| `--dry-run` | Preview configuration without writing files |

**Example:**
```
sdd-forge setup --name my-project --path ./src --type node-cli --lang en
```

#### `sdd-forge upgrade`

Re-deploys skill files from the installed package version to the project's `.claude/skills/` and `.agents/skills/` directories. Also applies any needed `config.json` schema migrations, such as converting legacy string arrays in `chapters` to the current object format. Reports each file as updated or unchanged.

**Usage:** `sdd-forge upgrade [--dry-run]`

#### `sdd-forge presets list`

Prints the full preset inheritance tree starting from the `base` preset, using box-drawing characters. Each node shows the preset key, axis, language, aliases, scan category names, and whether a `templates/` directory is present.

**Usage:** `sdd-forge presets list`

#### `docs build`

Runs the complete documentation pipeline in sequence. Steps with their weights are: `scan` (1) → `enrich` (2) → `init` (1) → `data` (1) → `text` (3) → `readme` (1) → `agents` (1). If `docs.languages` contains more than one language, a `translate` step is appended. A weighted progress indicator tracks overall completion. If no default agent is configured, `enrich` and `text` are skipped with a warning.

**Usage:** `sdd-forge docs build [options]`

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init`; regenerate text in existing chapter files only |
| `--verbose` | Log detailed per-step output to stderr |
| `--dry-run` | Preview the pipeline without writing any files |

**Example:**
```
sdd-forge docs build --verbose
sdd-forge docs build --regenerate --dry-run
```

#### `docs scan`

Scans source files according to the configured preset's scan rules and writes the structured result to `.sdd-forge/output/analysis.json`. This is the required first step before any other `docs` command can run.

**Usage:** `sdd-forge docs scan [--dry-run]`

#### `docs enrich`

Passes the raw `analysis.json` to an AI agent to annotate every entry with a `role`, `summary`, `detail`, and chapter classification. Updates `analysis.json` in place. Requires a configured default agent.

**Usage:** `sdd-forge docs enrich [--dry-run]`

#### `docs init`

Resolves the template chain for the configured preset type, merges chapter lists (preset order merged with any `config.chapters` overrides via `resolveChaptersOrder`), and writes chapter Markdown files to `docs/`. When an AI agent is available and `config.chapters` is not explicitly set, uses AI to filter chapters based on analysis content and documentation purpose. Non-destructive by default.

**Usage:** `sdd-forge docs init [options]`

| Option | Description |
|---|---|
| `--type <type>` | Override the preset type |
| `--lang <lang>` | Override the output language |
| `--docs-dir <path>` | Override the output directory |
| `--force` | Overwrite files that already exist |
| `--dry-run` | Report actions without writing |

#### `docs data`

Reads all chapter files in `docs/`, resolves each `{{data(...)}}` directive using the analysis and the configured data resolver, and writes the populated content back. Safe to run multiple times; only files with resolvable directives are modified.

**Usage:** `sdd-forge docs data [--dry-run]`

#### `docs text`

Iterates over chapter files and calls an AI agent for each `{{text(...)}}` directive to generate narrative prose from the analysis context. Writes the filled text back to each file between the directive markers. Requires a configured default agent.

**Usage:** `sdd-forge docs text [--dry-run]`

#### `docs readme`

Resolves the `README.md` template from the preset chain, populates `{{data}}` directives, fills `{{text}}` directives with AI if present, and writes the result to the project root or `--output` path. Skips the write if the generated content is identical to the existing file to avoid spurious changes.

**Usage:** `sdd-forge docs readme [options]`

| Option | Description |
|---|---|
| `--lang <lang>` | Target output language |
| `--output <path>` | Custom output path (default: `README.md` in project root) |
| `--dry-run` | Print generated content without writing |

#### `docs forge`

Orchestrates iterative AI-driven documentation authoring across all chapter files with a configurable write–review loop. Supports three modes: `local` (individual AI calls per file, run concurrently), `assist`, and `agent`. After each round the review command is executed and any failure output is fed back as `reviewFeedback` for subsequent rounds, up to `--max-runs` iterations. Finalizes by regenerating `README.md` and translations.

**Usage:** `sdd-forge docs forge --prompt <text> [options]`

| Option | Description |
|---|---|
| `--prompt <text>` | Authoring instruction passed to the agent (required unless `--prompt-file` is set) |
| `--prompt-file <path>` | Load the prompt from a file |
| `--spec <path>` | Path to a spec file to include as additional context |
| `--max-runs <n>` | Maximum write–review iterations (default: `3`) |
| `--review-cmd <cmd>` | Review command string (default: `sdd-forge docs review`) |
| `--mode <mode>` | Execution mode: `local`, `assist`, or `agent` |
| `--verbose` / `-v` | Stream agent stdout/stderr to stderr |
| `--dry-run` | Skip agent calls and list target files only |

**Example:**
```
sdd-forge docs forge --prompt "Focus on the CLI usage section" --max-runs 2
```

#### `docs review`

Validates all chapter files in `docs/` against quality rules: minimum 15 lines, presence of an H1 heading, no unfilled `{{text}}` directives, no unfilled `{{data}}` directives, no exposed directive syntax in rendered output, no broken HTML comment pairs, and no residual block tags. Also checks that `README.md` exists, that all configured non-default language directories exist and are non-empty, and that analysis entries are referenced in the documentation. Exits with `EXIT_ERROR` if any check fails, making it usable as a CI gate.

**Usage:** `sdd-forge docs review [docs-dir]`

The optional positional argument overrides the default `docs/` directory path.

#### `docs translate`

Translates existing chapter files and `README.md` into each non-default language defined in `docs.languages`. Calls the AI agent concurrently (concurrency level from config). Skips files where the target is newer than the source unless `--force` is set. Creates per-language subdirectories under `docs/` automatically. Applies tone-specific writing style instructions for supported languages (e.g. `です/ます` style for Japanese `polite` tone).

**Usage:** `sdd-forge docs translate [options]`

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate even if the target file is up to date |
| `--dry-run` | List translation tasks without executing them |

#### `docs changelog`

Scans the `specs/` directory for numbered subdirectories (format: `NNN-name` or `bak.NNN-name`), parses each `spec.md` for title, status, created date, branch, and description, and generates a Markdown table written to `docs/change_log.md`. Produces two tables: a deduplicated index of the latest revision per series, and a full chronological listing of all spec entries.

**Usage:** `sdd-forge docs changelog [out-file] [--dry-run]`

The optional positional argument sets a custom output path.

#### `docs agents`

Generates or updates `AGENTS.md` for the project. If the file does not exist, creates it with stub SDD and PROJECT directive blocks. Resolves `{{data}}` directives in the SDD section using the configured data resolver, then calls an AI agent with a refine prompt built from `package.json` scripts, chapter file contents, and `README.md` to produce an updated PROJECT section. Only the content inside the PROJECT directive block is replaced; all other content is preserved.

**Usage:** `sdd-forge docs agents [--dry-run]`

#### `flow prepare`

Initializes a new Spec-Driven Development flow. Creates the spec directory and `spec.md` file under `specs/`, creates a feature branch or git worktree depending on the configured work environment, and writes `flow.json` to the project to track state throughout the flow lifecycle.

**Usage:** `sdd-forge flow prepare`

#### `flow get status`

Reads the active `flow.json` and outputs a structured JSON envelope containing: current phase (derived from completed steps via `derivePhase`), full steps array with statuses, steps and requirements progress counters, branch names, worktree flag, linked issue number, request text, notes, metrics, merge strategy, and auto-approve flag.

**Usage:** `sdd-forge flow get status`

#### `flow get issue`

Fetches GitHub issue metadata for the given issue number by invoking `gh issue view --json title,body,labels,state`. Returns a flow envelope with the issue title, body, labels, and state, or a fail envelope if the `gh` call fails or the issue number is invalid.

**Usage:** `sdd-forge flow get issue <number>`

**Example:**
```
sdd-forge flow get issue 42
```

#### `flow get prompt`

Returns a predefined prompt object from the in-memory `PROMPTS_BY_LANG` map, keyed by locale and prompt kind. The returned object contains `phase`, `step`, `description`, `recommendation`, and a `choices` array. Supported kinds include `plan.approach`, `plan.work-environment`, `plan.approval`, `plan.test-mode`, `impl.review-mode`, `impl.confirmation`, `finalize.mode`, `finalize.steps`, and others.

**Usage:** `sdd-forge flow get prompt <lang> <kind>`

#### `flow set issue`

Persists an issue number into the active `flow.json` via `setIssue()`, associating the current flow session with a GitHub issue. Returns a flow envelope confirming the stored value.

**Usage:** `sdd-forge flow set issue <number>`

#### `flow set test-summary`

Records test result counts for unit, integration, and acceptance test categories into the active flow state via `setTestSummary()`. At least one flag must be provided. All values must be non-negative integers.

**Usage:** `sdd-forge flow set test-summary [options]`

| Option | Description |
|---|---|
| `--unit <n>` | Number of unit tests |
| `--integration <n>` | Number of integration tests |
| `--acceptance <n>` | Number of acceptance tests |

#### `flow run finalize`

Orchestrates the finalization pipeline for a completed SDD flow. In `--mode all`, executes all six steps in order. In `--mode select`, runs only the steps listed in `--steps`. Returns a structured result envelope with per-step status (`done`, `skipped`, `failed`, or `dry-run`). In `all` mode with no `--merge-strategy`, auto-detects whether to use squash merge or PR based on config and `gh` availability.

**Usage:** `sdd-forge flow run finalize --mode <all\|select> [options]`

| Option | Description |
|---|---|
| `--mode <all\|select>` | Run all steps or select individually (required) |
| `--steps <1,2,...>` | Comma-separated step numbers for `select` mode (1=commit, 2=merge, 3=retro, 4=sync, 5=cleanup, 6=record) |
| `--merge-strategy <strategy>` | `squash`, `pr`, or `auto` (default: auto-detect) |
| `--message <msg>` | Custom git commit message for the commit step |
| `--dry-run` | Preview all steps without executing |

#### `flow run sync`

Runs `sdd-forge docs build` followed by `sdd-forge docs review`, then stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md` and commits them with the message `docs: sync documentation`. Skips the commit silently if there are no staged changes. Returns a flow envelope with the list of changed files and build output.

**Usage:** `sdd-forge flow run sync [--dry-run]`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
|---|---|---|
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | Fatal error: covers unknown subcommands, missing `config.json` or `flow.json`, invalid argument values, pipeline step failures, and AI agent call failures |

**stdout conventions:**

- `docs` commands write human-readable progress lines to stdout via `console.log`; error detail goes to stderr via `console.error`.
- `flow get`, `flow set`, and `flow run` commands write a single-line JSON envelope to stdout with the shape `{ group, key, status, data }`, enabling machine-readable consumption by skill scripts and external tooling.
- `--dry-run` mode prints a preview of what would be written or executed to stdout and exits without making changes.
- `--help` output is always written to stdout; all error and warning messages use stderr.
- `docs review` writes one human-readable line per failed check to stdout, then exits with code `1` if any failures were found, making it suitable as a CI gate command.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
