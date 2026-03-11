# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

This chapter covers all 20 commands available in `sdd-forge`, organized across six functional categories: Project, Build, Docs, Scan, Spec, and Flow. Commands follow a three-level dispatch structure — the top-level entry point (`sdd-forge.js`) routes to a category dispatcher (`docs.js`, `spec.js`, or `flow.js`), which in turn delegates to individual command implementations under `src/docs/commands/` and `src/specs/commands/`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | Category | Description | Key Options |
| --- | --- | --- | --- |
| `help` | Info | Display available commands with descriptions | — |
| `setup` | Project | Interactive wizard to register a project and generate `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Project | Upgrade template-derived files (skills, AGENTS.md) to the installed version | `--dry-run` |
| `default` | Project | Show registered projects or set the default project | `[<name>]` |
| `build` | Build | Run the full pipeline: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `init` | Docs | Initialize `docs/` directory from preset templates | `--force`, `--dry-run` |
| `forge` | Docs | Iteratively improve docs using AI against a prompt or spec | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | Docs | Run a quality check against the generated docs | — |
| `changelog` | Docs | Generate `docs/change_log.md` by scanning `specs/` | `--dry-run` |
| `agents` | Docs | Generate or update `AGENTS.md` | `--sdd`, `--project`, `--dry-run` |
| `readme` | Docs | Generate `README.md` from docs chapter files | `--dry-run` |
| `translate` | Docs | Translate docs into non-default output languages | `--dry-run` |
| `scan` | Scan | Analyse source code and write `.sdd-forge/output/analysis.json` | — |
| `enrich` | Scan | Use AI to annotate each analysis entry with role, summary, and chapter classification | `--agent` |
| `data` | Scan | Resolve `{{data}}` directives in docs using analysis data | `--dry-run` |
| `text` | Scan | Resolve `{{text}}` directives in docs using AI | `--agent`, `--dry-run` |
| `spec` | Spec | Create a numbered feature branch and initialise `specs/NNN-slug/` | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | Spec | Check a `spec.md` for unresolved items before (pre) or after (post) implementation | `--spec`, `--phase` |
| `flow` | Flow | Automate the full SDD flow: spec creation → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | Info | Display the preset inheritance tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

The following options are processed by the top-level entry point (`src/sdd-forge.js`) before any subcommand runs and therefore apply to every command.

| Option | Description |
| --- | --- |
| `--project <name>` | Select a named project from `.sdd-forge/projects.json`. Sets `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` environment variables for the duration of the command. |
| `-v`, `--version`, `-V` | Print the installed `sdd-forge` version and exit. |
| `-h`, `--help` | Print the top-level command list and exit. When passed to a specific subcommand, print that command's help text and exit. |

The `--dry-run` flag is supported by most mutating commands and is documented per command below. When active it prevents all filesystem writes and prints what would have been written to stdout instead.
<!-- {{/text}} -->

### Command Details

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

Prints a formatted list of all available commands grouped by section, with the current version number. No options are accepted; pass `-h` or `--help` to any other command to get that command's help.

```
sdd-forge help
```

#### setup

Interactive wizard that registers a project and writes `.sdd-forge/config.json`. When called without flags it opens a step-by-step prompt covering UI language, project name, source path, output languages, architecture type, documentation style, and AI agent selection. All steps can be bypassed with CLI flags for scripted or CI use.

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/laravel --lang en --agent claude
```

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Absolute path to the source directory |
| `--work-root <path>` | Override the working root (defaults to `--path`) |
| `--type <type>` | Preset type string, e.g. `webapp/laravel`, `cli`, `library` |
| `--lang <lang>` | Default output language code, e.g. `en`, `ja` |
| `--purpose <text>` | One-line project purpose for the docs style prompt |
| `--tone <text>` | Preferred writing tone for AI-generated text |
| `--agent <name>` | Default AI agent (`claude`, `codex`, or skip) |
| `--set-default` | Mark this project as the default |
| `--no-default` | Do not change the current default project |
| `--dry-run` | Print what would be written without making changes |

#### upgrade

Upgrades template-managed files — currently the skill `SKILL.md` files under `.agents/skills/` and their `.claude/skills/` symlinks — to match the currently installed `sdd-forge` version. Config files (`config.json`, `context.json`) are never modified. Safe to run repeatedly.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Report which files would be updated without writing |

#### default

With no arguments, lists all registered projects and marks the current default. With a project name, sets that project as the new default.

```
sdd-forge default
sdd-forge default myapp
```

#### build

Runs the complete documentation pipeline in sequence: `scan → enrich → init → data → text → readme → agents`, plus `translate` when multi-language output is configured. Each step is tracked with a progress bar. The `enrich` and `text` steps are skipped with a warning when `defaultAgent` is not configured.

```
sdd-forge build
sdd-forge build --agent claude --verbose
sdd-forge build --dry-run
```

| Option | Description |
| --- | --- |
| `--agent <name>` | AI agent to use for `enrich` and `text` steps (overrides `config.defaultAgent`) |
| `--force` | Pass `--force` to the `init` step to overwrite existing chapter files |
| `--dry-run` | Pass `--dry-run` to all steps; no files are written |
| `--verbose` | Print per-step log output during the pipeline run |

#### init

Initialises or refreshes the `docs/` directory from preset templates. Existing chapter files are not overwritten unless `--force` is given.

```
sdd-forge init
sdd-forge init --force
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Print which files would be created or updated |

#### forge

Iteratively improves documentation files using AI. On each run the agent reads the current docs, applies the prompt or spec requirements, and writes updated files. Stops after `--max-runs` iterations or when the review passes.

```
sdd-forge forge --prompt "Add a section on configuration file format"
sdd-forge forge --spec specs/042-config-docs/spec.md --mode agent --max-runs 3
```

| Option | Description |
| --- | --- |
| `--prompt <text>` | Free-text instruction for the AI |
| `--spec <path>` | Path to a `spec.md` to drive the improvement |
| `--max-runs <n>` | Maximum improvement iterations (default: `5`) |
| `--mode <mode>` | `local` (default), `assist`, or `agent` |
| `--agent <name>` | AI agent to use |
| `--dry-run` | Run without writing files |

#### review

Checks the generated docs against the review checklist and reports any quality issues. Exits non-zero when issues are found.

```
sdd-forge review
```

#### changelog

Scans the `specs/` directory, extracts metadata from each `spec.md` (title, status, created date, branch), and writes `docs/change_log.md` containing an index of the latest spec per series and a full chronological table.

```
sdd-forge changelog
sdd-forge changelog --dry-run
```

| Option | Description |
| --- | --- |
| `[output-path]` | Optional override for the output file (default: `docs/change_log.md`) |
| `--dry-run` | Print the generated content to stdout without writing |

#### agents

Generates or updates `AGENTS.md` (and the `CLAUDE.md` symlink) with current SDD tooling instructions and project-specific context.

```
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project
```

| Option | Description |
| --- | --- |
| `--sdd` | Regenerate only the SDD template section |
| `--project` | Regenerate only the project context section |
| `--dry-run` | Print output without writing |

#### readme

Generates the root `README.md` from the preset README template and the current docs chapter files. Resolves `{{data}}` directives at generation time. Skips writing if the content is unchanged.

```
sdd-forge readme
sdd-forge readme --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Print generated content without writing |

#### translate

Translates docs into non-default languages configured in `config.output.languages`. The translation mode (`translate` or `generate`) is determined by `config.output.mode`.

```
sdd-forge translate
sdd-forge translate --dry-run
```

#### scan

Analyses the source code under the configured source root and writes the result to `.sdd-forge/output/analysis.json`. No AI call is made; this step is purely static analysis using the configured preset scanner.

```
sdd-forge scan
```

#### enrich

Sends the analysis data to the AI agent to annotate each entry with a `role`, `summary`, `detail`, and chapter classification. Writes the enriched data back to `analysis.json`.

```
sdd-forge enrich --agent claude
```

| Option | Description |
| --- | --- |
| `--agent <name>` | AI agent to use (required if `defaultAgent` is not set) |

#### data

Resolves all `{{data: source.method(...)}}` directives in the docs chapter files using the current `analysis.json`. Does not invoke AI.

```
sdd-forge data
sdd-forge data --dry-run
```

| Option | Description |
| --- | --- |
| `--dry-run` | Print resolved content without writing |

#### text

Resolves all `{{text: ...}}` directives in the docs chapter files using AI. Only directives that have not yet been filled (or are empty) are processed unless `--force` is given.

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

| Option | Description |
| --- | --- |
| `--agent <name>` | AI agent to use |
| `--dry-run` | Print generated text without writing |

#### spec

Creates a sequentially numbered feature branch (`feature/NNN-slug`) and initialises the corresponding `specs/NNN-slug/` directory with `spec.md` and `qa.md` templates.

```
sdd-forge spec --title "user authentication"
sdd-forge spec --title "user authentication" --no-branch
sdd-forge spec --title "user authentication" --worktree
```

| Option | Description |
| --- | --- |
| `--title <text>` | Feature title (required); converted to a URL-friendly slug |
| `--base <branch>` | Base branch to branch from (default: current HEAD) |
| `--no-branch` | Create spec files only without creating a Git branch |
| `--worktree` | Create a dedicated Git worktree for the feature branch |
| `--allow-dirty` | Skip the clean-worktree check |
| `--dry-run` | Print what would be created without making changes |

#### gate

Checks a `spec.md` for unresolved items and missing required sections. In `pre` phase (default), unchecked items in `Status`, `Acceptance Criteria`, and `User Scenarios & Testing` sections are allowed. In `post` phase all items must be checked.

```
sdd-forge gate --spec specs/042-auth/spec.md
sdd-forge gate --spec specs/042-auth/spec.md --phase post
```

| Option | Description |
| --- | --- |
| `--spec <path>` | Path to the `spec.md` file to check (required) |
| `--phase <pre\|post>` | Check phase: `pre` (before implementation) or `post` (after implementation); default `pre` |

The following conditions cause a gate failure: presence of `[NEEDS CLARIFICATION]`, `TBD`, `TODO`, or `FIXME` tokens; unchecked `- [ ]` items outside exempt sections; missing `## Clarifications`, `## Open Questions`, or `## User Confirmation` sections; absence of `- [x] User approved this spec` in `## User Confirmation`; and missing `## Acceptance Criteria` or `## User Scenarios` section.

#### flow

Automates the full SDD flow: creates a spec (unless `--spec` is given), runs `gate`, and on success runs `forge`. If gate fails, it prints `NEEDS_INPUT` with the blocking reasons and exits with code `2`.

```
sdd-forge flow --request "Add CSV export to the orders page"
sdd-forge flow --request "Fix pagination bug" --spec specs/039-pagination/spec.md
sdd-forge flow --request "Refactor auth module" --forge-mode agent --max-runs 3
```

| Option | Description |
| --- | --- |
| `--request <text>` | User request text (required) |
| `--title <text>` | Override the derived spec title slug |
| `--spec <path>` | Use an existing spec instead of creating a new one |
| `--agent <name>` | AI agent to use for forge |
| `--max-runs <n>` | Maximum forge iterations (default: `5`) |
| `--forge-mode <mode>` | `local` (default), `assist`, or `agent` |
| `--no-branch` | Create spec files without creating a Git branch |
| `--worktree` | Create a dedicated Git worktree |
| `--dry-run` | Dry-run all child commands |

#### presets list

Prints the full preset inheritance tree to stdout, showing architecture-layer presets as nodes and framework-specific presets as leaves with their aliases and scan categories.

```
sdd-forge presets list
sdd-forge presets
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| Exit Code | Meaning | Typical source |
| --- | --- | --- |
| `0` | Success | Normal command completion; `build` explicitly calls `process.exit(0)` after the pipeline finishes |
| `1` | General error | Invalid arguments, missing required flags, file-not-found errors, gate check failure when called directly, or any unhandled exception |
| `2` | Gate blocked — needs input | `flow` command when the gate step fails; the blocking reasons are printed to stdout before exit |

**stdout** carries user-facing progress messages, generated content (when `--dry-run` is active), and structured output such as the command list from `help` or the preset tree from `presets list`.

**stderr** carries error messages, warnings (e.g. `[enrich] WARN: no defaultAgent configured`), and gate failure details (e.g. `- line 12: unresolved token (TBD)`).

Commands that produce file output (such as `data`, `text`, `readme`, and `changelog`) print a confirmation message to stdout on success (e.g. `[readme] updated`) and skip writing when content is unchanged, printing a `no changes` notice instead. The `--dry-run` flag redirects would-be file writes to stdout, preceded by a `---` separator or a dry-run notice on stderr.
<!-- {{/text}} -->
