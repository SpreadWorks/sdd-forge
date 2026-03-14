# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge is configured primarily through a single JSON file (`.sdd-forge/config.json`) that controls output languages, document style, AI agent providers, scan scope, and flow behavior. Preset definitions in `src/presets/{key}/preset.json` supply architecture-specific defaults, and two runtime environment variables allow the work directory and source root to be separated for multi-project setups.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Defines output languages, operating language, project type, document style, AI providers, scan scope, concurrency limits, and flow behavior. Created by `sdd-forge setup` and validated on every command run. |
| `preset.json` | `src/presets/{key}/preset.json` | Preset manifest for each built-in architecture (base, node-cli, cakephp2, laravel, symfony, library). Declares label, aliases, default scan patterns, and chapter ordering. Auto-discovered at startup by `src/lib/presets.js`. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Generated output from `sdd-forge scan`. Consumed by subsequent pipeline steps (`enrich`, `data`, `text`). Not hand-edited. |
| `config.example.json` | `src/templates/config.example.json` | Bundled reference template copied to the project during `sdd-forge setup`. |
| `review-checklist.md` | `src/templates/review-checklist.md` | Bundled checklist template used by `sdd-forge review`. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

All fields are read from `.sdd-forge/config.json`. Validation is performed by `validateConfig()` in `src/lib/types.js` on every command invocation.

**Top-level fields**

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `output` | Required | object | — | Output language configuration. Must contain at least `languages` and `default`. |
| `output.languages` | Required | string[] | — | List of languages to generate documentation in (e.g. `["en"]`, `["en", "ja"]`). Must be non-empty. |
| `output.default` | Required | string | — | Default output language. Must be one of the values in `output.languages`. |
| `output.mode` | Optional | `"translate"` \| `"generate"` | — | How non-default languages are produced. `"translate"` post-processes the default-language output; `"generate"` produces each language independently. |
| `lang` | Required | string | — | Operating language for CLI messages, AGENTS.md, skills, and spec files (e.g. `"en"`, `"ja"`). |
| `type` | Required | string | — | Project architecture type. Accepts preset keys (`"cakephp2"`, `"laravel"`, `"symfony"`) or canonical paths (`"webapp/cakephp2"`, `"cli"`, `"library"`). Aliases are resolved via `TYPE_ALIASES` in `src/lib/types.js`. |
| `limits` | Optional | object | — | Resource limit settings. |
| `limits.concurrency` | Optional | number | `5` | Maximum number of files processed in parallel during AI fill steps. Resolved by `resolveConcurrency()` in `src/lib/config.js`. |
| `limits.agentTimeout` | Optional | number | — | Per-agent invocation timeout in seconds. |
| `documentStyle` | Optional | object | — | Controls the tone and purpose of generated documentation. |
| `documentStyle.purpose` | Required if `documentStyle` present | string | — | Intended use of the document: `"developer-guide"`, `"user-guide"`, `"api-reference"`, or a free-form string. |
| `documentStyle.tone` | Required if `documentStyle` present | string | — | Writing tone: `"polite"`, `"formal"`, or `"casual"`. |
| `documentStyle.customInstruction` | Optional | string | — | Additional free-text instruction appended to every AI prompt for this project. |
| `textFill` | Optional | object | — | Settings for the `text` command's AI fill step. |
| `textFill.projectContext` | Optional | string | — | A short paragraph describing the project, injected into AI prompts to provide additional context. |
| `textFill.preamblePatterns` | Optional | object[] | — | List of regex patterns (`{ pattern, flags }`) used to strip unwanted preamble text from AI output. |
| `defaultAgent` | Optional | string | — | Key of the AI provider to use when none is specified on the command line. Must match a key in `providers`. |
| `providers` | Optional | object | — | Map of named AI agent definitions. Each key becomes a selectable agent name. |
| `providers.{name}.command` | Required per provider | string | — | Executable to invoke (e.g. `"claude"`). |
| `providers.{name}.args` | Required per provider | string[] | — | Command arguments. The placeholder `{{PROMPT}}` in any argument is replaced with the prompt text at runtime. |
| `providers.{name}.timeoutMs` | Optional per provider | number | — | Per-invocation timeout in milliseconds, overriding `limits.agentTimeout` for this provider. |
| `providers.{name}.systemPromptFlag` | Optional per provider | string | — | Flag name used to pass a system prompt (e.g. `"--system-prompt"`). |
| `chapters` | Optional | string[] | — | Project-specific chapter ordering, overriding the preset's default `chapters` array. Each entry is a chapter filename without extension. |
| `agentWorkDir` | Optional | string | — | Absolute path to use as the working directory when spawning agent subprocesses. |
| `scan` | Optional | object | — | Overrides the preset's default scan configuration. |
| `scan.include` | Required if `scan` present | string[] | — | Glob patterns for source files to include in the scan. Must be non-empty. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from the scan. |
| `flow` | Optional | object | — | Settings for the `sdd-forge flow` SDD automation command. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy used when closing a spec branch. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**Output language and multi-language mode**

The `output` block controls which languages documentation is generated in. Setting `output.mode` to `"translate"` generates the default language first and then derives additional languages from it, reducing AI token usage.

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**Document style**

`documentStyle` customizes the tone and focus of every AI-generated paragraph. The `customInstruction` field is particularly useful for injecting project-specific conventions.

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "Always include a usage example at the end of each section."
}
```

**AI agent provider**

Custom AI agents are registered under `providers`. Any executable that accepts a prompt and writes to stdout can be used. The `{{PROMPT}}` placeholder in `args` is substituted with the actual prompt text at invocation time.

```json
"defaultAgent": "claude",
"providers": {
  "claude": {
    "command": "claude",
    "args": ["-p", "{{PROMPT}}"],
    "timeoutMs": 120000
  }
}
```

**Concurrency limit**

`limits.concurrency` controls how many files are processed in parallel during the `text` and `forge` commands. Lower values reduce memory and API rate-limit pressure on large projects.

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 90
}
```

**Chapter ordering**

The `chapters` array defines the order in which documentation chapters are generated. It overrides the preset's default order. Each entry is the chapter filename without extension.

```json
"chapters": ["overview", "configuration", "cli_commands", "data_model", "security"]
```

**Scan scope**

If the preset's default scan patterns do not match the project's directory layout, `scan.include` and `scan.exclude` can be set to override them. Patterns follow standard glob syntax.

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__mocks__/**"]
}
```

**Flow merge strategy**

`flow.merge` determines how spec branches are integrated when `sdd-forge flow` closes a spec. `"squash"` produces a single clean commit; `"ff-only"` requires a linear history; `"merge"` creates an explicit merge commit.

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

Two environment variables influence how sdd-forge resolves its working paths at runtime. Both are read in `src/lib/cli.js` by the `repoRoot()` and `sourceRoot()` functions. They are primarily set automatically by the CLI entry point (`src/sdd-forge.js`) based on the registered project configuration, but can also be set manually to override path resolution in custom or CI environments.

| Variable | Function | Purpose |
|----------|----------|---------|
| `SDD_WORK_ROOT` | `repoRoot()` | Root directory that contains `.sdd-forge/` and `docs/`. When set, `repoRoot()` returns this path directly, bypassing `git rev-parse --show-toplevel`. Use this when the sdd-forge work directory is not the same as the git repository root. |
| `SDD_SOURCE_ROOT` | `sourceRoot()` | Root directory of the source code being analyzed. When set, `sourceRoot()` returns this path instead of falling back to `repoRoot()`. Use this when the target project's source tree is separate from the directory containing `.sdd-forge/`. |

**Resolution order for `repoRoot()`:**
1. `SDD_WORK_ROOT` environment variable (if set)
2. `git rev-parse --show-toplevel` (git repository root)
3. `process.cwd()` (current working directory, last resort)

**Resolution order for `sourceRoot()`:**
1. `SDD_SOURCE_ROOT` environment variable (if set)
2. `repoRoot()` (falls back to the work root)

One additional environment variable is handled internally during agent invocation in `src/lib/agent.js`: the `CLAUDECODE` variable is explicitly removed from the environment passed to agent subprocesses, preventing the Claude CLI's own session context from leaking into subordinate agent calls. This behavior is automatic and requires no user configuration.
<!-- {{/text}} -->
