# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge reads its settings primarily from `.sdd-forge/config.json` (project-level configuration), `preset.json` (preset definitions shipped with the tool), and `package.json` (project metadata). These files control documentation output languages, document style, AI agent invocation, scan targets, flow merge strategy, chapter ordering, and concurrency — providing extensive customization points for adapting the tool to diverse project types and workflows.

<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Defines language, project type, documentation settings, agent configuration, scan rules, flow strategy, and concurrency. Created by `sdd-forge setup`. |
| `preset.json` | `src/presets/<preset>/preset.json` | Preset definition shipped with the tool. Declares parent chain, language layer, chapter ordering, scan include/exclude patterns, and aliases. Resolved automatically based on the `type` field in `config.json`. |
| `package.json` | Project root | Standard Node.js package manifest. sdd-forge reads fields such as `engines`, `type`, `dependencies`, and the optional `docsInit` field for initialization hints. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Generated output from `sdd-forge scan`. Consumed by downstream commands (`enrich`, `text`, `forge`, `review`) as the source-code analysis data store. |

Path helper functions in `src/lib/config.js` resolve these locations relative to the repository root:

- `sddDir(root)` → `.sdd-forge/`
- `sddConfigPath(root)` → `.sdd-forge/config.json`
- `sddOutputDir(root)` → `.sdd-forge/output/`
- `sddDataDir(root)` → `.sdd-forge/data/`

<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

The following table lists all fields recognized in `.sdd-forge/config.json`. Validation is performed by `validateConfig()` in `src/lib/types.js`.

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Yes | `string` | — | Operating language for the CLI interface, AGENTS.md, skills, and specs (e.g. `"en"`, `"ja"`). |
| `type` | Yes | `string` | — | Project type identifier. Accepts a full preset path (e.g. `"webapp/cakephp2"`) or a short alias (e.g. `"laravel"`). Resolved via `TYPE_ALIASES`. |
| `docs` | Yes | `object` | — | Documentation output configuration (see sub-fields below). |
| `docs.languages` | Yes | `string[]` | — | List of output languages (e.g. `["ja"]`, `["en", "ja"]`). Must be non-empty. |
| `docs.defaultLanguage` | Yes | `string` | — | Default output language. Must be included in `docs.languages`. |
| `docs.mode` | No | `"translate" \| "generate"` | `"translate"` | How non-default languages are produced. `"translate"` runs a translation pass; `"generate"` creates each language independently. |
| `docs.style` | No | `object` | — | Document style settings (see sub-fields below). |
| `docs.style.purpose` | Conditional | `string` | — | Required when `docs.style` is present. Describes the document purpose (e.g. `"developer-guide"`, `"user-guide"`, `"api-reference"`, or a custom string). |
| `docs.style.tone` | Conditional | `string` | — | Required when `docs.style` is present. Must be one of: `"polite"`, `"formal"`, `"casual"`. |
| `docs.style.customInstruction` | No | `string` | — | Free-form additional instruction for AI text generation. |
| `docs.enrichBatchSize` | No | `number` | — | Number of entries per batch during the `enrich` step. |
| `docs.enrichBatchLines` | No | `number` | — | Maximum total lines per batch during the `enrich` step. |
| `concurrency` | No | `number` | `5` | Maximum number of files processed in parallel. Must be a positive number. |
| `chapters` | No | `string[]` | (from preset) | Project-specific chapter ordering override. Each entry is a chapter filename (e.g. `"overview.md"`). When omitted, the order defined in the preset's `preset.json` is used. |
| `scan` | No | `object` | — | Source code scan configuration. |
| `scan.include` | Conditional | `string[]` | (from preset) | Required when `scan` is present. Glob patterns for files to include in analysis. |
| `scan.exclude` | No | `string[]` | — | Glob patterns for files to exclude from analysis. |
| `flow` | No | `object` | — | SDD flow configuration. |
| `flow.merge` | No | `"squash" \| "ff-only" \| "merge"` | `"squash"` | Git merge strategy used by `sdd-forge flow merge`. |
| `agent` | No | `object` | — | AI agent invocation settings. |
| `agent.default` | No | `string` | — | Name of the default agent provider (must match a key in `agent.providers`). |
| `agent.workDir` | No | `string` | — | Working directory for agent execution. |
| `agent.timeout` | No | `number` | `300` (seconds) | Agent execution timeout. Must be a positive number. |
| `agent.providers` | No | `object` | — | Map of provider definitions. Each key is a provider name. |
| `agent.providers.<name>.command` | Conditional | `string` | — | Required per provider. The executable command (e.g. `"claude"`). |
| `agent.providers.<name>.args` | Conditional | `string[]` | — | Required per provider. Command arguments. Use `{{PROMPT}}` as a placeholder for the prompt text. |
| `agent.providers.<name>.timeoutMs` | No | `number` | — | Per-provider timeout override in milliseconds. |
| `agent.providers.<name>.systemPromptFlag` | No | `string` | — | CLI flag for passing a system prompt (e.g. `"--system-prompt"`). |
| `agent.commands` | No | `object` | — | Per-command agent and profile overrides. |

<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**Project Type Selection**

The `type` field determines which preset chain is activated. Presets control chapter structure, scan patterns, and framework-specific DataSources. Short aliases are supported for convenience.

```json
{
  "type": "laravel"
}
```

Available presets: `base`, `cli`, `webapp`, `library`, `php`, `node`, `cakephp2`, `laravel`, `symfony`, `node-cli`. Presets form an inheritance chain (e.g. `laravel` → `webapp` → `base`, with `php` as the language layer).

**Document Style**

Control the tone and purpose of generated documentation through `docs.style`:

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "developer-guide",
      "tone": "formal",
      "customInstruction": "Focus on architecture decisions and trade-offs."
    }
  }
}
```

**Multi-Language Output**

Generate documentation in multiple languages by listing them in `docs.languages`. The `mode` field controls whether additional languages are produced via translation or independent generation:

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

Override the default chapter order defined by the preset. Each entry corresponds to a Markdown filename in the docs directory:

```json
{
  "chapters": ["overview.md", "architecture.md", "configuration.md", "cli_commands.md"]
}
```

**Scan Targets**

Narrow or expand the set of files analyzed by `sdd-forge scan`:

```json
{
  "scan": {
    "include": ["src/**/*.ts", "lib/**/*.js"],
    "exclude": ["**/*.test.ts", "**/fixtures/**"]
  }
}
```

**AI Agent Providers**

Configure one or more AI agent backends. The `{{PROMPT}}` placeholder in `args` is replaced with the actual prompt at invocation time. When the total argument size exceeds 100 KB, sdd-forge automatically falls back to passing the prompt via stdin.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 600,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}"],
        "systemPromptFlag": "--system-prompt"
      }
    }
  }
}
```

**Concurrency**

Adjust the number of files processed in parallel during scan and text generation:

```json
{
  "concurrency": 10
}
```

**Flow Merge Strategy**

Choose the Git merge strategy for the SDD flow:

```json
{
  "flow": {
    "merge": "ff-only"
  }
}
```

Accepted values are `"squash"` (default), `"ff-only"`, and `"merge"`.

<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

sdd-forge references the following environment variables at runtime. All are optional; the tool operates with sensible defaults when they are not set.

| Variable | Purpose | Fallback Behavior |
|----------|---------|-------------------|
| `SDD_WORK_ROOT` | Specifies the work root directory (the parent of `.sdd-forge/` and `docs/`). Used in project mode when the work tree differs from the source tree. | Falls back to the Git repository root (`git rev-parse --show-toplevel`), then to `process.cwd()`. |
| `SDD_SOURCE_ROOT` | Specifies the source code root directory. Used in project mode when source files reside in a different location from the work root. | Falls back to the value resolved by `SDD_WORK_ROOT` (or its own fallback chain). |
| `CLAUDECODE` | Set automatically by the Claude Code CLI environment. sdd-forge deletes this variable from the child process environment when spawning AI agents, preventing nested Claude Code sessions from interfering with each other. | No fallback needed — the variable is only relevant during agent invocation cleanup. |

These variables are read in `src/lib/cli.js` (for `SDD_WORK_ROOT` and `SDD_SOURCE_ROOT`) and `src/lib/agent.js` (for `CLAUDECODE`).

<!-- {{/text}} -->
