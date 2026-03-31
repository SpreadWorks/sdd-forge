<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads its project settings from a single JSON file located inside the `.sdd-forge/` directory, with optional supplementary data drawn from the project's `package.json`. The configuration covers a wide range of items — documentation language and style, project preset type, AI agent behaviour, source scanning patterns, SDD flow strategy, and chapter ordering — giving teams precise control over how documentation is generated and published.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration; loaded and schema-validated on every command run via `loadConfig()`. Missing file causes an immediate error. |
| `package.json` | `<project-root>/package.json` | Supplementary source; individual fields are read on demand via `loadPackageField()` (e.g. project name or version). Returns `undefined` silently if the file is absent or unparseable. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level documentation settings block. |
| `docs.languages` | Required | `string[]` | — | Non-empty list of language codes to generate documentation for (e.g. `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | `string` | — | Primary output language; must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Whether to translate documentation from the default language or generate each language independently. |
| `docs.style` | Optional | object | — | Writing style overrides applied to all AI-generated text. |
| `docs.style.purpose` | Required if `docs.style` present | `string` | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` present | `"polite"` \| `"formal"` \| `"casual"` | — | Tone used throughout generated prose. |
| `docs.style.customInstruction` | Optional | `string` | — | Free-form instruction appended verbatim to AI generation prompts. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for source files excluded from documentation generation. |
| `lang` | Required | `string` | — | Language code for the project's primary output (e.g. `"en"`). |
| `type` | Required | `string` \| `string[]` | — | Project preset identifier (e.g. `"node-cli"`, `"laravel"`). Accepts a single string or an ordered array for multi-preset composition. |
| `concurrency` | Optional | `number` | `5` | Maximum number of parallel AI calls. Must be a positive integer. |
| `chapters` | Optional | `{ chapter: string, desc?: string, exclude?: boolean }[]` | — | Ordered chapter list that overrides the preset default. Each entry requires a `chapter` filename; `desc` and `exclude` are optional. |
| `agent.default` | Optional | `string` | — | Key name of the default provider entry under `agent.providers`. |
| `agent.workDir` | Optional | `string` | — | Working directory for agent subprocess execution. |
| `agent.timeout` | Optional | `number` | — | Per-call timeout in milliseconds. Must be a positive integer. |
| `agent.retryCount` | Optional | `number` | — | Number of retry attempts on agent failure. Must be a positive integer. |
| `agent.providers.<name>.command` | Required per provider | `string` | — | Executable command used to invoke the agent (e.g. `"claude"`). |
| `agent.providers.<name>.args` | Required per provider | `string[]` | — | Argument list passed to the provider command. |
| `scan.include` | Required if `scan` present | `string[]` | — | Glob patterns defining which source files to include in scanning. Must be non-empty. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied during SDD flow finalization. |
| `flow.push.remote` | Optional | `string` | — | Git remote name to push to during flow finalization. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the GitHub CLI (`gh`) is used for pull-request creation in the SDD flow. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation language and style**

Set the languages your docs are generated in, choose a writing tone, and supply a custom AI instruction to tailor the prose to your project's voice.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate",
    "style": {
      "purpose": "Internal developer reference for onboarding and maintenance",
      "tone": "formal",
      "customInstruction": "Prefer short sentences and use active voice throughout."
    }
  }
}
```

**Project type and preset composition**

Specify one or more preset identifiers to select the documentation template that matches your stack. Multiple presets are merged in order.

```json
{
  "type": ["node", "node-cli"]
}
```

**Chapter ordering**

Override the preset's default chapter order or exclude specific chapters from the output using the `chapters` array.

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

**Concurrency**

Control how many AI calls run in parallel. Reduce this value if you hit rate limits from your AI provider.

```json
{
  "concurrency": 3
}
```

**Agent providers**

Define one or more named agent providers and select which one is used by default. Each provider specifies the executable and the argument list passed to it.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "json"]
      }
    }
  }
}
```

**SDD flow strategy**

Choose the Git merge strategy used when the SDD flow finalizes a feature branch, and optionally configure automatic push to a named remote.

```json
{
  "flow": {
    "merge": "squash",
    "push": {
      "remote": "origin"
    }
  }
}
```

**GitHub CLI integration**

Enable or disable `gh`-based pull-request creation during flow finalization.

```json
{
  "commands": {
    "gh": "enable"
  }
}
```

**Source scan scope**

Use `scan.include` and `scan.exclude` glob patterns to precisely control which source files are analysed during the `sdd-forge scan` step.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The configuration module (`src/lib/config.js`) and schema validator (`src/lib/types.js`) do not reference any environment variables via `process.env`. All configuration values are read exclusively from `.sdd-forge/config.json` and, where applicable, `package.json`. Environment variable handling for runtime context (such as project root resolution) is performed at the CLI entry-point layer rather than within the configuration module itself.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
