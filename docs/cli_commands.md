<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter covers the complete CLI reference for `sdd-forge`, which provides 7 top-level commands — `help`, `setup`, `upgrade`, `presets`, `docs`, `flow`, and `check` — with over 40 subcommands organized into three major subcommand groups (`docs`, `flow`, and `check`). The `docs` and `flow` groups follow a hierarchical dispatch pattern, while `setup`, `upgrade`, `presets`, and `help` operate as standalone commands.
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key Options / Flags |
|---|---|---|
| `help` | Display available commands organized by section | — |
| `setup` | Interactive project setup wizard | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | Upgrade template-derived files (skills, AGENTS.md, config) | `--dry-run` |
| `presets list` | Display the preset inheritance tree | — |
| `docs build` | Run the full docs pipeline (scan → enrich → init → data → text → readme → agents → translate) | `--force`, `--regenerate`, `--verbose`, `--dry-run`, `--agent` |
| `docs scan` | Scan source code and generate `analysis.json` | `--stdout`, `--dry-run`, `--reset` |
| `docs enrich` | AI-enrich analysis entries with summary, chapter, and role metadata | `--stdout`, `--dry-run`, `--agent` |
| `docs init` | Initialize `docs/` from preset templates | `--force`, `--dry-run` |
| `docs data` | Process `{{data}}` directives in templates | `--dry-run` |
| `docs text` | Process `{{text}}` directives using AI generation | `--verbose`, `--dry-run`, `--force` |
| `docs readme` | Generate `README.md` from the docs structure | — |
| `docs agents` | Generate `AGENTS.md` / `CLAUDE.md` | — |
| `docs review` | Run an AI code review of documentation | — |
| `docs changelog` | Generate `CHANGELOG.md` | — |
| `docs translate` | Translate documentation to all configured languages | — |
| `docs snapshot` | Create documentation snapshots | — |
| `docs forge` | Auto-format and validate markdown files | — |
| `flow prepare` | Initialize spec and create a branch or worktree | `--title`, `--base`, `--issue`, `--request`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow resume` | Discover and resume an active flow session | — |
| `flow get status` | Return current flow state as JSON | — |
| `flow get resolve-context` | Resolve worktree and repository paths | — |
| `flow get check <target>` | Check a named condition (`dirty`, `gh`, `impl`, `finalize`) | — |
| `flow get prompt <kind>` | Return a prompt template by kind | — |
| `flow get qa-count` | Count answered questions in the draft phase | — |
| `flow get guardrail <phase>` | Return guardrail rules for a phase (`draft`, `pre`, `post`, `impl`) | `--format json` |
| `flow get issue <number>` | Fetch GitHub issue content | — |
| `flow get context [path]` | List analysis entries or retrieve file content | `--raw`, `--search` |
| `flow set step <id> <status>` | Update the status of a workflow step | — |
| `flow set request "<text>"` | Set the user request on the active flow | — |
| `flow set issue <number>` | Associate a GitHub issue number with the flow | — |
| `flow set note "<text>"` | Append a note to the flow state | — |
| `flow set summary '<json>'` | Set the requirements list from a JSON array | — |
| `flow set req <index> <status>` | Update the status of a single requirement | — |
| `flow set metric <phase> <counter>` | Increment a metric counter (`question`, `redo`, `docsRead`, `srcRead`) | — |
| `flow set issue-log` | Record an issue log entry | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `flow set auto on\|off` | Enable or disable autoApprove mode | — |
| `flow set test-summary` | Set test result counts | `--unit`, `--integration`, `--acceptance` |
| `flow run gate` | Run a gate check against guardrail rules | `--spec`, `--phase`, `--skip-guardrail` |
| `flow run review` | Run an AI code review | `--phase`, `--dry-run`, `--skip-confirm` |
| `flow run impl-confirm` | Check implementation readiness | `--mode` (`overview`\|`detail`) |
| `flow run finalize` | Execute the finalization pipeline (commit → merge → sync → cleanup) | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
| `flow run sync` | Sync documentation (build → review → add → commit) | `--dry-run` |
| `flow run lint` | Check changed files against guardrail patterns | `--base` |
| `flow run retro` | Evaluate spec accuracy after implementation | `--force`, `--dry-run` |
| `flow run report` | Generate a work report from flow state | `--dry-run` |
| `check config` | Validate `config.json` | — |
| `check freshness` | Check documentation freshness against source code | — |
| `check scan` | Check the results of a prior scan | — |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Short | Scope | Description |
|---|---|---|---|
| `--help` | `-h` | All commands | Display help text for the command and exit |
| `--version` | `-v`, `-V` | Top-level only | Display the installed package version and exit |
| `--dry-run` | — | Most subcommands | Simulate the operation without writing any files or making external calls |

Two environment variables also apply globally across all commands:

| Variable | Description |
|---|---|
| `SDD_FORGE_WORK_ROOT` | Override the work root directory (default: git repository root) |
| `SDD_FORGE_SOURCE_ROOT` | Override the source root directory (default: same as work root) |

Argument parsing is handled by an internal `parseArgs(argv, spec)` utility located in `src/lib/cli.js`. It converts kebab-case flags to camelCase properties (`--dry-run` → `dryRun`), applies defaults defined per-command, and raises an error on unrecognised options. The `--` separator is supported to stop option parsing.
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `help`

Displays the full command list organized into sections (Project, Docs, Flow, Info). Output is sent to stdout with ANSI formatting (bold command names, dim descriptions).

```
sdd-forge help
sdd-forge          # same as help when no subcommand is given
```

#### `setup`

Runs an interactive project setup wizard that creates `.sdd-forge/config.json`, generates `AGENTS.md`, and creates a `CLAUDE.md` symlink. When all required options are passed on the command line the wizard skips interactive prompts.

```
sdd-forge setup
sdd-forge setup --name my-project --type hono --lang en --agent claude
sdd-forge setup --dry-run
```

| Option | Description |
|---|---|
| `--name <name>` | Project name |
| `--path <path>` | Path to the project root |
| `--work-root <path>` | Work root directory |
| `--type <preset>` | Preset type (e.g. `hono`, `nextjs`) |
| `--purpose <text>` | Project purpose for docs style |
| `--tone <text>` | Writing tone for docs style |
| `--agent <name>` | Default AI agent name |
| `--lang <code>` | Default documentation language |
| `--dry-run` | Preview changes without writing files |

#### `upgrade`

Detects template-derived files that have changed in the installed package (skills under `.claude/skills/` and `.agents/skills/`, AGENTS.md SDD section, `config.json` format) and updates only the files that differ.

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### `presets list`

Prints the preset inheritance tree showing all available preset types and their parent chains.

```
sdd-forge presets list
sdd-forge presets        # defaults to list
```

#### `docs build`

Runs the complete documentation pipeline in sequence: `scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate`. Individual steps can be skipped via flags.

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --agent claude --dry-run
```

| Option | Description |
|---|---|
| `--force` | Overwrite existing generated content |
| `--regenerate` | Force regeneration even when content is current |
| `--verbose` | Print detailed progress for each step |
| `--agent <name>` | AI agent to use for enrichment and text generation |
| `--dry-run` | Preview pipeline without writing files |

#### `docs scan`

Scans the source tree and writes the result to `.sdd-forge/output/analysis.json`. Pass `--stdout` to print JSON to stdout instead.

```
sdd-forge docs scan
sdd-forge docs scan --stdout
sdd-forge docs scan --reset
```

#### `docs enrich`

Sends analysis entries to the configured AI agent and adds `summary`, `chapter`, and `role` fields. Results are merged back into `analysis.json`.

```
sdd-forge docs enrich
sdd-forge docs enrich --agent claude --dry-run
```

#### `docs init`

Initializes the `docs/` directory by copying preset templates. Existing files are not overwritten unless `--force` is given.

```
sdd-forge docs init
sdd-forge docs init --force
```

#### `docs data`

Processes all `{{data}}` directives in template files, replacing them with structured data extracted from `analysis.json`.

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### `docs text`

Sends `{{text}}` directives to the AI agent and writes the generated markdown back into the template files. Use `--force` to regenerate sections that already have content.

```
sdd-forge docs text
sdd-forge docs text --force --verbose
sdd-forge docs text --dry-run
```

#### `docs readme`

Generates `README.md` at the repository root from the current docs structure and preset configuration.

```
sdd-forge docs readme
```

#### `docs agents`

Generates or updates `AGENTS.md` (and the `CLAUDE.md` symlink) with SDD section content derived from the current docs and configuration.

```
sdd-forge docs agents
```

#### `docs review`

Runs an AI review pass over the generated documentation and prints findings to stdout.

```
sdd-forge docs review
```

#### `docs changelog`

Generates `CHANGELOG.md` from commit history and flow metadata.

```
sdd-forge docs changelog
```

#### `docs translate`

Translates all documentation files into the languages declared in `config.json` under `docs.languages`.

```
sdd-forge docs translate
```

#### `docs snapshot`

Creates a point-in-time snapshot of the current documentation set.

```
sdd-forge docs snapshot
```

#### `docs forge`

Auto-formats and validates markdown files in the `docs/` directory, enforcing consistent structure.

```
sdd-forge docs forge
```

#### `flow prepare`

Initializes a new Spec-Driven Development flow: creates a spec file, optionally creates a git branch or worktree, and records the request in flow state.

```
sdd-forge flow prepare --request "Add user authentication"
sdd-forge flow prepare --issue 42 --worktree
sdd-forge flow prepare --title "auth-feature" --base main --no-branch
```

| Option | Description |
|---|---|
| `--request <text>` | Free-text description of the feature or fix |
| `--issue <number>` | GitHub issue number to link |
| `--title <name>` | Branch / worktree name |
| `--base <branch>` | Base branch to branch from (default: main) |
| `--worktree` | Create a git worktree instead of a branch |
| `--no-branch` | Skip branch creation |
| `--dry-run` | Preview without creating files or branches |

#### `flow resume`

Locates an active flow session in the repository (including worktrees) and prints its state.

```
sdd-forge flow resume
```

#### `flow get <key>`

Reads a value from the active flow state and prints a JSON envelope to stdout.

```
sdd-forge flow get status
sdd-forge flow get context src/lib/cli.js --raw
sdd-forge flow get context --search "parseArgs"
sdd-forge flow get guardrail draft --format json
sdd-forge flow get check dirty
sdd-forge flow get issue 42
```

Available keys: `status`, `resolve-context`, `check <target>`, `prompt <kind>`, `qa-count`, `guardrail <phase>`, `issue <number>`, `context [path]`.

#### `flow set <key>`

Writes a value to the active flow state and prints a JSON envelope confirming success.

```
sdd-forge flow set step spec done
sdd-forge flow set request "Add OAuth support"
sdd-forge flow set note "Decided to use JWT"
sdd-forge flow set metric draft question
sdd-forge flow set auto on
sdd-forge flow set test-summary --unit 42 --integration 8
```

#### `flow run <action>`

Executes a flow action and prints a JSON envelope with the result.

```
sdd-forge flow run gate --phase pre
sdd-forge flow run finalize --merge-strategy squash
sdd-forge flow run finalize --mode select --steps 1,2
sdd-forge flow run lint --base main
sdd-forge flow run retro --force
sdd-forge flow run report --dry-run
```

| Action | Description |
|---|---|
| `gate` | Run a guardrail gate check for the given `--phase` |
| `review` | Run an AI code review |
| `impl-confirm` | Confirm implementation readiness (`--mode overview\|detail`) |
| `finalize` | Commit → merge → sync → cleanup pipeline |
| `sync` | Build and commit updated docs |
| `lint` | Check changed files against guardrail patterns |
| `retro` | Evaluate spec accuracy post-implementation |
| `report` | Generate a work report from flow state |

#### `check config`

Validates `.sdd-forge/config.json` against the current schema and reports any errors or deprecated fields.

```
sdd-forge check config
```

#### `check freshness`

Compares modification timestamps of source files with generated documentation files to detect stale docs.

```
sdd-forge check freshness
```

#### `check scan`

Validates the contents of `.sdd-forge/output/analysis.json` and reports missing or malformed entries.

```
sdd-forge check scan
```
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

**Exit Codes**

| Code | Constant | Meaning |
|---|---|---|
| `0` | `EXIT_SUCCESS` | The command completed successfully |
| `1` | `EXIT_ERROR` | The command encountered a fatal error |

Exit codes are defined in `src/lib/exit-codes.js`. Commands use `process.exit(EXIT_ERROR)` for immediate termination on fatal errors, or set `process.exitCode` (without calling `process.exit`) so that any registered cleanup hooks can complete before the process exits.

**Standard Output (stdout)**

| Scenario | Format |
|---|---|
| `help` and top-level info | Plain text with ANSI formatting (bold, dim) |
| `--version` | Plain version string |
| `docs` command output | Human-readable progress text |
| All `flow` commands | JSON envelope (see below) |

**Standard Error (stderr)**

| Scenario | Format |
|---|---|
| Fatal errors | Plain text error message |
| Usage hints | Plain text |
| Warnings | Plain text prefixed with warning context |

**Flow Command JSON Envelope**

All `flow get`, `flow set`, and `flow run` commands write a structured JSON envelope to stdout:

```json
{
  "ok": true,
  "type": "get",
  "key": "status",
  "data": { ... },
  "errors": [
    {
      "level": "fatal",
      "code": "MACHINE_READABLE_CODE",
      "messages": ["Human-readable description"]
    }
  ]
}
```

`ok` is `true` on success and `false` on failure. The process exit code mirrors this value: `0` when `ok` is `true`, `1` when `ok` is `false`. The `errors` array is empty on success and contains one or more entries on failure, each with a `level` of `"fatal"` or `"warn"`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
