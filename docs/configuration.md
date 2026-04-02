<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from `.sdd-forge/config.json` and supplementary metadata from `package.json`, covering documentation output languages, project type, AI agent behavior, source scanning scope, and workflow options. Users can tailor tone and style for generated content, define chapter layouts, configure agent providers, and control GitHub CLI integration through a single validated configuration file.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. Loaded and validated by `loadConfig()` in `src/lib/config.js`. Contains all settings for documentation, language, agent, scan, flow, and commands. |
| `package.json` | `<project-root>/package.json` | Supplementary package metadata. Individual fields are read on demand via `loadPackageField()`. Not subject to the same validation schema as `config.json`. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | List of output language codes (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Default language for output; must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Documentation generation mode. |
| `docs.style` | Optional | object | — | Writing style settings applied to AI-generated content. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | Description of the documentation's intended purpose. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Desired tone for generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction passed to the AI. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for files to exclude from documentation generation. |
| `lang` | Required | string | — | Interface and output language code. |
| `type` | Required | string \| string[] | — | Project type identifier (e.g., `"node-cli"`, `"laravel"`). |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI tasks. Must be a positive integer if provided. |
| `chapters` | Optional | object[] | — | Per-chapter configuration overrides. Each entry requires a `chapter` filename string and optionally accepts `desc` (string) and `exclude` (boolean). |
| `agent.workDir` | Optional | string | — | Working directory override for agent execution. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for agent tasks. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts for failed agent tasks. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token budget per processing batch. |
| `agent.providers` | Optional | object | — | Named AI provider configurations. Each entry requires `command` (non-empty string) and `args` (array). |
| `scan.include` | Required if `scan` is set | string[] | — | Glob patterns specifying source files to include in scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used during flow finalization. |
| `flow.push.remote` | Optional | string | — | Git remote name for push operations during flow. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search mode used during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI integration is active. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation style**

Set `docs.style` to control the tone and purpose statement embedded in all AI-generated content.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "API reference for internal developers",
      "tone": "formal",
      "customInstruction": "Use imperative mood in all headings."
    }
  }
}
```

**Chapter ordering and descriptions**

Use the `chapters` array to override the default chapter order defined by the preset and to supply per-chapter descriptions. Set `exclude: true` to omit a chapter from the build.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md", "desc": "All available CLI subcommands" },
    { "chapter": "configuration.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**AI agent providers**

Define named providers under `agent.providers`. Each provider requires a `command` and an `args` array. Use `agent.default` to select the active provider.

```json
{
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    },
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 8000
  }
}
```

**Concurrency**

Adjust `concurrency` to limit the number of parallel AI requests. The default is `5`.

```json
{ "concurrency": 3 }
```

**Flow merge strategy and GitHub CLI**

Configure how branches are merged at the end of a flow, and opt in to GitHub CLI integration for automated pull request creation.

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" },
    "commands": {
      "context": { "search": { "mode": "ai" } }
    }
  },
  "commands": { "gh": "enable" }
}
```

**Source scan scope**

Use `scan.include` and `scan.exclude` to define exactly which files are analysed.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/vendor/**"]
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The configuration loading modules (`src/lib/config.js`) do not directly reference environment variables; all project settings are read from file-based configuration. The top-level entry point (`sdd-forge.js`) resolves project context via the following environment variables before configuration is loaded.

| Variable | Purpose |
|---|---|
| `SDD_SOURCE_ROOT` | Overrides the detected project source root directory used as the base for all path resolution. |
| `SDD_WORK_ROOT` | Overrides the working root directory where `.sdd-forge/` output and state files are written. |

When neither variable is set, the tool falls back to the current working directory for both values.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
