<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The sdd-forge CLI provides 20 commands organized under two namespace dispatchers (`docs`, `flow`) plus four independent top-level commands (`help`, `setup`, `upgrade`, `presets`). Most documentation-related operations are invoked as `docs <subcommand>` and most spec workflow operations as `flow <subcommand>`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `help` | Print command reference and usage overview | — |
| `setup` | Interactive project wizard; creates `.sdd-forge/config.json`, deploys skills, writes AGENTS.md/CLAUDE.md | `--name`, `--type`, `--purpose`, `--tone`, `--lang`, `--agent`, `--path`, `--work-root`, `--dry-run` |
| `upgrade` | Update skills and SDD directive block in AGENTS.md; migrate chapters to object format | `--dry-run` |
| `docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → (translate) | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `docs scan` | Analyse source files and write `analysis.json` to `.sdd-forge/output/` | — |
| `docs enrich` | AI-assisted enrichment pass; annotates each analysis entry with role, summary, and chapter classification | — |
| `docs init` | Initialise docs chapter files from preset templates | `--force` |
| `docs data` | Resolve `{{data}}` directives and inject structured data into chapter files | — |
| `docs text` | Resolve `{{text}}` directives; generate prose sections via AI | — |
| `docs readme` | Assemble final README/docs output from chapter files | — |
| `docs forge` | One-shot local forge mode for targeted doc generation | — |
| `docs review` | AI review pass over generated documentation | — |
| `docs translate` | Translate docs into additional languages; mtime-based incremental updates | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate changelog from specs/ NNN-series directories | `--dry-run`, `[output-path]` |
| `docs agents` | Generate or update AGENTS.md with project context | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | Capture a snapshot of current docs state | — |
| `flow get` | Read a value from the current flow state | `<key>` |
| `flow set` | Write a value into the current flow state | `<key> <field> <value>` |
| `flow run` | Execute a named flow command | `<command>`, `--auto` |
| `presets list` | Display the full preset inheritance tree with keys, labels, axes, aliases, and scan keys | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `-v`, `-V`, `--version` | Top-level | Print the installed sdd-forge version and exit |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs translate`, `docs changelog`, `docs agents` | Simulate execution and print what would be written without modifying any files |
| `--force` | `docs build`, `docs init`, `docs translate` | Overwrite existing files; in `docs build` re-runs init; in `docs translate` retranslates all files regardless of mtime |
| `--verbose` | `docs build` | Emit per-step log lines in addition to the progress bar |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

**Usage:** `sdd-forge help`

Prints the full command reference to stdout. No options. Exits with code 0.

#### setup

**Usage:** `sdd-forge setup [options]`

Interactive project wizard. When all options are supplied on the command line, runs non-interactively.

| Option | Description |
|---|---|
| `--name` | Project name |
| `--type` | Preset type (leaf name, e.g. `node-cli`) |
| `--purpose` | Short purpose statement for docs style |
| `--tone` | Prose tone (e.g. `technical`) |
| `--lang` | Primary language code (e.g. `en`) |
| `--agent` | Agent provider identifier |
| `--path` | Source root path |
| `--work-root` | Work root path |
| `--dry-run` | Print actions without writing files |

**Creates:** `.sdd-forge/config.json`, skill files under `.claude/skills/` and `.agents/skills/`, AGENTS.md with SDD directive block, CLAUDE.md.

#### upgrade

**Usage:** `sdd-forge upgrade [--dry-run]`

Updates deployed skill files and refreshes the SDD directive block in AGENTS.md to match the current package version. Also migrates `chapters` entries from string-array format to object format.

| Option | Description |
|---|---|
| `--dry-run` | Show what would change without writing |

#### docs build

**Usage:** `sdd-forge docs build [options]`

Runs the full documentation pipeline in sequence: `scan → enrich → init → data → text → readme → agents → translate` (translate only when multi-language output is configured). Enrich and text steps are skipped when no agent is configured. Displays a weighted progress bar to stdout.

| Option | Description |
|---|---|
| `--force` | Re-run init, overwriting existing chapter files |
| `--regenerate` | Skip init; regenerate text from existing chapter files |
| `--dry-run` | Execute pipeline without writing output files |
| `--verbose` | Emit per-step log lines alongside the progress bar |

#### docs scan

**Usage:** `sdd-forge docs scan`

Analyses project source files and writes `analysis.json` to `.sdd-forge/output/`. This file is the input for all subsequent pipeline steps.

#### docs enrich

**Usage:** `sdd-forge docs enrich`

Passes the full analysis to the configured AI agent and annotates each entry with role, summary, and chapter classification. Requires a default agent to be configured.

#### docs init

**Usage:** `sdd-forge docs init [--force]`

Initialises chapter markdown files from the active preset's templates. Without `--force`, skips files that already exist.

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files |

#### docs data

**Usage:** `sdd-forge docs data`

Resolves `{{data}}` directives in chapter files and injects structured data (tables, lists) generated from `analysis.json`.

#### docs text

**Usage:** `sdd-forge docs text`

Resolves `{{text}}` directives by invoking the AI agent to produce prose. Strips previously generated fill content before processing. Per-file errors are reported without stopping the run.

#### docs readme

**Usage:** `sdd-forge docs readme`

Assembles the final documentation output from the completed chapter files.

#### docs forge

**Usage:** `sdd-forge docs forge`

One-shot local forge mode for targeted section generation without running the full pipeline.

#### docs review

**Usage:** `sdd-forge docs review`

Runs an AI review pass over generated documentation and reports quality issues to stdout.

#### docs translate

**Usage:** `sdd-forge docs translate [options]`

Translates chapter files into configured non-default languages. Uses mtime-based incremental logic so only modified files are retranslated by default. Only active when `outputCfg.mode === 'translate'`. Preserves all Markdown formatting, directives, and code blocks. Runs translations concurrently.

| Option | Description |
|---|---|
| `--lang <code>` | Target a single language code instead of all configured languages |
| `--force` | Retranslate all files regardless of mtime |
| `--dry-run` | Print what would be translated without writing files |

**Final output line:** `N file(s) translated, N skipped[, N error(s)]`

#### docs changelog

**Usage:** `sdd-forge docs changelog [--dry-run] [output-path]`

Scans `specs/` for `NNN-series` and `bak.NNN-series` subdirectories containing `spec.md`. Generates a latest-per-series index table and a full all-specs table written to `docs/change_log.md` by default.

| Option | Description |
|---|---|
| `--dry-run` | Print the generated changelog to stdout instead of writing |
| `output-path` | (Positional, optional) Override the output file path |

#### docs agents

**Usage:** `sdd-forge docs agents [options]`

Generates or updates AGENTS.md with project context derived from analysis data.

| Option | Description |
|---|---|
| `--sdd` | Update only the SDD section |
| `--project` | Update only the PROJECT section |
| `--dry-run` | Print output without writing |

#### docs snapshot

**Usage:** `sdd-forge docs snapshot`

Captures a snapshot of the current docs state. No options.

#### flow get

**Usage:** `sdd-forge flow get <key>`

Reads and prints the value of `<key>` from the current flow state file to stdout.

**Example:** `sdd-forge flow get status`

#### flow set

**Usage:** `sdd-forge flow set <key> <field> <value>`

Writes `<value>` into `<field>` of `<key>` in the current flow state file.

**Example:** `sdd-forge flow set step approach done`

#### flow run

**Usage:** `sdd-forge flow run <command> [--auto]`

Executes the named flow command (e.g. `merge`) as registered in the FLOW_COMMANDS registry.

| Option | Description |
|---|---|
| `--auto` | Run without interactive prompts |

**Example:** `sdd-forge flow run merge --auto`

#### presets list

**Usage:** `sdd-forge presets list`

Prints an ASCII art inheritance tree of all available presets. Each node shows its key, label, axis, aliases, lang, and scan keys. Nodes whose `templates/` directory is absent are marked `[no templates]`. Children are sorted alphabetically.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Condition |
|---|---|
| `0` | Successful completion; or `--help` flag shown |
| `1` | Unknown subcommand; missing required arguments; build pipeline error; specified path not found |

**stdout conventions:**
- File paths written or skipped are reported to stdout.
- Completion summaries (e.g. file counts) go to stdout.
- `--dry-run` output — simulated actions and content previews — goes to stdout.
- `docs build` renders a weighted progress bar to stdout; `--verbose` adds per-step log lines.
- `docs translate` prints a final summary line: `N file(s) translated, N skipped[, N error(s)]`.
- `docs changelog --dry-run` prints the `generated_at` timestamp and generated tables to stdout.

**stderr conventions:**
- All error messages and warnings are written to stderr via `console.error()`.
- Unrecognised subcommands and missing required argument errors go to stderr before exit code 1.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
