<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from `.sdd-forge/config.json` and supplemental metadata from `package.json`, covering settings for documentation output language, project type, AI agent behavior, source scanning, and SDD flow control. Users can tailor documentation style, chapter ordering, concurrency limits, and external tool integration through a structured JSON schema that is validated at load time by `src/lib/types.js`.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Defines documentation languages, output mode, agent settings, scan targets, chapter ordering, and flow options. Read and validated by `loadConfig()` in `src/lib/config.js`. |
| `package.json` | `<project root>/package.json` | Supplemental metadata source. Arbitrary fields are retrieved on demand via `loadPackageField()`. Used to read package name, version, and other manifest values during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `lang` | Required | string | `"en"` | Documentation output language code. Resolved from `DEFAULT_LANG` when absent during quick reads via `loadLang()`. |
| `type` | Required | string \| string[] | — | Project type identifier (e.g. `"node-cli"`, `"laravel"`). Determines which preset is applied. |
| `docs` | Required | object | — | Top-level documentation output configuration block. |
| `docs.languages` | Required | string[] | — | List of output language codes (e.g. `["en", "ja"]`). Must be non-empty. |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How additional languages are produced. `translate` derives them from the default; `generate` runs independent AI generation per language. |
| `docs.style` | Optional | object | — | Writing style overrides applied to AI-generated text. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to generated prose. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction passed to the AI writer. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation. |
| `concurrency` | Optional | number (≥ 1) | `5` | Maximum number of concurrent AI agent calls during build. |
| `chapters` | Optional | object[] | — | Project-level override of chapter order and inclusion. |
| `chapters[].chapter` | Required per entry | string | — | Chapter filename (e.g. `"overview.md"`). |
| `chapters[].desc` | Optional | string | — | Human-readable description of the chapter. |
| `chapters[].exclude` | Optional | boolean | — | Set to `true` to omit this chapter from output. |
| `agent` | Optional | object | — | AI agent execution settings. |
| `agent.workDir` | Optional | string | — | Working directory for the agent process. |
| `agent.timeout` | Optional | number (≥ 1) | — | Agent execution timeout in milliseconds. |
| `agent.retryCount` | Optional | number (≥ 1) | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token count per processing batch. |
| `agent.providers` | Optional | object | — | Named AI provider definitions. |
| `agent.providers.<name>.command` | Required per provider | string | — | Executable command used to invoke this provider. |
| `agent.providers.<name>.args` | Required per provider | array | — | Arguments passed to the provider command. |
| `scan` | Optional | object | — | Source file scanning configuration. |
| `scan.include` | Required if `scan` is set | string[] | — | Glob patterns of files to include in analysis. Must be non-empty. |
| `scan.exclude` | Optional | string[] | — | Glob patterns of files to exclude from analysis. |
| `flow` | Optional | object | — | SDD flow execution settings. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied at flow finalization. |
| `flow.push.remote` | Optional | string | — | Git remote name used when pushing during flow. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search mode for context lookup within flow commands. |
| `commands` | Optional | object | — | External tool integration toggles. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the `gh` CLI is used for pull request creation during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation language and mode**

Set `docs.languages` to all output languages and `docs.defaultLanguage` to the primary one. Use `docs.mode` to choose between translating from the default language or generating each language independently.

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

**Documentation writing style**

Provide `docs.style` to guide the tone and intent of AI-generated prose. All three sub-fields are required when `docs.style` is present.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal developer reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Avoid marketing language. Prefer concise technical descriptions."
    }
  }
}
```

**Chapter ordering and exclusion**

Override preset chapter order or exclude specific chapters by providing a `chapters` array in `config.json`. Entries not listed in the array follow the preset default order.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md" },
    { "chapter": "configuration.md", "desc": "Config reference" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**AI agent concurrency and provider**

Control parallelism with `concurrency` and define which AI provider to use under `agent.providers`. This allows pointing sdd-forge at any CLI-compatible model.

```json
{
  "concurrency": 3,
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

**SDD flow merge strategy and GitHub integration**

Set `flow.merge` to control how feature branches are merged, and `commands.gh` to enable or disable automatic pull request creation via the `gh` CLI.

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

**Source scan targets**

Define which files are analysed during `sdd-forge scan` by configuring `scan.include` and optionally `scan.exclude`.

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

| Environment Variable | Purpose |
|---|---|
| `SDD_SOURCE_ROOT` | Overrides the detected project root directory. `sdd-forge.js` reads this variable to locate the target project when the tool is invoked from outside the project tree. |
| `SDD_WORK_ROOT` | Specifies the working root used for resolving `.sdd-forge/` artifacts such as `config.json` and generated output. Allows the config and output directory to be located separately from the source root. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
