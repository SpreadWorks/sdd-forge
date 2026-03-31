<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/cli_commands.md)
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

sdd-forge provides over 25 CLI commands organized into three top-level namespaces — `docs` (documentation generation pipeline), `flow` (Spec-Driven Development workflow), and standalone commands (`setup`, `upgrade`, `presets`, `help`). Each namespace uses a multi-level dispatcher that dynamically imports dedicated command modules, supporting subcommand structures up to three levels deep (for example, `sdd-forge flow run gate`).
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options |
|---|---|---|
| `sdd-forge help` | Display the full command listing with descriptions | — |
| `sdd-forge setup` | Interactive project setup wizard; generates `.sdd-forge/config.json` and deploys skills | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | Re-deploy skills to their latest version and migrate config format | `--dry-run` |
| `sdd-forge presets list` | Render the preset inheritance tree with metadata annotations | — |
| `sdd-forge docs build` | Run the full documentation pipeline: scan → enrich → init → data → text → readme → agents | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | Scan source code and write `analysis.json` | — |
| `sdd-forge docs enrich` | AI-enrich analysis entries with roles, summaries, and chapter classifications | — |
| `sdd-forge docs init` | Initialize chapter Markdown files from preset templates | `--force`, `--dry-run` |
| `sdd-forge docs data` | Populate `{{data}}` directives in chapter files from analysis | `--dry-run` |
| `sdd-forge docs text` | Fill `{{text}}` directives via AI agent | `--dry-run` |
| `sdd-forge docs readme` | Generate `README.md` from the preset README template | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | Iterative AI-driven docs improvement loop with automated review gating | `--prompt`, `--prompt-file`, `--spec`, `--mode`, `--max-runs`, `--review-cmd`, `--dry-run` |
| `sdd-forge docs review` | Validate chapter files for structure, directive fill status, and output integrity | — |
| `sdd-forge docs translate` | Translate default-language docs to non-default languages via AI | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | Generate `change_log.md` from the `specs/` directory | `--dry-run` |
| `sdd-forge docs agents` | Update `AGENTS.md` with AI-refined project context | `--dry-run` |
| `sdd-forge flow get status` | Return the active SDD flow state as a JSON envelope | — |
| `sdd-forge flow get issue <n>` | Fetch a GitHub issue by number as a JSON envelope via `gh` CLI | — |
| `sdd-forge flow get check <target>` | Check prerequisites for a flow phase (`impl`, `finalize`, `dirty`, `gh`) | — |
| `sdd-forge flow set` | Update fields in the active flow state | — |
| `sdd-forge flow run prepare-spec` | Create feature branch or git worktree and initialize `spec.md` / `qa.md` | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run gate` | Validate `spec.md` completeness and guardrail compliance | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge flow run impl-confirm` | Check implementation readiness against tracked requirements | `--mode` |
| `sdd-forge flow run lint` | Run guardrail lint pattern checks on files changed since the base branch | `--base` |
| `sdd-forge flow run finalize` | Execute the finalization pipeline: commit → merge → sync → cleanup → record | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Applicable Commands | Description |
|---|---|---|
| `-h`, `--help` | All commands | Display help text for the command and exit with code `0` |
| `-v`, `--version`, `-V` | `sdd-forge` (top-level only) | Print the installed sdd-forge version string and exit |
| `--dry-run` | `setup`, `upgrade`, most `docs` subcommands, `flow run finalize`, `flow run prepare-spec` | Preview all file writes and git operations without applying any changes |
| `--verbose` (`-v`) | `docs build`, `docs forge` | Emit detailed per-step progress messages to stderr |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### sdd-forge help

Displays the full command listing grouped by section (Project, Docs, Flow, Info), the installed version, and a usage summary. ANSI bold and dim escapes are used for formatting. Invoked automatically when no subcommand is provided.

```
sdd-forge help
sdd-forge --help
```

#### sdd-forge setup

Runs a full-featured project initialization wizard. Prompts for project name, output languages, preset type (tree-based multi-select), document purpose, tone, and agent configuration. Writes `.sdd-forge/config.json`, creates `docs/`, `specs/`, and `.sdd-forge/output/` directories, adds `.gitignore` and `.gitattributes` entries, and deploys skills. Non-interactive mode activates when all required options are supplied via flags.

```
sdd-forge setup
sdd-forge setup --name myapp --type node-cli --lang en --agent claude
```

| Option | Description |
|---|---|
| `--name` | Project name |
| `--type` | Preset type leaf name (e.g., `node-cli`, `laravel`) |
| `--lang` | UI and config language (`en`, `ja`) |
| `--agent` | Default agent provider (`claude`, `codex`) |
| `--dry-run` | Preview generated config without writing files |

#### sdd-forge upgrade

Idempotent upgrade tool safe to run repeatedly. Re-deploys skills from the installed sdd-forge package to `.claude/skills/` and `.agents/skills/`, reporting each skill as `updated` or `unchanged`. Also migrates the `chapters` field in `config.json` from the legacy string-array format to the current object-array format.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### sdd-forge presets list

Prints the full preset inheritance tree rooted at `base`. Each node shows its label, axis, language, aliases, and scan keys. Nodes without a `templates/` directory are annotated with `[no templates]`.

```
sdd-forge presets list
```

#### sdd-forge docs build

Orchestrates the full documentation generation pipeline in fixed sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents`, followed by `translate` when multi-language output is configured. Steps requiring an AI agent (`enrich`, `text`) are skipped with a warning when no `defaultAgent` is configured. The `init` step is skipped when `--regenerate` is used.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate --dry-run
```

| Option | Description |
|---|---|
| `--force` | Force overwrite of existing chapter files during the `init` step |
| `--regenerate` | Skip `init`; regenerate AI text into existing chapter files |
| `--verbose` | Show per-step log output to stderr |
| `--dry-run` | Preview pipeline steps without writing files |

#### sdd-forge docs scan

Scans the source tree using the scan configuration defined by the project type preset and writes `.sdd-forge/output/analysis.json`. This is the first step of the documentation pipeline and must be run before any other `docs` subcommand.

```
sdd-forge docs scan
```

#### sdd-forge docs enrich

Passes the raw `analysis.json` to an AI agent to assign each entry a role, summary, detail description, and chapter classification. Writes an enriched `analysis.json` in place.

```
sdd-forge docs enrich
```

#### sdd-forge docs init

Resolves chapter Markdown templates from the preset inheritance chain and copies them into the `docs/` directory. Existing files are preserved unless `--force` is specified.

```
sdd-forge docs init
sdd-forge docs init --force
```

#### sdd-forge docs data

Resolves all `{{data(...)}}` directives in chapter files by invoking the appropriate data source methods with the analysis as input and writing the rendered results back in-place.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

Fills `{{text(...)}}` directives in chapter files by sending each directive's prompt and surrounding document context to the configured AI agent. Previously filled content is stripped before regeneration.

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

Generates `README.md` by resolving the `README.md` template from the preset chain, populating `{{data}}` directives (including the language switcher), and optionally filling `{{text}}` directives via AI. Skips writing when the generated content is identical to the existing file.

```
sdd-forge docs readme
sdd-forge docs readme --output docs/en/README.md --lang en
```

| Option | Description |
|---|---|
| `--lang` | Target output language |
| `--output` | Override the output file path |
| `--dry-run` | Print generated content to stdout without writing |

#### sdd-forge docs forge

Runs an iterative AI and review loop to improve documentation quality. Each round invokes the AI agent on target chapter files, then runs `docs review`. If review fails, feedback is summarized and only the failing files are targeted in the next round. Requires `--prompt` or `--prompt-file`. A `--spec` path can be supplied to restrict the target files to chapters relevant to that spec.

```
sdd-forge docs forge --prompt "Add more detail to the architecture section"
sdd-forge docs forge --prompt-file task.txt --spec specs/042-feature/spec.md --max-runs 5
```

| Option | Description |
|---|---|
| `--prompt` | User intent prompt (required unless `--prompt-file` is used) |
| `--prompt-file` | Path to a file containing the prompt text |
| `--spec` | Path to a spec.md file to narrow target chapter files |
| `--mode` | `local` (no AI), `assist` (AI with graceful fallback), or `agent` (AI required) |
| `--max-runs` | Maximum improvement rounds (default: 3) |
| `--review-cmd` | Override the review command string (default: `sdd-forge docs review`) |
| `--dry-run` | List target files without running the loop |

#### sdd-forge docs review

Validates all chapter files in the `docs/` directory against quality criteria: minimum 15 lines, presence of an H1 heading, no unfilled `{{text}}` directives, no unfilled `{{data}}` directives, and output integrity (no exposed directive syntax, no residual block template comments, no unbalanced HTML comments). Also verifies `analysis.json` and `README.md` existence. For multi-language configurations, repeats all checks for each non-default language subdirectory. Exits with code `1` if any check fails.

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### sdd-forge docs translate

Translates default-language chapter files to each non-default language defined in `docs.languages`. Uses file mtime comparison to skip up-to-date targets unless `--force` is set. Applies language- and tone-specific writing style instructions derived from `docs.style`. Runs translations in parallel up to the configured concurrency limit.

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| Option | Description |
|---|---|
| `--lang` | Restrict translation to a single target language |
| `--force` | Bypass mtime check and retranslate all files |
| `--dry-run` | List translation tasks without executing |

#### sdd-forge docs changelog

Scans the `specs/` directory, parses each `spec.md` for metadata (title, status, created date, feature branch, input summary), and generates `docs/change_log.md`. The output contains a latest-index table (one row per series) and an all-specs table (one row per directory, sorted by name).

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### sdd-forge docs agents

Updates `AGENTS.md` by resolving `{{data("agents.sdd")}}` and `{{data("agents.project")}}` directives, then refines the PROJECT section using an AI agent provided with the generated docs and `package.json` scripts as context. Creates `AGENTS.md` from a default template if it does not exist.

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge flow get status

Returns the full active flow state as a JSON envelope. Fields include: `spec`, `baseBranch`, `featureBranch`, `worktree`, `issue`, `phase`, `steps[]`, `stepsProgress`, `requirements[]`, `requirementsProgress`, `request`, `notes[]`, `metrics`, `mergeStrategy`, and `autoApprove`. Returns a `NO_FLOW` error envelope when no flow is active.

```
sdd-forge flow get status
```

#### sdd-forge flow get issue \<number\>

Fetches a GitHub issue's `title`, `body`, `labels`, and `state` via the `gh` CLI and returns the result as a JSON envelope. Returns a `GH_ERROR` envelope on failure.

```
sdd-forge flow get issue 42
```

#### sdd-forge flow get check \<target\>

Checks a specific prerequisite condition and returns a JSON envelope with `pass`, `summary`, and a per-check details array. Valid targets: `impl` (gate and test steps done or skipped), `finalize` (implement step done or skipped), `dirty` (working tree has no uncommitted changes), `gh` (GitHub CLI is available).

```
sdd-forge flow get check impl
sdd-forge flow get check dirty
sdd-forge flow get check gh
```

#### sdd-forge flow run prepare-spec

Creates the feature branch or git worktree and initializes `specs/<NNN>-<slug>/spec.md` and `specs/<NNN>-<slug>/qa.md` from templates. The three-digit index is determined automatically from existing spec directories and `feature/NNN-*` branches. Registers the new flow in the active-flow index and initializes `flow.json` with `approach`, `branch`, and `spec` steps marked as done.

```
sdd-forge flow run prepare-spec --title "Add user authentication"
sdd-forge flow run prepare-spec --title "Refactor API layer" --base main --worktree
```

| Option | Description |
|---|---|
| `--title` | Feature title (required); converted to a URL-safe branch name slug |
| `--base` | Base branch (defaults to current HEAD) |
| `--worktree` | Create a git worktree instead of a local branch |
| `--no-branch` | Spec-only mode: no branch or worktree is created |
| `--dry-run` | Preview without executing |

#### sdd-forge flow run gate

Validates `spec.md` for completeness and guardrail compliance. Text checks detect unresolved tokens (`TBD`, `TODO`, `FIXME`, `[NEEDS CLARIFICATION]`), unchecked task items, and missing required sections (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`). In `post` phase, also verifies that `## User Confirmation` contains `- [x] User approved this spec`. The optional AI guardrail check evaluates the spec against loaded guardrail articles. Returns a JSON envelope.

```
sdd-forge flow run gate
sdd-forge flow run gate --spec specs/042-feature/spec.md --phase post
sdd-forge flow run gate --skip-guardrail
```

| Option | Description |
|---|---|
| `--spec` | Path to `spec.md` (auto-resolved from active flow if omitted) |
| `--phase` | `pre` (default) or `post` |
| `--skip-guardrail` | Skip the AI guardrail compliance check |

#### sdd-forge flow run impl-confirm

Summarizes requirement completion status from the active flow state. Reports total, done, pending, and in-progress counts. In `detail` mode, also lists files changed since the base branch via `git diff`. Sets `next` to `review` when all requirements are done or none are tracked, otherwise to `fix`.

```
sdd-forge flow run impl-confirm
sdd-forge flow run impl-confirm --mode detail
```

#### sdd-forge flow run lint

Runs guardrail lint pattern checks against all files modified since the base branch. Loads lint rules from merged guardrail articles. Reports each violation with the article name, file path, line number, and matched text. Returns a JSON envelope with `pass`/`fail` status.

```
sdd-forge flow run lint
sdd-forge flow run lint --base main
```

#### sdd-forge flow run finalize

Orchestrates the end-of-flow pipeline across five steps: (1) `commit` — stages all changes and commits, (2) `merge` — squash-merges or creates a PR via `gh`, (3) `sync` — runs `sdd-forge docs build` and commits documentation changes (skipped on PR route), (4) `cleanup` — removes the feature branch and/or worktree, (5) `record` — placeholder for completion recording. Use `--mode all` to run all steps or `--mode select --steps 1,2` to run specific steps. Returns a JSON envelope with per-step results.

```
sdd-forge flow run finalize --mode all
sdd-forge flow run finalize --mode select --steps 1,2 --merge-strategy pr
sdd-forge flow run finalize --mode all --dry-run
```

| Option | Description |
|---|---|
| `--mode` | `all` or `select` (required) |
| `--steps` | Comma-separated step numbers for `select` mode (1=commit, 2=merge, 3=sync, 4=cleanup, 5=record) |
| `--merge-strategy` | `squash`, `pr`, or `auto` (default; uses PR when `commands.gh=enable` and `gh` is available) |
| `--message` | Custom commit message for the commit step |
| `--dry-run` | Preview all steps without executing |
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Exit Code | Constant | Meaning |
|---|---|---|
| `0` | `EXIT_SUCCESS` | Command completed successfully |
| `1` | `EXIT_ERROR` | Command failed due to an error, missing input, or a validation failure |

All diagnostic messages — errors, warnings, and pipeline progress logs — are written to **stderr**. Generated file content printed in `--dry-run` mode is written to **stdout**. Structured results from `flow get` and `flow run` commands are emitted as JSON envelopes to **stdout** via the `output()` helper in `lib/flow-envelope.js`. The `docs review` command exits with code `1` and writes each individual failure reason to stdout. Commands that invoke an AI agent print periodic dot indicators to stderr during the call unless `--verbose` is active.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
