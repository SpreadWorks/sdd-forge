<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

The CLI provides over 30 commands organized in a three-level dispatch hierarchy: the top-level `sdd-forge` entry point routes to two namespace dispatchers (`docs` and `flow`) and four independent commands (`setup`, `upgrade`, `presets`, `help`). The `docs` namespace contains 12 pipeline subcommands, while `flow` is further divided into three operation groups (`get`, `set`, `run`) encompassing more than 20 subcommands that cover the full Spec-Driven Development lifecycle.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display available commands and descriptions | — |
| `sdd-forge setup` | Interactive project setup wizard | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Refresh skill files and patch deprecated config fields | `--dry-run` |
| `sdd-forge presets list` | Print the preset inheritance tree | — |
| `sdd-forge docs build` | Run the full documentation pipeline (scan → enrich → init → data → text → readme → agents → translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source files and produce `analysis.json` | — |
| `sdd-forge docs enrich` | AI-enrich analysis entries with role, summary, and chapter classification | — |
| `sdd-forge docs init` | Create chapter files from resolved preset templates | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | Populate `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives using an AI agent | `--force`, `--dry-run` |
| `sdd-forge docs readme` | Generate or update `README.md` from the preset template | `--output`, `--lang`, `--dry-run` |
| `sdd-forge docs forge` | AI-driven multi-round document generation loop | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--dry-run` |
| `sdd-forge docs review` | Validate docs for integrity, unfilled directives, and coverage | — |
| `sdd-forge docs changelog` | Generate a Markdown changelog from spec directory entries | `--dry-run` |
| `sdd-forge docs agents` | Generate or update `AGENTS.md` | `--dry-run` |
| `sdd-forge docs translate` | Translate docs chapter files and README into target languages | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow prepare` | Create branch/worktree and initialize the spec directory | `--title`, `--base`, `--worktree`, `--no-branch`, `--issue`, `--request`, `--dry-run` |
| `sdd-forge flow get check` | Validate preconditions for a given target (impl, finalize, dirty, gh) | positional target |
| `sdd-forge flow get context` | Read files, search analysis entries, or collect keywords for AI context building | `--search`, `--raw` |
| `sdd-forge flow get guardrail` | Return guardrail rules for a specified phase | positional phase, `--format` |
| `sdd-forge flow get issue` | Fetch a GitHub issue by number via the `gh` CLI | positional issue number |
| `sdd-forge flow get prompt` | Return predefined prompt text by language and kind | positional kind |
| `sdd-forge flow get qa-count` | Return the count of QA items from the current flow state | — |
| `sdd-forge flow get resolve-context` | Assemble a comprehensive context snapshot (worktree, branch, spec, flow state) | — |
| `sdd-forge flow get status` | Return the current flow phase and step statuses | — |
| `sdd-forge flow set auto` | Toggle the `autoApprove` flag in flow state | `on` or `off` |
| `sdd-forge flow set issue` | Store a GitHub issue reference in flow state | positional issue number |
| `sdd-forge flow set metric` | Increment a named counter (question, redo, docsRead, srcRead) for a phase | positional phase, positional counter |
| `sdd-forge flow set note` | Append a text note to the notes array in flow state | positional note text |
| `sdd-forge flow set redo` | Append a redo log entry with reason and resolution | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | Update the status of a requirement entry by index | positional index, positional status |
| `sdd-forge flow set request` | Store the original user request text in flow state | positional request text |
| `sdd-forge flow set step` | Update the status of a named flow step | positional step id, positional status |
| `sdd-forge flow set summary` | Store a requirements array (JSON) in flow state | positional JSON array |
| `sdd-forge flow set test-summary` | Record test execution counts per type in flow state | `--unit`, `--integration`, `--acceptance` |
| `sdd-forge flow run finalize` | Orchestrate commit, merge/PR, docs sync, and worktree cleanup | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow run gate` | Validate a spec file against structural rules and AI guardrails | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run impl-confirm` | Display changed files and requirement status to confirm implementation readiness | `--mode` |
| `sdd-forge flow run lint` | Run lint checks against merged guardrail rules | `--base` |
| `sdd-forge flow run report` | Generate and persist a flow execution report | `--dry-run` |
| `sdd-forge flow run retro` | AI-assisted retrospective comparing implemented diff against requirements | `--force`, `--dry-run` |
| `sdd-forge flow run review` | Run AI code review on current changes, with optional test sufficiency review | `--phase`, `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | Run the docs build pipeline and commit documentation changes | `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applies to | Description |
| --- | --- | --- |
| `-h`, `--help` | All commands | Display help text for the command and exit with code 0. When passed to a namespace (`docs`, `flow`), lists available subcommands. |
| `-v`, `-V`, `--version` | Top-level `sdd-forge` only | Print the package version number and exit with code 0. |
| `--dry-run` | Most pipeline and flow commands | Preview what the command would do without writing files or executing git operations. Behavior is command-specific; commands that support this flag document it in their help output. |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`
Prints a formatted list of all available commands with i18n-translated descriptions grouped by category (Project, Docs, Flow, Info). Invoked automatically when no subcommand is provided.

```
sdd-forge help
sdd-forge          # same as help
```

#### `sdd-forge setup`
Interactive wizard that collects project name, source path, language, preset type, and docs purpose/tone. Creates `.sdd-forge/`, `docs/`, and `specs/` directories, writes `config.json`, patches `.gitignore` and `.gitattributes`, deploys skill files, and injects the SDD directive block into `AGENTS.md` or `CLAUDE.md`.

```
sdd-forge setup
sdd-forge setup --name myproject --type node-cli --lang en --agent claude
sdd-forge setup --dry-run
```

| Option | Description |
| --- | --- |
| `--name` | Project name |
| `--type` | Preset type (e.g., `node-cli`, `laravel`) |
| `--lang` | Project language code (e.g., `en`, `ja`) |
| `--agent` | Default AI agent name |
| `--purpose` | Documentation purpose (`developer-guide`, `user-guide`, `api-reference`) |
| `--tone` | Writing tone (`polite`, `formal`, `casual`) |
| `--dry-run` | Preview without writing files |

#### `sdd-forge upgrade`
Refreshes skill files in `.claude/skills/` and `.agents/skills/` from the current package templates and migrates deprecated `config.json` fields (e.g., converts string-array `chapters` to object-array format).

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `sdd-forge presets list`
Prints the full preset inheritance tree starting from the `base` preset, including axis, language, aliases, scan keys, and whether a `templates/` directory is present.

```
sdd-forge presets list
```

#### `sdd-forge docs build`
Orchestrates the full documentation pipeline in sequence: scan → enrich → init → data → text → readme → agents → translate (when multi-language is configured). Uses a progress display and skips AI-dependent steps when no default agent is configured.

```
sdd-forge docs build
sdd-forge docs build --force
sdd-forge docs build --regenerate
sdd-forge docs build --verbose --dry-run
```

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing chapter files during `init` and `text` steps |
| `--regenerate` | Skip `init` and re-run `text` on existing chapter files |
| `--verbose` | Print step-level progress to stderr |
| `--dry-run` | Preview pipeline steps without writing |

#### `sdd-forge docs scan`
Scans the source directory and writes `analysis.json` to `.sdd-forge/output/`. This is the first required step in the documentation pipeline.

```
sdd-forge docs scan
```

#### `sdd-forge docs enrich`
Calls an AI agent to add `role`, `summary`, `detail`, and `chapter` fields to each entry in `analysis.json`. Requires a configured default agent.

```
sdd-forge docs enrich
```

#### `sdd-forge docs init`
Resolves the template chain for the configured preset type, optionally translates templates when the output language differs, and writes chapter `.md` files to `docs/`. Existing files are skipped unless `--force` is specified. When analysis data and an agent are available, an AI filter prunes irrelevant chapters.

```
sdd-forge docs init
sdd-forge docs init --force
sdd-forge docs init --type node-cli --dry-run
```

| Option | Description |
| --- | --- |
| `--type` | Override preset type |
| `--force` | Overwrite existing chapter files |
| `--dry-run` | Report what would be written without writing |

#### `sdd-forge docs data`
Populates `{{data(...)}}` directives in all chapter files by calling the configured resolver for the project's preset type.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### `sdd-forge docs text`
Fills `{{text(...)}}` directives in chapter files using an AI agent. Each directive's prompt drives the generated content. Supports parallel processing with concurrency limits from config.

```
sdd-forge docs text
sdd-forge docs text --force
sdd-forge docs text --dry-run
```

#### `sdd-forge docs readme`
Generates or updates `README.md` from the preset README template. Resolves `{{data}}` and `{{text}}` directives, skipping write if content is unchanged. Accepts `--output` to redirect to a language-specific path.

```
sdd-forge docs readme
sdd-forge docs readme --output docs/en/README.md
sdd-forge docs readme --lang ja --dry-run
```

#### `sdd-forge docs forge`
AI-driven multi-round document generation loop. Supports three modes: `local` (per-file parallel AI calls), `assist` (single prompt for all files), and `agent` (sub-agent delegation). Runs review after each round and exits early on pass.

```
sdd-forge docs forge --prompt "Update all architecture sections"
sdd-forge docs forge --prompt-file prompts/update.txt --max-runs 5
sdd-forge docs forge --spec specs/042-feature/spec.md --mode local
```

| Option | Description |
| --- | --- |
| `--prompt` | Instruction text for the AI agent (required unless `--prompt-file` is used) |
| `--prompt-file` | Path to a file containing the prompt |
| `--spec` | Path to a spec file to focus generation on relevant chapters |
| `--max-runs` | Maximum generation rounds (default: 3) |
| `--mode` | Generation mode: `local`, `assist`, or `agent` (default: `local`) |
| `--review-cmd` | Shell command used to validate output after each round |
| `--dry-run` | Run only one round without executing review |

#### `sdd-forge docs review`
Validates all chapter files for exposed `{{data}}`/`{{text}}` directives, broken HTML comments, residual block tags, minimum line count (15), missing H1 headings, and analysis coverage. Also checks that `README.md` and `analysis.json` exist and that translated language directories are present when configured.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### `sdd-forge docs changelog`
Reads the `specs/` directory, parses each `spec.md` for title, status, and date metadata, and writes a Markdown changelog table to `docs/change_log.md`. Produces both a latest-by-series index and a full all-specs table. No AI involvement.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
sdd-forge docs changelog docs/CHANGELOG.md
```

#### `sdd-forge docs agents`
Generates or updates `AGENTS.md` with SDD directive content and project-specific context derived from analysis data.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### `sdd-forge docs translate`
Translates chapter files and `README.md` into configured target languages using an AI agent. Skips files where the target is newer than the source unless `--force` is set. Outputs translated files to `docs/<lang>/` subdirectories.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
sdd-forge docs translate --dry-run
```

| Option | Description |
| --- | --- |
| `--lang` | Translate to a single target language only |
| `--force` | Overwrite target files even if they are newer than the source |
| `--dry-run` | List files that would be translated without translating |

#### `sdd-forge flow prepare`
Initializes a new SDD flow: creates a numbered spec directory under `specs/`, writes `spec.md` and `qa.md` from templates, creates a feature branch (or worktree), and writes the initial `flow.json`. Validates that the working tree is clean before proceeding.

```
sdd-forge flow prepare --title "Add export API"
sdd-forge flow prepare --title "Fix pagination" --base main --worktree
sdd-forge flow prepare --title "Config refactor" --no-branch --issue 42
```

| Option | Description |
| --- | --- |
| `--title` | Feature title used to derive the branch name and spec directory name (required) |
| `--base` | Base branch to branch from (defaults to current HEAD) |
| `--worktree` | Create a git worktree instead of a regular branch |
| `--no-branch` | Spec-only mode; no branch or worktree is created |
| `--issue` | GitHub issue number to link in `flow.json` |
| `--request` | User request text to store in `flow.json` |
| `--dry-run` | Show what would be created without executing |

#### `sdd-forge flow get check`
Validates whether preconditions for a given target are met. Valid targets: `impl` (requires `gate` and `test` steps done), `finalize` (requires `implement` step done), `dirty` (checks for uncommitted changes), `gh` (checks `gh` CLI availability).

```
sdd-forge flow get check impl
sdd-forge flow get check dirty
sdd-forge flow get check gh
```

#### `sdd-forge flow get context`
Provides file reading, analysis search, and keyword collection for AI context building. In file mode, reads the specified path and increments the `srcRead` metric. In search mode (`--search`), uses ngram similarity scoring followed by fallback substring matching and optional AI keyword selection.

```
sdd-forge flow get context src/lib/cli.js
sdd-forge flow get context --search "authentication flow"
sdd-forge flow get context --raw
```

#### `sdd-forge flow get guardrail`
Returns guardrail rules for the specified phase (`draft`, `spec`, `impl`, `lint`) loaded from the merged preset chain. Outputs Markdown by default; use `--format json` for a structured JSON envelope.

```
sdd-forge flow get guardrail spec
sdd-forge flow get guardrail impl --format json
```

#### `sdd-forge flow get status`
Returns the current flow phase, step statuses, requirements progress, metrics, and other fields from `flow.json`.

```
sdd-forge flow get status
```

#### `sdd-forge flow get resolve-context`
Assembles a comprehensive context snapshot including worktree path, branch info, spec content (Goal and Scope sections), git state (dirty files, ahead count, last commit), and the recommended next skill. Used by skill scripts to orient AI agents at the start of a session.

```
sdd-forge flow get resolve-context
```

#### `sdd-forge flow set step`
Updates the status of a named step in `flow.json`. Valid statuses include `done`, `skipped`, `in_progress`, and `pending`.

```
sdd-forge flow set step gate done
sdd-forge flow set step implement in_progress
```

#### `sdd-forge flow set metric`
Increments a named counter for a specified phase in `flow.json`. Valid phases: `draft`, `spec`, `gate`, `test`, `impl`. Valid counters: `question`, `redo`, `docsRead`, `srcRead`.

```
sdd-forge flow set metric impl srcRead
sdd-forge flow set metric spec question
```

#### `sdd-forge flow set redo`
Appends a redo entry to `redolog.json` in the spec directory, recording the step, reason, optional trigger, resolution, and guardrail candidate.

```
sdd-forge flow set redo --step implement --reason "missed edge case" --resolution "added null check"
```

#### `sdd-forge flow run gate`
Validates a spec file against structural rules (missing sections, unresolved tokens, unchecked tasks) and optionally against AI-evaluated guardrail articles. The `--phase post` variant additionally checks that the User Confirmation section contains an approval checkbox.

```
sdd-forge flow run gate
sdd-forge flow run gate --spec specs/042-feature/spec.md --phase post
sdd-forge flow run gate --skip-guardrail
```

#### `sdd-forge flow run review`
Runs AI code review on current changes against the base branch. In default mode, generates and applies approved refactoring proposals. With `--phase test`, performs test sufficiency gap analysis with up to three auto-fix cycles.

```
sdd-forge flow run review
sdd-forge flow run review --phase test
sdd-forge flow run review --dry-run
```

#### `sdd-forge flow run retro`
Performs an AI-assisted retrospective by comparing spec requirements against the git diff. Writes `retro.json` to the spec directory with per-requirement verdicts (done/partial/not_done) and an overall completion rate.

```
sdd-forge flow run retro
sdd-forge flow run retro --force
sdd-forge flow run retro --dry-run
```

#### `sdd-forge flow run finalize`
Orchestrates the final steps of a flow in sequence: (1) commit staged changes + run retro + save report, (2) merge via squash or create a GitHub PR, (3) sync documentation, (4) delete branch/worktree. Use `--mode all` to run all steps or `--mode select --steps 1,2` to run specific steps.

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2
sdd-forge flow run finalize --mode all --merge-strategy pr
sdd-forge flow run finalize --mode all --dry-run
```

#### `sdd-forge flow run sync`
Runs the docs build pipeline (`sdd-forge docs build`) from within the current working directory, then stages and commits changed documentation files with the message `docs: sync documentation`.

```
sdd-forge flow run sync
sdd-forge flow run sync --dry-run
```

#### `sdd-forge flow run lint`
Checks files changed since the base branch against guardrail lint patterns loaded from the merged preset chain.

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit Codes**

| Code | Constant | Meaning |
| --- | --- | --- |
| `0` | — | Success; command completed normally |
| `1` | `EXIT_ERROR` | Command failed, unrecognized subcommand, missing required argument, or a pipeline step returned an error |

`EXIT_ERROR` is defined in `src/lib/exit-codes.js` and used consistently across all command scripts via `process.exit(EXIT_ERROR)`.

**stdout/stderr conventions**

| Stream | Usage |
| --- | --- |
| `stdout` | Primary output: generated content (`--dry-run` previews, help text, changelog tables, JSON envelopes from `flow get`/`flow set`/`flow run` commands) |
| `stderr` | Progress messages, warnings, and verbose log lines prefixed with `[command]` (e.g., `[forge] start: docs/overview.md`, `[build] WARN: no defaultAgent configured`) |

All `flow get`, `flow set`, and `flow run` commands wrap their results in a structured JSON envelope written to stdout:

```
{"ok": true, "group": "get", "command": "status", "data": { ... }}
{"ok": false, "group": "run", "command": "gate", "errors": [{"code": "GATE_FAILED", "messages": [...]}]}
```

Docs pipeline commands (`docs build`, `docs forge`, `docs text`, etc.) write progress and warning messages to stderr and emit no structured stdout unless `--dry-run` is active, in which case generated content is written to stdout.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
