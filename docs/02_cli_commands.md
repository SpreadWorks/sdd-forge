# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

This chapter covers all 18 subcommands available in `sdd-forge`, organized into documentation generation commands (routed through `docs.js`), spec workflow commands (routed through `spec.js`), and directly executed commands (`flow`, `presets`). All commands share a common set of global options, and most require a resolved project context before execution.

## Contents

### Command List

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| Command | Description | Key Options |
|---|---|---|
| `build` | Runs the full documentation pipeline (`scan → init → data → text → readme → agents → translate`) in one step | `--project` |
| `scan` | Analyzes source code and writes `analysis.json` and `summary.json` | `--project` |
| `init` | Initializes `docs/` from preset templates | `--project` |
| `data` | Resolves `{{data: ...}}` directives using analysis output | `--project` |
| `text` | Resolves `{{text: ...}}` directives using the configured AI agent | `--file`, `--agent`, `--project` |
| `readme` | Auto-generates `README.md` from docs content via AI | `--project` |
| `forge` | Iteratively improves docs using AI, guided by a prompt | `--prompt`, `--spec`, `--project` |
| `review` | Runs an AI quality check on docs and reports PASS/FAIL | `--project` |
| `changelog` | Generates `change_log.md` from all spec files under `specs/` | `--project` |
| `agents` | Updates `AGENTS.md` with the latest SDD template and PROJECT section | `--sdd`, `--project-only`, `--dry-run` |
| `translate` | Translates docs into additional output languages defined in config | `--lang`, `--force`, `--dry-run` |
| `upgrade` | Updates SDD-managed template sections to match the installed package version | `--project` |
| `setup` | Registers a project and generates initial `.sdd-forge/config.json` | — |
| `default` | Sets or displays the default project in `projects.json` | — |
| `spec` | Creates a new spec file and optionally a feature branch | `--title`, `--no-branch` |
| `gate` | Validates a spec against acceptance criteria before or after implementation | `--spec`, `--phase` |
| `flow` | Automates the full SDD flow from a natural-language request | `--request` |
| `presets` | Lists all bundled project type presets | — |
| `help` | Displays available subcommands and descriptions | `-h`, `--help` |

### Global Options

<!-- {{text: List global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| Option | Aliases | Description |
|---|---|---|
| `--project <name>` | — | Specifies the target project by name, as registered in `.sdd-forge/projects.json`. When omitted, the project marked as `default` in `projects.json` is used. |
| `--help` | `-h` | Prints the help text for the given subcommand and exits. |
| `--version` | `-v`, `-V` | Prints the current `sdd-forge` version from `package.json` and exits. |

> **Note:** The `setup`, `default`, `help`, and `presets` commands skip project context resolution entirely. They do not require a registered project and ignore the `--project` flag.

### Command Details

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

Each command below is documented with its purpose, available options, and representative usage examples. Commands that involve AI generation require a valid `defaultAgent` or `providers` entry in `.sdd-forge/config.json`. Commands that modify files on disk always operate within the resolved project's `docs/` directory unless otherwise noted.

#### build

Runs the complete documentation generation pipeline in a single step. The pipeline executes the following stages in order: `scan → init → data → text → readme → agents → translate`. This is the standard entry point for first-time setup or full regeneration of project docs.

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

Analyzes the project source code according to the configured preset (e.g., `cli/node-cli`, `webapp/cakephp2`) and writes results to `.sdd-forge/output/analysis.json` and `.sdd-forge/output/summary.json`. The `summary.json` is a lightweight version intended for AI consumption.

```bash
sdd-forge scan
```

#### init

Initializes the `docs/` directory structure by copying preset templates. Templates are resolved from `src/presets/{preset}/templates/{lang}/`. Existing files are not overwritten unless explicitly forced.

```bash
sdd-forge init
```

#### data

Resolves all `{{data: ...}}` directives found in `docs/` files, replacing them with structured data extracted from `analysis.json`. Directives outside template boundaries are left untouched.

```bash
sdd-forge data
```

#### text

Resolves `{{text: ...}}` directives in `docs/` files using the configured AI agent. Processes files concurrently up to the `limits.concurrency` setting. Optionally targets a single file.

| Option | Description |
|---|---|
| `--file <path>` | Process only the specified docs file |
| `--agent <name>` | Override the AI agent to use |

```bash
sdd-forge text
sdd-forge text --file docs/02_cli_commands.md
```

#### readme

Auto-generates `README.md` in the project root using the content of `docs/` as source material. The output is driven by the AI agent defined in the project config.

```bash
sdd-forge readme
```

#### forge

Iteratively improves one or more docs files using AI, guided by a prompt describing recent changes. When `--spec` is provided, the spec file is included as additional context for the AI.

| Option | Description |
|---|---|
| `--prompt <text>` | Description of changes to reflect in docs (required) |
| `--spec <path>` | Path to the spec file for additional context |

```bash
sdd-forge forge --prompt "Added translate command with --lang option"
sdd-forge forge --prompt "Refactored scanner" --spec specs/010-refactor/spec.md
```

#### review

Runs a quality check over the generated docs using AI, validating completeness, accuracy, and consistency with the source code. Outputs a PASS or FAIL result with actionable feedback.

```bash
sdd-forge review
```

#### changelog

Generates `change_log.md` by aggregating all spec files under `specs/`. Each spec contributes a changelog entry describing the feature or fix it represents.

```bash
sdd-forge changelog
```

#### agents

Updates `AGENTS.md` with the latest SDD instruction template and a newly generated PROJECT section derived from `analysis.json` / `summary.json`. The command supports partial updates via flags.

| Option | Description |
|---|---|
| `--sdd` | Update only the `<!-- SDD:START/END -->` section |
| `--project` | Update only the `<!-- PROJECT:START/END -->` section |
| `--dry-run` | Preview output without writing to disk |

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --dry-run
```

#### translate

Translates the generated docs into one or more additional output languages, as specified by `output.languages` in the project config. Uses `output.mode` (`translate` or `generate`) to determine the translation strategy.

| Option | Description |
|---|---|
| `--lang <code>` | Target language code to translate into (e.g., `en`, `ja`) |
| `--force` | Overwrite existing translated files |
| `--dry-run` | Preview without writing to disk |

```bash
sdd-forge translate --lang en
sdd-forge translate --lang en --force
```

#### upgrade

Updates the SDD-managed sections of `docs/` templates to match the latest version bundled with the installed `sdd-forge` package. Content outside directive boundaries is preserved.

```bash
sdd-forge upgrade
```

#### setup

Registers a new project with `sdd-forge` and generates the initial `.sdd-forge/config.json`. Guides the user through selecting a project type preset and configuring output language settings. Also creates `AGENTS.md` and a `CLAUDE.md` symlink.

```bash
sdd-forge setup
```

#### default

Sets or displays the default project for the current tool installation. The default project is stored in `.sdd-forge/projects.json` and used when `--project` is not specified.

```bash
sdd-forge default
sdd-forge default myproject
```

#### spec

Creates a new spec file under `specs/NNN-<slug>/spec.md` and optionally creates a feature branch. Used at the start of the SDD workflow for any new feature or fix.

| Option | Description |
|---|---|
| `--title <name>` | Title of the spec / feature (required) |
| `--no-branch` | Skip branch creation (e.g., when already inside a worktree) |

```bash
sdd-forge spec --title "Add translate command"
sdd-forge spec --title "Fix scanner" --no-branch
```

#### gate

Validates a spec file against defined acceptance criteria before (`--phase pre`) or after (`--phase post`) implementation. Reports each check item as PASS or FAIL.

| Option | Description |
|---|---|
| `--spec <path>` | Path to the spec file to validate (required) |
| `--phase <pre\|post>` | Gate phase; defaults to `pre` |

```bash
sdd-forge gate --spec specs/010-translate/spec.md
sdd-forge gate --spec specs/010-translate/spec.md --phase post
```

#### flow

Automatically executes the full SDD flow — spec creation, gate check, and implementation scaffolding — for a given natural-language request. Intended for AI agent environments where manual step-by-step execution is not practical.

| Option | Description |
|---|---|
| `--request <text>` | Natural-language description of the feature or fix |

```bash
sdd-forge flow --request "Add support for multilingual output"
```

#### presets

Lists all available project type presets bundled with `sdd-forge`, including architecture-layer presets (`webapp`, `cli`, `library`) and framework-specific presets (`cakephp2`, `laravel`, `symfony`, `node-cli`).

```bash
sdd-forge presets
```

#### help

Displays a summary of all available subcommands and their descriptions. Equivalent to running `sdd-forge` with no arguments.

```bash
sdd-forge help
sdd-forge -h
```

### Exit Codes and Output

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the fact that gate and review PASS/FAIL results are printed to stdout.}} -->

| Exit Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | General error (missing required option, file not found, configuration invalid, etc.) |
| `2` | Gate or review check failed (FAIL result reported; see stdout for details) |

**stdout / stderr usage:**

| Stream | Content |
|---|---|
| `stdout` | Primary command output: generated text, rendered tables, PASS/FAIL results from `gate` and `review`, dry-run previews |
| `stderr` | Progress indicators, warnings, debug information, and error messages |

`gate` and `review` always print their PASS/FAIL verdict and per-item check results to **stdout**, making them suitable for capture in CI pipelines. Error messages describing why a command could not run (missing config, invalid arguments, etc.) are written to **stderr** and do not appear in captured stdout.
