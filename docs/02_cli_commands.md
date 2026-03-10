# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

`sdd-forge` provides 19 subcommands organized across a three-level dispatch architecture: top-level commands route through `docs.js`, `spec.js`, `flow.js`, or `presets-cmd.js` dispatchers before reaching individual command modules. A set of global options applies across all commands, while certain administrative commands bypass project context resolution entirely.

## Contents

### Command List

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| Command | Description | Key Options |
|---|---|---|
| `build` | Run the full documentation pipeline: `scan → init → data → text → readme → agents → translate` | `--project` |
| `scan` | Analyze source code and output `analysis.json` to `.sdd-forge/output/` | `--project` |
| `init` | Initialize `docs/` directory from preset templates | `--project`, `--force` |
| `data` | Resolve `{{data}}` directives in `docs/` using analysis data | `--project` |
| `text` | Resolve `{{text}}` directives in `docs/` using AI | `--project`, `--agent` |
| `readme` | Auto-generate `README.md` from docs content | `--project` |
| `forge` | Iteratively improve docs quality with AI | `--prompt`, `--spec`, `--project` |
| `review` | Run quality checks on generated docs | `--project` |
| `changelog` | Generate `change_log.md` from accumulated `specs/` entries | `--project` |
| `agents` | Update `AGENTS.md` with SDD and project sections | `--sdd`, `--project`, `--dry-run` |
| `snapshot` | Snapshot testing for regression detection (`save` / `check` / `update`) | `--project` |
| `upgrade` | Update docs templates to the latest preset version | `--project`, `--dry-run` |
| `translate` | Translate docs into additional languages | `--lang`, `--force`, `--dry-run` |
| `setup` | Register a project and generate initial configuration | — |
| `default` | Set the default project for subsequent commands | — |
| `spec` | Initialize a new SDD spec file with a feature branch | `--title`, `--no-branch` |
| `gate` | Run spec gate checks before or after implementation | `--spec`, `--phase` |
| `flow` | Automate the full SDD workflow from request to implementation | `--request` |
| `presets` | List all available presets and their metadata | — |
| `help` | Display the command list and usage summary | — |

### Global Options

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| Option | Alias | Description |
|---|---|---|
| `--project <name>` | — | Specify the target project by name, looked up from `.sdd-forge/projects.json`. When omitted, the project marked as `default` in `projects.json` is used. |
| `--help` | `-h` | Display usage information for the given command and exit. |
| `--version` | `-v`, `-V` | Print the installed `sdd-forge` version (read from `package.json`) and exit. |

> **Note:** The commands `setup`, `default`, `help`, and `presets` skip project context resolution and do not require a registered project to be configured. All other commands resolve `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` environment variables from the project context before execution.

### Command Details

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

Executes the complete documentation generation pipeline in sequence:

```
scan → init → data → text → readme → agents → [translate]
```

The `translate` step runs only when multiple output languages are configured in `.sdd-forge/config.json`. Each step is executed with the resolved project context.

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

Analyzes the source code of the target project and writes structured output to `.sdd-forge/output/analysis.json`. The scan behavior is governed by the project type (e.g., `cli/node-cli`, `webapp/cakephp2`) defined in `config.json`.

```bash
sdd-forge scan
```

#### init

Initializes the `docs/` directory by copying preset templates that match the configured project type and language. Use `--force` to overwrite an existing `docs/` directory.

```bash
sdd-forge init
sdd-forge init --force
```

#### data

Resolves all `{{data}}` directives found in `docs/` files by substituting them with structured data extracted from `analysis.json`. Directives outside `{{data}}` / `{{/data}}` blocks are left untouched.

```bash
sdd-forge data
```

#### text

Resolves all `{{text}}` directives in `docs/` files by invoking the configured AI agent. The agent reads the surrounding document context and relevant source code to generate section body text. Use `--agent` to override the default agent.

```bash
sdd-forge text
sdd-forge text --agent claude
```

#### readme

Generates `README.md` in the project root by aggregating content from the `docs/` directory according to the active preset's readme template.

```bash
sdd-forge readme
```

#### forge

Iteratively improves docs quality by passing a change summary to the AI agent, which then updates affected sections in `docs/`. Optionally scope improvements to changes described in a spec file.

```bash
sdd-forge forge --prompt "Added user authentication module"
sdd-forge forge --prompt "Refactored routing layer" --spec specs/012-routing/spec.md
```

#### review

Runs the docs quality checklist against the current `docs/` contents and reports PASS or FAIL to stdout. The review checklist is loaded from `src/templates/review-checklist.md`.

```bash
sdd-forge review
```

#### changelog

Reads all accumulated `specs/` directories and generates a `change_log.md` summarizing the history of implemented features and fixes.

```bash
sdd-forge changelog
```

#### agents

Regenerates `AGENTS.md` by updating the SDD section (from `src/presets/base/templates/{lang}/AGENTS.sdd.md`) and the PROJECT section (generated from `analysis.json` and refined by AI). Use `--sdd` or `--project` to update only one section.

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project --dry-run
```

#### snapshot

Captures and compares the current state of generated outputs for regression detection. Captured targets include `analysis.json`, all `docs/*.md` files, and `README.md`.

| Subcommand | Description |
|---|---|
| `save` | Save the current output as a named snapshot |
| `check` | Compare current output against the saved snapshot |
| `update` | Overwrite the saved snapshot with the current output |

```bash
sdd-forge snapshot save
sdd-forge snapshot check
sdd-forge snapshot update
```

#### upgrade

Updates the `docs/` template files to the latest version provided by the installed preset, preserving manually authored content outside directive blocks.

```bash
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### translate

Translates existing `docs/` content into one or more additional languages as defined in `config.json`. Use `--lang` to target a specific language, `--force` to re-translate already translated files, and `--dry-run` to preview without writing.

| Option | Description |
|---|---|
| `--lang <code>` | Target language code (e.g., `en`, `ja`) |
| `--force` | Re-translate files that already exist in the target language |
| `--dry-run` | Preview translation without writing files |

```bash
sdd-forge translate --lang en
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

#### setup

Registers a new project by prompting for the source path, work root, and project type, then generates an initial `.sdd-forge/config.json`. This command skips project context resolution and can be run before any project is configured.

```bash
sdd-forge setup
```

#### default

Sets the default project in `.sdd-forge/projects.json` so that subsequent commands can omit the `--project` flag.

```bash
sdd-forge default myproject
```

#### spec

Creates a new SDD spec file under `specs/NNN-<title>/spec.md` and, by default, checks out a new feature branch. Use `--no-branch` when working inside a git worktree.

```bash
sdd-forge spec --title "Add CSV export"
sdd-forge spec --title "Fix auth bug" --no-branch
```

#### gate

Validates a spec file against the SDD gate checklist. Run with `--phase pre` (default) before implementation to confirm readiness, or `--phase post` after implementation to verify completion.

```bash
sdd-forge gate --spec specs/012-csv-export/spec.md
sdd-forge gate --spec specs/012-csv-export/spec.md --phase post
```

#### flow

Automates the full SDD workflow — from spec creation through gate check and implementation — based on a natural-language request. This is a direct command with no subcommand routing.

```bash
sdd-forge flow --request "Add CSV export for report data"
```

#### presets

Lists all presets available in the installed `sdd-forge` package, including their type identifiers, architecture layer, and supported aliases.

```bash
sdd-forge presets
```

#### help

Displays a summary of all available subcommands and their descriptions.

```bash
sdd-forge help
sdd-forge -h
```

### Exit Codes and Output

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| Exit Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | General error (invalid arguments, missing configuration, file I/O failure, etc.) |
| `1` | Gate check returned FAIL (implementation should not proceed) |
| `1` | Review check returned FAIL (docs quality did not meet the checklist threshold) |

**stdout / stderr conventions:**

| Stream | Usage |
|---|---|
| `stdout` | Primary command output: generated content, table data, PASS/FAIL verdicts, and progress messages |
| `stderr` | Diagnostic messages, warnings, and error details that do not form part of the command's primary output |

> `gate` and `review` write their PASS or FAIL result to `stdout` so that the outcome can be captured by scripts and CI pipelines. Detailed diagnostic information accompanying a FAIL result may additionally appear on `stderr`.
