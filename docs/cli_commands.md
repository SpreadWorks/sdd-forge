<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/cli_commands.md) | **English**
<!-- {{/data}} -->

# CLI Command Reference

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure."})}} -->

This chapter documents 8 CLI entrypoints and routed commands in the analyzed files: `setup`, `check`, `check freshness`, `docs`, `docs build`, `docs changelog`, `docs readme`, and `docs translate`. The command structure is hierarchical, with dispatcher commands (`check`, `docs`) forwarding to subcommands, while `docs build` runs a multi-step pipeline (scan, enrich, init, data, text, readme, agents, and optional translate).
<!-- {{/text}} -->

## Content

### Command List

<!-- {{text({prompt: "List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.", mode: "deep"})}} -->

| Command | Description | Key options |
| --- | --- | --- |
| `sdd-forge setup` | Initializes an SDD project, creates baseline directories/files, and writes config. | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run`, help |
| `sdd-forge check` | Dispatcher for check subcommands. | `-h`, `--help` |
| `sdd-forge check freshness` | Compares source/docs mtimes and reports `fresh`, `stale`, or `never-built`. | `--format <text|json>`, `-h`, `--help` |
| `sdd-forge check config` | Routed subcommand listed by `check` dispatcher. | Use `sdd-forge check config --help` |
| `sdd-forge check scan` | Routed subcommand listed by `check` dispatcher. | Use `sdd-forge check scan --help` |
| `sdd-forge docs` | Dispatcher for docs subcommands. | `-h`, `--help` |
| `sdd-forge docs build` | Composite docs pipeline runner with progress logging and optional translation step. | `--force`, `--regenerate`, `--verbose`, `--dry-run`, `-h`, `--help` |
| `sdd-forge docs changelog [output]` | Generates changelog markdown from `specs/` metadata. | `--dry-run`, help |
| `sdd-forge docs readme` | Generates/updates README from templates and directives. | `--lang`, `--output`, `--dry-run`, `-h`, `--help` |
| `sdd-forge docs translate` | Translates docs/README to configured target languages. | `--lang`, `--force`, `--dry-run`, `-h`, `--help` |
| `sdd-forge docs <scan|enrich|init|data|text|forge|review|agents>` | Additional routed docs subcommands exposed by dispatcher. | Use `sdd-forge docs <command> --help` |
<!-- {{/text}} -->

### Global Options

<!-- {{text({prompt: "Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.", mode: "deep"})}} -->

| Option | Scope in analyzed commands | Behavior |
| --- | --- | --- |
| `-h`, `--help` | `check`, `check freshness`, `docs`, `docs build`, `docs changelog`, `docs readme`, `docs translate` (and parseArgs-based setup flow) | Prints usage/help text and exits without running normal command work. |
| *(none beyond help)* | All analyzed commands | No other option is universally shared across every analyzed command; feature flags are command-specific. |
<!-- {{/text}} -->

### Command Details

<!-- {{text({prompt: "Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.", mode: "deep"})}} -->

#### `sdd-forge setup`
Usage: `sdd-forge setup [options]`; options include `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run`; example: `sdd-forge setup --name my-project --path . --lang en`.
#### `sdd-forge check`
Usage: `sdd-forge check <command>`; available routed commands are `config`, `freshness`, `scan`; examples: `sdd-forge check --help`, `sdd-forge check freshness --format json`.
#### `sdd-forge check freshness`
Usage: `sdd-forge check freshness [options]`; options: `--format <text|json>`, `-h`, `--help`; examples: `sdd-forge check freshness`, `sdd-forge check freshness --format json`.
#### `sdd-forge docs`
Usage: `sdd-forge docs <command>`; available commands include `build`, `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `changelog`, `agents`, `translate`; example: `sdd-forge docs readme --help`.
#### `sdd-forge docs build`
Usage: `sdd-forge docs build [--force] [--regenerate] [--verbose] [--dry-run]`; runs pipeline steps and optional translation based on output config; examples: `sdd-forge docs build --verbose`, `sdd-forge docs build --dry-run --force`.
#### `sdd-forge docs changelog`
Usage: `sdd-forge docs changelog [output_path] [--dry-run]`; default output is `docs/change_log.md`; examples: `sdd-forge docs changelog`, `sdd-forge docs changelog docs/custom_change_log.md --dry-run`.
#### `sdd-forge docs readme`
Usage: `sdd-forge docs readme [--lang <code>] [--output <path>] [--dry-run]`; updates root `README.md` or a custom target path; examples: `sdd-forge docs readme --dry-run`, `sdd-forge docs readme --output docs/ja/README.md`.
#### `sdd-forge docs translate`
Usage: `sdd-forge docs translate [--lang <code>] [--force] [--dry-run]`; translates chapter files and optional README for configured multi-language output; examples: `sdd-forge docs translate --lang ja`, `sdd-forge docs translate --force`.
<!-- {{/text}} -->

### Exit Codes and Output

<!-- {{text({prompt: "Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.", mode: "deep"})}} -->

| Context | Exit code behavior | Stdout / Stderr convention |
| --- | --- | --- |
| `sdd-forge check` help with subcommand missing | Exits `1` when no subcommand is provided; exits `0` when `-h/--help` is explicitly requested. | Usage/help is printed to stderr. |
| `sdd-forge check` unknown subcommand | Exits with `EXIT_ERROR`. | Error message and help hint are printed to stderr. |
| `sdd-forge check freshness` | `0` when result is `fresh`; `EXIT_ERROR` when result is `stale` or `never-built`; `EXIT_ERROR` for invalid `--format`. | Normal result lines go to stdout (`text` or JSON). Truncation warnings and format errors are written to stderr. |
| `sdd-forge docs` help/dispatch | Exits `1` when no subcommand is provided; exits `0` for explicit help. | Usage/help is printed to stderr. |
| `sdd-forge docs build` visible error path | Exits with `EXIT_ERROR` when `--regenerate` is used but no chapter files exist in `docs/`. | Error is printed to stderr; progress/info logs are emitted during pipeline execution. |
| `sdd-forge docs changelog` | No explicit nonzero exit in shown flow; command writes file or prints dry-run output. | Generated content goes to stdout in dry-run mode; status messages are logged (including generated path). |
| `sdd-forge docs readme` / `docs translate` / `setup` | `readme` has no explicit `process.exit` in shown path; `translate` throws on unrecoverable setup errors; `setup` is described as using standardized failure exit handling. | `readme` and `translate` use logger/stdout messages for normal progress; errors are surfaced as command failures in their execution path. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Project Structure](project_structure.md) | [Configuration and Customization →](configuration.md)
<!-- {{/data}} -->
