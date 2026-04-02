<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads its primary configuration from `.sdd-forge/config.json` and supplements it with metadata from the project's `package.json`. The configuration covers documentation output languages, project type and preset selection, AI agent behaviour, source scan patterns, SDD flow strategy, and external command integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded by `loadConfig()` in `src/lib/config.js` and passed through `validateConfig()` before use. |
| `package.json` | `<project-root>/package.json` | Supplementary metadata source. Arbitrary fields are read on demand via `loadPackageField()` in `src/lib/config.js`. |

All paths under `.sdd-forge/` are derived from the project root. `sddDir()`, `sddConfigPath()`, `sddOutputDir()`, and `sddDataDir()` in `src/lib/config.js` centralise these path computations. Generated output is written to `.sdd-forge/output/` and structured data to `.sdd-forge/data/`.
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | `string` | — | Language code used for generated content. |
| `type` | Required | `string` \| `string[]` | — | Project preset type(s). Each entry must be a non-empty string (e.g. `"node-cli"`, `"laravel"`). |
| `docs` | Required | `object` | — | Top-level documentation output settings. |
| `docs.languages` | Required | `string[]` | — | Non-empty list of output languages. |
| `docs.defaultLanguage` | Required | `string` | — | Default language; must be present in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Documentation generation mode. |
| `docs.style` | Optional | `object` | — | Style overrides for generated text. When provided, both `purpose` and `tone` are required. |
| `docs.style.purpose` | Required if `docs.style` set | `string` | — | Purpose descriptor guiding the documentation tone. |
| `docs.style.tone` | Required if `docs.style` set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone for generated content. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional free-form style instructions. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from documentation. |
| `concurrency` | Optional | `number` (≥ 1) | `5` | Maximum number of concurrent AI operations. |
| `chapters` | Optional | `object[]` | — | Project-specific chapter list overriding the preset order. Each entry must include a `chapter` filename string. |
| `chapters[].chapter` | Required | `string` | — | Chapter filename, e.g. `"overview.md"`. |
| `chapters[].desc` | Optional | `string` | — | Chapter description override. |
| `chapters[].exclude` | Optional | `boolean` | — | When `true`, the chapter is excluded from output. |
| `agent` | Optional | `object` | — | AI agent execution settings. |
| `agent.workDir` | Optional | `string` | — | Working directory for agent execution. |
| `agent.timeout` | Optional | `number` (≥ 1) | — | Agent call timeout in milliseconds. |
| `agent.retryCount` | Optional | `number` (≥ 1) | — | Number of retries for failed agent calls. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Maximum token count per batch operation. |
| `agent.providers` | Optional | `object` | — | Named AI provider configurations. |
| `agent.providers.<name>.command` | Required | `string` | — | Shell command to invoke the provider. |
| `agent.providers.<name>.args` | Required | `array` | — | Arguments passed to the provider command. |
| `scan` | Optional | `object` | — | Source file scan configuration. |
| `scan.include` | Required if `scan` set | `string[]` | — | Non-empty list of glob patterns specifying files to scan. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for files to exclude from scanning. |
| `flow` | Optional | `object` | — | SDD workflow settings. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used during flow finalization. |
| `flow.push.remote` | Optional | `string` | — | Remote name used when pushing during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search mode for context lookups during flow execution. |
| `commands` | Optional | `object` | — | External command integration settings. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation style**

The `docs.style` object customises the tone and purpose of all AI-generated content. When omitted, the preset defaults apply.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "A public developer-facing reference guide",
      "tone": "formal",
      "customInstruction": "Avoid passive voice where possible."
    }
  }
}
```

**Multi-language output**

Set `docs.languages` to more than one language code and `docs.mode` to `"generate"` to have each language produced independently rather than translated from the default.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "generate"
  }
}
```

**Chapter ordering**

The `chapters` array overrides the preset-defined chapter order. Only the chapters listed are included; set `exclude: true` on any entry to omit a specific chapter.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md", "desc": "Available commands and flags" },
    { "chapter": "configuration.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**AI agent providers**

The `agent.providers` map lets you register named AI providers. Each provider entry requires the shell command and its argument list. The `agent.default` key selects which provider is used by default.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "stream-json", "--verbose"]
      }
    }
  }
}
```

**Scan scope**

The `scan` object controls which source files are analysed. Use `include` to restrict scanning to relevant directories and `exclude` to skip generated or third-party paths.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/vendor/**", "src/**/*.test.js"]
  }
}
```

**Flow and merge strategy**

The `flow` object controls SDD workflow behaviour. `flow.merge` sets the git merge strategy applied at finalization; `commands.gh` enables or disables GitHub CLI integration for pull request creation.

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
|----------|---------|
| `SDD_SOURCE_ROOT` | Overrides the source project root directory resolved by the `sdd-forge` entry point. When set, the tool uses this path as the project root instead of the current working directory. |
| `SDD_WORK_ROOT` | Overrides the working root directory (where `.sdd-forge/` is located) resolved by the entry point. Allows the config and output directories to reside outside the source tree. |

These variables are consumed by `src/sdd-forge.js` when establishing project context before any subcommand runs. The configuration loading functions in `src/lib/config.js` (`loadConfig`, `sddConfigPath`, etc.) receive the resolved root as a function argument and do not read environment variables directly.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
