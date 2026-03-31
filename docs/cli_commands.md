<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents the CLI commands available in `sdd-forge`, covering 3 top-level namespaces (`docs`, `flow`) and standalone commands (`setup`, `upgrade`, `presets`, `help`), with a total of over 15 subcommands organized into a three-level dispatch hierarchy.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display grouped command listing with version | — |
| `sdd-forge setup` | Interactive project setup wizard | `--dry-run`, `--name`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--path`, `--work-root` |
| `sdd-forge upgrade` | Update skills and migrate config format | `--dry-run` |
| `sdd-forge presets list` | Display preset inheritance tree | — |
| `sdd-forge docs build` | Run full pipeline: scan → enrich → init → data → text → readme → agents → [translate] | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Scan source code and generate analysis | `--dry-run` |
| `sdd-forge docs enrich` | Enrich analysis with AI-generated roles and classifications | `--dry-run` |
| `sdd-forge docs init` | Initialize docs structure | `--dry-run` |
| `sdd-forge docs data` | Generate data directives | `--dry-run` |
| `sdd-forge docs text` | Generate text directives via AI | `--dry-run` |
| `sdd-forge docs readme` | Generate README | `--dry-run` |
| `sdd-forge docs forge` | Iterative docs improvement loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Review generated docs | `--dry-run` |
| `sdd-forge docs changelog` | Generate `docs/change_log.md` from specs/ | `--dry-run` |
| `sdd-forge docs agents` | Generate or update AGENTS.md | `--dry-run` |
| `sdd-forge docs translate` | Translate docs to non-default languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow get` | Get flow state value | — |
| `sdd-forge flow set` | Set flow state value | — |
| `sdd-forge flow run retro` | Evaluate spec accuracy against git diff using AI | `--force`, `--dry-run` |
| `sdd-forge flow merge` | Squash-merge feature branch or open PR | `--dry-run`, `--pr`, `--auto` |
| `sdd-forge flow cleanup` | Remove feature branch and/or worktree | `--dry-run` |
| `sdd-forge flow review` | Run multi-phase AI code review | `--dry-run`, `--skip-confirm` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Short | Description | Applicable To |
|---|---|---|---|
| `--help` | `-h` | Display help for the command | All commands |
| `--dry-run` | — | Preview actions without making changes | Most `docs` and `flow` commands |
| `--verbose` | `-v` | Show detailed output | `docs build`, `docs forge` |
| `--version` | `-v`, `-V` | Display the installed version of sdd-forge | Top-level entry point only |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge help

Displays a grouped listing of all available commands along with the current version.

No options beyond `--help/-h`.

```
sdd-forge help
```

#### sdd-forge setup

Interactive wizard for initializing a new sdd-forge project. Prompts for project metadata and creates the initial configuration.

| Option | Description |
|---|---|
| `--dry-run` | Preview configuration without writing files |
| `--name` | Project name |
| `--type` | Preset type (e.g. `node-cli`, `laravel`) |
| `--purpose` | Short description of the project's purpose |
| `--tone` | Documentation tone |
| `--agent` | Agent provider to use |
| `--lang` | Documentation language |
| `--path` | Source root path |
| `--work-root` | Work root path |

```
sdd-forge setup
sdd-forge setup --name my-project --type node-cli --dry-run
```

#### sdd-forge upgrade

Updates skill files (`.claude/skills/`, `.agents/skills/`) and migrates the project config format to the current version. Only changed files are overwritten.

| Option | Description |
|---|---|
| `--dry-run` | Preview changes without writing files |

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Displays the full preset inheritance tree, showing all available presets and their parent chains.

No options beyond `--help/-h`.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the complete documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate` (if non-default languages are configured).

| Option | Description |
|---|---|
| `--force` | Force regeneration of all outputs |
| `--regenerate` | Regenerate existing content without re-running init |
| `--dry-run` | Preview pipeline steps without writing files |
| `--verbose` / `-v` | Show detailed output for each step |

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

#### sdd-forge docs scan

Scans the source code and generates `analysis.json` stored in `.sdd-forge/output/`.

| Option | Description |
|---|---|
| `--dry-run` | Preview scan results without writing output |

```
sdd-forge docs scan
```

#### sdd-forge docs enrich

Passes the analysis to the configured AI agent to annotate each entry with role, summary, and chapter classification.

| Option | Description |
|---|---|
| `--dry-run` | Preview enrichment without writing output |

```
sdd-forge docs enrich
```

#### sdd-forge docs init

Initializes the docs directory structure from preset templates based on the project config.

| Option | Description |
|---|---|
| `--dry-run` | Preview initialization without writing files |

```
sdd-forge docs init
```

#### sdd-forge docs data

Populates `{{data}}` directives in docs chapter files from the enriched analysis.

| Option | Description |
|---|---|
| `--dry-run` | Preview data generation without writing files |

```
sdd-forge docs data
```

#### sdd-forge docs text

Generates AI-written prose for `{{text}}` directives in docs chapter files.

| Option | Description |
|---|---|
| `--dry-run` | Preview text generation without writing files |

```
sdd-forge docs text
```

#### sdd-forge docs readme

Generates the project `README.md` from the docs chapter files.

| Option | Description |
|---|---|
| `--dry-run` | Preview README generation without writing files |

```
sdd-forge docs readme
```

#### sdd-forge docs forge

Runs an iterative docs improvement loop: generates text, runs a review command, and refines until quality thresholds are met or the run limit is reached. Supports per-file mode when the configured agent has a `systemPromptFlag`.

| Option | Description |
|---|---|
| `--prompt` | Custom prompt string for the AI |
| `--prompt-file` | Path to a file containing the prompt |
| `--spec` | Spec file to use as context |
| `--max-runs` | Maximum improvement iterations (default: `3`) |
| `--review-cmd` | Review command to run (default: `sdd-forge docs review`) |
| `--mode` | Operation mode: `local`, `assist`, or `agent` |
| `--dry-run` | Preview actions without writing files |
| `--verbose` / `-v` | Show detailed output including agent stdout/stderr |

```
sdd-forge docs forge --prompt "Improve the overview section"
sdd-forge docs forge --max-runs 5 --mode agent --verbose
```

#### sdd-forge docs review

Reviews the generated documentation for quality issues.

| Option | Description |
|---|---|
| `--dry-run` | Preview review without writing output |

```
sdd-forge docs review
```

#### sdd-forge docs changelog

Scans the `specs/` directory and generates `docs/change_log.md` containing a latest-per-series index and a full all-specs table.

| Option | Description |
|---|---|
| `--dry-run` | Print changelog to stdout without writing the file |

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Generates or updates `AGENTS.md` (and the `CLAUDE.md` symlink) with the SDD directive block and project-specific context.

| Option | Description |
|---|---|
| `--dry-run` | Preview output without writing files |

```
sdd-forge docs agents
```

#### sdd-forge docs translate

Translates docs chapter files to non-default languages using AI. Uses file mtime comparison to skip already up-to-date targets.

| Option | Description |
|---|---|
| `--lang` | Restrict translation to a single target language code |
| `--force` | Re-translate all files regardless of mtime |
| `--dry-run` | Preview translation without writing files |

```
sdd-forge docs translate --lang ja
sdd-forge docs translate --lang ja --force
```

#### sdd-forge flow get

Retrieves a value from the current active flow state.

```
sdd-forge flow get <key>
```

#### sdd-forge flow set

Sets a value in the current active flow state.

```
sdd-forge flow set <key> <value>
```

#### sdd-forge flow run retro

Evaluates how accurately the spec predicted the implementation by comparing spec requirements against the git diff. Writes a per-requirement status assessment to `retro.json` in the spec directory.

| Option | Description |
|---|---|
| `--force` | Overwrite an existing `retro.json` |
| `--dry-run` | Preview evaluation without writing output |

```
sdd-forge flow run retro
sdd-forge flow run retro --force
```

#### sdd-forge flow merge

Squash-merges the feature branch into the base branch, or creates a GitHub pull request. The PR route is auto-selected when `config.commands.gh` is `'enable'` and the `gh` CLI is available.

| Option | Description |
|---|---|
| `--dry-run` | Print git/gh commands without executing them |
| `--pr` | Force PR creation instead of a direct squash merge |
| `--auto` | Auto-detect the route (PR if gh is configured and available, else squash) |

```
sdd-forge flow merge
sdd-forge flow merge --auto
sdd-forge flow merge --pr --dry-run
```

#### sdd-forge flow cleanup

Removes the feature branch and, in worktree mode, the associated git worktree. Clears the `.active-flow` entry from the flow state; the `flow.json` in `specs/` is preserved.

| Option | Description |
|---|---|
| `--dry-run` | Print cleanup commands without executing them |

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

#### sdd-forge flow review

Runs a multi-phase AI code review pipeline. A draft phase generates numbered improvement proposals, a final phase validates each proposal with APPROVED or REJECTED verdicts, and results are saved to `review.md` in the spec directory.

| Option | Description |
|---|---|
| `--dry-run` | Display proposals without applying them |
| `--skip-confirm` | Skip interactive confirmation prompts |

```
sdd-forge flow review
sdd-forge flow review --skip-confirm
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
|---|---|---|
| `0` | — | Success; command completed without errors |
| `1` | `EXIT_ERROR` | Error; covers unknown subcommands, missing required inputs, agent failures, and pipeline errors |

Normal output — help text, status messages, and generated content — is written to **stdout**. Error messages are written to **stderr** and are prefixed with `[command] ERROR:` (for example, `[build] ERROR: missing agent configuration`). Warnings are also written to stderr and are prefixed with `WARN:`. During long-running AI agent calls, progress is indicated by a dot-ticker written to stderr so the user receives feedback without polluting stdout. In `--verbose` mode, agent stdout and stderr are streamed directly to the terminal.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
