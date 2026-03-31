<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides more than 25 CLI commands organized under four top-level entry points: standalone commands (`help`, `setup`, `upgrade`, `presets`), the `docs` namespace with twelve pipeline subcommands plus the `docs build` meta-command, and the `flow` namespace with three sub-dispatchers (`get`, `set`, `run`) alongside direct subcommands (`merge`, `cleanup`, `review`). Commands follow the hierarchical pattern `sdd-forge <namespace> <subcommand> [options]` for `docs` and `flow`, and `sdd-forge <command> [options]` for standalone commands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `sdd-forge help` | Display all available commands with descriptions | — |
| `sdd-forge setup` | Interactive wizard to create `.sdd-forge/config.json` | `--name`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | Update skills and config format to match installed version | `--dry-run` |
| `sdd-forge presets list` | Render the preset inheritance tree with metadata | — |
| `sdd-forge docs build` | Run the full pipeline: scan → enrich → init → data → text → readme → agents → [translate] | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and write `analysis.json` | — |
| `sdd-forge docs enrich` | Enrich analysis entries with AI-assigned roles and summaries | — |
| `sdd-forge docs init` | Initialize chapter markdown files from preset templates | `--force`, `--dry-run` |
| `sdd-forge docs data` | Populate `{{data}}` directives in chapter files | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives in chapter files via AI | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from the preset README template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative AI docs improvement loop with review gating | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `sdd-forge docs review` | Validate chapter files for structure and content completeness | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `change_log.md` from `specs/` directory entries | `--dry-run` |
| `sdd-forge docs agents` | Update `AGENTS.md` by resolving directives and running AI refinement | `--dry-run` |
| `sdd-forge flow get status` | Return current SDD flow state as a JSON envelope | — |
| `sdd-forge flow get check` | Check prerequisites for a flow phase or environment state | target: `impl`, `finalize`, `dirty`, `gh` |
| `sdd-forge flow get issue` | Fetch GitHub issue content as a JSON envelope via `gh` CLI | issue number |
| `sdd-forge flow set` | Set flow state values (sub-dispatcher) | key-specific options |
| `sdd-forge flow run gate` | Validate `spec.md` completeness and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run prepare-spec` | Create feature branch or worktree and initialize spec directory | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run impl-confirm` | Check implementation readiness against requirements | `--mode` |
| `sdd-forge flow run lint` | Run guardrail lint checks against changed files | `--base` |
| `sdd-forge flow run finalize` | Execute the finalization pipeline (commit, merge, sync, cleanup, record) | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `sdd-forge flow merge` | Squash-merge feature branch or create a GitHub Pull Request | `--pr`, `--auto`, `--dry-run` |
| `sdd-forge flow cleanup` | Remove feature branch and/or git worktree after a completed flow | `--dry-run` |
| `sdd-forge flow review` | Run a two-phase AI code quality review and save results to `review.md` | `--dry-run`, `--skip-confirm` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Short | Applies To | Description |
| --- | --- | --- | --- |
| `--help` | `-h` | All commands | Display usage information and available options for the command |
| `--dry-run` | — | `setup`, `upgrade`, all `docs` subcommands, most `flow run` subcommands | Preview actions and output without writing any files or executing destructive operations |
| `--verbose` | `-v` | `docs build`, `docs forge` | Print step-by-step progress details to stderr during execution |
| `--force` | — | `docs build`, `docs init`, `docs translate` | Overwrite existing files or bypass mtime-based incremental checks |
| `--version` | `-v`, `-V` | Root entry point (`sdd-forge`) | Print the installed package version and exit |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge help`

Displays the full command listing grouped by section (Project, Docs, Flow, Info) with version number. Invoked automatically when no subcommand is provided. Descriptions are resolved via the i18n system, so output reflects the active locale.

#### `sdd-forge setup`

Runs an interactive wizard that creates or updates `.sdd-forge/config.json`. Prompts cover project name, output languages (multi-select), default output language, preset type selection (tree-based), document purpose, tone, and AI agent provider. A confirmation loop allows re-editing before writing. Non-interactive mode activates when `--name`, `--type`, `--purpose`, and `--tone` are all supplied as flags. Also creates directory structure (`docs/`, `specs/`, `.sdd-forge/output/`), updates `.gitignore` and `.gitattributes`, and deploys skills.

```
sdd-forge setup --name my-project --type node-cli --purpose developer-guide --tone polite
```

#### `sdd-forge upgrade`

Idempotent upgrade command that redeploys skill files under `.claude/skills/` and `.agents/skills/` from the installed package templates. Also migrates legacy `chapters` format in `config.json` from a string array to the current object array format. Safe to run repeatedly without modifying user-defined config values.

```
sdd-forge upgrade --dry-run
```

#### `sdd-forge presets list`

Renders the full preset inheritance tree starting from the `base` root. Each node shows label, axis, language, aliases, and available scan keys. Nodes without a `templates/` directory are annotated with `[no templates]`.

#### `sdd-forge docs build`

Orchestrates the complete documentation pipeline as a single command with a progress bar. The default pipeline is: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `[translate]`. The `enrich` and `text` steps are skipped when no AI agent is configured. `--regenerate` skips `init` and rewrites existing chapter content. `--force` forces `init` to overwrite existing files. Multi-language output iterates non-default languages after the primary pipeline.

```
sdd-forge docs build --verbose
sdd-forge docs build --regenerate --dry-run
```

#### `sdd-forge docs scan`

Scans the configured source root and writes `analysis.json` to `.sdd-forge/output/`. The output is the input for all subsequent `docs` pipeline steps.

#### `sdd-forge docs enrich`

Passes the raw analysis to an AI agent to annotate each entry with role, summary, and chapter classification. Results are written back into `analysis.json`. Skipped automatically in `docs build` when no agent is configured.

#### `sdd-forge docs init`

Creates chapter markdown files in `docs/` from preset templates, resolving the full inheritance chain. Existing files are not overwritten unless `--force` is passed. Chapter order follows `preset.json` or the project-local `config.chapters` override.

#### `sdd-forge docs data`

Resolves all `{{data(...)}}` directives in chapter files by calling the type-based resolver chain with the current `analysis.json`. Writes results back in-place. The `--dry-run` flag prints resolved content without writing.

#### `sdd-forge docs text`

Fills all `{{text(...)}}` directives in chapter files by invoking the configured AI agent. Operates in batch mode per file. Supports `--dry-run` to preview prompts. Errors in individual files are reported but do not halt the pipeline.

#### `sdd-forge docs readme`

Generates `README.md` from the preset `README.md` template by resolving `{{data}}` and `{{text}}` directives. Accepts `--output` to write to a non-default path and `--lang` to target a specific language. Performs a no-op if the generated content matches the current file.

#### `sdd-forge docs forge`

Runs an iterative AI improvement loop for docs quality. Each round invokes an AI agent on target chapter files then runs `sdd-forge docs review` to assess quality. If review fails, feedback is captured and passed to the next round. Loop exits when review passes or `--max-runs` is reached. Accepts `--spec` to narrow target files to chapters relevant to the spec. Three modes: `local` (no AI, review-only), `assist` (AI + fallback), `agent` (AI required).

```
sdd-forge docs forge --prompt "document the CLI command structure" --max-runs 3 --mode agent
```

#### `sdd-forge docs review`

Validates all chapter files against quality rules: minimum 15 lines, presence of an H1 heading, no unfilled `{{text}}` or `{{data}}` directive blocks, no exposed directive syntax in rendered output, no residual block comments, and balanced HTML comment tags. Also verifies that `analysis.json` and `README.md` exist. Reports uncovered analysis categories. For multi-language configs, validates each non-default language subdirectory. Exits with code 1 if any check fails.

#### `sdd-forge docs translate`

Translates chapter files from the default language to each configured non-default language via AI. Uses mtime comparison for incremental translation; `--force` bypasses this check. `--lang` restricts translation to a single target language. Applies writing style and tone instructions from `config.docs.style`. Preserves all `{{data}}` and `{{text}}` directives verbatim.

#### `sdd-forge docs changelog`

Scans `specs/` for numbered subdirectories, parses each `spec.md` for title, status, created date, branch, and input summary, and writes a `change_log.md` with two tables: a latest-index table (one row per series) and an all-specs table. Deduplicates by series name, keeping the highest-numbered entry per series. `bak.` prefixed directories are included in the all-specs table but excluded from the latest index.

#### `sdd-forge docs agents`

Updates `AGENTS.md` by resolving `{{data("agents.sdd")}}` and `{{data("agents.project")}}` block directives. The `agents.sdd` block is rendered from the SDD template. The `agents.project` block is template-generated and then refined by an AI agent using the existing docs and `package.json` scripts as context. Creates `AGENTS.md` from scratch if it does not exist.

#### `sdd-forge flow get status`

Returns the full flow state as a JSON envelope including phase, step progress, requirements progress, branch names, worktree flag, linked issue, and metrics. Returns a `fail` envelope with `NO_FLOW` when no `flow.json` is active.

#### `sdd-forge flow get check`

Checks a named prerequisite target. Valid targets: `impl` (gate and test steps done/skipped), `finalize` (implement step done/skipped), `dirty` (working tree clean), `gh` (GitHub CLI available). Returns a structured JSON envelope with per-check pass/fail details.

```
sdd-forge flow get check dirty
sdd-forge flow get check gh
```

#### `sdd-forge flow get issue`

Fetches GitHub issue data using `gh issue view <number> --json title,body,labels,state`. Returns a JSON envelope with `number`, `title`, `body`, `labels`, and `state`. Returns a `fail` envelope with `GH_ERROR` on network or CLI errors.

#### `sdd-forge flow run gate`

Validates a `spec.md` file for completeness. Text checks include: no unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), no unchecked task items outside skip-sections, and required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria` or `## User Scenarios`). In `post` phase, also requires `- [x] User approved this spec` in the User Confirmation section. Optionally runs an AI guardrail compliance check against project guardrail articles.

```
sdd-forge flow run gate --spec specs/042-new-feature/spec.md --phase pre
sdd-forge flow run gate --phase post --skip-guardrail
```

#### `sdd-forge flow run prepare-spec`

Creates the feature branch (or git worktree with `--worktree`) and initializes `specs/<NNN>-<slug>/spec.md` and `qa.md` from templates. The index `NNN` is auto-incremented from existing spec directories and `feature/NNN-*` branches. Writes `flow.json` with initial step state and registers the flow in the `.active-flow` index. Requires `--title`. Aborts if the working tree is dirty.

```
sdd-forge flow run prepare-spec --title "add export command" --base main
sdd-forge flow run prepare-spec --title "add export command" --worktree
```

#### `sdd-forge flow run impl-confirm`

Checks implementation readiness by summarizing requirement statuses from `flow.json`. In `detail` mode, also lists files changed since the base branch via `git diff baseBranch...HEAD --name-only`. Returns `ready` when all requirements are done or none are tracked, and `incomplete` otherwise, with `next` set to `review` or `fix` accordingly.

#### `sdd-forge flow run lint`

Runs guardrail lint pattern checks against files changed since the base branch. Resolves the base branch from `--base` or `state.baseBranch`. Returns a `fail` envelope listing each violation as `FAIL: [article] file:line — match` when violations are found.

#### `sdd-forge flow run finalize`

Executes the five-step finalization pipeline. `--mode all` runs all steps; `--mode select --steps 1,2,3` runs only the specified steps. Steps: 1=commit (`git add -A` + `git commit`), 2=merge (delegates to `flow merge`), 3=sync (`sdd-forge docs build` + docs commit, skipped on PR route), 4=cleanup (delegates to `flow cleanup`), 5=record (placeholder). Returns a JSON envelope with per-step results and flow artifacts.

```
sdd-forge flow run finalize --mode all --merge-strategy squash
sdd-forge flow run finalize --mode select --steps 1,2 --dry-run
```

#### `sdd-forge flow merge`

Merges the feature branch into the base branch. Default mode squash-merges. `--pr` pushes the branch and creates a GitHub Pull Request via `gh pr create`, populating the PR title and body from `spec.md` Goal, Requirements, and Scope sections. `--auto` selects PR mode when `config.commands.gh === 'enable'` and `gh` is available. Supports both worktree mode (`git -C mainRepoPath merge --squash`) and standard branch mode.

#### `sdd-forge flow cleanup`

Removes the feature branch and/or git worktree after a completed flow and clears the `.active-flow` registry entry. In worktree mode, runs `git worktree remove` followed by `git branch -D`. In branch-only mode, runs `git branch -D` directly. The `flow.json` in `specs/` is preserved. Warns if invoked from inside the worktree being removed.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
| --- | --- | --- |
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | Command failed, invalid input, missing required argument, or a quality check did not pass |

**stdout conventions**

Most `docs` commands write progress messages prefixed with a bracketed command name (e.g., `[agents]`, `[build]`, `[readme]`) directly to stdout. The `flow get` and `flow run` subcommands write a single-line JSON envelope to stdout — always an object with `ok` (boolean), `cmd`, `key`, and a `data` or `error` payload — making them suitable for machine consumption by skill scripts.

**stderr conventions**

Progress ticks (`.` characters during AI agent calls), verbose pipeline step details (`--verbose`), and non-fatal warnings are written to stderr. Error messages from failed commands are also printed to stderr before the process exits with code 1.

| Stream | Used For |
| --- | --- |
| stdout | Normal command output, generated file content (`--dry-run`), JSON envelopes (`flow get`/`flow run`) |
| stderr | Progress indicators, verbose logs, warnings, error messages |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
