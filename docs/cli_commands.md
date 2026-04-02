<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The sdd-forge CLI exposes over 20 commands organized into three tiers: four top-level commands (`help`, `setup`, `upgrade`, `presets`), twelve `docs` subcommands that implement the full documentation pipeline from source scanning through AI-driven text generation, and the `flow` namespace with four command groups (`prepare`, `get`, `set`, `run`) covering the complete Spec-Driven Development lifecycle. Every command accepts `-h` / `--help` for inline usage information, and namespace dispatchers (`docs`, `flow`) forward all remaining arguments to their respective target modules.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Print all commands with descriptions and package version | — |
| `setup` | Interactive wizard to initialize or update a sdd-forge project | `--name`, `--type`, `--lang`, `--agent`, `--purpose`, `--tone`, `--dry-run` |
| `upgrade` | Re-deploy skill files and apply `config.json` schema migrations | `--dry-run` |
| `presets list` | Print the preset inheritance tree with axes, aliases, and scan keys | — |
| `docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents (→ translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `docs scan` | Scan source files and produce `.sdd-forge/output/analysis.json` | — |
| `docs enrich` | AI-enrich analysis entries with role, summary, detail, and chapter classification | — |
| `docs init` | Initialize `docs/` chapter files from preset templates | `--type`, `--force`, `--docs-dir`, `--dry-run` |
| `docs data` | Resolve `{{data(...)}}` directives in chapter files from analysis | `--dry-run` |
| `docs text` | Fill `{{text(...)}}` directives with AI-generated prose | `--dry-run` |
| `docs readme` | Generate or update `README.md` from the preset readme template | `--lang`, `--output`, `--dry-run` |
| `docs forge` | AI-driven documentation authoring with iterative write-review loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--verbose`, `--dry-run` |
| `docs review` | Validate documentation output for quality and completeness | — |
| `docs changelog` | Generate a Markdown changelog table from `specs/` subdirectories | `--dry-run` |
| `docs agents` | Generate or refine `AGENTS.md` / `CLAUDE.md` using AI | `--dry-run` |
| `docs translate` | Translate chapter files and README into configured target languages | `--lang`, `--force`, `--dry-run` |
| `flow prepare` | Initialize spec file and create feature branch or git worktree | — |
| `flow get issue` | Fetch a GitHub issue by number via the `gh` CLI | — |
| `flow get prompt` | Retrieve a predefined prompt object by language and kind key | — |
| `flow get status` | Return current flow phase, step list, and progress counters | — |
| `flow set issue` | Associate a GitHub issue number with the active flow in `flow.json` | — |
| `flow run finalize` | Execute the finalization pipeline: commit → merge → retro → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `flow run lint` | Run guardrail lint checks on changed files against the base branch | `--base` |
| `flow run review` | Run two-stage AI code quality review on the current branch diff | `--dry-run`, `--skip-confirm` |
| `flow run sync` | Build docs, validate, and commit the result | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
| --- | --- | --- |
| `-h`, `--help` | All commands | Print usage information and available options; exits with code `0` |
| `--dry-run` | `setup`, `upgrade`, most `docs` and `flow run` commands | Preview operations without writing files, executing git commands, or calling AI agents |
| `--verbose`, `-v` | `docs build`, `docs forge` | Print detailed step-by-step progress to stderr |
| `--lang <lang>` | `docs init`, `docs readme`, `docs translate` | Override the output language for template resolution and AI prompts |
| `-v`, `--version`, `-V` | Top-level entry point only | Print the installed package version and exit |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Prints the formatted command list with descriptions and the current package version. Output is localized using the project's configured language via the `translate()` function.

Usage: `sdd-forge help`

#### setup

Interactive wizard that creates or updates `.sdd-forge/config.json`, appends entries to `.gitignore` and `.gitattributes`, deploys skill files, and initializes `AGENTS.md`. When an existing config is found, its values are used as defaults for each wizard prompt. All wizard steps can be bypassed with CLI flags for non-interactive use.

Usage: `sdd-forge setup [options]`

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--path <path>` | Source directory path |
| `--type <type>` | Preset type (e.g., `node-cli`, `laravel`) |
| `--lang <lang>` | Project language code (e.g., `en`, `ja`) |
| `--agent <agent>` | Default AI agent identifier |
| `--purpose <purpose>` | Documentation purpose: `developer-guide`, `user-guide`, or `api-reference` |
| `--tone <tone>` | Writing tone: `polite`, `formal`, or `casual` |
| `--dry-run` | Preview config without writing any files |

Example: `sdd-forge setup --name myapp --type node-cli --lang en`

#### upgrade

Re-deploys skill files from the current package installation and applies pending `config.json` schema migrations. Currently detects and converts the legacy string-array `chapters` format to the object-array format. Reports each skill file as `updated` or `unchanged`.

Usage: `sdd-forge upgrade [--dry-run]`

#### presets list

Prints the full preset inheritance tree starting from the `base` preset, using box-drawing characters for the hierarchy. Each node shows the preset key, axis, language, aliases, scan keys, and whether a `templates/` directory is present.

Usage: `sdd-forge presets list`

#### docs build

Runs the complete documentation pipeline sequentially: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, with an optional `translate` step for multi-language projects. Each step is weighted for a progress indicator. The `enrich` and `text` steps are skipped if no `defaultAgent` is configured in `config.json`. Before running `text`, the content of each chapter file is stripped of stale fill content to prevent accumulation.

Usage: `sdd-forge docs build [options]`

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init` and regenerate text in existing chapter files |
| `--verbose` | Print per-step progress to stderr |
| `--dry-run` | Preview without writing any files or calling AI agents |

Example: `sdd-forge docs build --force --verbose`

#### docs scan

Scans the configured source directory according to preset-defined rules and writes categorized results to `.sdd-forge/output/analysis.json`. This file is the input for all subsequent pipeline steps.

Usage: `sdd-forge docs scan`

#### docs enrich

Reads `analysis.json` and passes entries to the configured AI agent to assign a `role`, `summary`, `detail`, and chapter classification to each entry. Writes enriched data back to `analysis.json`.

Usage: `sdd-forge docs enrich`

#### docs init

Creates chapter Markdown files in `docs/` by resolving the preset template chain for the configured type and language. Templates are translated when the output language differs from `en`. Skips files that already exist unless `--force` is passed. When analysis data and an AI agent are available, optionally filters the chapter list based on content relevance and the configured documentation purpose (`developer-guide`, `user-guide`, etc.).

Usage: `sdd-forge docs init [options]`

| Option | Description |
| --- | --- |
| `--type <type>` | Override the preset type for template resolution |
| `--force` | Overwrite existing chapter files |
| `--docs-dir <dir>` | Override the output directory path |
| `--dry-run` | Print the list of files that would be written |

#### docs data

Reads each chapter file in `docs/`, resolves all `{{data(...)}}` directives by calling the preset resolver chain against `analysis.json`, and writes the results back. Supports `--dry-run` to preview resolved output without writing.

Usage: `sdd-forge docs data [--dry-run]`

#### docs text

Finds unfilled `{{text(...)}}` directives in chapter files, constructs a system prompt from the configured documentation style, and calls the AI agent to generate prose. Files are processed concurrently up to the limit in `config.json`. Writes filled content back to each file.

Usage: `sdd-forge docs text [--dry-run]`

#### docs readme

Resolves the preset readme template, applies `{{data(...)}}` directives with a path-aware resolver (handling `docs.langSwitcher` for relative links), fills any `{{text(...)}}` blocks using the AI agent, and writes the result to `README.md` or the path specified by `--output`. Skips writing if the generated content is identical to the existing file.

Usage: `sdd-forge docs readme [options]`

| Option | Description |
| --- | --- |
| `--lang <lang>` | Target language for template resolution |
| `--output <path>` | Override the output file path |
| `--dry-run` | Print generated content to stdout without writing |

#### docs forge

Orchestrates an iterative AI documentation authoring loop across all chapter files. In `local` mode, invokes the AI agent once per chapter file concurrently. After each round, runs the review command and feeds any failures back as `reviewFeedback` in subsequent rounds, up to `--max-runs` iterations. Finalizes by regenerating `README.md` and running any configured translate steps.

Usage: `sdd-forge docs forge --prompt "<instruction>" [options]`

| Option | Description |
| --- | --- |
| `--prompt <text>` | Instruction passed to the AI agent (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Path to a `spec.md` to include as additional context |
| `--max-runs <n>` | Maximum write-review iterations (default: `3`) |
| `--review-cmd <cmd>` | Review command between rounds (default: `sdd-forge docs review`) |
| `--mode <mode>` | Invocation mode: `local`, `assist`, or `agent` (default: `local`) |
| `--verbose`, `-v` | Stream agent stdout/stderr to terminal |
| `--dry-run` | List target files without invoking the agent |

Example: `sdd-forge docs forge --prompt "Document all public APIs" --spec specs/041-api/spec.md`

#### docs review

Validates all chapter files in `docs/` for output quality. Checks performed per file: minimum 15 lines, presence of an H1 heading, no unfilled `{{text}}` directives, no unfilled `{{data}}` directives, no exposed directive syntax in rendered output, no broken HTML comment pairs, and no residual template block tags. Also verifies that `README.md` exists and that each configured non-default language directory contains non-empty chapter files. Exits with code `1` if any check fails.

Usage: `sdd-forge docs review [docs-dir]`

#### docs changelog

Scans `specs/` for numbered subdirectories, reads each `spec.md` to extract `title`, `status`, `created`, and `branch` metadata, and writes a Markdown table to `docs/change_log.md`. Deduplicates by spec series, showing only the latest version per series in the index table while listing all versions in the full table.

Usage: `sdd-forge docs changelog [output-path] [--dry-run]`

#### docs agents

Reads or creates `AGENTS.md` at the project source root. Resolves the `{{data("agents.sdd")}}` directive against the preset resolver, then calls the AI agent with a refine prompt built from `package.json` scripts, generated chapter content, and `README.md` to update the `{{data("agents.project")}}` block. Content outside directive blocks is preserved.

Usage: `sdd-forge docs agents [--dry-run]`

#### docs translate

Translates chapter files and `README.md` into each non-default language listed in `docs.languages`. Skips files whose target modification time is newer than the source unless `--force` is set. Calls `callAgentAsync` concurrently via `mapWithConcurrency` with a language-specific system prompt that includes tone and style instructions. Writes output to `docs/<lang>/` subdirectories, creating them if necessary.

Usage: `sdd-forge docs translate [options]`

| Option | Description |
| --- | --- |
| `--lang <lang>` | Translate to a single target language only |
| `--force` | Re-translate all files regardless of modification time |
| `--dry-run` | List files that would be translated without writing |

#### flow prepare

Initializes a new SDD flow by creating a spec file under `specs/`, setting up a feature branch or git worktree as selected, and writing `flow.json` with the initial flow state including `spec`, `baseBranch`, `featureBranch`, and `worktree` fields.

Usage: `sdd-forge flow prepare`

#### flow get issue

Fetches a GitHub issue by number using `gh issue view --json` and returns the `title`, `body`, `labels`, and `state` fields wrapped in a flow envelope JSON object.

Usage: `sdd-forge flow get issue <number>`

#### flow get prompt

Returns a predefined prompt object for a given kind key (e.g., `plan.approach`, `impl.review-mode`, `finalize.mode`). The response includes `phase`, `step`, `description`, `recommendation`, and a `choices` array. Supports both `ja` and `en` locales.

Usage: `sdd-forge flow get prompt <kind>`

#### flow get status

Reads `flow.json` and returns the current phase (derived from completed steps via `derivePhase()`), the full step list with statuses, requirements progress, branch names, issue number, request text, notes, metrics, and `autoApprove` flag — all in a flow envelope JSON object.

Usage: `sdd-forge flow get status`

#### flow set issue

Persists a GitHub issue number to `flow.json` via `setIssue()`, associating it with the current flow. The issue number is included in squash merge commit messages and PR bodies during finalization.

Usage: `sdd-forge flow set issue <number>`

#### flow run finalize

Executes the finalization pipeline in `all` mode (all six steps) or `select` mode (user-specified subset). Steps by number: `1=commit`, `2=merge`, `3=retro`, `4=sync`, `5=cleanup`, `6=record`. The merge step delegates to `flow/commands/merge.js`; when `--merge-strategy auto` is used, it creates a PR if `config.commands.gh=enable` and `gh` is available, otherwise performs a squash merge. The sync step is automatically skipped when the merge route is PR.

Usage: `sdd-forge flow run finalize --mode <all|select> [options]`

| Option | Description |
| --- | --- |
| `--mode <all\|select>` | Required: run all steps or a user-defined subset |
| `--steps <1,2,...>` | Comma-separated step numbers (required in `select` mode) |
| `--merge-strategy <strategy>` | `squash`, `pr`, or `auto` (default: `auto`) |
| `--message <msg>` | Custom commit message for step 1 (commit) |
| `--dry-run` | Preview all steps without executing git or build operations |

#### flow run lint

Loads guardrail articles from the project via `loadMergedArticles()` and runs pattern-based lint checks against the diff between HEAD and the base branch. Reports each violation with the article name, file path, line number, and matched text. Returns a pass/fail flow envelope.

Usage: `sdd-forge flow run lint [--base <branch>]`

#### flow run review

Runs a two-stage AI review. The draft stage generates numbered refactoring proposals from the branch diff. The final stage validates each proposal with an APPROVED or REJECTED verdict and a reason. Results are written to `specs/<id>/review.md`. Approved proposals can optionally be applied by the AI agent in a follow-up pass.

Usage: `sdd-forge flow run review [--dry-run] [--skip-confirm]`

#### flow run sync

Delegates to `flow/run/sync.js`, which runs `sdd-forge docs build`, then `sdd-forge docs review`, stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`, and commits with the message `docs: sync documentation`. The commit step is skipped if there are no staged changes.

Usage: `sdd-forge flow run sync [--dry-run]`
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Condition |
| --- | --- | --- |
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Unknown subcommand, missing required argument, pipeline step failure, missing or invalid `config.json`, AI agent error, or failed git/gh operation |

**stdout conventions**

| Command Group | Format |
| --- | --- |
| `docs` commands | Human-readable progress lines prefixed with the command name in brackets, e.g., `[build] scan done`, `[text] WARN: no defaultAgent configured` |
| `flow get`, `flow set`, `flow run` commands | A single-line JSON envelope: `{"group":"…","command":"…","data":{…}}` on success or `{"group":"…","command":"…","error":{"code":"…","message":"…"}}` on failure |
| `--dry-run` mode | A preview of operations (file paths, git commands) printed to stdout; no filesystem writes or subprocess executions occur |

**stderr conventions**

| Pattern | Description |
| --- | --- |
| Progress dots (`.`) | Emitted by `docs forge` and other long-running AI calls when `--verbose` is not set |
| `[step] WARN: …` | Non-fatal warnings such as missing agent configuration or skipped pipeline steps |
| `[step] ERROR: …` | Fatal errors logged before `process.exit(EXIT_ERROR)` |
| Verbose logs | Detailed step output streamed to stderr when `--verbose` / `-v` is passed to `docs build` or `docs forge` |}
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
