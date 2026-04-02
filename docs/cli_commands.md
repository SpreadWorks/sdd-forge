<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides 24 named commands organized under two namespace dispatchers — `docs` (14 subcommands covering the complete documentation pipeline) and `flow` (subcommands for Spec-Driven Development workflow management) — along with independent top-level commands: `setup`, `upgrade`, and `presets`. The `flow` dispatcher is further subdivided into `get`, `set`, `run`, `prepare`, `merge`, and `cleanup` groups, each routing to dedicated command modules.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display all available commands grouped by category with the package version | — |
| `setup` | Interactive wizard to initialize a new sdd-forge project and write `config.json` | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--purpose`, `--tone`, `--dry-run` |
| `upgrade` | Re-deploy skill files and apply `config.json` schema migrations | `--dry-run` |
| `docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan source files and produce `analysis.json` in `.sdd-forge/output/` | — |
| `docs enrich` | AI-enrich analysis entries with role, summary, detail, and chapter classification | — |
| `docs init` | Initialize `docs/` with chapter template files resolved from the preset chain | `--type`, `--lang`, `--force`, `--dry-run` |
| `docs data` | Resolve `{{data(...)}}` directives in chapter files using the preset resolver | `--dry-run` |
| `docs text` | Fill `{{text(...)}}` directives in chapter files using an AI agent | `--dry-run` |
| `docs readme` | Generate or update `README.md` from the preset template with data and text directives | `--lang`, `--output`, `--dry-run` |
| `docs forge` | AI-driven documentation authoring with an iterative write-review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--dry-run`, `-v` |
| `docs review` | Validate documentation quality: unfilled directives, line count, H1, broken HTML comments | — |
| `docs translate` | Translate chapter files and README to configured target languages using AI | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate a Markdown changelog table from `specs/` directory metadata | `--dry-run` |
| `docs agents` | Generate or refine `AGENTS.md` / `CLAUDE.md` using AI and directive resolution | `--dry-run` |
| `flow prepare` | Initialize spec file and create feature branch or git worktree for a new flow | — |
| `flow get status` | Return current flow phase, step list, requirements, and progress counters as JSON | — |
| `flow get issue` | Fetch a GitHub issue by number via `gh` and return structured JSON | — |
| `flow get prompt` | Retrieve a predefined choice prompt object by language and kind | — |
| `flow set issue` | Associate a GitHub issue number with the active flow in `flow.json` | — |
| `flow set test-summary` | Record unit/integration/acceptance test counts into flow state metrics | `--unit`, `--integration`, `--acceptance` |
| `flow run sync` | Run docs build, review, stage, and commit documentation changes | `--dry-run` |
| `flow merge` | Squash-merge the feature branch into base, or create a GitHub pull request | `--dry-run`, `--pr`, `--auto` |
| `flow cleanup` | Remove the git worktree and delete the feature branch after merge | `--dry-run` |
| `presets list` | Print the full preset inheritance tree with metadata using box-drawing characters | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Alias | Description | Applicable Commands |
| --- | --- | --- | --- |
| `--help` | `-h` | Print usage information for the command and exit | All commands |
| `--dry-run` | — | Preview planned actions without writing files, calling AI agents, or executing git operations | `docs build`, `docs init`, `docs forge`, `docs readme`, `docs translate`, `docs changelog`, `docs agents`, `flow merge`, `flow cleanup`, `flow run sync`, `upgrade` |
| `--verbose` | `-v` | Stream detailed per-step progress and agent output to stderr | `docs forge` |
| `--lang` | — | Override the target output language for generated or translated files | `docs init`, `docs readme`, `docs translate` |
| `--force` | — | Overwrite existing output files that would otherwise be skipped | `docs build`, `docs init`, `docs translate` |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `help`
**Usage:** `sdd-forge help`

Prints all available commands grouped by category (Project, Docs, Flow, Info) alongside the current package version. The list is derived from the static `LAYOUT` array in `help.js`. No options are accepted.

#### `setup`
**Usage:** `sdd-forge setup [options]`

Interactive multi-step wizard that prompts for project name, source path, output language(s), preset type(s), documentation purpose, tone, and AI agent provider. Writes `.sdd-forge/config.json`, creates required directories, updates `.gitignore` and `.gitattributes`, deploys skill files, and generates or updates `AGENTS.md`. All prompts can be bypassed with CLI options for non-interactive use.

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source directory path |
| `--work-root <path>` | Work root (defaults to source path) |
| `--type <type>` | Preset type |
| `--lang <lang>` | Project language code (e.g. `en`, `ja`) |
| `--agent <agent>` | Default AI agent provider |
| `--purpose <purpose>` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone <tone>` | Writing tone (`polite`, `formal`, `casual`) |
| `--dry-run` | Preview without writing files |

#### `upgrade`
**Usage:** `sdd-forge upgrade [--dry-run]`

Re-deploys skill files from the installed package version and applies any pending schema migrations to `.sdd-forge/config.json`. Currently migrates the `chapters` array from the legacy string format to the object format. Reports each skill file as `updated` or `unchanged`.

| Option | Description |
| --- | --- |
| `--dry-run` | Show planned changes without writing |

#### `docs build`
**Usage:** `sdd-forge docs build [options]`

Runs the complete documentation pipeline in the following sequence: `scan → enrich → init → data → text → readme → agents`. If `docs.languages` is configured for multiple languages, a `translate` step is appended. The `enrich` and `text` steps are silently skipped when no `agent.default` is configured. Progress is displayed with weighted step indicators.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init`; re-run `data`, `text`, `readme`, and `agents` only |
| `--verbose` | Print per-step progress details |
| `--dry-run` | Preview all steps without writing files or calling AI |

#### `docs scan`
**Usage:** `sdd-forge docs scan`

Scans the configured source directory using the active preset's scan rules and writes `analysis.json` to `.sdd-forge/output/`. This file is the primary input for all subsequent pipeline steps. No options beyond `--help`.

#### `docs enrich`
**Usage:** `sdd-forge docs enrich`

Passes all entries from `analysis.json` to an AI agent in a single batch request. The agent annotates each entry with a role, summary, detail, and chapter classification. The enriched data is written back to `analysis.json`. Requires `agent.default` to be set in `config.json`.

#### `docs init`
**Usage:** `sdd-forge docs init [options]`

Resolves the template chain for the configured preset type, determines the chapter order via `resolveChaptersOrder()`, and writes Markdown template files to `docs/`. When `config.chapters` is not defined and an AI agent is available, the chapter list is filtered by an AI call that matches analysis content against chapter topics. Existing files are skipped unless `--force` is passed.

| Option | Description |
| --- | --- |
| `--type <type>` | Override the preset type |
| `--lang <lang>` | Target language for template translation |
| `--docs-dir <path>` | Write files to a custom directory |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

#### `docs data`
**Usage:** `sdd-forge docs data [--dry-run]`

Resolves all `{{data("source.method")}}` directives in chapter files by calling the corresponding resolver methods from the active preset chain. Writes the expanded Markdown content between the directive tags. Processing runs in place on each chapter file.

#### `docs text`
**Usage:** `sdd-forge docs text [--dry-run]`

Fills `{{text(...)}}` directives in chapter files by calling an AI agent with the enriched analysis and a per-directive prompt. Files are processed concurrently up to the `config.concurrency` limit. Stale directive content is stripped before each AI call to avoid redundant context.

#### `docs readme`
**Usage:** `sdd-forge docs readme [options]`

Generates or updates `README.md` (or a language-specific variant) by resolving the `README.md` template from the preset chain, applying `{{data}}` directives, and filling any `{{text}}` directives via AI. The file is not rewritten if the generated content is identical to the current content.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Target language code |
| `--output <path>` | Write to a custom path instead of `README.md` |
| `--dry-run` | Print generated content to stdout without writing |

#### `docs forge`
**Usage:** `sdd-forge docs forge --prompt <text> [options]`

Orchestrates AI-driven documentation authoring across all chapter files with an iterative write-review loop. In `local` mode (default), each file is passed to the AI agent individually with a per-file prompt and the shared system prompt derived from the analysis summary. After each round, the review command is executed and any failures are included as `reviewFeedback` in the next round. The loop runs up to `--max-runs` times.

| Option | Description |
| --- | --- |
| `--prompt <text>` | Authoring instruction for the AI agent (required unless `--prompt-file` is set) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Path to a spec file to include as context |
| `--max-runs <n>` | Maximum write-review iterations (default: `3`) |
| `--mode <mode>` | `local` (default), `assist`, or `agent` |
| `--review-cmd <cmd>` | Review command to run after each round (default: `sdd-forge docs review`) |
| `--dry-run` | List target files without invoking the agent |
| `--verbose` / `-v` | Stream agent stdout/stderr to the terminal |

**Example:**
```
sdd-forge docs forge --prompt "Write comprehensive end-user documentation" --spec specs/041-commands/spec.md
```

#### `docs review`
**Usage:** `sdd-forge docs review [docs-dir]`

Validates all chapter files in `docs/` (or the specified directory) against a set of integrity checks: minimum line count of 15, presence of an H1 heading, no unfilled `{{text}}` directives (empty blocks), no unfilled `{{data}}` directives, no broken HTML comments (unbalanced `<!--`/`-->`), and no residual template block tags. Also verifies that `README.md` exists and that all multi-language doc directories contain non-empty files. Exits with `EXIT_ERROR` if any check fails.

#### `docs translate`
**Usage:** `sdd-forge docs translate [options]`

Translates chapter files and `README.md` from the default language to all configured non-default languages using an AI agent. Files where the target is newer than the source are skipped unless `--force` is set. Language subdirectories under `docs/` are created automatically. Concurrency is controlled by `config.concurrency`.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate even if the target file is already up-to-date |
| `--dry-run` | List tasks without performing translation |

#### `docs changelog`
**Usage:** `sdd-forge docs changelog [output-path] [--dry-run]`

Scans the `specs/` directory for numbered subdirectories (e.g. `041-commands/`), reads `spec.md` from each, and extracts title, status, created date, branch, and input summary. Writes a formatted Markdown file containing a latest-by-series index table and a full history table. Defaults to writing `docs/change_log.md`.

#### `docs agents`
**Usage:** `sdd-forge docs agents [--dry-run]`

Reads `AGENTS.md` from the source root (or creates a stub if absent), resolves `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives, then calls an AI agent to refine the PROJECT section using package scripts, chapter content, and README as context. Only the PROJECT block is replaced; user-written content outside directive boundaries is preserved.

#### `flow prepare`
**Usage:** `sdd-forge flow prepare [options]`

Initializes a new SDD flow by writing a spec file and optionally creating a feature branch or git worktree. Records the flow state in `flow.json` under the spec directory. Requires a valid `config.json`.

#### `flow get status`
**Usage:** `sdd-forge flow get status`

Returns the current flow phase (derived from completed steps), the full step and requirements lists with statuses, progress counters, per-phase metrics, the active spec path, branch names, worktree flag, and `autoApprove` setting as a JSON envelope to stdout.

#### `flow get issue`
**Usage:** `sdd-forge flow get issue <number>`

Fetches a GitHub issue by number using `gh issue view --json` and returns its title, body, labels, and state in a structured JSON envelope. Requires the `gh` CLI to be installed and authenticated.

#### `flow get prompt`
**Usage:** `sdd-forge flow get prompt <lang> <kind>`

Returns a predefined prompt object for the specified language (`en`, `ja`) and kind key (e.g. `plan.approach`, `plan.approval`, `impl.review-mode`, `finalize.mode`, `finalize.steps`). The returned object includes phase, step, description, optional recommendation, and a numbered choices array.

#### `flow set issue`
**Usage:** `sdd-forge flow set issue <number>`

Associates a GitHub issue number with the active flow by persisting it in `flow.json` via `setIssue()`. Subsequent `flow merge` calls use this number to generate `fixes #N` references in commit messages and PR bodies.

#### `flow set test-summary`
**Usage:** `sdd-forge flow set test-summary [options]`

Records test count data into the `metrics.test.summary` field of the active flow state. At least one option must be provided. Values must be non-negative integers.

| Option | Description |
| --- | --- |
| `--unit <n>` | Number of unit tests |
| `--integration <n>` | Number of integration tests |
| `--acceptance <n>` | Number of acceptance tests |

#### `flow run sync`
**Usage:** `sdd-forge flow run sync [--dry-run]`

Runs `sdd-forge docs build` followed by `sdd-forge docs review`, then stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md` with `git add` and creates a commit with the message `docs: sync documentation`. Reports the list of changed files in the output envelope. If no files changed, the result is `skipped`.

#### `flow merge`
**Usage:** `sdd-forge flow merge [options]`

Merges the feature branch into the base branch using squash merge, or creates a GitHub pull request. PR title is derived from the first line of the `## Goal` section in `spec.md`; the PR body includes Goal, Requirements, and Scope sections. When using worktree mode, `git -C <mainRepoPath>` is used for all git operations.

| Option | Description |
| --- | --- |
| `--pr` | Create a pull request via `gh pr create` instead of squash merge |
| `--auto` | Automatically choose PR if `commands.gh=enable` in config and `gh` is available; otherwise squash merge |
| `--dry-run` | Print git and gh commands without executing |

#### `flow cleanup`
**Usage:** `sdd-forge flow cleanup [--dry-run]`

Removes the git worktree with `git worktree remove` and deletes the feature branch with `git branch -D`. Clears the `.active-flow` entry from flow state. Safe to run idempotently if the worktree has already been removed. In spec-only mode (where `featureBranch === baseBranch`), the command exits with a skip message and only clears the flow state entry.

#### `presets list`
**Usage:** `sdd-forge presets list`

Prints the full preset inheritance tree rooted at the `base` preset, using box-drawing characters (`├──`, `└──`). Each node displays the preset key, label, axis, language, aliases, scan configuration keys, and a `[no templates]` marker when no `templates/` directory exists alongside `preset.json`. Children are sorted alphabetically.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Symbol | Meaning |
| --- | --- | --- |
| `0` | Success | Command completed without errors or printed help and exited cleanly |
| `1` | `EXIT_ERROR` | Fatal error: unknown subcommand, missing required configuration, pipeline step failure, invalid arguments, or quality check failure in `docs review` |

**stdout conventions:**

- Progress lines from `docs` commands use a `[command]` prefix, for example `[forge] start: docs/overview.md` or `[init] merged: overview.md`.
- `flow get` and `flow set` subcommands write a structured JSON envelope to stdout in the form `{"ok": true, "group": "get", "cmd": "status", "data": {...}}` on success, or `{"ok": false, "group": "get", "cmd": "status", "error": {"code": "...", "message": "..."}}` on failure.
- `docs review` writes one line per check result; all failures are printed before the command exits.
- `docs changelog` and `docs forge` write human-readable summaries of generated or processed files.
- `--dry-run` output for all commands is written to stdout so it can be captured or piped.

**stderr conventions:**

- Unknown subcommand errors and configuration warnings are written to stderr.
- `docs forge` with `--verbose` / `-v` streams the AI agent's stdout and stderr directly to the terminal's stderr.
- Pipeline-level errors (e.g. `[build] ERROR: ...`) are printed to stderr before the process exits with `EXIT_ERROR`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
