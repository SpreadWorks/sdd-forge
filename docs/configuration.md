<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge stores all project configuration in `.sdd-forge/config.json`, with additional metadata read from the project's `package.json`. The configuration covers documentation output languages and style, AI agent behavior, source scan targets, chapter layout, flow merge strategy, and GitHub CLI integration, giving users precise control over every stage of the documentation pipeline.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary configuration file for sdd-forge. Loaded and validated by `loadConfig()`. Defines all settings for docs generation, agent execution, scan targets, flow strategy, and chapter layout. An error is thrown if the file is missing or fails validation. |
| `package.json` | `<project-root>/package.json` | Read on demand by `loadPackageField()` to retrieve arbitrary fields such as `name` or `version`. Returns `undefined` silently if the file is absent or cannot be parsed. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | Non-empty list of language codes to generate docs for (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Primary language code; must appear in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How additional languages are produced: translated from the default or independently generated. |
| `docs.style` | Optional | object | — | Defines the tone and purpose applied when generating documentation text. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | A description of the documentation's purpose, passed to the AI as context. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone for all AI-generated text. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to AI prompts during text generation. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to omit from documentation. |
| `docs.enrichBatchSize` | Optional | number | — | Number of entries processed per batch during the enrich step. |
| `docs.enrichBatchLines` | Optional | number | — | Maximum source lines included per enrich batch. |
| `lang` | Required | string | — | Language code for the project (e.g., `"en"`). Used as a fallback by `loadLang()`, which defaults to `"en"` on any read failure. |
| `type` | Required | string \| string[] | — | Preset type(s) that determine which documentation template is applied (e.g., `"node-cli"`, `["node", "cli"]`). |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI calls. Must be a positive integer. Resolved by `resolveConcurrency()`. |
| `chapters` | Optional | object[] | — | Overrides chapter order. Each entry must have `chapter` (filename string) and may include `desc` (string) and `exclude` (boolean). Entries using the old string format require running `sdd-forge upgrade`. |
| `agent.default` | Optional | string | — | Key of the default agent provider defined in `agent.providers`. |
| `agent.workDir` | Optional | string | — | Working directory used when spawning agent processes. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for a single agent invocation. Must be a positive number. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. Must be a positive number. |
| `agent.providers` | Optional | object | — | Named agent provider definitions. Each entry requires `command` (non-empty string) and `args` (array). |
| `agent.commands` | Optional | object | — | Per-command agent configuration overrides. |
| `scan.include` | Required if `scan` is set | string[] | — | Non-empty list of glob patterns specifying which source files to include in analysis. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from the scan. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied when finalizing a development flow. |
| `flow.push.remote` | Optional | string | — | Name of the git remote to push to during flow finalization. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the GitHub CLI integration is active for operations such as PR creation. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation style**

The `docs.style` object lets you control the tone and purpose of all AI-generated text. Set `purpose` to describe what the documentation is for, `tone` to match your project's audience, and `customInstruction` to add any project-specific writing rules.

```json
"docs": {
  "style": {
    "purpose": "Developer reference for internal platform teams",
    "tone": "formal",
    "customInstruction": "Always use active voice and avoid passive constructions."
  }
}
```

**Multi-language output**

Set `docs.languages` to the list of languages you need and `docs.defaultLanguage` to the one sdd-forge generates first. Use `docs.mode` to choose between translating the primary output (`"translate"`) or generating each language independently (`"generate"`).

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate"
}
```

**Chapter order**

Supply a `chapters` array to define which documentation chapters are included and in what order. Each entry must have a `chapter` filename; use `exclude: true` to suppress a chapter that the preset would otherwise generate.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "cli_commands.md" },
  { "chapter": "configuration.md", "desc": "Config reference" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Concurrency**

Adjust `concurrency` to balance speed against API rate limits. The default is `5` parallel AI calls.

```json
"concurrency": 3
```

**Agent providers**

Define one or more named agent providers under `agent.providers` and set `agent.default` to the key that should be used unless overridden. Each provider requires a `command` and an `args` array.

```json
"agent": {
  "default": "claude",
  "timeout": 120000,
  "retryCount": 2,
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5"]
    }
  }
}
```

**Scan targets**

Use `scan.include` to specify which source files are analysed and `scan.exclude` to omit generated or vendored paths.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/vendor/**", "**/*.test.js"]
}
```

**Flow merge strategy**

Set `flow.merge` to control how feature branches are integrated and `flow.push.remote` to name the target remote.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
}
```

**GitHub CLI integration**

Set `commands.gh` to `"enable"` to allow sdd-forge to create pull requests via the GitHub CLI, or `"disable"` to suppress all `gh` invocations.

```json
"commands": {
  "gh": "enable"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The configuration loading module (`src/lib/config.js`) and the schema validation module (`src/lib/types.js`) do not reference any environment variables directly. All runtime context — such as the project root directory — is passed explicitly as function parameters (e.g., the `root` argument accepted by `loadConfig`, `loadLang`, `sddDir`, and related helpers) rather than being read from `process.env`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
