<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes 20 commands organized into three structural layers: four independent top-level commands (`help`, `setup`, `upgrade`, and `presets list`), a `docs` namespace containing 13 subcommands that cover the full documentation pipeline from source scanning through AI-assisted text generation and multi-language translation, and a `flow` namespace with three dispatcher subcommands (`get`, `set`, `run`) for managing the Spec-Driven Development workflow state.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display the help screen listing all available commands grouped by section | — |
| `setup` | Interactive or non-interactive wizard to create or update `.sdd-forge/config.json`, deploy skills, and generate `AGENTS.md` | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | Sync skills and config format to match the currently installed sdd-forge version | `--dry-run` |
| `docs build` | Execute the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `docs scan` | Scan the source tree and write `analysis.json` to `.sdd-forge/output/` | — |
| `docs enrich` | Use an AI agent to annotate each analysis entry with role, summary, detail, and chapter classification | — |
| `docs init` | Initialize chapter Markdown files from preset templates | `--force`, `--dry-run` |
| `docs data` | Resolve and fill all `{{data(...)}}` directives in chapter files | `--dry-run` |
| `docs text` | Call an AI agent to fill all `{{text(...)}}` directives in chapter files | `--dry-run` |
| `docs readme` | Regenerate the project `README.md` from chapter summaries | `--dry-run` |
| `docs forge` | Deep-forge individual chapter sections using the AI agent | `--dry-run` |
| `docs review` | Review generated documentation for quality and consistency | — |
| `docs translate` | Translate default-language docs to all configured non-default languages using an AI agent | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Scan `specs/` and generate `docs/change_log.md` with metadata tables | `--dry-run` |
| `docs agents` | Generate or update `AGENTS.md` with SDD and project context | `--dry-run` |
| `docs snapshot` | Snapshot the current state of the docs directory | — |
| `flow get` | Read a value from the current flow state | — |
| `flow set` | Write a value to the current flow state | — |
| `flow run` | Execute a named flow operation (e.g., `merge`, `cleanup`) | Varies by operation |
| `presets list` | Display the full preset inheritance hierarchy as a tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

The following options appear across multiple commands. Not every option is available in every command; check the individual command help (`sdd-forge <command> --help`) for the exact set.

| Option | Type | Applies To | Description |
| --- | --- | --- | --- |
| `--help` / `-h` | flag | All commands | Print command-specific usage and option descriptions, then exit with code 0 |
| `--dry-run` | flag | `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs agents`, `docs translate`, `docs changelog`, `upgrade` | Preview what would be written without modifying any files on disk |
| `--force` | flag | `docs build`, `docs init`, `docs translate` | Overwrite existing output files instead of skipping them |
| `--verbose` | flag | `docs build` | Print step-level progress details to stdout during the pipeline run |
| `--lang <code>` | string | `docs translate` | Restrict translation to a single target language code (e.g., `ja`) |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `help`

Prints the full command listing to stdout, grouped by section (Project, Docs, Flow, Info), with ANSI bold/dim formatting and the current package version.

```
sdd-forge help
sdd-forge --help
sdd-forge -h
```

#### `setup`

Runs an interactive wizard (or a fully non-interactive pass when all options are supplied) that creates `.sdd-forge/config.json`, provisions project directories (`docs/`, `specs/`, `.sdd-forge/output/`), writes `.gitignore` and `.gitattributes` entries, deploys skills to `.claude/skills/`, and generates or updates `AGENTS.md`.

```
sdd-forge setup
sdd-forge setup --name "My Project" --type node-cli --lang en --agent claude
```

| Option | Description |
| --- | --- |
| `--name <text>` | Project name written to `config.json` |
| `--path <dir>` | Path to the source root |
| `--work-root <dir>` | Path to the work root (defaults to source root) |
| `--type <preset>` | Preset type key (e.g., `node-cli`, `laravel`) |
| `--purpose <value>` | Document purpose: `developer-guide`, `user-guide`, `api-reference`, or `other` |
| `--tone <value>` | Writing tone: `polite`, `formal`, or `casual` |
| `--agent <value>` | Default AI agent: `claude` or `codex` |
| `--lang <code>` | UI and output language code |
| `--dry-run` | Show what would be created without writing files |

#### `upgrade`

Syncs the skills deployed under `.claude/skills/` and `.agents/skills/` to match the templates bundled with the currently installed sdd-forge version. Also migrates `config.json` chapter entries from the legacy string-array format to the current object format. Only changed files are updated.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `docs build`

Orchestrates the full documentation generation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, with an optional `translate` step appended when multiple output languages are configured. Progress is displayed via a weighted progress bar. The `enrich` and `text` steps are silently skipped when no AI agent is configured.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init` and reuse existing chapter files; requires at least one `.md` file already present in `docs/` |
| `--dry-run` | Run the pipeline without writing output files |
| `--verbose` | Print individual step details to stdout |

#### `docs scan`

Walks the source tree according to the active preset's scanner rules and writes structured analysis data to `.sdd-forge/output/analysis.json`.

```
sdd-forge docs scan
```

#### `docs enrich`

Passes the raw analysis to an AI agent, which annotates every entry with a role, summary, detailed description, and chapter classification. Requires a configured default agent.

```
sdd-forge docs enrich
```

#### `docs init`

Creates Markdown chapter files in `docs/` from the preset's templates. Existing files are preserved unless `--force` is specified.

```
sdd-forge docs init
sdd-forge docs init --force
```

#### `docs data`

Reads every chapter file in `docs/` and replaces the content between `{{data(...)}}` / `{{/data}}` markers with freshly resolved data from the analysis.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### `docs text`

Strips existing fill content from `{{text(...)}}` / `{{/text}}` blocks, then calls the configured AI agent to regenerate prose for each block. Errors in individual files are logged as warnings; the remaining files continue to be processed.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### `docs readme`

Generates or overwrites the project-level `README.md` by assembling chapter summaries and navigation links.

```
sdd-forge docs readme
sdd-forge docs readme --dry-run
```

#### `docs translate`

Translates source-language chapter files and `README.md` to each non-default language defined in `config.docs.languages`. Uses mtime comparison to skip files that are already up to date. Concurrency is governed by the `concurrency` setting in config.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
| --- | --- |
| `--lang <code>` | Translate only to the specified language |
| `--force` | Retranslate all files regardless of modification time |
| `--dry-run` | List tasks that would run without writing files |

#### `docs changelog`

Scans `specs/` for subdirectories matching `NNN-series` or `bak.NNN-series` naming patterns, extracts metadata from each `spec.md`, and writes `docs/change_log.md` containing a latest-per-series index table and a full all-specs table.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### `docs agents`

Generates or updates `AGENTS.md` (and the `CLAUDE.md` symlink if present) with the SDD workflow template and auto-generated project context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### `flow get`

Reads and prints a named value from the current `flow.json` state file.

```
sdd-forge flow get status
```

#### `flow set`

Writes a value to the current flow state. The available keys are defined in `flow/registry.js`.

```
sdd-forge flow set step approach done
```

#### `flow run`

Executes a named flow operation such as `merge` or `cleanup`. Accepts operation-specific flags passed through to the target script.

```
sdd-forge flow run merge --auto
sdd-forge flow run cleanup
```

#### `presets list`

Prints the full preset inheritance hierarchy as an ASCII tree using box-drawing characters. Each node shows the preset key, label, and optional metadata (axis, lang, aliases, scan keys). Presets without a `templates/` directory are marked `[no templates]`.

```
sdd-forge presets list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

#### Exit Codes

| Code | Condition |
| --- | --- |
| `0` | Command completed successfully, or `--help` was requested and usage was printed |
| `1` | Unknown subcommand, missing required argument, pipeline step threw an unrecoverable error, or a required directory/file was not found |

#### stdout vs. stderr Conventions

| Stream | Used For |
| --- | --- |
| stdout (`console.log`) | Primary output: generated file content in `--dry-run` mode, help text, version string, progress summaries, preset tree |
| stderr (`console.error`) | Error messages, unknown-command notices, warnings during pipeline steps (e.g., skipped enrich/text when no agent is configured) |

All pipeline warning messages are prefixed with the step name in brackets (e.g., `[text] WARN: ...`, `[build] ERROR: ...`). Commands that support `--dry-run` write their preview output to stdout and the dry-run notice to stderr, allowing stdout to be piped or redirected without mixing diagnostic text.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
