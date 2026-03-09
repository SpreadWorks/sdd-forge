# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

This chapter covers all 19 subcommands available in `sdd-forge`, organized by their routing layer: documentation commands dispatched through `docs.js`, specification commands dispatched through `spec.js`, and directly executed commands (`flow` and `presets`). A small set of global options — including `--project`, `--help`, and `--version` — apply across commands, while individual subcommands expose their own flags as detailed in the sections below.
<!-- {{/text}} -->

## Contents

### Command List

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| Command | Description | Main Options |
|---|---|---|
| `build` | Run the full documentation pipeline (scan → init → data → text → readme → agents → translate) | `--project` |
| `scan` | Analyze source code and output `analysis.json` and `summary.json` | `--project` |
| `init` | Initialize `docs/` from preset templates | `--project`, `--force` |
| `data` | Resolve `{{data}}` directives with analysis data | `--project` |
| `text` | Resolve `{{text}}` directives using an AI agent | `--project`, `--agent`, `--file` |
| `readme` | Auto-generate `README.md` from docs | `--project` |
| `forge` | Iteratively improve docs quality via AI | `--project`, `--prompt`, `--spec` |
| `review` | Run docs quality checks and report PASS/FAIL | `--project` |
| `changelog` | Generate `change_log.md` from accumulated specs | `--project` |
| `agents` | Update `AGENTS.md` (SDD template + PROJECT section) | `--project`, `--sdd`, `--project-only`, `--dry-run` |
| `upgrade` | Update bundled doc templates to the latest preset version | `--project`, `--force` |
| `translate` | Generate docs in additional languages | `--project`, `--lang`, `--force`, `--dry-run` |
| `setup` | Register a project and generate `.sdd-forge/config.json` | — |
| `default` | Set the default project in `projects.json` | — |
| `spec` | Create a new SDD spec (`spec.md`) and feature branch | `--title`, `--no-branch` |
| `gate` | Run spec gate checks before or after implementation | `--spec`, `--phase` |
| `flow` | Run the full SDD workflow automatically for a feature request | `--request` |
| `presets` | List available presets and their metadata | — |
| `help` | Display the command list and usage summary | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| Option | Aliases | Description |
|---|---|---|
| `--project <name>` | — | Specify the target project by name. Overrides the `default` entry in `.sdd-forge/projects.json`. |
| `--help` | `-h` | Display help text for the CLI or a specific subcommand and exit. |
| `--version` | `-v`, `-V` | Print the installed `sdd-forge` version (read from `package.json`) and exit. |

The commands `setup`, `default`, `help`, and `presets` skip project context resolution entirely. They do not require a registered project and will not attempt to load `.sdd-forge/config.json` or resolve `SDD_SOURCE_ROOT` / `SDD_WORK_ROOT`.

For all other commands, the active project is determined in the following priority order:

1. `--project <name>` flag passed on the command line
2. `default` field in `.sdd-forge/projects.json`
3. Environment variables `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` set externally
<!-- {{/text}} -->

### Command Details

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

Runs the complete documentation generation pipeline in sequence. Each step is executed only if the previous step succeeds.

**Pipeline steps:**
1. `scan` — analyze source code
2. `init` — initialize docs from templates (skipped if docs already exist)
3. `data` — resolve `{{data}}` directives
4. `text` — resolve `{{text}}` directives via AI
5. `readme` — generate `README.md`
6. `agents` — update `AGENTS.md`
7. `translate` — generate additional language docs (only when multiple `output.languages` are configured)

```sh
sdd-forge build
sdd-forge build --project myproject
```

#### scan

Analyzes the source code of the registered project and writes the results to `.sdd-forge/output/analysis.json`. A lightweight `summary.json` (used as the preferred input for AI commands) is also generated at the same path.

```sh
sdd-forge scan
sdd-forge scan --project myproject
```

#### init

Initializes the `docs/` directory by merging preset templates with `@extends` / `@block` inheritance. If `docs/` already exists, the command will not overwrite files unless `--force` is specified.

| Option | Description |
|---|---|
| `--force` | Overwrite existing doc files |

```sh
sdd-forge init
sdd-forge init --force
```

#### data

Resolves all `{{data: ...}}` directives in `docs/` files, replacing them inline with structured data extracted from `analysis.json`.

```sh
sdd-forge data
sdd-forge data --project myproject
```

#### text

Resolves all `{{text: ...}}` directives in `docs/` files by calling the configured AI agent and inserting generated text.

| Option | Description |
|---|---|
| `--agent <name>` | Use a specific provider defined in `config.json` instead of the default |
| `--file <path>` | Process only the specified doc file instead of all files |

```sh
sdd-forge text
sdd-forge text --file docs/01_overview.md
sdd-forge text --agent claude
```

#### readme

Generates `README.md` in the project root by assembling content from the docs and analysis data. The output format follows the project type preset.

```sh
sdd-forge readme
sdd-forge readme --project myproject
```

#### forge

Iteratively improves one or more docs files based on a natural-language prompt. The AI is instructed to revise existing content rather than replace it wholesale.

| Option | Description |
|---|---|
| `--prompt <text>` | Description of the change or improvement to make (required) |
| `--spec <path>` | Scope the update to a specific spec context |

```sh
sdd-forge forge --prompt "Clarify the authentication flow in the overview"
sdd-forge forge --prompt "Update after adding OAuth support" --spec specs/012-oauth/spec.md
```

#### review

Runs a quality check against `docs/` using the review checklist and reports an overall PASS or FAIL to stdout. The exit code reflects the result (0 = PASS, 1 = FAIL).

```sh
sdd-forge review
sdd-forge review --project myproject
```

#### changelog

Generates `docs/change_log.md` by aggregating information from all accumulated spec files under `specs/`.

```sh
sdd-forge changelog
sdd-forge changelog --project myproject
```

#### agents

Updates `AGENTS.md` by replacing the `<!-- SDD:START/END -->` section with the latest bundled template and regenerating the `<!-- PROJECT:START/END -->` section from analysis data.

| Option | Description |
|---|---|
| `--sdd` | Update only the SDD template section |
| `--project-only` | Regenerate only the PROJECT section |
| `--dry-run` | Preview changes without writing to disk |

```sh
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --dry-run
```

#### upgrade

Updates the doc template files in `docs/` to match the latest versions shipped with the installed preset. Useful after upgrading the `sdd-forge` package.

| Option | Description |
|---|---|
| `--force` | Overwrite customized template blocks |

```sh
sdd-forge upgrade
sdd-forge upgrade --force
```

#### translate

Generates documentation in additional output languages as specified by `output.languages` in `config.json`. The default language is always excluded from translation.

| Option | Description |
|---|---|
| `--lang <code>` | Target language code (e.g., `en`, `ja`) |
| `--force` | Regenerate even if translated files already exist |
| `--dry-run` | Preview which files would be generated without writing |

```sh
sdd-forge translate
sdd-forge translate --lang en
sdd-forge translate --lang en --force
sdd-forge translate --dry-run
```

#### setup

Interactive command that registers a project and creates `.sdd-forge/config.json`. This command skips project context resolution and is typically run once per project.

```sh
sdd-forge setup
```

#### default

Sets the default project in `.sdd-forge/projects.json`. The specified project will be used automatically when `--project` is not provided.

```sh
sdd-forge default myproject
```

#### spec

Creates a new SDD spec file at `specs/NNN-<title>/spec.md` and optionally creates a feature branch. If `--no-branch` is passed (or if running inside a git worktree), no branch is created.

| Option | Description |
|---|---|
| `--title <name>` | Human-readable spec title (required) |
| `--no-branch` | Skip branch creation |

```sh
sdd-forge spec --title "Add CSV export"
sdd-forge spec --title "Fix pagination bug" --no-branch
```

#### gate

Runs structured gate checks against a spec file to verify completeness before (pre) or after (post) implementation.

| Option | Description |
|---|---|
| `--spec <path>` | Path to the target `spec.md` (required) |
| `--phase <pre\|post>` | Check phase: `pre` (default) for pre-implementation, `post` for post-implementation |

```sh
sdd-forge gate --spec specs/005-csv-export/spec.md
sdd-forge gate --spec specs/005-csv-export/spec.md --phase post
```

#### flow

Runs the full SDD workflow automatically — spec creation, gate check, and scaffolding — in response to a free-form feature request. Intended for use when the full interactive flow should be delegated to the tool.

| Option | Description |
|---|---|
| `--request <text>` | Natural-language description of the feature or fix (required) |

```sh
sdd-forge flow --request "Add user-level rate limiting to the API"
```

#### presets

Lists all available presets detected under `src/presets/`, along with their type, architecture layer, and supported scan categories.

```sh
sdd-forge presets
```

#### help

Displays a summary of all available subcommands and their descriptions.

```sh
sdd-forge help
sdd-forge --help
sdd-forge -h
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| Exit Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | General error (invalid arguments, missing config, file I/O failure, etc.) |
| `1` | `gate` check returned FAIL |
| `1` | `review` check returned FAIL |

**stdout vs. stderr usage:**

| Stream | Content |
|---|---|
| `stdout` | Primary command output: generated text, PASS/FAIL verdicts, file paths, summaries |
| `stderr` | Progress indicators, warnings, debug messages, and non-fatal notices |

The `gate` and `review` commands write their PASS/FAIL result lines to stdout, making them suitable for capture in CI pipelines or shell scripts. Diagnostic detail (e.g., which checks failed and why) is also written to stdout immediately before the final verdict line.

All commands that modify files on disk print the affected file paths to stdout upon completion, allowing downstream tooling to detect which files were changed.
<!-- {{/text}} -->
