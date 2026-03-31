<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

The configuration system is centred on a single project-level file, `.sdd-forge/config.json`, which controls documentation generation, AI agent behaviour, workflow integration, and scan patterns. Configurable items range from output language and writing tone to concurrency limits, chapter ordering, merge strategy, and agent provider definitions.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded by `loadConfig()`, parsed as JSON, and fully validated against the schema before any command runs. An error is thrown if the file is missing or invalid. |
| `package.json` | `<project-root>/package.json` | Read on demand by `loadPackageField()` to retrieve arbitrary metadata fields such as `name` or `version`. Returns `undefined` silently if the file is absent or cannot be parsed. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Parent object for all documentation output settings. |
| `docs.languages` | Required | string[] | — | Non-empty list of language codes for which documentation is generated (e.g. `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | The primary output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls how non-default languages are produced. |
| `docs.style` | Optional | object | — | Writing style hints passed to the AI. Omit the entire object to use preset defaults. |
| `docs.style.purpose` | Required (if `style` present) | string | — | One-sentence description of the documentation's purpose. |
| `docs.style.tone` | Required (if `style` present) | `"polite"` \| `"formal"` \| `"casual"` | — | Desired writing tone for generated prose. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to AI prompts. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation generation. |
| `docs.enrichBatchSize` | Optional | number | — | Number of entries processed per enrich batch. |
| `docs.enrichBatchLines` | Optional | number | — | Maximum source lines sent per enrich batch. |
| `lang` | Required | string | — | Language code used for prompts and internal messages (e.g. `"en"`). |
| `type` | Required | string \| string[] | — | Preset type(s) that define chapter templates (e.g. `"node-cli"`). |
| `concurrency` | Optional | number | `5` | Maximum number of AI calls executed in parallel. Must be a positive integer if provided. |
| `chapters` | Optional | `{chapter, desc?, exclude?}`[] | — | Project-level override for chapter ordering and inclusion. Each entry must have a `chapter` filename; `exclude: true` removes a chapter from output. |
| `scan.include` | Required (if `scan` present) | string[] | — | Non-empty list of glob patterns identifying source files to scan. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to skip during scanning. |
| `agent.default` | Optional | string | — | Key of the default provider entry within `agent.providers`. |
| `agent.workDir` | Optional | string | — | Working directory used when spawning agent processes. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for a single agent call. Must be a positive number. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. Must be a positive number. |
| `agent.providers` | Optional | object | — | Map of named provider configurations. Each entry requires a `command` (non-empty string) and `args` (array). |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when finalising a flow branch. |
| `flow.push.remote` | Optional | string | — | Name of the git remote to push to during flow finalisation. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used in flow operations. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation language and multi-language output**

Set `docs.languages` to the list of languages you want and `docs.defaultLanguage` to your primary language. When `docs.mode` is `"translate"`, secondary languages are derived from the primary output; when set to `"generate"`, each language is generated independently.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate"
}
```

**Writing style**

Provide `docs.style` to guide the tone and purpose of generated prose. All three sub-fields (`purpose`, `tone`, `customInstruction`) let you steer the AI without modifying templates.

```json
"docs": {
  "style": {
    "purpose": "Reference documentation for library maintainers",
    "tone": "formal",
    "customInstruction": "Prefer active voice and avoid jargon."
  }
}
```

**Concurrency**

Increase or decrease the number of parallel AI calls to balance speed against API rate limits. The built-in default is `5`.

```json
"concurrency": 3
```

**Chapter ordering and exclusion**

Add a `chapters` array to reorder chapters or exclude specific ones from the output. Entries not listed here fall back to the preset order.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "cli_commands.md" },
  { "chapter": "configuration.md", "desc": "Config reference" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Agent providers**

Register one or more named AI agent runtimes under `agent.providers`, then set `agent.default` to select which one is used by default.

```json
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
```

**Flow and merge strategy**

Choose how feature branches are integrated and whether commits are pushed automatically.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
}
```

**Scan patterns**

Define which source files are analysed. `scan.include` accepts glob patterns; `scan.exclude` removes matched paths from the result.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js", "src/vendor/**"]
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Absolute path to the project's source root. Used by `sdd-forge.js` to resolve where source files and the `.sdd-forge/` directory reside when the tool is invoked outside the project root. |
| `SDD_WORK_ROOT` | Absolute path to the working directory for agent operations. Used by `sdd-forge.js` to determine where agent processes are spawned when `agent.workDir` is not set in `config.json`. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
