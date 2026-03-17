# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->
sdd-forge reads its project-level settings from `.sdd-forge/config.json` and resolves workspace paths through environment variables. Configurable items span documentation output languages and style, AI agent providers and invocation behavior, scan targets, SDD flow merge strategy, concurrency, and chapter ordering.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->
| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Holds all settings for docs generation, agent invocation, scan scope, flow behavior, and more. Loaded and validated by `loadConfig()`. |
| `flow.json` | `.sdd-forge/flow.json` | SDD workflow state persistence. Tracks the current flow's spec path, branches, step progress, requirements, and notes. Managed automatically by flow commands. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Generated output from `sdd-forge scan`. Contains the source code analysis results consumed by downstream commands. |
| `package.json` | Project root | Read to extract project metadata such as `name`, `version`, `engines`, `type`, and dependency information via `loadPackageField()`. |
| `preset.json` | `src/presets/{key}/preset.json` | Preset manifest files. Define parent chain, language layer, chapter order, scan patterns, and aliases for each preset. Discovered automatically at startup. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->
The following fields are defined in `.sdd-forge/config.json`. Validation is performed by `validateConfig()` in `src/lib/types.js`.

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `lang` | **Required** | `string` | — | Operating language for CLI output, AGENTS.md, skills, and specs (e.g. `"en"`, `"ja"`). |
| `type` | **Required** | `string` | — | Project type identifier. Use a preset key or path such as `"webapp/cakephp2"`, `"cli/node-cli"`, or `"laravel"`. Short aliases are resolved automatically. |
| `docs` | **Required** | `object` | — | Documentation output configuration (see sub-fields below). |
| `docs.languages` | **Required** | `string[]` | — | List of output languages (e.g. `["en"]`, `["en", "ja"]`). Must be non-empty. |
| `docs.defaultLanguage` | **Required** | `string` | — | Default output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate" \| "generate"` | `"translate"` | How non-default languages are produced. `"translate"` translates from the default language; `"generate"` generates each language independently. |
| `docs.style` | Optional | `object` | — | Document style settings (see sub-fields below). |
| `docs.style.purpose` | Required if `docs.style` is set | `string` | — | Document purpose (e.g. `"developer-guide"`, `"user-guide"`, `"api-reference"`, or a free-form string). |
| `docs.style.tone` | Required if `docs.style` is set | `"polite" \| "formal" \| "casual"` | — | Writing tone for generated text. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional free-form instructions passed to the AI agent during text generation. |
| `docs.enrichBatchSize` | Optional | `number` | — | Number of entries per batch during the enrich step. |
| `docs.enrichBatchLines` | Optional | `number` | — | Maximum lines per enrich batch. |
| `concurrency` | Optional | `number` | `5` | Maximum number of files processed in parallel. Must be a positive number. |
| `chapters` | Optional | `string[]` | (from preset) | Custom chapter ordering. Overrides the order defined in the preset's `preset.json`. Each entry is a chapter file name without the number prefix (e.g. `"overview"`, `"cli_commands"`). |
| `scan` | Optional | `object` | — | Scan scope configuration. |
| `scan.include` | Required if `scan` is set | `string[]` | — | Glob patterns for files to include in the scan. Must be non-empty. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for files to exclude from the scan. |
| `agent` | Optional | `object` | — | AI agent invocation settings (see sub-fields below). |
| `agent.default` | Optional | `string` | — | Name of the default agent provider (must match a key in `agent.providers`). |
| `agent.workDir` | Optional | `string` | `".tmp"` | Working directory for agent execution, relative to the project root. |
| `agent.timeout` | Optional | `number` | `300` (seconds) | Agent execution timeout in seconds. Must be a positive number. |
| `agent.providers` | Optional | `object` | — | Map of provider name → provider definition. |
| `agent.providers.<name>.command` | Required per provider | `string` | — | Executable command (e.g. `"claude"`). |
| `agent.providers.<name>.args` | Required per provider | `string[]` | — | Command arguments. Use `{{PROMPT}}` as a placeholder for the prompt text. |
| `agent.providers.<name>.systemPromptFlag` | Optional | `string` | — | CLI flag for passing a system prompt (e.g. `"--system-prompt"`). |
| `agent.providers.<name>.timeoutMs` | Optional | `number` | — | Per-provider timeout override in milliseconds. |
| `agent.providers.<name>.profiles` | Optional | `object` | — | Named argument profiles. Each key maps to an array of extra args prepended to the base args. |
| `agent.commands` | Optional | `object` | — | Per-command agent and profile overrides. Keys are dot-separated command IDs (e.g. `"docs.review"`, `"docs"`). |
| `agent.commands.<id>.agent` | Optional | `string` | — | Override agent provider for this command. |
| `agent.commands.<id>.profile` | Optional | `string` | `"default"` | Profile name to use for this command. |
| `flow` | Optional | `object` | — | SDD flow configuration. |
| `flow.merge` | Optional | `"squash" \| "ff-only" \| "merge"` | `"squash"` | Git merge strategy used by the flow merge step. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->
**Document Style and Tone**

Control the writing style of AI-generated documentation by setting `docs.style`. This affects how the `text` command instructs the AI agent.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate",
    "style": {
      "purpose": "developer-guide",
      "tone": "formal",
      "customInstruction": "Use active voice and keep paragraphs under 5 sentences."
    }
  }
}
```

**Multi-Language Output**

Generate documentation in multiple languages by listing them in `docs.languages`. The default language is generated first; additional languages are produced according to `docs.mode` (`"translate"` or `"generate"`).

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Chapter Ordering**

Override the preset's default chapter order with the `chapters` array. Each entry corresponds to a chapter file name (without number prefix).

```json
{
  "chapters": ["overview", "architecture", "configuration", "cli_commands", "data_model"]
}
```

**Scan Scope**

Limit which files are analyzed by specifying `scan.include` and `scan.exclude` glob patterns.

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.ts"],
    "exclude": ["**/*.test.js", "**/node_modules/**"]
  }
}
```

**Agent Provider Configuration**

Define one or more AI agent providers and select the default. Use profiles to vary arguments per command.

```json
{
  "agent": {
    "default": "claude",
    "workDir": ".tmp",
    "timeout": 600,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}", "--output-format", "text"],
        "profiles": {
          "default": [],
          "fast": ["--model", "haiku"]
        }
      }
    },
    "commands": {
      "docs.review": { "agent": "claude", "profile": "fast" },
      "docs.text":   { "agent": "claude", "profile": "default" }
    }
  }
}
```

**Concurrency**

Adjust the number of files processed in parallel. The default is `5`. Increase for faster processing on machines with sufficient resources, or decrease to reduce API rate-limit pressure.

```json
{
  "concurrency": 10
}
```

**Flow Merge Strategy**

Choose the git merge strategy used when completing an SDD flow.

```json
{
  "flow": {
    "merge": "ff-only"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->
| Variable | Purpose | Default Behavior |
|---|---|---|
| `SDD_WORK_ROOT` | Overrides the working root (repository root) path. When set, `repoRoot()` returns this value instead of detecting the git repository root. Used in project mode to point sdd-forge at a specific working directory. | Falls back to `git rev-parse --show-toplevel`, then `process.cwd()`. |
| `SDD_SOURCE_ROOT` | Overrides the source root path. When set, `sourceRoot()` returns this value. Useful when the source code to analyze resides in a different location from the working root (e.g. a monorepo sub-directory). | Falls back to the value of `repoRoot()`. |
| `CLAUDECODE` | Automatically removed from the environment before spawning an AI agent subprocess. This prevents the Claude Code harness environment from leaking into child agent processes. | Not read by sdd-forge itself; only stripped from the child process environment in `agent.js`. |
<!-- {{/text}} -->
