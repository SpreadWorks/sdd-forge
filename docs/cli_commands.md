<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The sdd-forge CLI exposes **23 commands and subcommands** organized into three namespace groups (`docs`, `flow`, `check`) plus four standalone commands (`help`, `setup`, `upgrade`, `presets`). Each namespace dispatcher routes to individual command modules, and the `docs build` pipeline chains all documentation steps automatically.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Show command list and usage | — |
| `sdd-forge setup` | Interactive project initialization wizard | `--dry-run`, `--name`, `--type`, `--lang`, `--agent` |
| `sdd-forge upgrade` | Deploy updated skills and migrate config | `--dry-run` |
| `sdd-forge presets [list]` | Print the available preset tree | — |
| `sdd-forge docs build` | Run the full docs pipeline (scan→enrich→init→data→text→readme→agents→translate) | `--force`, `--dry-run`, `--verbose`, `--regenerate` |
| `sdd-forge docs scan` | Scan source files and write `analysis.json` | `--dry-run`, `--stdout`, `--reset` |
| `sdd-forge docs enrich` | AI-enrich analysis entries with summaries and keywords | `--dry-run`, `--stdout`, `--agent` |
| `sdd-forge docs init` | Scaffold `docs/` chapter files from preset templates | `--force`, `--dry-run`, `--type`, `--lang`, `--docs-dir` |
| `sdd-forge docs data` | Populate `{{data}}` directives in chapter files | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | Fill `{{text}}` directives with AI-generated content | `--dry-run`, `--force`, `--per-directive`, `--timeout`, `--id`, `--lang`, `--files`, `--docs-dir` |
| `sdd-forge docs readme` | Generate or update `README.md` from preset template | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | AI-driven multi-round documentation generation loop with review gating | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Run static integrity checks on `docs/` and `README.md` | — |
| `sdd-forge docs changelog` | Generate `docs/change_log.md` from `specs/` directories | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` using AI | `--dry-run` |
| `sdd-forge docs translate` | Translate docs into configured target languages | `--dry-run`, `--force`, `--lang` |
| `sdd-forge check config` | Validate `.sdd-forge/config.json` against schema and preset registry | `--format <text|json>` |
| `sdd-forge check scan` | Show `analysis.json` coverage statistics against the source tree | `--format <text|json|md>`, `--list` |
| `sdd-forge flow prepare` | Initialize a new spec, branch, and optional worktree | `--title`, `--base`, `--issue`, `--request`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow resume` | Discover and resume the active flow | — |
| `sdd-forge flow get <key>` | Read flow state (`status`, `context`, `prompt`, `guardrail`, `check`, `issue`, `qa-count`, `resolve-context`) | key-specific positional arguments |
| `sdd-forge flow set <key>` | Update flow state (`step`, `req`, `summary`, `issue`, `note`, `request`, `auto`, `test-summary`, `metric`, `issue-log`) | key-specific positional arguments |
| `sdd-forge flow run <action>` | Execute a flow action (`gate`, `review`, `impl-confirm`, `lint`, `retro`, `report`, `finalize`, `sync`) | action-specific flags |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
| --- | --- | --- |
| `-h`, `--help` | All commands | Print usage and available options for the command, then exit with code 0 |
| `-v`, `-V`, `--version` | `sdd-forge` (top-level only) | Print the package version and exit |
| `--dry-run` | Most `docs`, `flow`, `check`, and `setup`/`upgrade` commands | Preview what would be written or executed without making any changes |
| `--format <text\|json\|md>` | `check config`, `check scan` | Select output format; defaults to `text` |
| `--verbose` / `-v` | `docs build`, `docs forge` | Print step-level progress details to stderr |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Prints a formatted list of all available commands grouped by category, including the current package version. No arguments or options.

```
sdd-forge help
```

#### `sdd-forge setup`

Interactive wizard that initializes a new project. Prompts for project name, source path, language, preset type(s), AI agent provider, and documentation style. Writes `.sdd-forge/config.json`, creates `docs/`, `specs/`, and `.sdd-forge/` directories, ensures `.gitignore`/`.gitattributes` entries, generates `AGENTS.md`, creates a `CLAUDE.md` symlink, and deploys skills.

```
sdd-forge setup [--dry-run] [--name <name>] [--type <preset>] [--lang <code>] [--agent <provider>]
```

#### `sdd-forge upgrade`

Deploys updated skill files from package templates into the project's `.claude/skills/` and `.agents/skills/` directories. Only overwrites files whose content has changed. Also migrates `config.json` format changes (e.g., the `chapters` array). If `config.experimental.workflow.enable` is `true`, additionally deploys project-level workflow skills.

```
sdd-forge upgrade [--dry-run]
```

#### `sdd-forge presets [list]`

Prints a tree view of all available presets showing key, label, axis, language, aliases, scan keys, and whether templates exist. Defaults to `list` if no subcommand is given.

```
sdd-forge presets list
```

#### `sdd-forge docs build`

Runs the complete documentation pipeline in sequence: scan, enrich, init, data, text, readme, agents, and (if multi-language is configured) translate. Progress is displayed as a weighted progress bar. Use `--regenerate` to skip the `init` step and re-generate text in existing chapter files. Use `--force` to overwrite existing chapter files during `init`.

```
sdd-forge docs build [--force] [--regenerate] [--dry-run] [--verbose]
```

#### `sdd-forge docs scan`

Walks the source tree according to `scan.include`/`scan.exclude` config patterns, analyzes each file, and writes structured output to `.sdd-forge/output/analysis.json`. Supports incremental updates via file-hash tracking; pass `--reset` to clear cached hashes for specific categories or all categories.

```
sdd-forge docs scan [--dry-run] [--stdout] [--reset [<category>]]
```

#### `sdd-forge docs enrich`

Calls an AI agent to add or update `summary`, `detail`, and `keywords` fields for each entry in `analysis.json`. Processes entries in batches controlled by `batchTokenLimit`. Skips entries that already have enrichment data unless `--dry-run` is used to preview.

```
sdd-forge docs enrich [--dry-run] [--stdout] [--agent <name>]
```

#### `sdd-forge docs init`

Scaffolds chapter Markdown files in `docs/` by resolving templates from the configured preset chain. Optionally calls an AI agent to filter out irrelevant chapters based on `analysis.json`. Skips existing files unless `--force` is passed. Supports per-language output via `--lang`.

```
sdd-forge docs init [--force] [--dry-run] [--type <preset>] [--lang <code>] [--docs-dir <path>]
```

#### `sdd-forge docs data`

Populates `{{data(...)}}` directives in all chapter files under `docs/` by resolving each directive through the preset resolver chain against `analysis.json`. Writes changes in-place; use `--dry-run` to print resolved content to stdout instead.

```
sdd-forge docs data [--dry-run] [--stdout] [--docs-dir <path>]
```

#### `sdd-forge docs text`

Fills `{{text(...)}}` directives in chapter files by calling an AI agent per directive. Use `--force` to overwrite already-filled directives, `--per-directive` to call the agent once per directive instead of batching, `--id` to target a single directive, and `--files` to restrict to a comma-separated list of files.

```
sdd-forge docs text [--dry-run] [--force] [--per-directive] [--timeout <ms>] [--id <id>] [--lang <code>] [--files <list>] [--docs-dir <path>]
```

#### `sdd-forge docs readme`

Generates or updates `README.md` by resolving the `README.md` preset template, populating `{{data}}` directives, and filling any `{{text}}` directives via AI. Computes a diff and writes only when content changes. Use `--output` to write to a custom path (useful for per-language README generation).

```
sdd-forge docs readme [--dry-run] [--lang <code>] [--output <path>]
```

#### `sdd-forge docs forge`

Runs an AI-driven multi-round generation loop: populates `{{data}}` and `{{text}}` directives, then calls an AI agent per target chapter file, and gates each round with `sdd-forge docs review`. Retries up to `--max-runs` times. Supports `local` (direct AI calls), `assist`, and `agent` modes. Pass `--spec` to scope generation to a specific spec file.

```
sdd-forge docs forge --prompt "<instruction>" [--prompt-file <path>] [--spec <path>] [--max-runs <n>] [--mode local|assist|agent] [--review-cmd <cmd>] [--dry-run] [--verbose]
```

#### `sdd-forge docs review`

Performs static integrity checks on all chapter files in `docs/` and on `README.md`. Checks include: file existence, minimum line count (15), presence of an H1 heading, no unfilled `{{text}}` or `{{data}}` directives, no broken HTML comments, no residual block template markers, and presence of translated language directories when multi-language output is configured. Exits non-zero if any check fails.

```
sdd-forge docs review [<docs-dir>]
```

#### `sdd-forge docs changelog`

Scans `specs/` for subdirectories named with a three-digit prefix (e.g., `001-feature-name`), reads each `spec.md`, and generates a Markdown change log table at `docs/change_log.md` (or a custom path). The output includes a latest-per-series index table and a full all-specs table.

```
sdd-forge docs changelog [--dry-run] [<output-path>]
```

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` in the project source root. Resolves `{{data}}` directives for the SDD and PROJECT sections, then calls an AI agent to refine the PROJECT section using `analysis.json` and chapter content as context. Creates a skeleton `AGENTS.md` if the file does not yet exist.

```
sdd-forge docs agents [--dry-run]
```

#### `sdd-forge docs translate`

Translates chapter files and `README.md` into all non-default languages configured in `docs.languages`. Operates incrementally by comparing source and target file modification times; use `--force` to retranslate all files. Translations run in parallel up to the configured concurrency limit. Requires an AI agent to be configured.

```
sdd-forge docs translate [--dry-run] [--force] [--lang <code>]
```

#### `sdd-forge check config`

Validates `.sdd-forge/config.json` in three stages: file existence and JSON parse, schema validation via `validateConfig` (reporting up to 50 errors), and preset existence check. Outputs results in `text` (default) or `json` format.

```
sdd-forge check config [--format text|json]
```

#### `sdd-forge check scan`

Cross-references `analysis.json` against all source files matched by `scan.include`/`scan.exclude` patterns and reports coverage statistics grouped by file extension. By default shows up to 10 uncovered files; use `--list` to show all.

```
sdd-forge check scan [--format text|json|md] [--list]
```

#### `sdd-forge flow prepare`

Creates a new spec directory under `specs/`, writes `spec.md` and `qa.md` from templates (with support for local overrides in `.sdd-forge/templates/`), initializes `flow.json` with the initial step set, and optionally creates a feature branch or a git worktree. The spec directory is named with a zero-padded sequential index (e.g., `001-my-feature`).

```
sdd-forge flow prepare --title "<title>" [--base <branch>] [--issue <number>] [--request "<text>"] [--worktree] [--no-branch] [--dry-run]
```

#### `sdd-forge flow resume`

Locates the active flow state, resolves the current phase and step, and returns rich context (branch name, ahead count, last commit, spec goal/scope, dirty files, GitHub CLI availability) to allow the orchestrating skill to continue from where it left off.

```
sdd-forge flow resume
```

#### `sdd-forge flow get <key>`

Reads information from the active flow state. Available keys:

| Key | Description |
| --- | --- |
| `status` | Current phase, step progress, requirements, and flow metadata |
| `context` | Search `analysis.json` by file path or keyword query |
| `prompt` | Return a structured prompt template by kind and language |
| `guardrail` | Return guardrail rules for a given phase as Markdown or JSON |
| `check` | Evaluate prerequisites (`impl`, `finalize`), dirty worktree, or `gh` availability |
| `issue` | Fetch GitHub issue details via the `gh` CLI |
| `qa-count` | Return the Q&A item count from flow metrics |
| `resolve-context` | Assemble conflict-resolution context including branch and spec data |

```
sdd-forge flow get status
sdd-forge flow get context --query "<keyword>" [--mode ngram|ai]
sdd-forge flow get guardrail --phase <phase> [--format json]
sdd-forge flow get check <target>
sdd-forge flow get issue <number>
```

#### `sdd-forge flow set <key>`

Updates the active flow state. Available keys:

| Key | Description |
| --- | --- |
| `step <id> <status>` | Set a flow step status (`done`, `in_progress`, `skipped`) |
| `req <index> <status>` | Update a requirement status by index |
| `summary <json-array>` | Replace the requirements array from a JSON string |
| `issue <number>` | Link a GitHub issue number |
| `note "<text>"` | Append a free-text note |
| `request "<text>"` | Store the initial feature request text |
| `auto on\|off` | Toggle autoApprove mode |
| `test-summary` | Record unit/integration/acceptance test counts |
| `metric` | Record AI call metrics for a flow phase |
| `issue-log` | Append an entry to the issue log |

```
sdd-forge flow set step implement done
sdd-forge flow set req 0 done
sdd-forge flow set auto on
sdd-forge flow set test-summary --unit 12 --integration 3
```

#### `sdd-forge flow run <action>`

Executes a flow action. Available actions:

| Action | Description |
| --- | --- |
| `gate` | Run structural/AI-based quality gate for `draft`, `pre`, `post`, or `impl` phases |
| `review` | Multi-phase code/spec/test review with iterative AI feedback |
| `impl-confirm` | Summarize changed files and requirement completion status |
| `lint` | Run guardrail-based lint checks against the diff from the base branch |
| `retro` | AI retrospective evaluating requirement coverage against the git diff |
| `report` | Generate `report.json` aggregating git summary and issue log metrics |
| `finalize` | Commit, merge (squash or PR), sync docs, clean up worktree, and post report |
| `sync` | Rebuild docs and commit the result on the base branch |

```
sdd-forge flow run gate --phase pre
sdd-forge flow run finalize --mode all [--merge-strategy squash|pr] [--dry-run]
sdd-forge flow run retro [--force] [--dry-run]
sdd-forge flow run lint [--base <branch>]
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Condition |
| --- | --- | --- |
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Unknown command or subcommand, argument validation failure, missing required file (config, analysis.json), schema validation error, preset not found, AI agent call failure, git operation failure, or review integrity check failure |

**stdout conventions:**

- Structured results (resolved directives, generated content, coverage data) are written to **stdout**.
- When `--format json` is passed, the full result object is written to stdout as pretty-printed JSON.
- When `--dry-run` is used with `--stdout`, the content that would be written to disk is printed to stdout instead.
- `sdd-forge flow run` and `sdd-forge flow get` commands write a JSON envelope (`{"ok": true, "data": {...}}` or `{"ok": false, "error": {...}}`) to stdout for consumption by the orchestrating skill.

**stderr conventions:**

- Human-readable progress messages, warnings (`WARN:`), and error descriptions are written to **stderr**.
- Validation error lists and per-file status lines (e.g., `[forge] start: docs/overview.md`) are written to stderr.
- The `--verbose` flag routes additional step-level detail to stderr.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
