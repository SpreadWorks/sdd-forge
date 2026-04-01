<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents all CLI commands provided by `sdd-forge`, covering 4 top-level independent commands (`help`, `setup`, `upgrade`, `presets`), plus two namespace dispatchers — `docs` with 12 subcommands and `flow` with subcommands organized under `prepare`, `get`, `set`, and `run` groups.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Prints all commands grouped by section with version header. | — |
| `sdd-forge setup` | Interactive wizard to initialize a project with config, docs structure, and skills. | `--name`, `--type`, `--lang`, `--agent`, `--purpose`, `--tone`, `--path`, `--work-root`, `--dry-run` |
| `sdd-forge upgrade` | Re-deploys skill files and applies config schema migrations. | `--dry-run` |
| `sdd-forge presets` | Lists available presets with inheritance tree. | `list` subcommand |
| `sdd-forge docs build` | Runs the full documentation pipeline: scan → enrich → init → data → text → readme → agents → translate. | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scans source tree and writes `analysis.json` to `.sdd-forge/output/`. | — |
| `sdd-forge docs enrich` | AI-enriches `analysis.json` entries with role, summary, and detail fields. | — |
| `sdd-forge docs init` | Resolves preset template chain and writes chapter `.md` files to `docs/`. | `--type`, `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Resolves `{{data(...)}}` directives in chapter files using `analysis.json`. | `--dry-run` |
| `sdd-forge docs text` | Fills `{{text(...)}}` directives with AI agent output. | `--dry-run` |
| `sdd-forge docs readme` | Resolves and writes `README.md` from preset chain with data and text directives applied. | `--lang`, `--output <path>`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven iterative documentation authoring with review feedback loop. | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | Validates chapter files and supporting assets for completeness and structure. | — |
| `sdd-forge docs changelog` | Generates a Markdown changelog table from `specs/` numbered directories. | `--dry-run` |
| `sdd-forge docs agents` | Regenerates `AGENTS.md` with SDD and project context via AI refinement. | `--dry-run` |
| `sdd-forge docs translate` | Translates chapter files and `README.md` to non-default configured languages. | `--lang <lang>`, `--force`, `--dry-run` |
| `sdd-forge flow prepare` | Creates a spec directory, branch or worktree, and writes `flow.json`. | `--title` (required), `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow get issue` | Retrieves a linked GitHub issue as a JSON envelope. | — |
| `sdd-forge flow get status` | Returns current flow phase, step/requirement progress, and metadata from `flow.json`. | — |
| `sdd-forge flow set issue` | Persists a GitHub issue number to `flow.json`. | `<number>` (positional) |
| `sdd-forge flow run finalize` | Runs the finalize pipeline: commit, merge, sync docs, cleanup, record. | `--mode` (required), `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run lint` | Runs guardrail pattern checks against files changed vs base branch. | `--base <branch>` |
| `sdd-forge flow run prepare-spec` | Assigns a spec ID, creates spec files and branch, saves `flow.json`. | `--title` (required), `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | Runs two-stage AI review on branch diff and writes `review.md`. | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Builds documentation and commits updated files. | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies To | Description |
|---|---|---|
| `-h`, `--help` | All commands | Prints usage information and exits with code 0. |
| `--dry-run` | Most subcommands | Previews file writes and git operations without executing them. Generated content is printed to stdout; diagnostic messages go to stderr. |
| `-v`, `-V`, `--version` | Top-level `sdd-forge` only | Prints the installed package version and exits with code 0. |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### help

Prints all available commands grouped into sections (Project, Docs, Flow, Info) with a version header. Takes no options or arguments.

```
sdd-forge help
```

#### setup

Interactive wizard that initializes a project. Prompts for project name, output language(s), preset type, docs purpose, tone, and agent provider. Creates `.sdd-forge/config.json`, `docs/`, `specs/`, `.sdd-forge/output/`, updates `.gitignore` and `.gitattributes`, deploys skills, and generates `AGENTS.md`.

| Option | Description |
|---|---|
| `--name` | Project name |
| `--path` | Source root path |
| `--work-root` | Work root path |
| `--type` | Preset type |
| `--purpose` | Docs purpose |
| `--tone` | Docs tone |
| `--agent` | Agent provider |
| `--lang` | Output language |
| `--dry-run` | Preview without writing |

```
sdd-forge setup
sdd-forge setup --name myapp --type node-cli --lang en --dry-run
```

#### upgrade

Re-deploys skill files from the installed package into `.claude/skills/` and `.agents/skills/`, and applies `config.json` schema migrations (for example, converting a `chapters` string array to object array format). Reports each skill as updated or unchanged.

| Option | Description |
|---|---|
| `--dry-run` | Preview changes without writing |

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### presets list

Prints the full preset inheritance tree using box-drawing characters. Each entry shows key, axis, lang, aliases, scan keys, and a `[no templates]` annotation where applicable.

```
sdd-forge presets list
```

#### docs build

Runs the full documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate` (translate only when multiple languages are configured). If no `defaultAgent` is configured, the `enrich` and `text` steps are skipped with a warning.

| Option | Description |
|---|---|
| `--force` | Force overwrite of existing chapter files during `init` |
| `--regenerate` | Skip `init` and regenerate content for existing chapter files |
| `--verbose` | Emit detailed per-step progress output |
| `--dry-run` | Preview without writing |

```
sdd-forge docs build
sdd-forge docs build --regenerate --verbose
```

#### docs scan

Scans the source tree according to preset scan keys and writes `analysis.json` to `.sdd-forge/output/`.

```
sdd-forge docs scan
```

#### docs enrich

AI-enriches entries in `analysis.json` by adding `role`, `summary`, and `detail` fields to each entry. Requires a `defaultAgent` to be configured.

```
sdd-forge docs enrich
```

#### docs init

Resolves the preset template chain and writes chapter `.md` files to `docs/`. Skips existing files unless `--force` is given. When `config.chapters` is not set and an agent is configured, an AI filter removes chapters not represented in the analysis data.

| Option | Description |
|---|---|
| `--type` | Override preset type |
| `--lang` | Override language |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Preview without writing |

```
sdd-forge docs init
sdd-forge docs init --force
```

#### docs data

Resolves all `{{data(...)}}` directives in chapter files in `docs/` using the data from `analysis.json`.

| Option | Description |
|---|---|
| `--dry-run` | Preview resolved content without writing |

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### docs text

Fills all `{{text(...)}}` directives in chapter files with AI-generated output. Runs concurrently up to the configured concurrency limit.

| Option | Description |
|---|---|
| `--dry-run` | Preview generated text without writing |

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### docs readme

Resolves the `README.md` template from the preset chain, applies `{{data(...)}}` directives, and fills `{{text(...)}}` directives via AI. Skips the write if the resulting content is unchanged from the existing file.

| Option | Description |
|---|---|
| `--lang` | Target language |
| `--output <path>` | Output file path (default: project root `README.md`) |
| `--dry-run` | Preview without writing |

```
sdd-forge docs readme
sdd-forge docs readme --output ./README.md
```

#### docs forge

AI-driven iterative documentation authoring. Runs up to `--max-runs` rounds, using a review command to generate feedback and guide the next iteration. Supports three modes: `local` (per-file agent calls), `assist`, and `agent`.

| Option | Description |
|---|---|
| `--prompt <text>` | Inline authoring prompt (required unless `--prompt-file` is given) |
| `--prompt-file <path>` | Path to a file containing the prompt |
| `--spec <path>` | Path to a spec file to include as context |
| `--max-runs <n>` | Maximum iterations (default: 3) |
| `--review-cmd <cmd>` | Review command to run after each round (default: `sdd-forge docs review`) |
| `--mode <local\|assist\|agent>` | Authoring mode (default: `local`) |
| `--verbose` | Stream agent output to stderr |
| `--dry-run` | List target files and exit |

```
sdd-forge docs forge --mode local --prompt "Expand all sections"
sdd-forge docs forge --spec specs/001-feature/spec.md --mode agent --max-runs 5
```

#### docs review

Validates all chapter files in `docs/` for: minimum 15 lines, presence of an H1 heading, unfilled `{{text}}`/`{{data}}` blocks, broken HTML comments, and residual block tags. Also checks that `README.md` exists, `analysis.json` exists, and translation directories are populated. Exits with `EXIT_ERROR` if any check fails.

```
sdd-forge docs review
```

#### docs changelog

Scans `specs/` numbered directories, reads each `spec.md`, extracts title, status, creation date, and description, and outputs a Markdown table to `docs/change_log.md`.

| Option | Description |
|---|---|
| `--dry-run` | Preview output without writing |

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### docs agents

Reads or creates `AGENTS.md`, resolves `agents.sdd` and `agents.project` directives, and uses AI to refine the PROJECT section based on `package.json` scripts, docs content, and `README.md`. Writes the result back to `AGENTS.md`.

| Option | Description |
|---|---|
| `--dry-run` | Preview without writing |

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### docs translate

Translates chapter files and `README.md` to all non-default languages configured in `docs.languages`. Skips files where the target translation is newer than the source unless `--force` is given. Writes translated files to `docs/<lang>/` subdirectories.

| Option | Description |
|---|---|
| `--lang <lang>` | Translate to a specific language only |
| `--force` | Re-translate all files regardless of modification time |
| `--dry-run` | Preview without writing |

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

#### flow prepare

Creates a spec directory and branch or worktree for a new flow, then writes `flow.json`. Delegates to `flow run prepare-spec` internally.

| Option | Description |
|---|---|
| `--title <name>` | Spec title (required) |
| `--base <branch>` | Base branch (default: current HEAD) |
| `--worktree` | Use a git worktree instead of a local branch |
| `--no-branch` | Skip branch creation (spec-only mode) |
| `--dry-run` | Preview without writing |

```
sdd-forge flow prepare --title "Add export feature"
sdd-forge flow prepare --title "Refactor parser" --worktree
```

#### flow get issue

Retrieves the GitHub issue linked to the current flow via `gh issue view --json`. Returns a JSON envelope on stdout containing `number`, `title`, `body`, `labels`, and `state`.

```
sdd-forge flow get issue
```

#### flow get status

Reads `flow.json` and returns a JSON envelope with the current phase, step and requirement progress counts, branch names, worktree path, linked issue reference, `autoApprove` flag, notes, metrics, and merge strategy.

```
sdd-forge flow get status
```

#### flow set issue

Persists a GitHub issue number to the active `flow.json`, linking the flow to that issue. Accepts the issue number as a positional argument.

```
sdd-forge flow set issue <number>
sdd-forge flow set issue 42
```

#### flow run finalize

Runs the finalize pipeline in the following order: (1) commit, (2) merge, (3) sync docs, (4) cleanup, (5) record. In `select` mode, steps are specified as a comma-separated list. Merge strategy auto-detection selects PR if `config.commands.gh=enable` and the `gh` CLI is available; otherwise falls back to squash.

| Option | Description |
|---|---|
| `--mode <all\|select>` | Execution mode (required) |
| `--steps <1,2,...>` | Steps to run when `--mode=select` |
| `--merge-strategy <squash\|pr\|auto>` | Merge strategy override |
| `--message <msg>` | Custom commit message for step 1 |
| `--dry-run` | Preview without executing |

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2
sdd-forge flow run finalize --mode all --merge-strategy pr
```

#### flow run lint

Loads guardrail articles and runs pattern checks against all files changed relative to the base branch. Outputs a flow envelope with pass/fail status and violation details. Exits with `EXIT_ERROR` if any rule fails.

| Option | Description |
|---|---|
| `--base <branch>` | Base branch for `git diff` (auto-resolved from `flow.json` if omitted) |

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```

#### flow run prepare-spec

Assigns a sequential 3-digit spec ID, slugifies the title, creates `specs/<id>-<slug>/spec.md` and `qa.md` from templates (with local overrides from `.sdd-forge/templates/`), creates a branch or worktree, and saves `flow.json` with initial step definitions.

| Option | Description |
|---|---|
| `--title <name>` | Spec title (required) |
| `--base <branch>` | Base branch (default: current HEAD) |
| `--worktree` | Use a git worktree |
| `--no-branch` | Skip branch creation |
| `--dry-run` | Preview without writing |

```
sdd-forge flow run prepare-spec --title "Add CSV export"
```

#### flow run review

Runs a two-stage AI review against the branch diff relative to the base branch. The draft stage produces numbered improvement proposals; the final stage assigns `APPROVED` or `REJECTED` verdicts. Results are written to `specs/<id>/review.md`.

| Option | Description |
|---|---|
| `--dry-run` | Show proposals without applying changes |
| `--skip-confirm` | Skip confirmation prompts |

```
sdd-forge flow run review
sdd-forge flow run review --skip-confirm
```

#### flow run sync

Runs `sdd-forge docs build` followed by `sdd-forge docs review`, then stages `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md` and commits with the message `docs: sync documentation`. Skips the commit if no staged changes are detected.

| Option | Description |
|---|---|
| `--dry-run` | Preview without writing or committing |

```
sdd-forge flow run sync
sdd-forge flow run sync --dry-run
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | When Used |
|---|---|---|
| `0` | — | Command completed successfully. |
| `1` | `EXIT_ERROR` | Failure — covers unknown subcommands, missing or invalid config, git operation failures, validation errors, and flow-specific codes such as `NO_FLOW`, `DIRTY_WORKTREE`, `LINT_FAILED`, `INVALID_MODE`, `MISSING_TITLE`, and `GH_ERROR`. |

**stdout/stderr conventions**

| Stream | Usage |
|---|---|
| stdout | Normal output, content previews under `--dry-run`, and structured JSON envelopes from `flow get`, `flow set`, and `flow run` commands. |
| stderr | Errors via `console.error`, warnings, and progress indicators (dot ticker) from long-running operations such as `docs build` and `docs forge`. |

`flow` commands return a structured JSON envelope on stdout:

```json
{ "group": "<group>", "command": "<command>", "status": "ok", "data": { ... } }
```

On failure, the envelope carries `"status": "fail"` with `code` and `message` fields.

Under `--dry-run`, generated content is printed to stdout for inspection while all diagnostic messages continue to go to stderr.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
