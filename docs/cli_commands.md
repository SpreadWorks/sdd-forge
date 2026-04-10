<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The sdd-forge CLI provides 7 top-level commands — `help`, `setup`, `upgrade`, `presets`, `docs`, `flow`, and `check` — totaling over 30 addressable commands and sub-keys when all subcommands are counted. Three of the top-level commands act as dispatchers: `docs` exposes 13 subcommands for the documentation pipeline, `flow` exposes 5 command groups (`prepare`, `resume`, `get`, `set`, `run`) whose `get`, `set`, and `run` groups each accept multiple named keys or actions, and `check` exposes 3 diagnostic subcommands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Subcommand / Key | Description | Key Options |
|---|---|---|---|
| `help` | — | Display available commands | — |
| `setup` | — | Interactive wizard to create `.sdd-forge/config.json` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | — | Update template-derived files (skills, AGENTS.md) to match installed version | `--dry-run` |
| `presets` | `list` | Display preset inheritance tree | — |
| `docs` | `build` | Run full pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs` | `scan` | Analyze source code and produce `analysis.json` | — |
| `docs` | `enrich` | Enrich analysis data with AI-generated summaries | — |
| `docs` | `init` | Initialize docs structure from preset templates | — |
| `docs` | `data` | Process `{{data}}` directives in documentation files | — |
| `docs` | `text` | Process `{{text}}` directives using AI | — |
| `docs` | `readme` | Generate `README.md` | — |
| `docs` | `forge` | Generate new documentation files | — |
| `docs` | `review` | Review documentation with AI | — |
| `docs` | `changelog` | Generate changelog | — |
| `docs` | `agents` | Generate `AGENTS.md` | — |
| `docs` | `translate` | Translate documentation into configured languages | — |
| `docs` | `snapshot` | Snapshot current documentation state | — |
| `flow` | `prepare` | Initialize spec file and create feature branch or worktree | `--title`, `--base`, `--issue`, `--request`, `--worktree`, `--no-branch`, `--dry-run` |
| `flow` | `resume` | Discover and display active flow context for recovery | — |
| `flow` | `get <key>` | Read flow state; returns a JSON envelope | See command details |
| `flow` | `set <key>` | Update flow state; returns a JSON envelope | See command details |
| `flow` | `run <action>` | Execute flow actions such as gate checks and finalization | See command details |
| `check` | `config` | Validate `.sdd-forge/config.json` | `--format <text\|json>` |
| `check` | `freshness` | Check whether documentation is up to date with source | `--format <text\|json>` |
| `check` | `scan` | Verify integrity of the most recent scan output | `--format <text\|json>` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

The following options are recognized at the top level, before any subcommand, and are handled by the main entry point (`src/sdd-forge.js`).

| Option | Alias | Description | Exit Code |
|---|---|---|---|
| `--version` | `-v`, `-V` | Print the installed package version and exit | `0` |
| `--help` | `-h` | Print the top-level help message and exit | `0` |

When no arguments are provided, the help message is displayed and the process exits with code `1`. All subcommand dispatchers (`docs`, `flow`, `check`) also accept `-h` / `--help` at their own level to display subcommand-specific usage.

Argument parsing across all commands is performed by `src/lib/cli.js::parseArgs()`, which supports boolean flags, value-accepting options, short aliases, and default values. The `--` separator stops option parsing. Unrecognised options cause an error to be thrown by `parseArgs`.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Displays an overview of all available commands grouped by category (Project, Docs, Flow, Info) with short descriptions. Output is written to stdout with ANSI colour formatting.

```
sdd-forge help
sdd-forge --help
sdd-forge -h
```

#### setup

Runs an interactive wizard that prompts for project metadata and writes `.sdd-forge/config.json`. When all required values are supplied as flags, the wizard skips the corresponding prompts. On completion, it creates `.sdd-forge/`, `docs/`, and `specs/` directories, updates `.gitignore` and `.gitattributes`, and deploys skill templates.

```
sdd-forge setup
sdd-forge setup --name "My App" --type hono --lang en --agent claude
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source code root path |
| `--work-root <path>` | Work root directory |
| `--type <preset>` | Project preset type |
| `--purpose <text>` | Short description of the project's purpose |
| `--tone <text>` | Documentation tone |
| `--agent <name>` | Default AI agent |
| `--lang <code>` | Primary language code (default: `en`) |
| `--dry-run` | Preview actions without writing files |

#### upgrade

Detects differences between currently deployed skill/template files and the installed sdd-forge version, then updates only the changed files. Does not modify `config.json` or `context.json`. Obsolete skills are removed automatically.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Show which files would be updated without writing them |

#### presets list

Prints the full preset inheritance tree to stdout, including each preset's key, label, axis, language, aliases, supported scan categories, and template availability indicators.

```
sdd-forge presets list
```

#### docs build

Runs the complete documentation pipeline in sequence: `scan → enrich → init → data → text → readme → agents → translate`. Steps that have already run and whose outputs are current are skipped unless `--force` or `--regenerate` is specified.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| Option | Description |
|---|---|
| `--force` | Force full regeneration including re-init |
| `--regenerate` | Regenerate docs content without re-running init |
| `--verbose` | Print detailed progress for each step |
| `--dry-run` | Preview pipeline steps without executing them |

#### docs scan

Analyses the source code under the configured path and writes `analysis.json` to `.sdd-forge/output/`.

```
sdd-forge docs scan
```

#### docs enrich

Reads `analysis.json` and calls the configured AI agent to add summaries, enriching the data in place.

```
sdd-forge docs enrich
```

#### docs init

Initialises the `docs/` directory structure from the active preset's templates. Existing files are not overwritten unless `--force` is used.

```
sdd-forge docs init
```

#### docs data

Processes all `{{data}}` directives in documentation files, substituting values from `analysis.json` and the project config.

```
sdd-forge docs data
```

#### docs text

Processes all `{{text}}` directives in documentation files by calling the configured AI agent to generate prose.

```
sdd-forge docs text
```

#### docs readme

Generates or updates the project's top-level `README.md` from the documentation content.

```
sdd-forge docs readme
```

#### docs forge

Generates new documentation files based on the active preset templates.

```
sdd-forge docs forge
```

#### docs review

Submits documentation files to the AI agent for review and writes suggestions to stdout.

```
sdd-forge docs review
```

#### docs changelog

Generates a changelog entry based on recent git history and the current documentation state.

```
sdd-forge docs changelog
```

#### docs agents

Generates or updates `AGENTS.md` (and its `CLAUDE.md` symlink) using the configured preset and analysis data.

```
sdd-forge docs agents
```

#### docs translate

Translates documentation files into the languages specified in `docs.languages` within `config.json`.

```
sdd-forge docs translate
```

#### flow prepare

Initialises a new development flow: creates a spec file in `specs/`, creates a feature branch (or git worktree when `--worktree` is used), and writes the active flow state to `.sdd-forge/.active-flow`.

```
sdd-forge flow prepare --title "Add user auth"
sdd-forge flow prepare --title "Refactor API" --worktree --issue 42
```

| Option | Description |
|---|---|
| `--title <name>` | **(Required)** Feature title used for the spec file and branch name |
| `--base <branch>` | Base branch to branch from (default: current HEAD) |
| `--issue <number>` | Link a GitHub issue number to the flow |
| `--request <text>` | Free-text description of the request |
| `--worktree` | Create a git worktree instead of switching branches |
| `--no-branch` | Create only the spec file without a branch |
| `--dry-run` | Preview what would be created without executing |

#### flow resume

Scans for an active flow state and prints recovery context to stdout as a JSON envelope. Useful when the AI agent session has lost flow context.

```
sdd-forge flow resume
```

#### flow get \<key\>

Reads a named value from the active flow state and prints a JSON envelope to stdout.

```
sdd-forge flow get status
sdd-forge flow get context src/lib/cli.js
sdd-forge flow get guardrail pre
sdd-forge flow get check dirty
```

| Key | Positional Args | Options | Description |
|---|---|---|---|
| `status` | — | — | Current flow state summary |
| `resolve-context` | — | — | Resolved worktree and repo paths |
| `check` | `<target>` | — | Evaluate a condition: `dirty`, `gh`, `impl`, `finalize` |
| `prompt` | `<kind>` | — | Return a prompt template by kind |
| `qa-count` | — | — | Number of answered questions in the draft phase |
| `guardrail` | `<phase>` | `--format json` | Guardrails for the given phase (`draft`, `pre`, `post`, `impl`) |
| `issue` | `<number>` | — | Fetch GitHub issue content as JSON |
| `context` | `[path]` | `--raw`, `--search <query>` | List analysis entries or return file content |

#### flow set \<key\>

Updates a named value in the active flow state and prints a JSON envelope confirming the change.

```
sdd-forge flow set step spec done
sdd-forge flow set metric pre question
sdd-forge flow set issue-log --step impl --reason "Wrong type" --resolution "Corrected return type"
```

| Key | Positional Args | Options | Description |
|---|---|---|---|
| `step` | `<id> <status>` | — | Update a workflow step status |
| `request` | `<text>` | — | Set the user request field |
| `issue` | `<number>` | — | Set the linked GitHub issue number |
| `note` | `<text>` | — | Append a note to the notes array |
| `summary` | `<json-array>` | — | Set the requirements list from a JSON array |
| `req` | `<index> <status>` | — | Update a single requirement's status |
| `metric` | `<phase> <counter>` | — | Increment a metric counter (`question`, `redo`, `docsRead`, `srcRead`, `issueLog`) |
| `issue-log` | — | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` | Record an issue-log entry |
| `auto` | `on\|off` | — | Enable or disable autoApprove mode |
| `test-summary` | — | `--unit N`, `--integration N`, `--acceptance N` | Set test counts by category |

#### flow run \<action\>

Executes a named flow action and prints a JSON envelope with results.

```
sdd-forge flow run gate --phase pre
sdd-forge flow run finalize --mode all --merge-strategy squash
sdd-forge flow run review --phase spec
```

| Action | Description | Key Options |
|---|---|---|
| `gate` | Check deliverable readiness for a given phase | `--spec <path>`, `--phase <draft\|pre\|post\|impl>`, `--skip-guardrail` |
| `review` | Run AI code review on spec or test files | `--phase <test\|spec>`, `--dry-run`, `--skip-confirm` |
| `impl-confirm` | Verify implementation readiness before coding | `--mode <overview\|detail>` |
| `finalize` | Execute the finalization pipeline (commit, merge, sync, cleanup) | `--mode <all\|select>`, `--steps <1,2,3,4>`, `--merge-strategy <squash\|pr>`, `--message <msg>`, `--dry-run` |
| `sync` | Synchronise documentation with source changes | `--dry-run` |
| `lint` | Check changed files against guardrail patterns | `--base <branch>` |
| `retro` | Evaluate spec accuracy against the implementation | `--force`, `--dry-run` |
| `report` | Generate a work report for the completed flow | `--dry-run` |

#### check config

Validates the contents of `.sdd-forge/config.json` and reports any missing required fields or schema violations.

```
sdd-forge check config
sdd-forge check config --format json
```

| Option | Description |
|---|---|
| `--format <text\|json>` | Output format (default: `text`) |

#### check freshness

Compares the modification timestamps of source files against the last scan and documentation build to determine whether the docs are stale.

```
sdd-forge check freshness
```

| Option | Description |
|---|---|
| `--format <text\|json>` | Output format (default: `text`) |

#### check scan

Verifies that `analysis.json` exists, is well-formed, and matches the current source tree.

```
sdd-forge check scan
```

| Option | Description |
|---|---|
| `--format <text\|json>` | Output format (default: `text`) |
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

#### Exit Codes

Two exit code constants are defined in `src/lib/exit-codes.js` and used consistently across all commands.

| Code | Constant | Meaning |
|---|---|---|
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | An error occurred (configuration error, runtime failure, unknown command, or check failure) |

Help output (`-h` / `--help`) exits `0` when a recognised command is provided, and `1` when invoked with no subcommand at a dispatcher level (e.g., `sdd-forge docs` with no subcommand).

`flow` commands set `process.exitCode` rather than calling `process.exit()` directly, allowing any registered cleanup handlers to run before the process terminates. All other commands call `process.exit()` immediately.

#### Standard Output and Standard Error

| Stream | Content |
|---|---|
| stdout | Help text, version string, command results, progress messages, `flow` JSON envelopes |
| stderr | Error messages, usage guidance on invalid invocation, deprecation warnings |

#### Flow JSON Envelope Format

All `flow get`, `flow set`, and `flow run` commands write a structured JSON envelope to stdout.

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | `true` on success, `false` on failure |
| `type` | string | Command group: `get`, `set`, or `run` |
| `key` | string | The key or action that was invoked |
| `data` | object \| null | Result payload on success, `null` on failure |
| `errors` | array | Array of error objects; each has `level`, `code`, and `messages` fields |

An `ok: false` envelope always corresponds to exit code `1`. An `ok: true` envelope always corresponds to exit code `0`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
