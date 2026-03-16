# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge uses a layered configuration system centered on `.sdd-forge/config.json`, supplemented by preset manifests (`preset.json`), i18n locale files, and environment variables. Configurable items span documentation output settings, AI agent providers, concurrency, project type selection, SDD workflow behavior, and localization — all of which can be customized at the project level.

<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Main project configuration — defines language, project type, docs settings, agent providers, concurrency, and flow options. Created by `sdd-forge setup`. |
| `preset.json` | `src/presets/{key}/preset.json` | Framework/architecture preset manifest — declares chapter order, scan patterns, aliases, and architecture layer. Auto-discovered at startup. |
| `package.json` | Project root | Project metadata — name, version, description, scripts, and repository URL are read for documentation generation. |
| `flow.json` | `.sdd-forge/flow.json` | SDD workflow state — tracks the current spec, branches, step progress, and requirement status across flow phases. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Generated source code analysis data — produced by `sdd-forge scan` and consumed by downstream docs commands. |
| `ui.json` | `src/locale/{lang}/ui.json` | Built-in UI strings for CLI prompts, help text, and setup dialogs. |
| `messages.json` | `src/locale/{lang}/messages.json` | Built-in operational messages (errors, feedback, status). |
| `prompts.json` | `src/locale/{lang}/prompts.json` | Built-in AI prompt templates used during text generation and review. |
| `ui.json` / `messages.json` / `prompts.json` | `src/presets/{key}/locale/{lang}/` | Preset-specific i18n overrides (optional). Merged on top of built-in strings. |
| `ui.json` / `messages.json` / `prompts.json` | `.sdd-forge/locale/{lang}/` | Project-specific i18n overrides (optional). Highest priority in the 3-layer merge. |

<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

The following table documents all fields recognized in `.sdd-forge/config.json`. Validation is performed by `validateConfig()` in `src/lib/types.js`, which collects all errors and reports them together.

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | `string` | — | Operating language for the CLI, AGENTS.md, skills, and specs (e.g., `"en"`, `"ja"`). |
| `type` | Required | `string` | — | Project type identifier. Accepts a canonical path like `"webapp/cakephp2"` or a short alias like `"laravel"`. Resolved via `TYPE_ALIASES`. |
| `concurrency` | Optional | `number` | `5` | Maximum number of files processed in parallel during docs generation. Must be a positive number. |
| `docs` | Required | `object` | — | Documentation output configuration (see sub-fields below). |
| `docs.languages` | Required | `string[]` | — | Non-empty array of output language codes (e.g., `["en"]`, `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | `string` | — | Primary output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `string` | — | How non-default languages are produced. Must be `"translate"` or `"generate"`. |
| `docs.style` | Optional | `object` | — | Document style settings (see sub-fields below). |
| `docs.style.purpose` | Required* | `string` | — | Document purpose (e.g., `"developer-guide"`, `"user-guide"`, `"api-reference"`, or a free-form string). Required when `docs.style` is present. |
| `docs.style.tone` | Required* | `string` | — | Writing tone. Must be `"polite"`, `"formal"`, or `"casual"`. Required when `docs.style` is present. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional free-form instructions passed to the AI during text generation. |
| `docs.enrichBatchSize` | Optional | `number` | — | Number of entries per batch during the enrich phase. |
| `docs.enrichBatchLines` | Optional | `number` | — | Maximum total lines per enrich batch. |
| `chapters` | Optional | `string[]` | (from preset) | Ordered list of chapter file names (e.g., `["overview.md", "architecture.md"]`). Overrides the preset's default chapter order. |
| `scan` | Optional | `object` | — | Source code scanning configuration. |
| `scan.include` | Required* | `string[]` | — | Non-empty array of glob patterns for files to include in scanning. Required when `scan` is present. |
| `scan.exclude` | Optional | `string[]` | — | Array of glob patterns for files to exclude from scanning. |
| `agent` | Optional | `object` | — | AI agent invocation settings. |
| `agent.default` | Optional | `string` | — | Name of the default agent provider (must match a key in `providers`). |
| `agent.workDir` | Optional | `string` | — | Working directory for agent execution (e.g., `".tmp"`). |
| `agent.timeout` | Optional | `number` | — | Agent execution timeout in seconds. Must be a positive number. |
| `agent.providers` | Optional | `object` | — | Map of named agent provider definitions (see sub-fields below). |
| `agent.providers.{name}.command` | Required* | `string` | — | Executable command for the agent (e.g., `"claude"`, `"codex"`). Required when the provider entry is present. |
| `agent.providers.{name}.args` | Required* | `string[]` | — | Command arguments. Use `{{PROMPT}}` as a placeholder for the prompt text. Required when the provider entry is present. |
| `agent.providers.{name}.systemPromptFlag` | Optional | `string` | — | CLI flag for passing a system prompt (e.g., `"--system-prompt"`). |
| `agent.providers.{name}.profiles` | Optional | `object` | — | Named argument profiles (e.g., `"opus": ["--model", "opus"]`). |
| `agent.commands` | Optional | `object` | — | Per-command agent and profile overrides (e.g., `"docs.text": { "agent": "claude", "profile": "default" }`). |
| `flow` | Optional | `object` | — | SDD workflow settings. |
| `flow.merge` | Optional | `string` | `"squash"` | Merge strategy for completing a flow. Must be `"squash"`, `"ff-only"`, or `"merge"`. |

<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**Project Type Selection**

The `type` field determines which preset is applied, controlling chapter structure, scan patterns, and available DataSources. Short aliases are resolved automatically (e.g., `"cakephp2"` → `"webapp/cakephp2"`).

```json
{
  "type": "laravel"
}
```

**Document Style**

Control the tone and purpose of generated documentation through `docs.style`. The AI uses these instructions when producing text content.

```json
{
  "docs": {
    "style": {
      "purpose": "user-guide",
      "tone": "casual",
      "customInstruction": "Use short paragraphs and include practical examples."
    }
  }
}
```

**Multi-Language Output**

Generate documentation in multiple languages by listing them in `docs.languages`. The `mode` field controls whether non-default languages are produced by translation or independent generation.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Chapter Order Override**

Override the preset's default chapter ordering by specifying a `chapters` array. Only listed chapters are generated, in the given order.

```json
{
  "chapters": ["overview.md", "architecture.md", "configuration.md", "cli_commands.md"]
}
```

**AI Agent Provider Configuration**

Define multiple AI agent providers and assign them to specific commands. Each provider specifies a command, arguments, and optional profiles for model selection.

```json
{
  "agent": {
    "default": "claude",
    "workDir": ".tmp",
    "timeout": 300,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}"],
        "profiles": {
          "default": ["--model", "sonnet"],
          "opus": ["--model", "opus"]
        }
      }
    },
    "commands": {
      "docs.text": { "agent": "claude", "profile": "default" },
      "docs.forge": { "agent": "claude", "profile": "opus" }
    }
  }
}
```

**Concurrency Tuning**

Adjust the number of files processed in parallel. Higher values speed up generation but consume more memory and API calls.

```json
{
  "concurrency": 10
}
```

**Scan Include/Exclude Patterns**

Restrict which source files are analyzed by providing glob patterns in `scan`. This is useful for large repositories where only a subset of files is relevant.

```json
{
  "scan": {
    "include": ["app/**/*.php", "src/**/*.js"],
    "exclude": ["**/vendor/**", "**/node_modules/**"]
  }
}
```

**Localization Overrides**

Customize CLI messages, UI strings, or AI prompts by placing override files in `.sdd-forge/locale/{lang}/`. The 3-layer merge order is: built-in → preset → project, with later layers taking precedence.

```
.sdd-forge/
└── locale/
    └── en/
        ├── ui.json        # Override UI strings
        ├── messages.json   # Override operational messages
        └── prompts.json    # Override AI prompt templates
```

**Flow Merge Strategy**

Choose how feature branches are merged back when completing an SDD flow.

```json
{
  "flow": {
    "merge": "ff-only"
  }
}
```

Available strategies: `"squash"` (default — combines all commits into one), `"ff-only"` (fast-forward only, fails if not possible), and `"merge"` (creates a merge commit).

<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

sdd-forge references the following environment variables, all defined in the `src/lib/` layer.

| Variable | Referenced In | Purpose | Default Behavior |
|----------|--------------|---------|------------------|
| `SDD_WORK_ROOT` | `src/lib/cli.js` (`repoRoot()`) | Specifies the project work root directory. When set, sdd-forge uses this path for locating `.sdd-forge/`, `docs/`, and other project-level files. | Falls back to `git rev-parse --show-toplevel`, then `process.cwd()`. |
| `SDD_SOURCE_ROOT` | `src/lib/cli.js` (`sourceRoot()`) | Specifies the source code root directory for scanning. Allows the source tree to reside in a different location from the work root. | Falls back to the value of `SDD_WORK_ROOT` or `repoRoot()`. |
| `CLAUDECODE` | `src/lib/agent.js` (`buildAgentInvocation()`) | Not read by sdd-forge itself. This variable is explicitly deleted from the child process environment when spawning AI agents, preventing Claude Code context from leaking into subprocess invocations. | Removed from the environment before agent execution. |

These variables are primarily useful when sdd-forge analyzes a project whose source code and configuration live in separate directories, or when running within CI/CD pipelines where the working directory differs from the repository root.

<!-- {{/text}} -->
