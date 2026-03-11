# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options are available, and the subcommand structure.}} -->

This chapter provides a complete reference for all sdd-forge CLI commands, covering the 19 subcommands available across documentation generation, specification management, and workflow automation. Commands are dispatched through a three-level architecture — top-level subcommands are routed to `docs.js`, `spec.js`, `flow.js`, or `presets-cmd.js` — and several global options apply across all invocations.
<!-- {{/text}} -->

## Contents

### Command List

<!-- {{text[mode=deep]: List all commands in a table format, including the command name, description, and key options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `build` | Run the full documentation pipeline: `scan → enrich → init → data → text → readme → agents → translate` | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `scan` | Analyse source files and write results to `.sdd-forge/output/analysis.json` | `--verbose` |
| `enrich` | Use AI to annotate each entry in `analysis.json` with `summary`, `detail`, `chapter`, and `role` fields | `--agent`, `--batch-size` |
| `init` | Initialise `docs/` chapter files from preset templates | `--force`, `--dry-run` |
| `data` | Resolve `{{data}}` directives in docs files using analysis data | `--dry-run` |
| `text` | Resolve `{{text}}` directives in docs files using AI-generated prose | `--agent`, `--dry-run` |
| `readme` | Generate `README.md` from the docs chapter files and preset README template | `--dry-run` |
| `forge` | Iteratively improve docs against source with AI | `--prompt`, `--spec`, `--mode`, `--max-runs`, `--dry-run` |
| `review` | Run the docs quality checklist and report PASS/FAIL | `--dry-run` |
| `changelog` | Generate `docs/change_log.md` from `specs/` metadata | `--dry-run` |
| `agents` | Update the `AGENTS.md` SDD and PROJECT sections | `--sdd`, `--project`, `--dry-run` |
| `translate` | Translate docs to non-default output languages | `--lang`, `--force`, `--dry-run` |
| `upgrade` | Update template-derived files (skills, etc.) to match the installed sdd-forge version | `--dry-run` |
| `setup` | Interactive wizard to register a project and generate `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--dry-run` |
| `default` | View or change the default project | *(project name as positional arg)* |
| `snapshot` | Save, compare, or update documentation snapshots for regression detection | `save \| check \| update` |
| `spec` | Create a numbered feature branch and initialise a `specs/NNN-slug/` directory | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `gate` | Check a spec for unresolved items before (pre) or after (post) implementation | `--spec`, `--phase` |
| `flow` | Automate the full SDD flow: spec creation → gate → forge | `--request`, `--title`, `--spec`, `--forge-mode`, `--max-runs`, `--dry-run` |
| `presets list` | Display the preset inheritance tree | *(no options)* |
<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: List all global options common to every command in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| Option | Alias | Description |
| --- | --- | --- |
| `--project <name>` | | Select a registered project by name. Sets `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` environment variables for the duration of the command. |
| `--help` | `-h` | Print usage information for the command and exit. |
| `--version` | `-v`, `-V` | Print the installed sdd-forge version and exit. |

> **Note:** The `setup`, `default`, `help`, and `presets` commands skip project context resolution entirely. They can be run without a `.sdd-forge/config.json` or a registered project, making them safe to use during initial setup or in environments where no project has been configured yet.
<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command accepts --lang, --force, and --dry-run options.}} -->

#### build

Runs the complete documentation pipeline in a single step. The pipeline executes the following stages in order: `scan → enrich → init → data → text → readme → agents → translate` (the translate stage is added automatically when `output.languages` contains more than one language). Each stage shares the same resolved project context, so no intermediate manual steps are required.

```
sdd-forge build [--agent <name>] [--force] [--dry-run] [--verbose]
```

| Option | Description |
| --- | --- |
| `--agent <name>` | Override the AI agent used for `enrich` and `text` steps |
| `--force` | Re-initialise docs even if chapter files already exist |
| `--dry-run` | Simulate all write operations without modifying any files |
| `--verbose` | Print progress details for each pipeline stage |

#### scan

Analyses source files according to the project `type` and preset scan configuration, then writes the results to `.sdd-forge/output/analysis.json`. The output is the foundation for all subsequent pipeline stages.

```
sdd-forge scan
```

#### enrich

Sends the entries in `analysis.json` to an AI agent in batches and writes back `summary`, `detail`, `chapter`, and `role` fields to each entry. Already-enriched entries are skipped on re-runs, so the command is safe to interrupt and resume.

```
sdd-forge enrich [--agent <name>] [--batch-size <n>]
```

#### init

Creates or refreshes chapter files in `docs/` using the preset templates that match the project `type`. Existing files are left unchanged unless `--force` is specified.

```
sdd-forge init [--force] [--dry-run]
```

#### data

Resolves `{{data: source.method(...)}}` directives in all `docs/*.md` files by querying the project's DataSource classes against the current `analysis.json`.

```
sdd-forge data [--dry-run]
```

#### text

Resolves `{{text: ...}}` directives in `docs/*.md` by calling the configured AI agent. Each directive is processed individually, preserving the surrounding structure defined by the template.

```
sdd-forge text [--agent <name>] [--dry-run]
```

#### readme

Generates `README.md` from the preset README template and the resolved `docs/` chapter files. `{{data}}` directives in the README template are resolved at generation time. Skips writing if the resulting content is identical to the existing file.

```
sdd-forge readme [--dry-run]
```

#### forge

Iteratively improves the documentation in `docs/` by sending the current source code and docs to an AI agent along with a change prompt. Supports three modes: `local` (update docs files directly), `assist` (print suggested changes), and `agent` (let the AI agent apply changes autonomously).

```
sdd-forge forge --prompt "<description>" [--spec <path>] [--mode local|assist|agent] [--max-runs <n>] [--dry-run]
```

#### review

Runs the docs quality checklist defined in `src/templates/review-checklist.md` and prints PASS or FAIL to stdout. Use this after `forge` to confirm that the documentation meets the project's quality standards.

```
sdd-forge review [--dry-run]
```

#### changelog

Scans the `specs/` directory, extracts metadata from each `spec.md`, and writes a consolidated `docs/change_log.md`. The output includes an index of the latest spec per series and a full chronological table.

```
sdd-forge changelog [<output-path>] [--dry-run]
```

#### agents

Updates the `AGENTS.md` file. By default both the `<!-- SDD:START/END -->` section (from the preset template) and the `<!-- PROJECT:START/END -->` section (AI-generated from `analysis.json`) are refreshed. Use `--sdd` or `--project` to update only one section.

```
sdd-forge agents [--sdd] [--project] [--dry-run]
```

#### translate

Translates `docs/*.md` files into the non-default languages listed in `output.languages`. In `translate` mode (the default) the AI agent translates the default-language files; in `generate` mode, `init → data → text → readme` are run independently for each target language.

```
sdd-forge translate [--lang <code>] [--force] [--dry-run]
```

#### upgrade

Updates template-derived files — primarily the skill SKILL.md files under `.agents/skills/` and their `.claude/skills/` symlinks — to match the currently installed sdd-forge version. Config files (`config.json`, `context.json`) are never modified. Also prints hints for any missing recommended config settings.

```
sdd-forge upgrade [--dry-run]
```

#### setup

Interactive wizard that registers a project, generates `.sdd-forge/config.json`, creates `AGENTS.md`, adds a `CLAUDE.md` symlink, and copies skill files. Supports both interactive (readline) and non-interactive (CLI flags) modes.

```
sdd-forge setup [--name <name>] [--path <path>] [--type <type>] [--agent <name>] [--dry-run]
```

#### default

With no arguments, lists all registered projects and marks the current default. With a project name argument, sets that project as the new default.

```
sdd-forge default [<project-name>]
```

#### snapshot

Saves, compares, or updates documentation snapshots stored in `.sdd-forge/snapshots/`. Use `check` in CI to detect unintended regressions across `analysis.json`, `docs/*.md`, and `README.md`.

```
sdd-forge snapshot save | check | update
```

#### spec

Creates a numbered feature branch and initialises the corresponding `specs/NNN-slug/` directory with `spec.md` and `qa.md` files. The sequence number is derived automatically from existing specs and branches. Branching strategy is controlled by `--no-branch` (spec files only) or `--worktree` (isolated git worktree).

```
sdd-forge spec --title "<feature name>" [--base <branch>] [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

#### gate

Validates a spec file for unresolved items before (`--phase pre`, the default) or after (`--phase post`) implementation. Checks include: unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked tasks, required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`), and the presence of a `- [x] User approved this spec` line.

```
sdd-forge gate --spec <path/to/spec.md> [--phase pre|post]
```

#### flow

Automates the full SDD loop: optionally creates a spec, runs `gate`, and — on success — invokes `forge`. If the gate fails, the command exits with code 2 and prints the unresolved items so the user can address them before re-running.

```
sdd-forge flow --request "<request text>" [--title <title>] [--spec <path>] [--forge-mode local|assist|agent] [--max-runs <n>] [--no-branch] [--worktree] [--dry-run]
```

#### presets list

Prints the preset inheritance tree to stdout, showing architecture-layer roots (`webapp`, `cli`, `library`) and their framework-specific leaf presets with aliases and scan categories.

```
sdd-forge presets list
sdd-forge presets          # same as list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the point that gate and review PASS/FAIL results are written to stdout.}} -->

| Exit Code | Meaning |
| --- | --- |
| `0` | Command completed successfully. |
| `1` | General error — invalid arguments, missing required files, unexpected runtime failure, or a gate/review FAIL result. |
| `2` | Gate needs input — `sdd-forge gate` or `sdd-forge flow` detected unresolved spec items and requires user action before proceeding. |

**stdout vs. stderr conventions:**

| Stream | Content |
| --- | --- |
| `stdout` | Primary command output: generated file contents (`--dry-run`), PASS/FAIL verdicts from `gate` and `review`, progress messages, and informational summaries. |
| `stderr` | Error messages, warnings (e.g. skipped steps due to missing `defaultAgent`), and stack traces. |

Because `gate` and `review` write their PASS/FAIL verdict to stdout, you can capture and parse the result in scripts:

```bash
sdd-forge gate --spec specs/001-my-feature/spec.md
# stdout: "gate: PASSED" or list of issues followed by exit code 1 or 2
```

The `build` command uses an in-process progress bar and routes per-step warnings to the progress logger (visible with `--verbose`), keeping stdout clean for redirection.
<!-- {{/text}} -->
