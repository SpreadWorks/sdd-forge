<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes 19 named commands organized into four groups: top-level commands (`help`, `setup`, `upgrade`), the `docs` namespace with 12 subcommands (including the composite `build` pipeline), the `flow` namespace with three routing keys (`get`, `set`, `run`), and `presets list`. All commands are dispatched from `src/sdd-forge.js`, which routes namespace prefixes through dedicated dispatcher modules and forwards independent commands directly to their script files.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display all available commands grouped by section | — |
| `setup` | Interactive wizard to initialize or update `.sdd-forge/config.json` and deploy skills | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Sync deployed skills and migrate config format to the current version | `--dry-run` |
| `docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `docs scan` | Scan source files and write `analysis.json` | `--dry-run` |
| `docs enrich` | Annotate analysis entries with AI-assigned roles, summaries, and chapter classifications | — |
| `docs init` | Create chapter Markdown files from preset templates | `--force`, `--dry-run` |
| `docs data` | Populate `{{data}}` directive blocks in chapter files | `--dry-run` |
| `docs text` | Generate prose for `{{text}}` directive blocks via an AI agent | `--dry-run` |
| `docs readme` | Generate or update the top-level `README.md` | `--dry-run` |
| `docs forge` | Run the forge review pipeline for local documentation | — |
| `docs review` | Review generated documentation for quality issues | — |
| `docs translate` | Translate default-language docs to non-default languages using an AI agent | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate `docs/change_log.md` from `specs/` directory metadata | `--dry-run` |
| `docs agents` | Generate or update `AGENTS.md` | `--dry-run` |
| `flow get` | Retrieve the current SDD flow state | — |
| `flow set` | Update an SDD flow state value | — |
| `flow run` | Execute an SDD flow operation such as merge or cleanup | `--auto` |
| `presets list` | Display the preset inheritance hierarchy as a tree | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applicable Commands | Description |
| --- | --- | --- |
| `--help`, `-h` | All commands | Display help text for the command and exit with code `0` |
| `--dry-run` | `build`, `scan`, `init`, `data`, `text`, `readme`, `agents`, `translate`, `changelog`, `upgrade`, `setup` | Preview changes without writing any files; generated content is printed to stdout |
| `--force` | `build`, `translate`, `init` | Overwrite existing output files rather than skipping them |
| `--verbose` | `build` | Print per-step progress details and AI interaction logs during the pipeline |
| `--version`, `-v`, `-V` | Top-level (`sdd-forge`) only | Print the installed package version string and exit |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Prints all available commands grouped by section (Project, Docs, Flow, Info) with short descriptions sourced from the i18n translation layer. Output uses ANSI bold/dim formatting.

```
sdd-forge help
```

#### setup

Runs an interactive wizard to create or update `.sdd-forge/config.json`, deploy skills to `.claude/skills/`, and generate `AGENTS.md`/`CLAUDE.md`. When all required flags are supplied, the wizard is skipped and the command runs non-interactively.

```
sdd-forge setup
sdd-forge setup --name "My Project" --type node-cli --lang en --agent claude
```

| Option | Description |
| --- | --- |
| `--name` | Project name |
| `--type` | Preset type (e.g., `node-cli`, `laravel`) |
| `--lang` | UI language for generated output |
| `--agent` | Default AI agent (`claude` or `codex`) |
| `--dry-run` | Preview configuration without writing files |

#### upgrade

Syncs deployed skill files to the current sdd-forge version and migrates `config.json` chapter entries from legacy string format to object format. Prints a per-skill status of `updated` or `unchanged`.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### docs build

Executes the full documentation pipeline with a progress bar. Steps run in order: `scan → enrich → init → data → text → readme → agents`. When `docs.languages` contains multiple entries a `translate` step is appended. The `enrich` and `text` steps are silently skipped when no AI agent is configured in `config.json`.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init` and reuse existing chapter files |
| `--dry-run` | Run all pipeline steps without writing files |
| `--verbose` | Print detailed per-step and AI interaction logs |

#### docs scan

Scans the configured source root according to the active preset's scan rules and writes the result to `.sdd-forge/output/analysis.json`.

```
sdd-forge docs scan
sdd-forge docs scan --dry-run
```

#### docs enrich

Sends the analysis snapshot to the configured AI agent and annotates each entry with `role`, `summary`, `detail`, and chapter classification. Requires `agent.default` to be set in `config.json`.

```
sdd-forge docs enrich
```

#### docs init

Creates chapter Markdown files under `docs/` from the active preset templates. Existing files are left unchanged unless `--force` is passed.

```
sdd-forge docs init
sdd-forge docs init --force
```

#### docs data

Evaluates every `{{data(...)}}` directive block in the chapter files and writes the resolved tables or structured content back in place.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### docs text

Invokes the AI agent to generate prose for each `{{text(...)}}` directive block in the chapter files. Existing fill content is stripped before regeneration. Errors in individual files are logged as warnings and the pipeline continues.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### docs readme

Assembles the top-level `README.md` from the chapter files according to the active preset template.

```
sdd-forge docs readme
sdd-forge docs readme --dry-run
```

#### docs translate

Translates default-language chapter files to each non-default language listed in `docs.languages`. Skips targets whose mtime is newer than the source unless `--force` is passed. Only active when `docs.output.mode` is `translate`.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
| --- | --- |
| `--lang` | Restrict translation to a single target language |
| `--force` | Retranslate all files regardless of mtime |
| `--dry-run` | List tasks without writing any files |

#### docs changelog

Reads all `specs/NNN-*/spec.md` files, extracts title, status, created date, branch, and input metadata, and writes a two-table Markdown file to `docs/change_log.md`: a latest-per-series index and a full all-specs listing.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### docs agents

Generates or updates `AGENTS.md` with the SDD workflow instruction block (`agents.sdd`) and a `{{data("agents.project")}}` directive block for project-specific context.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### flow get / flow set / flow run

The `flow` namespace routes through `src/flow.js` to sub-command scripts registered in `flow/registry.js`. `get` retrieves current SDD flow state values; `set` updates them; `run` executes operations such as `merge` and `cleanup`. Pass `--help` to any subcommand for a full listing of keys and options.

```
sdd-forge flow get status
sdd-forge flow set step approach done
sdd-forge flow run merge --auto
```

#### presets list

Renders the full preset inheritance tree using box-drawing characters. Each node displays the preset key, label, and optional `axis`, `lang`, `aliases`, and `scan` metadata. Nodes without a `templates/` directory are marked `[no templates]`.

```
sdd-forge presets list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit codes**

| Code | Condition |
| --- | --- |
| `0` | Command completed successfully; also returned after `--help` output |
| `1` | Fatal error: unknown command or subcommand, missing required arguments, referenced path not found, empty AI agent response, or unhandled build pipeline error |

**stdout conventions**

- Normal command output (help listings, preset trees, pipeline progress, generated content) is written to stdout.
- In `--dry-run` mode, file content that would be written to disk is printed to stdout instead.
- The `docs build` progress bar and per-step status messages are written to stdout.

**stderr conventions**

- Error messages for unknown commands, missing files, and agent failures are written to stderr via `console.error()`.
- Build pipeline warnings — such as skipped `enrich` or `text` steps due to a missing agent configuration, or per-file text generation errors — are also reported to stderr.
- Unknown subcommand errors always include a `Run: sdd-forge <cmd> --help` hint on stderr.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
