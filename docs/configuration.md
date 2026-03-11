# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

This chapter describes the configuration files that sdd-forge reads and the full range of options available for tailoring its behavior to your project. Configurable areas include output languages, document style, AI agent providers, parallel processing limits, and SDD flow settings.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and validated on every command run via `loadConfig()`. Required before most sdd-forge commands can execute. |
| `projects.json` | `.sdd-forge/projects.json` | Multi-project registry. Maps project names to source paths and optional work roots. Read by `resolveProject()` to determine which project is active. Created and updated by `sdd-forge setup`. |
| `package.json` | `<repo-root>/package.json` | Read for package metadata (e.g. project name, version) via `loadPackageField()`. Not modified by sdd-forge. |
| `preset.json` | `src/presets/<key>/preset.json` | Preset manifests bundled with sdd-forge. Discovered automatically at startup and used to resolve the `type` field in `config.json`. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

The table below covers every field accepted by `.sdd-forge/config.json`. Fields marked **Required** must be present; missing or invalid values cause `validateConfig()` to throw with a consolidated error message listing all violations.

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `output` | Required | object | — | Top-level output configuration block. |
| `output.languages` | Required | string[] | — | Non-empty list of output languages (e.g. `["ja"]` or `["en", "ja"]`). |
| `output.default` | Required | string | — | The primary output language. Must be one of the values in `output.languages`. |
| `output.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How non-default language docs are produced: `"translate"` delegates to a translation step; `"generate"` runs AI generation independently for each language. |
| `lang` | Required | string | `"en"` | Operating language for CLI messages, AGENTS.md, skill files, and spec documents. Falls back to `"en"` when the file is missing or unparseable (used by `loadLang()`). |
| `type` | Required | string | — | Project type identifier. Accepts canonical paths (e.g. `"webapp/cakephp2"`) or registered aliases (e.g. `"cakephp2"`). Resolved via `TYPE_ALIASES` from `buildTypeAliases()`. |
| `limits.agentTimeout` | Optional | number | — | Maximum time in **seconds** to wait for a single AI agent call before aborting. |
| `limits.concurrency` | Optional | number | `5` | Number of files processed in parallel during scan and text-fill phases. Resolved by `resolveConcurrency()`; falls back to `DEFAULT_CONCURRENCY = 5`. |
| `documentStyle.purpose` | Optional | string | — | Intended audience and style of the generated docs. Accepted values include `"developer-guide"`, `"user-guide"`, and `"api-reference"`, or any custom string. |
| `documentStyle.tone` | Optional | string | — | Writing register applied to AI-generated text. Must be one of `"polite"`, `"formal"`, or `"casual"`. |
| `documentStyle.customInstruction` | Optional | string | — | Freeform additional instructions appended to AI prompts during `text` and `forge` phases. |
| `defaultAgent` | Optional | string | — | Name key of the provider in `providers` to use when no `--agent` flag is supplied. |
| `providers.<key>.command` | Conditionally required | string | — | Executable to invoke for this agent provider (e.g. `"claude"`). Required when the `providers` block is present. |
| `providers.<key>.args` | Conditionally required | string[] | — | Arguments passed to the provider command. The placeholder `{{PROMPT}}` is substituted with the actual prompt at runtime. |
| `providers.<key>.timeoutMs` | Optional | number | — | Per-provider timeout in milliseconds. Takes precedence over `limits.agentTimeout` for this provider. |
| `providers.<key>.systemPromptFlag` | Optional | string | — | Flag used to pass a system prompt to the provider CLI (e.g. `"--system-prompt"`). |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy applied when `sdd-flow-close` merges a feature branch back to base. |
| `chapters` | Optional | string[] | — | Project-level override for the chapter file order in `docs/`. Entries are chapter filenames without extension. Overrides the order defined in the preset's `preset.json`. |
| `agentWorkDir` | Optional | string | — | Working directory set for agent subprocess execution. Useful when the agent CLI must be run from a specific path. |
| `textFill.projectContext` | Optional | string | — | Free-text project description injected into AI prompts to provide additional context during `text` and `forge` phases. |
| `textFill.preamblePatterns` | Optional | object[] | — | List of regex patterns (each with `pattern` and optional `flags` fields) used to strip unwanted prefixes from AI-generated output. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**Document style**

Control the tone and focus of all AI-generated documentation via `documentStyle`. The `purpose` field steers the framing of every chapter; `tone` adjusts formality; `customInstruction` appends arbitrary guidance to every AI call.

```json
"documentStyle": {
  "purpose": "developer-guide",
  "tone": "formal",
  "customInstruction": "Always include concrete code examples where relevant."
}
```

**AI agent provider**

sdd-forge delegates all LLM calls to an external CLI command. Define one or more providers under `providers` and set `defaultAgent` to select the default. The `{{PROMPT}}` placeholder in `args` is replaced with the generated prompt at runtime.

```json
"defaultAgent": "claude",
"providers": {
  "claude": {
    "command": "claude",
    "args": ["--print", "{{PROMPT}}"],
    "timeoutMs": 120000
  }
}
```

**Output languages**

Declare all languages docs should be produced in. Set `output.default` to the primary language. When `output.mode` is `"translate"`, the default-language docs are translated; `"generate"` runs AI generation independently for each language.

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**Chapter order**

Override the chapter sequence from the preset by listing chapter filenames (without extension) in the `chapters` array. Only the chapters listed will be included, in the order given.

```json
"chapters": ["overview", "architecture", "cli_commands", "configuration", "development"]
```

**Concurrency and timeouts**

Tune parallel processing and agent call limits under `limits`. Lowering `concurrency` reduces memory pressure on large codebases; raising `agentTimeout` accommodates slower providers.

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 180
}
```

**SDD flow merge strategy**

Choose how feature branches are merged back to the base branch at the end of an SDD flow. The default `"squash"` condenses the feature history into a single commit.

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

The following environment variables are read or managed by sdd-forge at runtime. They are not set by the user in a `.env` file; they are used internally to pass context between the top-level dispatcher and subcommand implementations.

| Variable | Set by | Read by | Purpose |
|---|---|---|---|
| `SDD_SOURCE_ROOT` | `src/sdd-forge.js` | `src/lib/cli.js` | Absolute path to the source code root of the project being analyzed. Set automatically when a project is resolved from `projects.json`. When present, overrides the default path detection in subcommands. |
| `SDD_WORK_ROOT` | `src/sdd-forge.js` | `src/lib/cli.js` | Absolute path to the working directory — the directory that contains `.sdd-forge/` and `docs/`. Set alongside `SDD_SOURCE_ROOT` in project mode. When present, overrides git-based repository root detection. |
| `CLAUDECODE` | — | `src/lib/agent.js` | Explicitly **deleted** from the child process environment before spawning an AI agent subprocess. This prevents the Claude CLI's own session state from leaking into agent invocations. |

In single-project setups (no `projects.json`), `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` are not set, and sdd-forge resolves paths from the current working directory using git root detection instead.
<!-- {{/text}} -->
