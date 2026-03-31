<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge exposes over 25 commands organized in a three-level dispatch hierarchy. The top-level entry point routes to two namespace dispatchers — `docs` (12 subcommands for documentation generation) and `flow` (with `get`, `set`, and `run` sub-dispatchers for the Spec-Driven Development workflow) — plus four independent commands: `help`, `setup`, `upgrade`, and `presets`.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display help screen listing all commands grouped by section | — |
| `sdd-forge setup` | Interactive project setup wizard; writes `.sdd-forge/config.json` and deploys skills | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Update skill files and migrate `config.json` to the current version format | `--dry-run` |
| `sdd-forge presets list` | Display preset inheritance tree with labels, axes, aliases, and scan keys | — |
| `sdd-forge docs build` | Run full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source files and produce `.sdd-forge/output/analysis.json` | — |
| `sdd-forge docs enrich` | Enrich analysis entries with AI-assigned roles, summaries, and chapter classifications | — |
| `sdd-forge docs init` | Initialize chapter markdown files from the preset template chain | `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolve `{{data}}` directives in chapter files using analysis data | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files via AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from the preset README template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative AI-driven docs improvement loop with integrated quality review | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `sdd-forge docs review` | Validate chapter files for structure, completeness, and directive fill status | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI with mtime-based incremental updates | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Scan `specs/` and generate `docs/change_log.md` with spec index tables | `--dry-run` |
| `sdd-forge docs agents` | Resolve directives and AI-refine the PROJECT section in `AGENTS.md` | `--dry-run` |
| `sdd-forge flow get status` | Return the complete active SDD flow state as a JSON envelope | — |
| `sdd-forge flow get check <target>` | Check prerequisites for a flow phase (`impl`, `finalize`, `dirty`, `gh`) | — |
| `sdd-forge flow get issue <number>` | Fetch GitHub issue content via `gh` CLI as a JSON envelope | — |
| `sdd-forge flow set` | Update fields in the active flow state | — |
| `sdd-forge flow run gate` | Validate `spec.md` completeness and AI guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run lint` | Run guardrail lint pattern checks on files changed since the base branch | `--base` |
| `sdd-forge flow run prepare-spec` | Create a feature branch or git worktree and initialize the spec directory | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run impl-confirm` | Check implementation readiness against requirements in flow state | `--mode` |
| `sdd-forge flow run finalize` | Execute the finalization pipeline: commit → merge → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow merge` | Squash-merge the feature branch into the base branch or create a GitHub Pull Request | `--pr`, `--auto`, `--dry-run` |
| `sdd-forge flow review` | AI-driven two-phase code quality review producing proposals and verdicts | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow cleanup` | Remove the feature branch and/or git worktree and clear the active-flow entry | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applicable Commands | Description |
| --- | --- | --- |
| `--help`, `-h` | All commands | Display usage information and exit with code `0` |
| `--dry-run` | `setup`, `upgrade`, `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run prepare-spec`, `flow run finalize`, `flow merge`, `flow review`, `flow cleanup` | Preview changes without writing to disk or executing destructive operations |
| `--verbose`, `-v` | `docs build`, `docs forge` | Print detailed step-by-step progress output to stderr |
| `--force` | `docs build`, `docs init`, `docs translate` | Force regeneration or overwrite even when target files already exist |
| `--lang <lang>` | `docs readme`, `docs translate` | Override the target output language for the command |

All commands that accept `--dry-run` follow a consistent contract: no files are written, no git operations are executed, and the intended actions are either logged to stdout or returned in the JSON envelope with `status: "dry-run"`.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge help

Displays the full help screen listing all available commands grouped by section (Project, Docs, Flow, Info). Includes the current package version and a usage hint. Equivalent to invoking `sdd-forge` with no arguments.

```
sdd-forge help
sdd-forge --help
```

#### sdd-forge setup

Launches an interactive wizard that prompts for project name, output languages, default output language, preset type, document purpose, tone, and agent configuration. Writes `.sdd-forge/config.json`, creates required directories (`docs/`, `specs/`, `.sdd-forge/output/`), adds `.gitignore` and `.gitattributes` entries, initializes `AGENTS.md`, and deploys skills to `.claude/skills/` and `.agents/skills/`. Non-interactive mode activates when all required values are provided via CLI flags.

| Option | Description |
| --- | --- |
| `--name <name>` | Project name |
| `--type <type>` | Preset type (e.g. `node-cli`, `laravel`) |
| `--lang <lang>` | UI and default output language |
| `--agent <provider>` | Agent provider (`claude` or `codex`) |
| `--dry-run` | Print resolved config without writing to disk |

```
sdd-forge setup
sdd-forge setup --name myapp --type node-cli --lang en --agent claude --dry-run
```

#### sdd-forge upgrade

Idempotent upgrade tool that updates skill files in `.claude/skills/` and `.agents/skills/` to match the currently installed version, and migrates `config.json` chapters from the legacy string-array format (e.g. `["overview.md"]`) to the current object-array format (e.g. `[{"chapter": "overview.md"}]`). Safe to run repeatedly; user settings in `config.json` are preserved.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Prints the preset inheritance tree rooted at `base`. Each node shows the preset key, label, axis, lang, aliases, scan keys, and a `[no templates]` marker if no template directory is present. Children are sorted alphabetically and displayed using tree connectors (`├──`, `└──`).

```
sdd-forge presets list
```

#### sdd-forge docs build

Runs the full documentation pipeline in fixed sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, followed by `translate` when multi-language output is configured. The `enrich` and `text` steps are skipped when no default agent is configured. The `init` step is skipped when `--regenerate` is specified. A weighted progress bar tracks pipeline completion.

| Option | Description |
| --- | --- |
| `--force` | Force chapter file recreation during `init` |
| `--regenerate` | Skip `init`; regenerate text in existing chapters only |
| `--verbose` | Print detailed per-step progress output |
| `--dry-run` | Skip all write operations; preview only |

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

#### sdd-forge docs scan

Scans source files in the configured source root according to the preset's scan rules and writes the result to `.sdd-forge/output/analysis.json`. This file is the primary input for all subsequent `docs` pipeline steps.

```
sdd-forge docs scan
```

#### sdd-forge docs enrich

Sends analysis entries to the configured AI agent, which assigns each entry a `role`, `summary`, `detail`, and chapter classification. The enriched data is written back to `analysis.json` and provides richer context for `data` and `text` generation.

```
sdd-forge docs enrich
```

#### sdd-forge docs init

Creates chapter markdown files in `docs/` by resolving the template inheritance chain for the configured preset type. Existing files are preserved unless `--force` is specified. Chapter ordering is controlled by the `chapters` array in `preset.json`, which can be overridden in `config.json`.

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview which files would be created or updated |

```
sdd-forge docs init
sdd-forge docs init --force
```

#### sdd-forge docs data

Resolves all `{{data(...)}}` directives in chapter files by calling the type-specific data resolver with the current `analysis.json`. Writes resolved content back in-place. Has no effect on `{{text}}` directives.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Fills all `{{text(...)}}` directives in chapter files by invoking the AI agent. Supports concurrent execution controlled by `config.concurrency`. Strips any previously generated fill content before calling the agent to avoid stale text accumulation.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

Generates `README.md` from the preset's `README.md` template. Resolves `{{data}}` directives via the type-based resolver, then fills any `{{text}}` directives in per-directive mode via the AI agent. Detects a no-op when the generated content is identical to the existing file.

| Option | Description |
| --- | --- |
| `--output <path>` | Write to a custom path instead of the project root `README.md` |
| `--lang <lang>` | Target language override |
| `--dry-run` | Print output to stdout without writing |

```
sdd-forge docs readme
sdd-forge docs readme --output docs/ja/README.md --lang ja
```

#### sdd-forge docs forge

Runs an iterative improvement loop. First populates `{{data}}` and `{{text}}` directives, then per round: invokes the AI agent to improve documentation, runs `docs review` to validate quality, and if review fails, narrows the target files to those with failures before the next round. Exits successfully when review passes or with an error after `--max-runs` iterations.

| Option | Description |
| --- | --- |
| `--prompt <text>` | User intent prompt describing the desired improvement (required unless `--prompt-file`) |
| `--prompt-file <path>` | Read the prompt from a file |
| `--spec <path>` | Spec file used to narrow the target chapter files |
| `--max-runs <n>` | Maximum iteration count (default: `3`) |
| `--mode <local / assist / agent>` | Operation mode: `local` runs review only, `assist` uses AI with graceful fallback, `agent` requires AI |
| `--review-cmd <cmd>` | Override the review command string (default: `sdd-forge docs review`) |
| `--dry-run` | Print target file list without executing |

```
sdd-forge docs forge --prompt "Improve the architecture section" --mode agent
sdd-forge docs forge --prompt-file request.txt --spec specs/042-feature/spec.md
```

#### sdd-forge docs review

Validates every chapter file in `docs/` against multiple quality checks: minimum line count of 15, presence of an H1 heading, unfilled `{{text}}` directives, unfilled `{{data}}` directives, and output integrity (exposed directive syntax, residual block-comment directives, unbalanced HTML comments). Also verifies that `analysis.json` and `README.md` exist. In multi-language configurations, runs the same checks on each non-default language subdirectory. Exits with code `1` if any check fails.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### sdd-forge docs translate

Translates chapter files from the default language to each configured non-default language using the AI agent. Compares source and target file modification times; files whose source is not newer than the target are skipped unless `--force` is set. Creates target language subdirectories automatically. Bounded parallel execution is controlled by `config.concurrency`.

| Option | Description |
| --- | --- |
| `--lang <lang>` | Restrict translation to a single target language |
| `--force` | Retranslate even if the target file is newer than the source |
| `--dry-run` | List translation tasks without executing |

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

#### sdd-forge docs changelog

Scans all subdirectories under `specs/`, parses each `spec.md` to extract title, status, created date, feature branch, and input summary, then writes `docs/change_log.md` containing a latest-index table (one row per series) and a full all-specs table sorted by directory name. Backup directories (prefixed `bak.`) are excluded from the latest index.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Resolves `{{data}}` directives in `AGENTS.md` (creating the file from a template if it does not exist), then calls the AI agent to refine the PROJECT section using the generated chapter files and `README.md` as context. The AI-refined content is written back into the `agents.project` directive block.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge flow get status

Returns the complete active flow state as a JSON envelope. Fields include `spec`, `baseBranch`, `featureBranch`, `worktree`, `phase`, `steps[]`, `stepsProgress`, `requirements[]`, `requirementsProgress`, `request`, `notes[]`, `metrics`, `mergeStrategy`, and `autoApprove`. Returns a `fail` envelope with error code `NO_FLOW` when no active flow is found.

```
sdd-forge flow get status
```

#### sdd-forge flow get check

Checks prerequisites for a named target and returns a structured JSON pass/fail envelope. Valid targets: `impl` (gate and test steps are done or skipped), `finalize` (implement step is done or skipped), `dirty` (working tree has no uncommitted changes), `gh` (GitHub CLI is installed and available).

```
sdd-forge flow get check impl
sdd-forge flow get check dirty
sdd-forge flow get check gh
```

#### sdd-forge flow get issue

Fetches a GitHub issue by number using the `gh` CLI and returns its `number`, `title`, `body`, `labels`, and `state` as a JSON envelope. Returns a `fail` envelope with error code `GH_ERROR` if `gh` is unavailable or the issue cannot be fetched. Requires `gh` to be installed and authenticated.

```
sdd-forge flow get issue 42
```

#### sdd-forge flow run gate

Validates a `spec.md` file for completeness. Text-based checks cover unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked task items, and required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, and `## Acceptance Criteria` or `## User Scenarios`). In `post` phase, additionally verifies that `## User Confirmation` contains a checked approval line. Optionally runs an AI guardrail compliance check against project articles loaded from the repository.

| Option | Description |
| --- | --- |
| `--spec <path>` | Path to `spec.md`; auto-resolved from active flow state if omitted |
| `--phase <pre / post>` | Gate phase controlling which checks are enforced (default: `pre`) |
| `--skip-guardrail` | Skip the AI guardrail compliance check |

```
sdd-forge flow run gate
sdd-forge flow run gate --spec specs/042-feature/spec.md --phase post
sdd-forge flow run gate --skip-guardrail
```

#### sdd-forge flow run lint

Loads merged guardrail articles from the project and runs lint pattern checks against all files changed since the base branch (`git diff baseBranch`). Returns a `fail` envelope listing each violation as `FAIL: [article] file:line — match`. Returns a pass result with no output if no guardrail articles are defined.

| Option | Description |
| --- | --- |
| `--base <branch>` | Base branch for `git diff`; auto-resolved from active flow state if omitted |

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```

#### sdd-forge flow run prepare-spec

Creates the feature branch or git worktree and initializes the spec directory with `spec.md` and `qa.md` templates. The branch name and directory index are auto-numbered by scanning existing `specs/` directories and `feature/NNN-*` branches (e.g. `feature/042-my-feature`). Registers the new flow in the active-flow index and marks the `approach`, `branch`, and `spec` steps as done in `flow.json`.

| Option | Description |
| --- | --- |
| `--title <name>` | Feature title used to derive the branch name and spec directory (required) |
| `--base <branch>` | Base branch to branch from (default: current HEAD) |
| `--worktree` | Create a git worktree instead of a regular branch |
| `--no-branch` | Spec-only mode; create spec files without creating a new branch |
| `--dry-run` | Preview the branch name and spec directory without creating anything |

```
sdd-forge flow run prepare-spec --title "add export feature"
sdd-forge flow run prepare-spec --title "add export feature" --worktree
sdd-forge flow run prepare-spec --title "hotfix" --no-branch --dry-run
```

#### sdd-forge flow run impl-confirm

Checks implementation readiness by summarizing requirement statuses from flow state (done / in_progress / pending counts). In `detail` mode also lists files changed since the base branch via `git diff baseBranch...HEAD --name-only`. Returns `ready` when all requirements are done or none are tracked, otherwise `incomplete`, with `next` set to `review` or `fix` accordingly.

| Option | Description |
| --- | --- |
| `--mode <overview / detail>` | Check mode: `overview` reads flow state only; `detail` also runs a git diff (default: `overview`) |

```
sdd-forge flow run impl-confirm
sdd-forge flow run impl-confirm --mode detail
```

#### sdd-forge flow run finalize

Orchestrates a five-step finalization pipeline. Step 1 commits staged changes, step 2 merges or creates a PR, step 3 runs `sdd-forge docs build` and commits updated docs (skipped when the merge strategy is PR), step 4 removes the worktree and branch via `flow cleanup`, and step 5 is a record placeholder. In `all` mode all five steps run; in `select` mode only the specified step numbers are executed. Returns a JSON envelope with per-step status and flow artifacts.

| Option | Description |
| --- | --- |
| `--mode <all / select>` | Run mode (required) |
| `--steps <1,2,3,...>` | Comma-separated step numbers for `select` mode |
| `--merge-strategy <squash / pr>` | Override merge strategy; default is auto-detection |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview all steps without executing |

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2
sdd-forge flow run finalize --mode all --merge-strategy pr --dry-run
```

#### sdd-forge flow merge

Squash-merges the feature branch into the base branch, or creates a GitHub Pull Request. In `--auto` mode, PR route is chosen when `config.commands.gh === 'enable'` and the `gh` CLI is available; otherwise squash merge is used. The PR title and body are derived from the `## Goal`, `## Requirements`, and `## Scope` sections of `spec.md`. Supports both worktree mode (`git -C mainRepoPath merge`) and standard branch mode.

| Option | Description |
| --- | --- |
| `--pr` | Always create a Pull Request via `gh pr create` |
| `--auto` | Auto-detect merge strategy based on config and `gh` availability |
| `--dry-run` | Print the git and gh commands without executing |

```
sdd-forge flow merge
sdd-forge flow merge --pr
sdd-forge flow merge --auto --dry-run
```

#### sdd-forge flow review

Runs a two-phase AI code review pipeline. The draft phase calls the `flow.review.draft` agent with the current diff to generate numbered improvement proposals across five categories: duplicate elimination, naming, dead code removal, design pattern consistency, and simplification. The final phase calls the `flow.review.final` agent to assign APPROVED or REJECTED verdicts with reasons. Results are saved to `review.md` in the spec directory.

| Option | Description |
| --- | --- |
| `--dry-run` | Show approved proposals without applying changes |
| `--skip-confirm` | Skip the initial confirmation prompt |

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

#### sdd-forge flow cleanup

Auto-detects cleanup mode from flow state: spec-only mode (feature branch equals base branch — no-op), worktree mode (runs `git worktree remove` then `git branch -D`), or branch mode (runs `git branch -D` only). Clears the `.active-flow` entry before executing destructive git operations. `flow.json` in `specs/` is preserved after cleanup.

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit Codes**

| Code | Constant | Condition |
| --- | --- | --- |
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | Command failed due to an error, invalid arguments, missing prerequisites, or a failed quality check |

**stdout / stderr Conventions**

| Stream | Usage |
| --- | --- |
| `stdout` | Primary command output: generated file contents in `--dry-run` mode, JSON envelopes from all `flow get` and `flow run` subcommands, help text, and the docs build progress bar |
| `stderr` | Diagnostic messages, per-step progress logs, warning lines prefixed with `WARN:`, error lines prefixed with `ERROR:`, and AI agent ticker dots during long-running agent calls |

All `flow get` and `flow run` subcommands write a structured JSON envelope to stdout. Success envelopes carry the shape `{ok: true, command, sub, data}` with a `data.result` field and a `data.artifacts` object. Failure envelopes carry `{ok: false, command, sub, error, message}` where `error` is a machine-readable error code such as `NO_FLOW`, `GATE_FAILED`, `LINT_FAILED`, or `DIRTY_WORKTREE`. This format is designed for machine consumption by skill scripts.

Commands that write files log the output path to stdout on success (e.g. `[agents] updated AGENTS.md`). The `docs review` command prints one line per failing check prefixed by the i18n message key, then exits with code `1` when any check fails.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
