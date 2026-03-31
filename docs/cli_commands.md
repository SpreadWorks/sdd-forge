<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes 20 named commands organized into a two-level subcommand hierarchy. The top-level dispatcher routes to two namespace groups — `docs` (13 subcommands covering the full documentation pipeline) and `flow` (3 routing subcommands: `get`, `set`, `run`) — alongside four independent commands: `help`, `setup`, `upgrade`, and `presets`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display the help screen listing all commands grouped by section | — |
| `sdd-forge setup` | Interactive wizard to create or update project configuration and deploy skills | `--name`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Sync skills and config format to the installed version without touching user settings | `--dry-run` |
| `sdd-forge docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Scan source files and produce `analysis.json` | — |
| `sdd-forge docs enrich` | AI-annotate analysis entries with role, summary, and chapter classification | — |
| `sdd-forge docs init` | Create chapter Markdown files from preset templates | `--force`, `--dry-run` |
| `sdd-forge docs data` | Populate `{{data(...)}}` directive blocks with generated tables | `--dry-run` |
| `sdd-forge docs text` | Generate prose for `{{text(...)}}` directive blocks via the configured AI agent | `--dry-run` |
| `sdd-forge docs readme` | Assemble and write the project `README.md` | `--dry-run` |
| `sdd-forge docs forge` | Run AI-driven documentation generation in local forge mode | — |
| `sdd-forge docs review` | Review generated documentation and report quality issues | — |
| `sdd-forge docs translate` | Translate default-language docs to configured target languages using an AI agent | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `docs/change_log.md` from `specs/` directory metadata | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` / `CLAUDE.md` | `--dry-run` |
| `sdd-forge docs snapshot` | Create a snapshot of the current documentation state | — |
| `sdd-forge flow get` | Read current SDD flow state for a key | — |
| `sdd-forge flow set` | Write a value to an SDD flow state key | — |
| `sdd-forge flow run` | Execute a named flow subcommand (`start`, `status`, `resume`, `review`, `merge`, `cleanup`) | `--auto` |
| `sdd-forge presets list` | Display the preset inheritance hierarchy as an ASCII tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
| --- | --- | --- |
| `--help`, `-h` | All commands and subcommands | Print usage information for the command and exit with code 0; exits with code 1 when no subcommand was supplied |
| `-v`, `--version`, `-V` | Top-level `sdd-forge` only | Print the installed package version and exit |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs translate`, `docs changelog`, `docs agents` | Simulate execution and report intended changes without writing any files |
| `--verbose` | `docs build` | Print verbose step-by-step progress messages during the pipeline |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`
Displays the help screen listing all available commands grouped by section (Project, Docs, Flow, Info) with brief descriptions. The package version appears in the header line. Output is written to stdout.

**Usage:** `sdd-forge help`

#### `sdd-forge setup`
Interactive wizard that creates or updates `.sdd-forge/config.json`, deploys skills to `.claude/skills/` and `.agents/skills/`, and generates `AGENTS.md`/`CLAUDE.md`. When all required values are supplied via flags, interactive prompts are skipped. In interactive mode, the wizard collects project name, output languages, preset types, document purpose, writing tone, and agent selection.

**Usage:** `sdd-forge setup [options]`

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--work-root <path>` | Work root directory (defaults to source root) |
| `--type <type>` | Preset type |
| `--purpose <value>` | Document purpose: `developer-guide`, `user-guide`, `api-reference`, or `other` |
| `--tone <value>` | Writing tone: `polite`, `formal`, or `casual` |
| `--agent <value>` | AI agent: `claude` or `codex` |
| `--lang <lang>` | UI and output language |
| `--dry-run` | Preview changes without writing files |

#### `sdd-forge upgrade`
Syncs template-managed files — skills and config format — to the currently installed version. Migrates `config.json` chapter entries from string format to object format when the old format is detected. User customizations in `config.json` are preserved.

**Usage:** `sdd-forge upgrade [--dry-run]`

#### `sdd-forge docs build`
Executes the full documentation generation pipeline: scan → enrich → init → data → text → readme → agents. A translate step is appended for multi-language projects. AI-dependent steps (enrich and text) are silently skipped when no agent is configured. Progress is displayed using a weighted progress bar.

**Usage:** `sdd-forge docs build [options]`

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during init |
| `--regenerate` | Skip init and reuse existing chapter files |
| `--dry-run` | Simulate the pipeline without writing files |
| `--verbose` | Print verbose step-by-step progress messages |

#### `sdd-forge docs scan`
Scans the source directory using the active preset's file matching rules and writes `analysis.json` to `.sdd-forge/output/`.

**Usage:** `sdd-forge docs scan`

#### `sdd-forge docs enrich`
Passes the complete analysis to a configured AI agent to annotate each entry with role, summary, detail text, and chapter classification.

**Usage:** `sdd-forge docs enrich`

#### `sdd-forge docs init`
Creates chapter Markdown files in `docs/` using templates from the active preset. Existing files are preserved unless `--force` is specified.

**Usage:** `sdd-forge docs init [--force] [--dry-run]`

#### `sdd-forge docs data`
Resolves all `{{data(...)}}` directive blocks in chapter files, inserting generated tables and structured content derived from the current analysis.

**Usage:** `sdd-forge docs data [--dry-run]`

#### `sdd-forge docs text`
Invokes the configured AI agent to generate prose for each `{{text(...)}}` directive block. Existing fill content is stripped from each target file before regeneration.

**Usage:** `sdd-forge docs text [--dry-run]`

#### `sdd-forge docs readme`
Assembles and writes the project `README.md` from chapter content.

**Usage:** `sdd-forge docs readme [--dry-run]`

#### `sdd-forge docs forge`
Runs documentation generation in local forge mode, supporting AI-driven review and targeted section regeneration cycles.

**Usage:** `sdd-forge docs forge`

#### `sdd-forge docs review`
Reviews the existing generated documentation and reports quality issues.

**Usage:** `sdd-forge docs review`

#### `sdd-forge docs translate`
Translates default-language documentation files to non-default target languages using an AI agent. Translation preserves all Markdown formatting, directives, code blocks, and identifiers. Uses mtime comparison to skip already up-to-date target files. Only operates when `docs.outputMode` is set to `translate`.

**Usage:** `sdd-forge docs translate [options]`

| Option | Description |
| --- | --- |
| `--lang <lang>` | Restrict translation to a single target language |
| `--force` | Retranslate all files regardless of mtime |
| `--dry-run` | Preview without writing files |

#### `sdd-forge docs changelog`
Scans the `specs/` directory for subdirectories matching `NNN-series` or `bak.NNN-series` naming patterns. Extracts title, status, created date, feature branch, and input summary from each `spec.md`, then writes `docs/change_log.md` containing a latest-per-series index table and a full all-specs table.

**Usage:** `sdd-forge docs changelog [--dry-run] [output-path]`

#### `sdd-forge docs agents`
Generates or updates `AGENTS.md`/`CLAUDE.md` with SDD context and project structure derived from the current analysis.

**Usage:** `sdd-forge docs agents [--dry-run]`

#### `sdd-forge flow get`
Reads and displays the current SDD flow state for a specified key.

**Usage:** `sdd-forge flow get <key>`

**Example:** `sdd-forge flow get status`

#### `sdd-forge flow set`
Writes a value to an SDD flow state key by dispatching to the appropriate handler script defined in `flow/registry.js`.

**Usage:** `sdd-forge flow set <key> [args]`

**Example:** `sdd-forge flow set step approach done`

#### `sdd-forge flow run`
Executes a named flow subcommand. Available subcommands: `start`, `status`, `resume`, `review`, `merge`, `cleanup`.

**Usage:** `sdd-forge flow run <subcommand> [options]`

**Example:** `sdd-forge flow run merge --auto`

#### `sdd-forge presets list`
Displays the full preset inheritance hierarchy as an ASCII tree using box-drawing characters. Each node shows the preset key, label, axis, language, aliases, and scan keys. Presets without a `templates/` directory are marked with `[no templates]`.

**Usage:** `sdd-forge presets list`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit Codes**

| Code | Condition |
| --- | --- |
| `0` | Command completed successfully |
| `1` | Unknown subcommand, missing required argument, configuration error, or pipeline failure |

**stdout and stderr conventions**

| Stream | Used For |
| --- | --- |
| stdout | Normal output: generated content, status messages, help text for `--help` invocations, and `--dry-run` content previews |
| stderr | Error messages, usage text when no subcommand is provided, and pipeline warnings |

Commands that dispatch to sub-scripts propagate non-zero exit codes from inner steps. The `docs build` command calls `process.exit(0)` on success and `process.exit(1)` on any pipeline error, printing the error message to stderr before exiting. Individual pipeline steps such as `docs text` return partial error counts rather than aborting, allowing the pipeline to complete and report incomplete sections.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
