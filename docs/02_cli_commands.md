# 02. CLI Command Reference

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

This chapter covers all 16 subcommands provided by the `sdd-forge` CLI, organized into documentation generation commands, SDD workflow commands, and utility commands. A small set of global options (such as `--project` and `--help`) are available across most commands, while individual subcommands expose their own flags.

## Contents

### Command List

<!-- {{text: List all commands in a table format. Include the command name, description, and primary options.}} -->

| Command | Description | Primary Options |
|---|---|---|
| `build` | Run the full documentation pipeline (scan → init → data → text → readme) | — |
| `scan` | Analyze source code and output `analysis.json` | — |
| `init` | Initialize `docs/` from preset templates | — |
| `data` | Resolve `{{data}}` directives with extracted analysis data | — |
| `text` | Resolve `{{text}}` directives using an AI agent | `--agent <name>` |
| `readme` | Auto-generate `README.md` from docs | — |
| `forge` | Iteratively improve docs with AI | `--prompt "<content>"`, `--spec <path>` |
| `review` | Run a quality check on generated docs | — |
| `changelog` | Generate `change_log.md` from `specs/` | — |
| `agents` | Update `AGENTS.md` / `CLAUDE.md` | `--sdd`, `--project`, `--dry-run` |
| `spec` | Initialize a new spec (feature branch + `spec.md`) | `--title "<name>"` |
| `gate` | Run a spec gate check | `--spec <path>`, `--phase pre\|post` |
| `flow` | Run the full SDD workflow automatically | `--request "<request>"` |
| `setup` | Register the project and generate `.sdd-forge/config.json` | — |
| `presets` | List available project-type presets | — |
| `help` | Display the full command list | — |

### Global Options

<!-- {{text: List the global options common to all commands in a table format.}} -->

| Option | Alias | Description |
|---|---|---|
| `--project <name>` | — | Target a specific registered project by name (reads from `.sdd-forge/projects.json`) |
| `--help` | `-h` | Display help text for the command |
| `--version` | `-v`, `-V` | Print the installed `sdd-forge` version and exit |

> `setup`, `default`, `help`, and `presets` skip project context resolution and do not require `--project`.

### Command Details

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a subsection for each command.}} -->

#### `build`

Runs the complete documentation generation pipeline in a single step: `scan` → `init` → `data` → `text` → `readme`. Use this command to regenerate all docs from scratch or after significant source-code changes.

```bash
sdd-forge build
```

#### `scan`

Analyzes the source code of the registered project and writes the results to `.sdd-forge/output/analysis.json` (and a lightweight `.sdd-forge/output/summary.json`). The scan behavior is determined by the `type` field in `config.json` and the matching preset's `scan` configuration.

```bash
sdd-forge scan
```

#### `init`

Initializes the `docs/` directory by copying preset templates for the configured project type. Existing files are not overwritten unless explicitly instructed.

```bash
sdd-forge init
```

#### `data`

Resolves all `{{data: ...}}` directives found in `docs/` files by substituting structured data extracted from `analysis.json`. This step does not call any AI agent.

```bash
sdd-forge data
```

#### `text`

Resolves all `{{text: ...}}` directives in `docs/` files by generating descriptive text via the configured AI agent. The agent is specified in `config.json` or overridden with `--agent`.

```bash
sdd-forge text --agent claude
```

| Option | Description |
|---|---|
| `--agent <name>` | Override the AI agent defined in `config.json` |

#### `readme`

Generates `README.md` at the project root from the content of `docs/`. The output language is determined by `config.json`'s `output.default` field.

```bash
sdd-forge readme
```

#### `forge`

Iteratively reviews and improves the current `docs/` content using an AI agent, guided by the provided prompt. Typically run after implementation as part of the SDD close flow.

```bash
sdd-forge forge --prompt "Added CSV export feature to reports"
sdd-forge forge --prompt "Updated auth logic" --spec specs/005-auth/spec.md
```

| Option | Description |
|---|---|
| `--prompt "<text>"` | Summary of the change that docs should reflect **(required)** |
| `--spec <path>` | Scope the improvement to a specific spec context |

#### `review`

Checks the quality and consistency of generated docs against the review checklist (`.sdd-forge/review-checklist.md` or the bundled default). Exits non-zero when issues are found; re-run after applying fixes.

```bash
sdd-forge review
```

#### `changelog`

Scans the `specs/` directory and consolidates spec entries into `docs/change_log.md`.

```bash
sdd-forge changelog
```

#### `agents`

Updates the `AGENTS.md` (and the `CLAUDE.md` symlink) file. By default, it refreshes both the `<!-- SDD:START/END -->` template section and the `<!-- PROJECT:START/END -->` generated section.

```bash
sdd-forge agents
sdd-forge agents --sdd          # Update SDD section only
sdd-forge agents --project      # Update PROJECT section only
sdd-forge agents --dry-run      # Preview changes without writing
```

| Option | Description |
|---|---|
| `--sdd` | Refresh only the `<!-- SDD:START/END -->` template block |
| `--project` | Refresh only the `<!-- PROJECT:START/END -->` generated block |
| `--dry-run` | Print the result to stdout without writing to disk |

#### `spec`

Creates a new SDD spec: initializes a `specs/NNN-<slug>/spec.md` file and (optionally) a feature branch.

```bash
sdd-forge spec --title "Add CSV export"
```

| Option | Description |
|---|---|
| `--title "<name>"` | Human-readable title for the spec **(required)** |
| `--no-branch` | Skip branch creation (used automatically inside worktrees) |

#### `gate`

Runs a gate check against a spec file to verify that all required fields and decisions are in place before (pre) or after (post) implementation.

```bash
sdd-forge gate --spec specs/003-csv-export/spec.md
sdd-forge gate --spec specs/003-csv-export/spec.md --phase post
```

| Option | Description |
|---|---|
| `--spec <path>` | Path to the `spec.md` file to check **(required)** |
| `--phase pre\|post` | Gate phase (default: `pre`) |

#### `flow`

Runs the full SDD workflow automatically from a natural-language request: spec creation → gate check → implementation guidance → doc update.

```bash
sdd-forge flow --request "Add password reset via email"
```

| Option | Description |
|---|---|
| `--request "<text>"` | Feature or fix request in plain language **(required)** |

#### `setup`

Registers the current (or specified) project in `.sdd-forge/projects.json` and generates an initial `.sdd-forge/config.json` interactively.

```bash
sdd-forge setup
```

#### `presets`

Lists all available project-type presets (e.g., `webapp/cakephp2`, `cli/node-cli`) with their descriptions and supported scan categories.

```bash
sdd-forge presets
```

#### `help`

Displays a formatted list of all available commands with short descriptions.

```bash
sdd-forge help
sdd-forge --help
```

### Exit Codes and Output

<!-- {{text: Describe exit code definitions (e.g., 0 = success) and the rules for stdout/stderr usage in a table format.}} -->

| Exit Code | Meaning |
|---|---|
| `0` | Command completed successfully |
| `1` | General error (invalid arguments, missing config, file I/O failure, etc.) |
| `2` | Gate check failed (`gate` command — unresolved spec issues detected) |
| `3` | Review check failed (`review` command — quality issues detected in docs) |

**stdout / stderr conventions:**

| Stream | Usage |
|---|---|
| `stdout` | Primary command output: generated text, table listings, pass/fail results, dry-run previews |
| `stderr` | Diagnostic messages, warnings, progress indicators, and error details |

Commands that write files (such as `build`, `forge`, and `agents`) emit a confirmation line to stdout for each file written. When `--dry-run` is available, the output that would be written is sent to stdout instead, and no files are modified.
