<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration primarily from `.sdd-forge/config.json`, with supplementary metadata sourced from `package.json`. The configuration covers documentation output languages, source scan patterns, AI agent behavior, SDD flow control, and external command integration, giving teams fine-grained control over how documentation is generated and how the development workflow operates.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. Loaded and schema-validated by `loadConfig()` in `src/lib/config.js`. Governs documentation output, scanning, agent, flow, and command settings. |
| `package.json` | `<project-root>/package.json` | Package metadata file. Read via `loadPackageField()` to retrieve arbitrary fields such as `name` and `version` for use during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `docs` | Required | object | — | Top-level container for all documentation settings. |
| `docs.languages` | Required | string[] | — | Non-empty list of output language codes to generate documentation for. |
| `docs.defaultLanguage` | Required | string | — | Primary output language; must be present in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Determines whether secondary languages are produced by translating the default output or generated independently. |
| `docs.style` | Optional | object | — | Tone and purpose settings applied to AI-generated prose. |
| `docs.style.purpose` | Required (if `docs.style` set) | string | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required (if `docs.style` set) | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction forwarded to the AI during text generation. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation output. |
| `lang` | Required | string | — | Language code for CLI messages and documentation output. |
| `type` | Required | string \| string[] | — | Project type identifier(s) used to select the documentation preset. |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI requests during documentation generation. |
| `chapters` | Optional | object[] | — | Project-level override of chapter order. Each entry requires a `chapter` field. |
| `chapters[].chapter` | Required (within entry) | string | — | Chapter filename (e.g. `overview.md`). |
| `chapters[].desc` | Optional | string | — | Human-readable description of the chapter. |
| `chapters[].exclude` | Optional | boolean | — | When `true`, omits this chapter from the build. |
| `agent.workDir` | Optional | string | — | Working directory for the AI agent subprocess. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for individual agent calls. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts for failed agent calls. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token budget per agent batch request. |
| `agent.providers.<name>.command` | Required (within provider) | string | — | Shell command used to invoke the named agent provider. |
| `agent.providers.<name>.args` | Required (within provider) | array | — | Arguments passed to the provider command. |
| `scan.include` | Required (if `scan` set) | string[] | — | Glob patterns specifying source files to include in the analysis scan. |
| `scan.exclude` | Optional | string[] | — | Glob patterns specifying source files to exclude from the analysis scan. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by the SDD flow finalize step. |
| `flow.push.remote` | Optional | string | — | Remote name to push to during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search strategy used within the SDD flow. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used during the SDD flow. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Output Languages**

Configure which languages documentation is generated for and which is the primary language. The `docs.mode` field controls whether secondary languages are translated from the default or generated independently.

```json
{
  "lang": "en",
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Documentation Style**

Tailor the tone and intent of AI-generated text using `docs.style`. Supply a `customInstruction` to apply project-specific writing guidelines.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "Internal reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Avoid passive voice. Prefer code examples over prose."
    }
  }
}
```

**Chapter Ordering**

Override the preset-defined chapter order at the project level using the `chapters` array. Entries not listed in the array retain their default preset position. Set `exclude: true` to omit a chapter entirely.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md" },
    { "chapter": "configuration.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**Scan Targets**

Control which source files are included in or excluded from analysis using glob patterns.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/vendor/**"]
  }
}
```

**Agent Providers**

Register one or more named AI agent providers. Each provider requires a shell command and an argument array.

```json
{
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "json"]
      }
    }
  }
}
```

**Concurrency**

Adjust the number of parallel AI requests. The default is `5`. Reduce this value on resource-constrained environments or when API rate limits are a concern.

```json
{
  "concurrency": 3
}
```

**Flow and GitHub Integration**

Choose the git merge strategy for SDD flow finalization and enable GitHub CLI integration for automated pull request creation.

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" }
  },
  "commands": {
    "gh": "enable"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|---|---|
| `SDD_SOURCE_ROOT` | Absolute path to the source project root. Used by the `sdd-forge` entry point to resolve the project directory passed into configuration and documentation commands. |
| `SDD_WORK_ROOT` | Absolute path to the working directory for agent subprocess execution. Used by the entry point alongside `SDD_SOURCE_ROOT` to establish the dual-root context required by the tool. |

These environment variables are consumed by the top-level `sdd-forge.js` dispatcher before configuration is loaded. The configuration loading functions in `src/lib/config.js` receive the resolved root path as a parameter and do not read environment variables directly.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
