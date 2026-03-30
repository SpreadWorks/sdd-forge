<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads its main project settings from `.sdd-forge/config.json` and also reads `package.json` when a package field is needed. The configuration covers documentation output, operating language, preset selection, concurrency, agent execution, flow behavior, external command availability, and optional scan and chapter controls.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `config.json` | `.sdd-forge/config.json` | Primary sdd-forge configuration file. It is loaded for validated project settings, and its `lang` field can also be read separately before full validation. |
| `package.json` | `package.json` at the repository root | Optional metadata source. The tool can read an arbitrary top-level field when needed. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Yes | object | None | Documentation configuration root. |
| `docs.languages` | Yes | string[] | None | Output languages for generated documents. Must be a non-empty array. |
| `docs.defaultLanguage` | Yes | string | None | Default output language. Must be one of `docs.languages`. |
| `docs.mode` | No | `"translate"` or `"generate"` | None | How non-default languages are produced. |
| `docs.style` | No | object | None | Document style settings for generated output. |
| `docs.style.purpose` | Yes when `docs.style` is set | string | None | Purpose of the generated document, such as `developer-guide`, `user-guide`, or `api-reference`. |
| `docs.style.tone` | Yes when `docs.style` is set | `"polite"`, `"formal"`, or `"casual"` | None | Tone used for generated documents. |
| `docs.style.customInstruction` | No | string | None | Additional free-form instruction for document generation. |
| `lang` | Yes | string | `"en"` when the config is unavailable or `lang` is unset during lightweight language loading | Operating language for the CLI, AGENTS.md, skills, and specs. |
| `type` | Yes | string or string[] | None | Preset name or preset list used by the project. |
| `concurrency` | No | number | `5` | Per-file concurrency for parallel processing. Must be positive if set. |
| `chapters` | No | string[] | None | Chapter list override. Entries must be strings. |
| `agent` | No | object | None | AI agent invocation settings. |
| `agent.default` | No | string | None | Default agent provider name. |
| `agent.workDir` | No | string | None | Working directory used for agent execution. |
| `agent.timeout` | No | number | None | Agent execution timeout in seconds. Must be positive if set. |
| `agent.retryCount` | No | number | None | Retry count for docs enrich agent calls. Must be positive if set. |
| `agent.providers` | No | object | None | Named provider definitions for agent execution. |
| `agent.providers.<name>.name` | No | string | None | Display name of a provider. |
| `agent.providers.<name>.command` | No | string | None | Executable used to run the provider. |
| `agent.providers.<name>.args` | No | string[] | None | Command arguments. Supports the `{{PROMPT}}` placeholder. |
| `agent.providers.<name>.timeoutMs` | No | number | None | Provider-specific timeout in milliseconds. |
| `agent.providers.<name>.systemPromptFlag` | No | string | None | Flag used to pass a system prompt to the provider. |
| `agent.commands` | No | object | None | Per-command agent and profile overrides. |
| `scan` | No | object | None | Scan settings for source analysis. |
| `scan.include` | Yes when `scan` is set | string[] | None | Include patterns for scanning. Must be a non-empty array. |
| `scan.exclude` | No | string[] | None | Exclude patterns for scanning. |
| `flow` | No | object | None | Workflow behavior settings. |
| `flow.merge` | No | `"squash"`, `"ff-only"`, or `"merge"` | `"squash"` | Merge strategy used by the flow. |
| `flow.push` | No | object | None | Push configuration for the flow. |
| `flow.push.remote` | No | string | `"origin"` | Remote name used when pushing. |
| `commands` | No | object | None | Availability settings for external commands. |
| `commands.gh` | No | `"enable"` or `"disable"` | `"disable"` | Controls whether GitHub CLI is treated as available. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize documentation output, execution behavior, workflow settings, and optional scan rules in `.sdd-forge/config.json`.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate",
    "style": {
      "purpose": "user-guide",
      "tone": "formal",
      "customInstruction": "Use a professional and approachable tone."
    }
  },
  "lang": "en",
  "type": ["symfony", "postgres"],
  "concurrency": 5,
  "chapters": ["overview", "configuration", "cli_commands"],
  "scan": {
    "include": ["src/**", "docs/**"],
    "exclude": ["node_modules/**", "dist/**"]
  },
  "agent": {
    "default": "local",
    "workDir": ".tmp/agents",
    "timeout": 300,
    "retryCount": 2,
    "providers": {
      "local": {
        "name": "Local Agent",
        "command": "codex",
        "args": ["run", "{{PROMPT}}"],
        "timeoutMs": 600000,
        "systemPromptFlag": "--system-prompt"
      }
    }
  },
  "flow": {
    "merge": "squash",
    "push": {
      "remote": "origin"
    }
  },
  "commands": {
    "gh": "enable"
  }
}
```

The main customization points are output languages and generation mode under `docs`, writing style under `docs.style`, the operating language in `lang`, preset selection in `type`, processing parallelism in `concurrency`, agent provider behavior under `agent`, merge and push behavior under `flow`, GitHub CLI availability under `commands.gh`, and optional scan scope and chapter selection through `scan` and `chapters`.
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

No `process.env` references are shown in the analyzed sdd-forge configuration sources.

| Environment variable | Purpose |
| --- | --- |
| None in the analyzed sources | No direct environment-variable lookup is shown for the core configuration loader or validator. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
