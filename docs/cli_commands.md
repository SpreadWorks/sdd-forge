<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents all commands provided by the `sdd-forge` CLI. The tool exposes approximately 20 commands organized into three tiers: independent top-level commands (`help`, `setup`, `upgrade`, `presets`), the `docs` namespace with 12 subcommands, and the `flow` namespace structured as four command groups (`prepare`, `get`, `set`, `run`) each containing multiple keys or actions.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display help text listing all available commands | |
| `sdd-forge setup` | Interactive wizard to generate `.sdd-forge/config.json` | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Re-deploy skills and apply config schema migrations | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | |
| `sdd-forge docs build` | Run the full documentation pipeline (scan → enrich → init → data → text → readme → agents → translate) | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `sdd-forge docs scan` | Analyze source code and generate `analysis.json` | |
| `sdd-forge docs enrich` | AI-powered enrichment of analysis entries with roles and summaries | |
| `sdd-forge docs init` | Initialize chapter markdown files from preset templates | `--type`, `--force`, `--dry-run`, `--lang`, `--docs-dir` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives using an AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate or update `README.md` | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven iterative documentation authoring loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | Validate generated docs quality; exits non-zero on failures | |
| `sdd-forge docs changelog` | Generate `docs/change_log.md` from `specs/` directories | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` / `CLAUDE.md` | `--dry-run` |
| `sdd-forge docs translate` | Translate docs to configured non-default languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow prepare` | Initialize a spec directory and create a feature branch or worktree | |
| `sdd-forge flow get <key>` | Read flow state values (`status`, `issue`, `prompt`) | |
| `sdd-forge flow set <key>` | Write flow state values (`issue`, `metric`, etc.) | |
| `sdd-forge flow run <action>` | Execute flow actions (`finalize`, `lint`, `sync`, `review`, `retro`) | Action-specific options |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applicable To | Description |
|---|---|---|
| `--help` / `-h` | All commands | Display help text for the command and exit with code `0` |
| `--version` / `-v` / `-V` | Top-level `sdd-forge` only | Print the package version and exit |
| `--dry-run` | Most commands | Preview changes without writing files or executing side effects |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge help

Displays the top-level help listing all available commands and their descriptions. Invoked with no arguments or with `-h` / `--help`. Reads the version from `package.json`.

```
sdd-forge help
sdd-forge --help
```

#### sdd-forge setup

Interactive wizard that creates or updates `.sdd-forge/config.json`. Prompts for project name, source path, language, preset type, docs purpose, tone, and agent provider. When CLI flags are supplied they are used as prefilled defaults. Also creates project directories, updates `.gitignore` and `.gitattributes`, deploys skill files, and creates or updates `AGENTS.md`.

```
sdd-forge setup
sdd-forge setup --name myapp --path ./src --type hono --lang en
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Source root path |
| `--work-root <path>` | Working root directory (defaults to the repo root) |
| `--type <type>` | Preset type leaf name (e.g. `hono`, `laravel`) |
| `--purpose <text>` | Docs style purpose (e.g. `user-guide`, `developer-guide`) |
| `--tone <text>` | Docs style tone (e.g. `polite`, `formal`) |
| `--agent <id>` | Default agent provider identifier |
| `--lang <code>` | Project language code (e.g. `en`, `ja`) |
| `--dry-run` | Preview config output without writing |

#### sdd-forge upgrade

Re-deploys skill files from the current package version to `.claude/skills/` and `.agents/skills/`, and applies any pending `config.json` schema migrations. Safe to run repeatedly; only overwrites template-managed content.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Show which files would be updated without writing |

#### sdd-forge presets list

Prints the full preset inheritance tree. Each node shows the preset key, label, axis, lang, aliases, and scan keys. Box-drawing characters indicate parent–child relationships.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the full documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`. When multi-language output is configured, a `translate` step follows. `--regenerate` skips `init` and regenerates text into existing chapter files. Progress is displayed with a step-weighted progress bar.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during the `init` step |
| `--regenerate` | Skip `init`; regenerate text in existing chapter files |
| `--dry-run` | Preview pipeline steps without writing files |
| `--verbose` | Print detailed step output |

#### sdd-forge docs scan

Analyzes the project source tree and writes `analysis.json` to `.sdd-forge/output/`. This file is the data foundation for all subsequent pipeline steps.

```
sdd-forge docs scan
```

#### sdd-forge docs enrich

Sends analysis entries to the configured AI agent to annotate each entry with a role, summary, detail text, and chapter classification. Requires `agent.default` to be set in `config.json`. Skipped automatically by `docs build` when no agent is configured.

```
sdd-forge docs enrich
```

#### sdd-forge docs init

Initializes chapter markdown files in the `docs/` directory using the preset template chain for the configured type. Uses AI to filter chapter candidates based on analysis content unless `config.chapters` is defined. Existing files are preserved unless `--force` is given.

```
sdd-forge docs init
sdd-forge docs init --type hono --force --lang ja
```

| Option | Description |
|---|---|
| `--type <type>` | Override preset type for template selection |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview file creation without writing |
| `--lang <code>` | Language override for template selection |
| `--docs-dir <path>` | Override the docs output directory |

#### sdd-forge docs data

Reads chapter files in `docs/` and resolves all `{{data(...)}}` directives by calling resolver methods against the enriched analysis.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Preview directive replacements without writing |

#### sdd-forge docs text

Fills `{{text(...)}}` directives in chapter markdown files using the configured AI agent. Files are processed concurrently up to the configured concurrency limit. Requires `agent.default` to be set in `config.json`.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Preview without writing |

#### sdd-forge docs readme

Generates or updates `README.md` by merging the preset readme template, resolving `{{data}}` directives, and filling `{{text}}` directives with AI. Skips writing if the generated content is identical to the existing file.

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| Option | Description |
|---|---|
| `--lang <code>` | Language override for output |
| `--output <path>` | Custom output path (default: `README.md` in repo root) |
| `--dry-run` | Preview without writing |

#### sdd-forge docs forge

AI-driven iterative documentation authoring loop. Builds a system prompt from analysis data and optional spec content, then invokes the AI agent per target file. After each round, runs the review command and feeds failures back as context for the next round, up to `--max-runs` iterations. Supports three modes: `local` (per-file agent calls), `assist`, and `agent`.

```
sdd-forge docs forge --prompt "Improve overview sections" --mode local
sdd-forge docs forge --prompt-file improve.txt --spec specs/042/spec.md --max-runs 3
```

| Option | Description |
|---|---|
| `--prompt <text>` | Inline prompt text (required unless `--prompt-file` is used) |
| `--prompt-file <path>` | Path to a file containing the prompt |
| `--spec <path>` | Path to a spec file for additional context |
| `--max-runs <n>` | Maximum write-review iterations (default: `3`) |
| `--review-cmd <cmd>` | Shell command used as the review step (default: `sdd-forge docs review`) |
| `--mode <mode>` | `local`, `assist`, or `agent` (default: `local`) |
| `--dry-run` | Preview target files without invoking the agent |
| `--verbose` / `-v` | Stream agent stdout/stderr during execution |

#### sdd-forge docs review

Validates generated documentation quality. Checks each chapter file for: minimum line count (15 lines), presence of an H1 heading, unfilled `{{text}}` directives, unfilled `{{data}}` directives, exposed directive syntax in rendered output, broken HTML comments, and residual block tags. Also verifies that `README.md` exists, that all translated language docs are present and non-empty, and that `analysis.json` coverage aligns with docs content. Exits with code `1` if any check fails.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### sdd-forge docs changelog

Scans `specs/` subdirectories, reads each `spec.md`, and extracts title, status, created date, and description fields to generate a Markdown changelog at `docs/change_log.md`. Outputs both a latest-per-series index table and a full spec table.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Print output to stdout without writing the file |

#### sdd-forge docs agents

Generates or updates `AGENTS.md` by merging SDD template content (via `{{data}}` directives) with AI-generated project context derived from docs chapter content, `README.md`, and `package.json` scripts. Creates `AGENTS.md` with a stub template if it does not exist.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Print the generated content to stdout without writing |

#### sdd-forge docs translate

Translates the default-language docs chapter files and `README.md` into one or more configured non-default languages. Translation tasks run concurrently. Skips files where the target is newer than the source unless `--force` is set. Creates per-language subdirectories under `docs/` automatically.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
|---|---|
| `--lang <code>` | Translate into a specific language only |
| `--force` | Retranslate even when the target file is up-to-date |
| `--dry-run` | Preview the list of files that would be translated |

#### sdd-forge flow prepare

Initializes a new SDD flow by creating a numbered spec directory under `specs/`, writing `flow.json`, and optionally creating a feature branch or git worktree. Requires a clean working tree when a branch or worktree is requested. Outputs a JSON envelope confirming the initialized state.

```
sdd-forge flow prepare
```

#### sdd-forge flow get

Reads values from the active flow state and writes a structured JSON envelope to stdout. Exits with `EXIT_ERROR` if no active flow is found for keys that require one.

Supported keys:

| Key | Description |
|---|---|
| `status` | Current phase, step list with statuses, requirements progress, and branch information |
| `issue` | Fetch a linked GitHub issue by number via `gh issue view` |
| `prompt` | Retrieve a predefined prompt object by kind (e.g. `plan.approach`, `finalize.mode`) |

```
sdd-forge flow get status
sdd-forge flow get issue
sdd-forge flow get prompt plan.approach
```

#### sdd-forge flow set

Writes values into the active flow state and outputs a JSON envelope to stdout.

Supported keys:

| Key | Arguments | Description |
|---|---|---|
| `issue` | `<number>` | Associate a GitHub issue number with the current flow |
| `metric` | `<phase> <key> <value>` | Record or increment a flow phase metric counter |

```
sdd-forge flow set issue 42
sdd-forge flow set metric plan docsRead 1
```

#### sdd-forge flow run finalize

Executes the finalization pipeline. In `--mode all`, runs all six steps in sequence: commit (1) → merge (2) → retro (3) → sync (4) → cleanup (5) → record (6). In `--mode select`, runs only the numbered steps supplied via `--steps`. Merge strategy is auto-detected from config unless overridden.

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2 --merge-strategy pr
sdd-forge flow run finalize --mode all --dry-run
```

| Option | Description |
|---|---|
| `--mode <all\|select>` | Run all steps or a specific subset (required) |
| `--steps <n,n,...>` | Comma-separated step numbers when using `--mode select` |
| `--merge-strategy <squash\|pr>` | Override merge strategy (`squash` or `pr`; default: auto) |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview steps without executing |

#### sdd-forge flow run lint

Runs guardrail lint patterns against files changed between the base branch and HEAD. Loads merged guardrail articles and reports violations. Returns a JSON envelope with pass/fail status, violation list, and file count.

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```

| Option | Description |
|---|---|
| `--base <branch>` | Base branch for `git diff` (auto-resolved from `flow.json` when omitted) |

#### sdd-forge flow run sync

Synchronizes documentation with the current code state by running `docs build` → `docs review` → `git add` → `git commit`. Returns a JSON envelope listing changed files. The commit is skipped if there are no staged changes after the build.

```
sdd-forge flow run sync
sdd-forge flow run sync --dry-run
```

| Option | Description |
|---|---|
| `--dry-run` | Preview without writing or committing |

#### sdd-forge flow run review

Orchestrates AI-driven code review across two sequential phases: test review (gap analysis between test design and existing test files, with up to three retries) and code review (draft proposal generation, verdict merging, and optional patch application). Writes `review.md` and `test-review.md` to the spec directory. Returns a JSON envelope with proposal counts and verdicts.

```
sdd-forge flow run review
```

#### sdd-forge flow run retro

Collects retrospective data by comparing spec requirements against the git diff between the base branch and HEAD. Saves results to `retro.json` in the spec directory and returns a summary via the JSON envelope.

```
sdd-forge flow run retro
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

All commands exit with one of two codes:

| Exit Code | Constant | Meaning |
|---|---|---|
| `0` | *(implicit success)* | Command completed successfully |
| `1` | `EXIT_ERROR` | Fatal error — invalid arguments, missing config, pipeline failure, or quality check failure |

`docs review` exits with code `1` when quality failures are detected, even though the command itself ran without a runtime error. Unknown subcommands in `docs`, `flow`, and the top-level dispatcher also exit with `EXIT_ERROR`.

**stdout / stderr conventions:**

| Category | Stream | Format |
|---|---|---|
| `flow get`, `flow set`, `flow run` | stdout | Structured JSON envelope: `{ ok, type, key, data, errors }` |
| `docs` pipeline commands | stdout | Human-readable log lines prefixed with `[step]` |
| `docs build` progress | stdout | Step-weighted progress bar with optional verbose log lines |
| Error and unknown-command messages | stderr | Plain text, prefixed with the command path (e.g. `sdd-forge docs: unknown command 'foo'`) |
| `--help` output | stdout | Plain text usage block |

Flow command JSON envelopes follow this structure:

```json
{ "ok": true,  "type": "get", "key": "status", "data": { ... }, "errors": [] }
{ "ok": false, "type": "run", "key": "lint",   "data": null,   "errors": [{ "code": "LINT_FAILED", "messages": ["..."] }] }
```
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
