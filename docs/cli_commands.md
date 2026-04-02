<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter covers all sdd-forge CLI commands — more than 20 in total — organized under two namespace dispatchers (`docs` for the documentation pipeline and `flow` for the Spec-Driven Development workflow) alongside four independent top-level commands (`help`, `setup`, `upgrade`, `presets`). The `docs` dispatcher routes to 13 subcommands, while the `flow` dispatcher uses a two-level pattern across `get`, `set`, and `run` command groups.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Print command list with descriptions | — |
| `sdd-forge setup` | Interactive project initialization wizard | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Re-deploy skill files and migrate config schema | `--dry-run` |
| `sdd-forge presets list` | Print the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and write `analysis.json` | — |
| `sdd-forge docs enrich` | Enrich analysis entries with AI-generated summaries | — |
| `sdd-forge docs init` | Initialize `docs/` from preset templates | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives using an AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate or update the project `README.md` | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven iterative documentation authoring | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `sdd-forge docs review` | Validate documentation quality and completeness | — |
| `sdd-forge docs translate` | Translate docs to configured target languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate Markdown changelog from `specs/` | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` | `--dry-run` |
| `sdd-forge flow prepare` | Initialize spec file and feature branch/worktree | — |
| `sdd-forge flow get status` | Return current flow phase, steps, and requirements | — |
| `sdd-forge flow get issue` | Fetch a GitHub issue by number | — |
| `sdd-forge flow get prompt` | Return a predefined prompt object by kind | — |
| `sdd-forge flow set issue` | Associate a GitHub issue number with the current flow | — |
| `sdd-forge flow set test-summary` | Record test result counts in flow state | `--unit`, `--integration`, `--acceptance` |
| `sdd-forge flow run finalize` | Run the finalization pipeline | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run sync` | Build docs and commit the result as part of the flow | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `-h`, `--help` | All commands | Print usage information and exit with code `0` |
| `--version`, `-v`, `-V` | Top-level (`sdd-forge`) only | Print the installed package version and exit |
| `--dry-run` | Most `docs` and `flow` commands | Preview changes without writing files or executing git operations |
| `--verbose`, `-v` | `docs build`, `docs forge` | Print detailed step-by-step progress to stderr |

The `-h`/`--help` flag is recognized by every command module via `parseArgs`. When present it prints usage text to stdout and skips all side effects. The `--dry-run` flag is propagated through the entire `docs build` pipeline to all sub-steps, so a single top-level flag suppresses writes across scan, init, data, text, readme, and agents.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Prints a formatted, version-stamped list of all available commands with short descriptions. No options are accepted.

**Usage:** `sdd-forge help`

#### `sdd-forge setup`

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, source path, language, preset type, documentation purpose, and AI agent provider. Writes `config.json` to `.sdd-forge/`, creates project directories, updates `.gitignore` and `.gitattributes`, deploys skill files, and generates `AGENTS.md`.

**Usage:** `sdd-forge setup [options]`

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--type <type>` | Preset type (e.g. `node-cli`, `laravel`) |
| `--lang <lang>` | Language code (e.g. `en`, `ja`) |
| `--agent <provider>` | Default AI agent provider |
| `--dry-run` | Preview without writing |

**Example:** `sdd-forge setup --name my-project --type node-cli --lang en`

#### `sdd-forge upgrade`

Re-deploys skill files from the installed sdd-forge package to the project's skill directories and applies any required `config.json` schema migrations (e.g., converting a string `chapters` array to the object format).

**Usage:** `sdd-forge upgrade [--dry-run]`

| Option | Description |
|---|---|
| `--dry-run` | Show which files would be updated without writing |

#### `sdd-forge presets list`

Prints the full preset inheritance tree using box-drawing characters. Each node shows the preset key, axis, language, aliases, and scan keys. Nodes without a `templates/` directory are marked `[no templates]`.

**Usage:** `sdd-forge presets list`

#### `sdd-forge docs build`

Runs the complete documentation pipeline in sequence: `scan → enrich → init → data → text → readme → agents`, and optionally `translate` for multi-language projects. Skips the `enrich` and `text` steps when no default AI agent is configured. The `--regenerate` flag skips `init` and re-fills text directives in existing files.

**Usage:** `sdd-forge docs build [options]`

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during `init` |
| `--regenerate` | Skip `init` and re-fill text directives in existing docs |
| `--verbose` | Print detailed step-by-step progress |
| `--dry-run` | Preview without writing |

**Example:** `sdd-forge docs build --verbose`

#### `sdd-forge docs scan`

Scans the project source tree and writes `analysis.json` to `.sdd-forge/output/`. The analysis categorizes files by type and extracts metadata used by subsequent pipeline steps.

**Usage:** `sdd-forge docs scan`

#### `sdd-forge docs enrich`

Calls an AI agent to annotate each entry in `analysis.json` with a `role`, `summary`, and `detail` field. Requires a configured default agent. Runs automatically as part of `docs build`.

**Usage:** `sdd-forge docs enrich`

#### `sdd-forge docs init`

Initializes the `docs/` directory by resolving the preset template chain, merging chapter lists, and writing Markdown chapter files. Optionally uses an AI agent to filter chapters based on analysis content and the configured documentation purpose. Skips existing files unless `--force` is set. Translates template content when the target language differs from English.

**Usage:** `sdd-forge docs init [options]`

| Option | Description |
|---|---|
| `--type <type>` | Override the preset type |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

#### `sdd-forge docs data`

Resolves all `{{data(...)}}` directives in chapter files by calling the preset resolver with the current `analysis.json`. Writes resolved content back in place.

**Usage:** `sdd-forge docs data [--dry-run]`

#### `sdd-forge docs text`

Fills all `{{text(...)}}` directives in chapter files using an AI agent. Each directive carries an inline prompt specifying what to write. Runs concurrently across files per the configured concurrency setting.

**Usage:** `sdd-forge docs text [--dry-run]`

#### `sdd-forge docs readme`

Generates or updates `README.md` by merging the preset readme template, resolving `{{data}}` directives, and filling `{{text}}` blocks with AI. For multi-language projects, per-language `README.md` files are written to the corresponding language subdirectory under `docs/`.

**Usage:** `sdd-forge docs readme [options]`

| Option | Description |
|---|---|
| `--lang <lang>` | Target language code |
| `--output <path>` | Custom output path |
| `--dry-run` | Print generated content without writing |

#### `sdd-forge docs forge`

AI-driven documentation authoring with an iterative write-review loop. Supports three modes: `local` (per-file agent calls, default), `assist`, and `agent`. After each round the review command is run and any failures are fed back as context for the next round, up to `--max-runs` iterations.

**Usage:** `sdd-forge docs forge --prompt "<instruction>" [options]`

| Option | Description |
|---|---|
| `--prompt <text>` | Authoring instruction (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Read prompt from a file |
| `--spec <path>` | Path to a spec.md file for additional context |
| `--max-runs <n>` | Maximum review-and-revise rounds (default: `3`) |
| `--review-cmd <cmd>` | Review command (default: `sdd-forge docs review`) |
| `--mode <mode>` | `local`, `assist`, or `agent` |
| `--verbose`, `-v` | Stream agent output to stderr |
| `--dry-run` | List target files without writing |

**Example:** `sdd-forge docs forge --prompt "Add usage examples to all CLI commands"`

#### `sdd-forge docs review`

Validates all chapter files for: minimum 15-line length, H1 heading presence, unfilled `{{text}}` and `{{data}}` directives, broken HTML comments, and residual block tags. Also verifies that `README.md` exists and that all translated language directories are present and non-empty. Exits with `EXIT_ERROR` on any failure, making it suitable as a CI gate.

**Usage:** `sdd-forge docs review [docs-dir]`

**Example:** `sdd-forge docs review docs/`

#### `sdd-forge docs translate`

Translates chapter files and `README.md` into each configured target language using an AI agent. Skips files where the target is newer than the source unless `--force` is set. Creates per-language subdirectories under `docs/` automatically.

**Usage:** `sdd-forge docs translate [options]`

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Retranslate even if target files are up to date |
| `--dry-run` | List tasks without translating |

#### `sdd-forge docs changelog`

Scans `specs/` for numbered subdirectories, reads each `spec.md` to extract title, status, date, and description, and writes a formatted Markdown table to `docs/change_log.md`. Produces both a latest-per-series index and a full chronological entry table.

**Usage:** `sdd-forge docs changelog [output-path] [--dry-run]`

#### `sdd-forge docs agents`

Generates or updates `AGENTS.md` by merging the SDD template section with AI-refined project-specific context. Creates a stub if `AGENTS.md` does not exist, resolves `{{data}}` directives, then calls an AI agent to produce an updated PROJECT section using docs content, `package.json` scripts, and `README.md` as input.

**Usage:** `sdd-forge docs agents [--dry-run]`

#### `sdd-forge flow prepare`

Initializes the SDD flow for a new feature request: creates a spec file under `specs/`, sets up a feature branch or git worktree based on the chosen work environment, and writes `flow.json` to track flow state. Requires an active `config.json`.

**Usage:** `sdd-forge flow prepare [options]`

#### `sdd-forge flow get status`

Returns the current flow phase (`plan`, `impl`, or `finalize`), all steps with their completion status, requirements progress, branch names, worktree flag, linked issue number, notes, and metrics as a JSON envelope to stdout.

**Usage:** `sdd-forge flow get status`

#### `sdd-forge flow get issue`

Fetches a GitHub issue by number using the `gh` CLI and returns its title, body, labels, and state as a structured JSON envelope.

**Usage:** `sdd-forge flow get issue <number>`

**Example:** `sdd-forge flow get issue 42`

#### `sdd-forge flow get prompt`

Returns a predefined prompt object — containing description, recommendation, and a choice list — keyed by language and kind. Supported kinds include `plan.approach`, `plan.work-environment`, `plan.approval`, `impl.review-mode`, `finalize.mode`, `finalize.steps`, and others defined in the internal `PROMPTS_BY_LANG` registry.

**Usage:** `sdd-forge flow get prompt <kind>`

**Example:** `sdd-forge flow get prompt plan.approach`

#### `sdd-forge flow set issue`

Associates a GitHub issue number with the current active flow by persisting it to `flow.json`.

**Usage:** `sdd-forge flow set issue <number>`

**Example:** `sdd-forge flow set issue 7`

#### `sdd-forge flow set test-summary`

Records unit, integration, and/or acceptance test counts into the current flow state.

**Usage:** `sdd-forge flow set test-summary [options]`

| Option | Description |
|---|---|
| `--unit <n>` | Number of unit tests |
| `--integration <n>` | Number of integration tests |
| `--acceptance <n>` | Number of acceptance tests |

**Example:** `sdd-forge flow set test-summary --unit 42 --integration 5`

#### `sdd-forge flow run finalize`

Orchestrates the finalization pipeline. In `--mode all`, runs all six steps in order: commit (1), merge or PR creation (2), retrospective (3), docs sync (4), cleanup (5), and record (6). In `--mode select`, only the specified step numbers are executed. Merge strategy defaults to auto-detection based on `config.commands.gh` and `gh` CLI availability.

**Usage:** `sdd-forge flow run finalize --mode <all|select> [options]`

| Option | Description |
|---|---|
| `--mode <all\|select>` | Execution mode (required) |
| `--steps <1,2,...>` | Step numbers for `select` mode |
| `--merge-strategy <strategy>` | `squash`, `pr`, or `auto` |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview without executing |

**Example:** `sdd-forge flow run finalize --mode select --steps 1,2,5`

#### `sdd-forge flow run sync`

Runs `sdd-forge docs build` followed by `sdd-forge docs review`, then stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md` and commits them with the message `docs: sync documentation`. Skips the commit if there are no staged changes.

**Usage:** `sdd-forge flow run sync [--dry-run]`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Condition |
|---|---|---|
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Unknown subcommand, missing required argument, pipeline step failure, or unrecoverable runtime error |

Flow subcommands (`flow get`, `flow set`, `flow run`) write structured JSON envelopes exclusively to stdout via the `ok()` and `fail()` helpers from `flow-envelope.js`. A success envelope contains `status: "ok"`, `group`, `command`, and a `data` object. A failure envelope replaces `data` with `code` and `message` fields. This design allows skill scripts to parse stdout reliably regardless of incidental log output on stderr.

Documentation pipeline commands write progress messages to stdout and error details to stderr. The `docs review` command exits with code `1` if any quality check fails, making it a suitable blocking step in CI pipelines. When `--dry-run` is active across any command, all filesystem writes and git operations are suppressed and a preview is printed to stdout instead.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
