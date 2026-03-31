<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 20 commands organized under two namespace dispatchers — `docs` (13 subcommands) and `flow` (`get`, `set`, `run`) — plus four independent top-level commands: `setup`, `upgrade`, `presets`, and `help`. The `docs` namespace drives the full documentation generation pipeline, while `flow` manages the Spec-Driven Development lifecycle including branch creation, review, merge, and retrospective evaluation.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
| --- | --- | --- |
| `help` | Display the help screen with all command descriptions | — |
| `setup` | Interactive wizard to initialize a new sdd-forge project | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Update skills and template-derived config files to match the installed version | `--dry-run` |
| `docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--dry-run`, `--verbose` |
| `docs scan` | Scan source files and produce `.sdd-forge/output/analysis.json` | — |
| `docs enrich` | Enrich analysis with AI-generated role, summary, and chapter annotations | — |
| `docs init` | Initialize chapter Markdown files in `docs/` from preset templates | `--force`, `--dry-run` |
| `docs data` | Populate `{{data}}` directives in chapter files from analysis data | `--dry-run` |
| `docs text` | Fill `{{text}}` directives in chapter files using an AI agent | `--dry-run` |
| `docs readme` | Generate the project `README.md` from chapter summaries | `--dry-run` |
| `docs forge` | Iterative AI-driven documentation improvement loop with integrated review feedback | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--mode`, `--review-cmd`, `--dry-run` |
| `docs review` | Review generated documentation quality | `--dry-run` |
| `docs translate` | Translate default-language docs to all configured non-default languages | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | Generate `docs/change_log.md` from metadata in the `specs/` directory | `--dry-run` |
| `docs agents` | Generate or update `AGENTS.md` / `CLAUDE.md` with project and SDD context | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | Take a snapshot of the current documentation state | — |
| `flow get` | Read a field from the active flow state (`flow.json`) | — |
| `flow set` | Write a field value into the active flow state | — |
| `flow run merge` | Squash-merge the feature branch into the base branch, or create a GitHub PR | `--pr`, `--auto`, `--dry-run` |
| `flow run cleanup` | Remove the feature branch and/or worktree associated with the active flow | `--dry-run` |
| `flow run review` | Run the multi-phase AI code review pipeline (draft → final) | `--dry-run`, `--skip-confirm` |
| `flow run retro` | Evaluate spec accuracy after implementation by comparing requirements against the git diff | `--force`, `--dry-run` |
| `presets list` | Display the full preset inheritance tree with labels and scan keys | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Shorthand | Description | Applicable Commands |
| --- | --- | --- | --- |
| `--help` | `-h` | Print usage information for the command and exit with code 0 | All commands |
| `--dry-run` | — | Preview what would be written or executed without making any changes | `docs build`, `docs init`, `docs data`, `docs text`, `docs readme`, `docs forge`, `docs translate`, `docs changelog`, `docs agents`, `flow run merge`, `flow run cleanup`, `flow run retro`, `setup`, `upgrade` |
| `--verbose` | `-v` | Write detailed per-step progress output to stderr | `docs build`, `docs forge` |
| `--force` | — | Overwrite existing files or bypass mtime-based incremental checks | `docs build`, `docs init`, `docs translate`, `flow run retro` |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `help`

Prints the full command listing grouped by section (Project, Docs, Flow, Info), with per-command descriptions sourced from the i18n layer, along with the installed package version.

```
sdd-forge help
sdd-forge --help
```

#### `setup`

Launches an interactive wizard that collects UI language, project name, output language(s), preset type (multi-select tree), document purpose, tone, and AI agent choice. Writes `.sdd-forge/config.json`, deploys skills to `.claude/skills/` and `.agents/skills/`, and creates or updates `AGENTS.md` / `CLAUDE.md`. Re-running preserves existing customizations. All prompts can be bypassed by supplying the corresponding flags for non-interactive use.

```
sdd-forge setup
sdd-forge setup --name my-project --type node-cli --lang en --agent claude
sdd-forge setup --dry-run
```

Options: `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run`

#### `upgrade`

Redeploys skill files and migrates `.sdd-forge/config.json` format changes introduced in newer versions of sdd-forge. Only overwrites template-managed content; user-configured values are preserved. Reports each skill file as `updated` or `unchanged`.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `docs build`

Runs the full documentation generation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, with an optional `translate` step when multi-language output is configured. Displays a weighted progress bar. The `enrich` and `text` steps are skipped when no AI agent is configured. Use `--regenerate` to re-run `data`, `text`, and `readme` against existing chapter files without re-running `init`. Errors in the `text` step are reported as non-fatal warnings; all other errors exit the pipeline.

```
sdd-forge docs build
sdd-forge docs build --force
sdd-forge docs build --regenerate
sdd-forge docs build --dry-run --verbose
```

#### `docs scan`

Walks the source tree and writes `.sdd-forge/output/analysis.json` containing structured entries for matched source files, grouped by category (modules, commands, config, etc.) according to the active preset's DataSource definitions.

```
sdd-forge docs scan
```

#### `docs enrich`

Sends analysis data to the configured AI agent and annotates each entry with `role`, `summary`, `detail`, and `chapter` fields. The enriched result is written back to `analysis.json` and consumed by all downstream pipeline steps.

```
sdd-forge docs enrich
```

#### `docs init`

Creates chapter Markdown files in `docs/` from the preset's template files. Skips files that already exist unless `--force` is passed.

```
sdd-forge docs init
sdd-forge docs init --force
sdd-forge docs init --dry-run
```

#### `docs data`

Reads `analysis.json` and fills all `{{data(...)}}` directive blocks in chapter files with generated Markdown tables and lists produced by the preset's DataSource resolvers.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### `docs text`

Invokes the AI agent for each chapter file containing `{{text(...)}}` directives and writes the generated prose into the directive blocks. Errors in individual files are reported as warnings and do not stop processing of remaining files.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### `docs readme`

Generates the project-level `README.md` from chapter summary data and the configured README template.

```
sdd-forge docs readme
sdd-forge docs readme --dry-run
```

#### `docs forge`

Runs an iterative improvement loop: populates `{{data}}` and `{{text}}` placeholders, invokes the AI agent to update documentation, then executes the review command. If review fails, file-level results are fed back into the next round up to `--max-runs` iterations. Supports three modes: `local` (no agent, outputs `NEEDS_INPUT`), `assist` (agent optional with local fallback), and `agent` (agent required).

```
sdd-forge docs forge --prompt "Improve the API reference sections"
sdd-forge docs forge --prompt-file prompts/improve.txt --max-runs 5
sdd-forge docs forge --spec specs/041-cli/spec.md --mode agent
sdd-forge docs forge --prompt "Update overview" --dry-run
```

Options: `--prompt`, `--prompt-file`, `--spec`, `--max-runs` (default: `3`), `--review-cmd` (default: `sdd-forge docs review`), `--mode` (`local`|`assist`|`agent`), `--dry-run`, `--verbose`

#### `docs review`

Runs the documentation review pipeline, checking generated chapter files for quality and consistency against the analysis data.

```
sdd-forge docs review
sdd-forge docs review --dry-run
```

#### `docs translate`

Translates all default-language chapter files to each configured non-default language using the AI agent. Skips files whose target is already newer than the source (mtime-based incremental). Writes output to `docs/{lang}/` directories. Only operates when `docs.output.mode` is `translate`.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja
sdd-forge docs translate --force
sdd-forge docs translate --dry-run
```

Options: `--lang` (restrict to a single target language), `--force` (retranslate all regardless of mtime), `--dry-run`

#### `docs changelog`

Scans `specs/` subdirectories matching the `NNN-series` or `bak.NNN-series` naming pattern, extracts metadata (title, status, created date, branch, input summary) from each `spec.md`, and writes `docs/change_log.md` with a latest-per-series index table and a complete all-specs table.

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### `docs agents`

Generates or updates `AGENTS.md` (and its `CLAUDE.md` counterpart) with the SDD directive block and a project-context section populated from analysis data.

```
sdd-forge docs agents
sdd-forge docs agents --sdd
sdd-forge docs agents --project
sdd-forge docs agents --dry-run
```

Options: `--sdd` (update SDD section only), `--project` (update PROJECT section only), `--dry-run`

#### `flow get`

Reads and prints a named field from the active flow state stored in `flow.json`.

```
sdd-forge flow get status
sdd-forge flow get step
```

#### `flow set`

Writes a value to a named field in the active flow state.

```
sdd-forge flow set step approach done
```

#### `flow run merge`

Merges the feature branch into the base branch via squash merge, or creates a GitHub PR when `--pr` or `--auto` is passed. In PR mode, the title and body are derived from the `Goal`, `Requirements`, and `Scope` sections of `spec.md`. The squash commit message uses the spec directory name and appends `fixes #<issue>` when an issue number is recorded in flow state. Auto-detection (`--auto`) selects the PR route when `config.commands.gh === 'enable'` and `gh` is available.

```
sdd-forge flow run merge
sdd-forge flow run merge --pr
sdd-forge flow run merge --auto
sdd-forge flow run merge --dry-run
```

#### `flow run cleanup`

Deletes the feature branch and, in worktree mode, removes the linked worktree directory. Clears the `.active-flow` entry from flow state while preserving `flow.json` in `specs/`.

```
sdd-forge flow run cleanup
sdd-forge flow run cleanup --dry-run
```

#### `flow run review`

Runs a two-phase AI code review: a draft phase generates numbered improvement proposals; a final phase validates each as `APPROVED` or `REJECTED`. Results are written to `review.md` in the spec directory. Approved proposals are printed to stdout.

```
sdd-forge flow run review
sdd-forge flow run review --dry-run
sdd-forge flow run review --skip-confirm
```

#### `flow run retro`

Evaluates spec accuracy after implementation by comparing the spec's Requirements section against the git diff between `baseBranch` and `HEAD`. The AI agent produces per-requirement `done`/`partial`/`not_done` verdicts along with a weighted completion rate, writing the result as `retro.json` in the spec directory.

```
sdd-forge flow run retro
sdd-forge flow run retro --force
sdd-forge flow run retro --dry-run
```

Options: `--force` (overwrite an existing `retro.json`), `--dry-run`

#### `presets list`

Prints the full preset inheritance tree using box-drawing characters (`├──`, `└──`). Each node displays the preset key, label, axis, language, aliases, and scan keys. Nodes without a `templates/` directory are annotated with `[no templates]`.

```
sdd-forge presets list
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | When Used |
| --- | --- | --- |
| `0` | — | Command completed successfully |
| `1` | `EXIT_ERROR` | Unknown command, missing required argument, agent call failure, file not found, config load error, or any unhandled pipeline error |

**stdout** carries primary output: generated file content printed in `--dry-run` mode, command listings, approved proposal summaries, and pipeline completion messages.

**stderr** carries operational feedback: per-step pipeline labels (`[scan]`, `[enrich]`, `[text]`, etc.), dot-progress indicators during agent calls, warnings about skipped steps (e.g., no agent configured), and error messages preceding a non-zero exit.

When `--dry-run` is active, commands print the content that would be written to files or the git/gh commands that would be executed — without modifying any files or running destructive operations.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
