<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The CLI Reference documents all commands available in the `sdd-forge` binary, organized into six top-level entry points and over 30 subcommands across two namespace dispatchers (`docs` and `flow`). The `docs` namespace drives the documentation pipeline with 12 subcommands, while `flow` provides Spec-Driven Development workflow control through `prepare`, `get`, `set`, and `run` command groups containing a total of 28 sub-operations.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display available commands and version info | — |
| `sdd-forge setup` | Interactive project setup wizard | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Redeploy skill files and migrate config schema | `--dry-run` |
| `sdd-forge presets list` | Display the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline (scan → enrich → init → data → text → readme → agents) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source files and produce `analysis.json` | — |
| `sdd-forge docs enrich` | AI-enrich analysis entries with role, summary, and chapter classification | — |
| `sdd-forge docs init` | Initialize `docs/` chapter files from preset templates | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` blocks in chapter files using AI | `--force`, `--dry-run` |
| `sdd-forge docs readme` | Generate or update `README.md` from template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven deep document generation | — |
| `sdd-forge docs review` | Validate integrity and completeness of generated docs | — |
| `sdd-forge docs translate` | Translate docs to configured target languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `change_log.md` from the `specs/` directory | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` with AI-refined project context | `--dry-run` |
| `sdd-forge flow prepare` | Create branch or worktree and initialize the spec directory | `--title`, `--base`, `--worktree`, `--no-branch`, `--issue`, `--request`, `--dry-run` |
| `sdd-forge flow get check` | Check prerequisites for flow step transitions | positional target: `impl`, `finalize`, `dirty`, `gh` |
| `sdd-forge flow get context` | Retrieve file contents or search analysis entries | `--raw`, `--search <query>` |
| `sdd-forge flow get guardrail` | Retrieve guardrail rules for a specified flow phase | positional phase, `--format json` |
| `sdd-forge flow get issue` | Fetch a GitHub issue by number via `gh` CLI | positional `<number>` |
| `sdd-forge flow get prompt` | Return pre-built prompt strings by language and kind | positional `<lang> <kind>` |
| `sdd-forge flow get qa-count` | Return the Q&A item count from the active flow state | — |
| `sdd-forge flow get resolve-context` | Resolve full execution context for skill-level orchestration | — |
| `sdd-forge flow get status` | Return current flow phase and step progress | — |
| `sdd-forge flow set auto` | Enable or disable auto-approve mode in the flow | positional `on\|off` |
| `sdd-forge flow set issue` | Associate a GitHub issue number with the active flow | positional `<number>` |
| `sdd-forge flow set metric` | Increment a phase-level metric counter | positional `<phase> <counter>` |
| `sdd-forge flow set note` | Append a timestamped note to the flow state | positional `"<text>"` |
| `sdd-forge flow set redo` | Append an entry to the redo log | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Update a requirement item's status | positional `<index> <status>` |
| `sdd-forge flow set request` | Set the original user request text in the flow state | positional `"<text>"` |
| `sdd-forge flow set step` | Update the status of a named flow step | positional `<id> <status>` |
| `sdd-forge flow set summary` | Set the structured requirements list from a JSON array | positional `'<json-array>'` |
| `sdd-forge flow set test-summary` | Record test coverage counts in the flow state | `--unit`, `--integration`, `--acceptance` |
| `sdd-forge flow run finalize` | Execute commit, merge or PR creation, docs sync, and cleanup | `--mode all\|select`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run gate` | Validate a spec file against structural rules and AI guardrails | `--spec`, `--phase pre\|post`, `--skip-guardrail` |
| `sdd-forge flow run impl-confirm` | Summarize implementation readiness against requirements | `--mode overview\|detail` |
| `sdd-forge flow run lint` | Run guardrail lint checks on files changed since the base branch | `--base` |
| `sdd-forge flow run report` | Generate and save a flow execution report | `--dry-run` |
| `sdd-forge flow run retro` | AI-driven retrospective evaluating spec accuracy against the git diff | `--force`, `--dry-run` |
| `sdd-forge flow run review` | AI code review pipeline with draft proposals and verdict application | `--phase`, `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Run docs build, review, stage, and commit documentation changes | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `-h`, `--help` | All commands and subcommands | Display usage information for the current command and exit with code `0` |
| `-v`, `-V`, `--version` | `sdd-forge` (top level only) | Print the installed package version string and exit |
| `--dry-run` | `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs translate`, `docs changelog`, `docs agents`, `flow prepare`, `flow run finalize`, `flow run report`, `flow run retro`, `flow run sync`, `upgrade` | Preview intended file writes and git operations without executing them; output is written to stdout for inspection |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge help

Displays all available top-level commands grouped by category (Project, Docs, Flow, Info) together with the installed version. Run automatically when no subcommand is provided.

```
sdd-forge help
sdd-forge
```

#### sdd-forge setup

Interactive wizard that initializes a new sdd-forge project. Prompts for project name, source path, output languages, preset type(s), documentation purpose, tone, and AI agent identifier. Writes `.sdd-forge/config.json`, creates required directories (`docs/`, `specs/`, `.sdd-forge/output/`), updates `.gitignore` and `.gitattributes`, deploys skill files, and creates or updates `AGENTS.md`.

```
sdd-forge setup
sdd-forge setup --name my-project --type node-cli --lang en --dry-run
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <dir>` | Source root directory |
| `--work-root <dir>` | Work root (defaults to source root) |
| `--type <preset>` | Preset type key (e.g. `node-cli`, `laravel`) |
| `--lang <code>` | Project language code (e.g. `en`, `ja`) |
| `--agent <id>` | Default AI agent identifier |
| `--purpose <value>` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone <value>` | Documentation tone (`polite`, `formal`, `casual`) |
| `--dry-run` | Preview without writing |

#### sdd-forge upgrade

Redeploys skill files from the current package version and migrates `config.json` to the current schema (e.g. converts string-array `chapters` to object-array format). Safe to run repeatedly; only changed files are reported as updated.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Prints the full preset inheritance tree rooted at `base`, showing each preset's key, label, axis, and whether a `templates/` directory exists.

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the complete documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, and optionally `translate` when multiple output languages are configured. Skips `enrich` and `text` if no default agent is configured. Use `--regenerate` to re-run `data`, `text`, and `readme` against existing chapter files without re-running `init`.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing chapter files during `init` and force re-generation during `text` |
| `--regenerate` | Skip `init`; re-run data/text/readme on existing files |
| `--verbose` | Show per-step progress details |
| `--dry-run` | Preview pipeline steps without writing |

#### sdd-forge docs scan

Scans the configured source root and writes `analysis.json` to `.sdd-forge/output/`. Analysis entries are keyed by category and include file paths, keywords, and metadata.

```
sdd-forge docs scan
```

#### sdd-forge docs enrich

Passes `analysis.json` to an AI agent to assign each entry a `role`, `summary`, `detail`, and `chapter` classification. Writes back to `analysis.json`. Requires a configured default agent.

```
sdd-forge docs enrich
```

#### sdd-forge docs init

Initializes `docs/` chapter files by resolving templates from the preset inheritance chain, merging block overrides, translating if required, and optionally using AI to filter irrelevant chapters. Skips existing files unless `--force` is set.

```
sdd-forge docs init
sdd-forge docs init --type node-cli --lang ja --force
```

| Option | Description |
|---|---|
| `--type <preset>` | Override preset type |
| `--lang <code>` | Override output language |
| `--docs-dir <dir>` | Override output directory |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

#### sdd-forge docs data

Resolves all `{{data(...)}}` directives in existing chapter files by calling the appropriate data source methods and replacing directive blocks with rendered output.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Fills all `{{text(...)}}` placeholder blocks in chapter files using an AI agent. Runs concurrently across files up to the configured concurrency limit. Skips already-filled blocks unless `--force` is set.

```
sdd-forge docs text
sdd-forge docs text --force --dry-run
```

#### sdd-forge docs readme

Generates or updates `README.md` by merging the preset README template, resolving `{{data}}` directives, and filling `{{text}}` blocks with AI. Skips the write if content is unchanged. Supports outputting to a custom path (e.g. for translated variants).

```
sdd-forge docs readme
sdd-forge docs readme --output docs/ja/README.md --lang ja
```

| Option | Description |
|---|---|
| `--lang <code>` | Output language |
| `--output <path>` | Custom output path |
| `--dry-run` | Preview output to stdout |

#### sdd-forge docs review

Validates generated docs by checking each chapter file for residual directives, unclosed HTML comments, unfilled `{{text}}` or `{{data}}` blocks, minimum line count, and required `# H1` heading. Also checks that all analysis categories are referenced by at least one chapter. Throws on any violation.

```
sdd-forge docs review
sdd-forge docs review docs/ja
```

#### sdd-forge docs translate

Translates docs chapter files and `README.md` to all configured non-default languages using an AI agent. Skips files whose source modification time is not newer than the target. Uses `mapWithConcurrency` for parallel execution.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
|---|---|
| `--lang <code>` | Translate to a single specific language |
| `--force` | Bypass freshness check; retranslate all files |
| `--dry-run` | List files that would be translated without writing |

#### sdd-forge docs changelog

Scans `specs/` for numbered subdirectories, parses metadata from each `spec.md`, and produces a Markdown table in `docs/change_log.md`. Includes a latest-per-series index and a full all-specs table. Requires no AI agent.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Generates or updates `AGENTS.md` by resolving `{{data}}` directives with analysis data, then calling an AI agent to refine the PROJECT section using docs chapter content, README, and `package.json` scripts as context. Creates a skeleton `AGENTS.md` if the file does not exist.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge flow prepare

Initializes a new SDD flow by creating a spec directory under `specs/`, writing `spec.md` and `qa.md` from templates, creating a feature branch or git worktree, and persisting initial flow state to `flow.json`.

```
sdd-forge flow prepare --title "Add OAuth login"
sdd-forge flow prepare --title "Refactor config" --worktree --issue 42
sdd-forge flow prepare --title "Hotfix" --no-branch --dry-run
```

| Option | Description |
|---|---|
| `--title <name>` | Feature title used to derive branch name and spec directory (required) |
| `--base <branch>` | Base branch to branch from (defaults to current HEAD) |
| `--worktree` | Create an isolated git worktree instead of a plain branch |
| `--no-branch` | Spec-only mode: create spec files without any branch |
| `--issue <number>` | GitHub issue number to link to this flow |
| `--request <text>` | Original user request text stored in `flow.json` |
| `--dry-run` | Preview without creating files or branches |

#### sdd-forge flow get check

Checks prerequisites before advancing to a flow step. Returns a structured pass/fail result with per-item details.

Valid targets:
- `impl` — verifies `gate` and `test` steps are done
- `finalize` — verifies `implement` step is done
- `dirty` — checks whether the working tree has uncommitted changes
- `gh` — probes availability of the `gh` CLI binary

```
sdd-forge flow get check dirty
sdd-forge flow get check gh
sdd-forge flow get check impl
```

#### sdd-forge flow get context

In list mode (no path), returns filtered analysis entries for the active flow phase. In file mode (with path), returns file content and increments the `srcRead` metric. In search mode (`--search`), performs bigram-similarity keyword search over analysis entries with AI fallback.

```
sdd-forge flow get context src/lib/config.js
sdd-forge flow get context --search "agent configuration"
sdd-forge flow get context --raw src/flow.js
```

#### sdd-forge flow get guardrail

Loads the merged guardrail ruleset and filters entries by the specified phase (`draft`, `spec`, `impl`, `lint`). Outputs Markdown by default or a JSON array when `--format json` is passed.

```
sdd-forge flow get guardrail spec
sdd-forge flow get guardrail impl --format json
```

#### sdd-forge flow get issue

Fetches a GitHub issue using `gh issue view` and returns its `title`, `body`, `labels`, and `state` in a JSON envelope.

```
sdd-forge flow get issue 123
```

#### sdd-forge flow get status

Returns the active flow's current phase, step list with statuses, requirements progress, branch names, and metrics in a structured JSON envelope.

```
sdd-forge flow get status
```

#### sdd-forge flow get resolve-context

Resolves the full orchestration context: worktree path, current branch, commits ahead of base, last commit, spec goal/scope, dirty status, and the recommended next skill name. Used by orchestration skills to determine the current position in the workflow.

```
sdd-forge flow get resolve-context
```

#### sdd-forge flow set auto

Sets the `autoApprove` flag in `flow.json`. When `on`, orchestration skills skip per-step user confirmation prompts.

```
sdd-forge flow set auto on
sdd-forge flow set auto off
```

#### sdd-forge flow set metric

Increments a named counter within a phase's metrics entry in `flow.json`. Valid phases: `draft`, `spec`, `gate`, `test`, `impl`. Valid counters: `question`, `redo`, `docsRead`, `srcRead`.

```
sdd-forge flow set metric impl srcRead
sdd-forge flow set metric spec question
```

#### sdd-forge flow set step

Updates the status of a named step (e.g. `done`, `skipped`, `in_progress`) in `flow.json`. Used by skills to advance or roll back step state.

```
sdd-forge flow set step gate done
sdd-forge flow set step implement in_progress
```

#### sdd-forge flow set req

Updates the status of a requirement item at the given zero-based index in `flow.json`.

```
sdd-forge flow set req 0 done
sdd-forge flow set req 2 in_progress
```

#### sdd-forge flow run gate

Validates a `spec.md` file against structural rules (required sections, unresolved tokens, unchecked tasks) and optionally runs AI-evaluated guardrail compliance checks. Phase `pre` skips the User Confirmation check; phase `post` requires `[x] User approved this spec` to be set.

```
sdd-forge flow run gate
sdd-forge flow run gate --spec specs/001-auth/spec.md --phase post
sdd-forge flow run gate --skip-guardrail
```

#### sdd-forge flow run impl-confirm

Summarizes requirement completion status from `flow.json`. In `detail` mode also lists files changed since the base branch via `git diff`. Returns `ready` if all requirements are done, otherwise `incomplete`.

```
sdd-forge flow run impl-confirm
sdd-forge flow run impl-confirm --mode detail
```

#### sdd-forge flow run lint

Runs guardrail lint patterns against files changed between the base branch and HEAD. Reports violations as `FAIL` lines and exits with `EXIT_ERROR` on any failure.

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```

#### sdd-forge flow run retro

Passes spec requirements and the full `git diff` to an AI agent, which evaluates each requirement as `done`, `partial`, or `not_done` and identifies unplanned changes. Writes `retro.json` to the spec directory.

```
sdd-forge flow run retro
sdd-forge flow run retro --force
```

#### sdd-forge flow run review

Runs a two-pass AI code review: a draft pass generates improvement proposals, and a final pass assigns `APPROVED` or `REJECTED` verdicts. Approved proposals are then applied. With `--phase test`, performs test gap analysis with up to three iterative fix rounds.

```
sdd-forge flow run review
sdd-forge flow run review --phase test --dry-run
```

#### sdd-forge flow run finalize

Executes the finalization pipeline. In `--mode all`, runs all four steps sequentially: commit (with retro and report), merge or PR creation, docs sync, and worktree cleanup. In `--mode select`, runs only the steps specified by `--steps` (e.g. `--steps 1,2`).

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2 --merge-strategy pr
sdd-forge flow run finalize --mode all --dry-run
```

#### sdd-forge flow run sync

Runs `sdd-forge docs build` then `sdd-forge docs review`, stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`, and commits with the message `docs: sync documentation`. Skips the commit if there are no staged changes.

```
sdd-forge flow run sync
sdd-forge flow run sync --dry-run
```

#### sdd-forge flow run report

Generates a flow execution report from the current state, redo log, git diff stat, and commit messages, then saves it as `report.json` in the spec directory.

```
sdd-forge flow run report
sdd-forge flow run report --dry-run
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit Codes**

| Code | Constant | Condition |
|---|---|---|
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Command failed due to a missing argument, invalid input, file not found, git error, or pipeline failure |

**Output Conventions**

| Stream | Content |
|---|---|
| `stdout` | Primary output: human-readable progress for `docs` commands; structured JSON envelopes (`{"ok": true\|false, "group": "...", "command": "...", "data": {...}, "errors": [...]}`) for all `flow get`, `flow set`, and `flow run` commands |
| `stderr` | Error messages, warnings, and progress logs from pipeline steps |

`flow` commands use a consistent envelope format emitted by the `ok()` and `fail()` helpers in `lib/flow-envelope.js`. A `fail` envelope always carries a string error code (e.g. `NO_FLOW`, `GATE_FAILED`, `LINT_FAILED`) together with one or more human-readable message strings. The `--dry-run` flag redirects would-be file writes to stdout for inspection without altering any state.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
