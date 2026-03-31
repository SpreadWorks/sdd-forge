<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides 20 commands organized under six top-level entry points: `help`, `setup`, `upgrade`, `docs`, `flow`, and `presets`. The `docs` namespace contains 13 individual subcommands covering the full documentation generation pipeline (`build`, `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `translate`, `changelog`, `agents`, `snapshot`), while the `flow` namespace offers three subcommands (`get`, `set`, `run`) for managing Spec-Driven Development workflow state.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display the help screen listing all commands by section | — |
| `sdd-forge setup` | Interactive wizard to create or update project config, deploy skills, and generate AGENTS.md | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Sync skills and config format to the installed sdd-forge version | `--dry-run` |
| `sdd-forge docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Scan source code and produce `.sdd-forge/output/analysis.json` | — |
| `sdd-forge docs enrich` | AI-annotate analysis entries with role, summary, detail, and chapter fields | — |
| `sdd-forge docs init` | Initialize chapter skeleton files in `docs/` | `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data(...)}}` directives and inject generated tables | `--dry-run` |
| `sdd-forge docs text` | AI-generate prose for `{{text(...)}}` directives | `--dry-run` |
| `sdd-forge docs readme` | Generate or update `README.md` from docs content | `--dry-run` |
| `sdd-forge docs forge` | Run local forge mode for targeted manual regeneration | — |
| `sdd-forge docs review` | Review generated docs for gaps or outdated sections | — |
| `sdd-forge docs translate` | Translate default-language chapter files to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `docs/change_log.md` from all spec directories | `--dry-run` |
| `sdd-forge docs agents` | Generate or update AGENTS.md with project context | `--dry-run` |
| `sdd-forge docs snapshot` | Create a snapshot of the current docs state | — |
| `sdd-forge flow get` | Retrieve a flow state value from `.sdd-forge/flow.json` | — |
| `sdd-forge flow set` | Update a flow state key in `.sdd-forge/flow.json` | — |
| `sdd-forge flow run` | Execute a named flow action such as `merge` or `cleanup` | `--auto` |
| `sdd-forge presets list` | Display the preset inheritance tree with metadata | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

The following options are parsed consistently across commands that use `parseArgs()`:

| Option | Applicable To | Description |
| --- | --- | --- |
| `--help`, `-h` | All commands | Print the command's help text and exit with code 0 |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs translate`, `docs changelog`, `docs agents` | Simulate execution and report what would change without writing any files |
| `--verbose` | `docs build` | Enable detailed step-by-step progress output during the build pipeline |
| `--force` | `docs build`, `docs init`, `docs translate` | Overwrite existing output files; in `translate`, retranslate all files regardless of modification time |

The `--dry-run` flag is the most broadly shared option: every command that writes files accepts it. Help flags (`--help` / `-h`) are handled uniformly at every dispatch level — top-level, namespace dispatcher, and individual command.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Displays the full help screen grouped by section (Project, Docs, Flow, Info), including the installed package version. Equivalent to running `sdd-forge` with no arguments, `--help`, or `-h`. Version only can be retrieved with `-v`, `--version`, or `-V`.

```
sdd-forge help
sdd-forge --help
sdd-forge -v
```

#### `sdd-forge setup`

Interactive wizard that creates or updates `.sdd-forge/config.json`, deploys skills to `.claude/skills/` and `.agents/skills/`, and generates or updates `AGENTS.md`/`CLAUDE.md`. When all required values are passed as CLI flags the wizard runs non-interactively.

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--work-root <path>` | Work root path (defaults to source path) |
| `--type <type>` | Preset type (e.g. `node-cli`, `laravel`) |
| `--purpose <purpose>` | Document purpose: `developer-guide`, `user-guide`, `api-reference`, `other` |
| `--tone <tone>` | Writing tone: `polite`, `formal`, `casual` |
| `--agent <agent>` | Default AI agent: `claude`, `codex` |
| `--lang <lang>` | UI language for prompts and output |
| `--dry-run` | Simulate without writing files |

```
sdd-forge setup
sdd-forge setup --name my-project --type node-cli --agent claude
```

#### `sdd-forge upgrade`

Syncs template-managed files to the currently installed sdd-forge version. Deploys updated skill files and migrates `config.json` from legacy formats (e.g., converts string-array `chapters` to object-array format). Reports each skill as `updated` or `unchanged`.

| Option | Description |
| --- | --- |
| `--dry-run` | Report what would change without writing files |

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `sdd-forge docs build`

Orchestrates the full documentation pipeline in sequence: `scan → enrich → init → data → text → readme → agents`, with an optional `translate` step when multiple output languages are configured. The `enrich` and `text` steps are skipped automatically when no AI agent is configured. A progress bar tracks each weighted step.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init` and reuse existing chapter files; exits with an error if `docs/` is empty |
| `--dry-run` | Simulate without writing files |
| `--verbose` | Print detailed log output for each pipeline step |

```
sdd-forge docs build
sdd-forge docs build --force
sdd-forge docs build --regenerate --verbose
sdd-forge docs build --dry-run
```

#### `sdd-forge docs scan`

Traverses the source tree according to the configured preset's scan rules and writes structured metadata to `.sdd-forge/output/analysis.json`. This is the first step of the pipeline and must be run before any subsequent docs commands.

```
sdd-forge docs scan
```

#### `sdd-forge docs enrich`

Sends the raw `analysis.json` to the configured AI agent, which annotates each entry with `role`, `summary`, `detail`, and `chapter` classification fields. The enriched output is written back to `analysis.json` and consumed by the `data` and `text` steps.

```
sdd-forge docs enrich
```

#### `sdd-forge docs init`

Creates chapter skeleton `.md` files in the `docs/` directory based on the preset's `chapters` array (overridable via `config.json`). Existing files are preserved by default.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Simulate without writing files |

```
sdd-forge docs init
sdd-forge docs init --force
```

#### `sdd-forge docs data`

Resolves all `{{data(...)}}` directives in each chapter file by calling the appropriate DataSource methods and inserting the resulting markdown tables or lists. Content between `{{data}}` and `{{/data}}` tags is replaced on every run.

| Option | Description |
| --- | --- |
| `--dry-run` | Print resolved content to stdout without modifying files |

```
sdd-forge docs data
```

#### `sdd-forge docs text`

Sends each `{{text(...)}}` directive to the AI agent and replaces existing fill content with freshly generated prose. Strips prior fill content before submitting to avoid token waste. Runs concurrently across chapter files using the configured concurrency limit.

| Option | Description |
| --- | --- |
| `--dry-run` | Simulate without writing files |

```
sdd-forge docs text
```

#### `sdd-forge docs readme`

Generates or updates `README.md` at the project root by assembling content from the generated chapter files and project metadata.

| Option | Description |
| --- | --- |
| `--dry-run` | Simulate without writing files |

```
sdd-forge docs readme
```

#### `sdd-forge docs forge`

Runs local forge mode for manual, targeted regeneration of specific documentation sections without executing the full pipeline.

```
sdd-forge docs forge
```

#### `sdd-forge docs review`

Compares generated documentation against source analysis and reports sections that may be outdated or incomplete.

```
sdd-forge docs review
```

#### `sdd-forge docs translate`

Translates default-language chapter files to all non-default languages configured in `config.docs.languages`. Uses file modification-time comparison to skip already up-to-date targets. Translation quality rules preserve all Markdown formatting, directives, code blocks, and identifiers while producing natural-sounding prose in the target language. Operates only when `config.docs.output.mode` is `translate`.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Restrict translation to a single target language |
| `--force` | Retranslate all files regardless of modification time |
| `--dry-run` | Report what would be translated without writing files |

```
sdd-forge docs translate
sdd-forge docs translate --lang ja
sdd-forge docs translate --force --dry-run
```

#### `sdd-forge docs changelog`

Reads all spec subdirectories under `specs/`, extracts metadata (title, created date, status, branch, input summary) from each `spec.md`, and writes `docs/change_log.md` with a latest-per-series index table and a full all-specs table. Directory names must match the `NNN-series` or `bak.NNN-series` pattern to be included.

| Option | Description |
| --- | --- |
| `--dry-run` | Print the generated content to stdout; the target path is reported on stderr |

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` using the AI agent to produce project-specific context, architecture notes, and SDD workflow instructions. If `CLAUDE.md` is a symlink it is converted to a regular file and its `agents.sdd` data directive block is updated in place.

| Option | Description |
| --- | --- |
| `--dry-run` | Simulate without writing files |

```
sdd-forge docs agents
```

#### `sdd-forge flow get`

Retrieves the current value of a named key from `.sdd-forge/flow.json`. Available keys are defined in `flow/registry.js`.

```
sdd-forge flow get status
```

#### `sdd-forge flow set`

Updates a specific key in `.sdd-forge/flow.json`. The second-level dispatcher (`set.js`) routes to a dedicated handler script for each key. Run `sdd-forge flow set --help` to list all available keys and their descriptions.

```
sdd-forge flow set step approach done
sdd-forge flow set --help
```

#### `sdd-forge flow run`

Executes a named flow action such as `merge` or `cleanup`. The `--auto` flag enables fully automated execution without interactive confirmation prompts.

```
sdd-forge flow run merge
sdd-forge flow run merge --auto
sdd-forge flow run cleanup
```

#### `sdd-forge presets list`

Prints the full preset inheritance tree using box-drawing characters, starting from the `base` root. Each node displays the preset key, label, and available metadata (`axis`, `lang`, `aliases`, `scan` keys). Presets that have no bundled `templates/` directory are marked with `[no templates]`.

```
sdd-forge presets list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit codes**

| Code | Condition |
| --- | --- |
| `0` | Command completed successfully |
| `1` | Unknown or missing subcommand; required argument absent; source path not found; build pipeline error; no chapter files present in `--regenerate` mode; lint errors detected (fixture); empty translation response |

**stdout / stderr conventions**

| Stream | Content |
| --- | --- |
| stdout | Help text, version string, command output, progress messages, dry-run content previews, generated file contents printed instead of written |
| stderr | Error messages (`console.error`), unknown-command notices, warnings emitted during pipeline steps (e.g. `[enrich] WARN: no defaultAgent configured`), dry-run target path notices in `docs changelog` |

All user-facing progress and status lines are written to stdout via `console.log`. Errors that cause a non-zero exit always appear on stderr via `console.error` before `process.exit(1)` is called. In `--dry-run` mode, generated content is printed to stdout while the would-write path is reported on stderr.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
