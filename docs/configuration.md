<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from `.sdd-forge/config.json`, with supplementary metadata drawn from the project's `package.json`. The configuration covers documentation generation settings, project type and language selection, AI agent behaviour, source scanning targets, SDD flow options, chapter ordering, and GitHub CLI integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Defines documentation settings, project type, language, agent behaviour, scan targets, flow options, and chapter layout. Read and validated by `loadConfig()` in `src/lib/config.js`. |
| `package.json` | Project root | Supplementary package metadata. Arbitrary fields are read on demand via `loadPackageField()` in `src/lib/config.js`; the `version` and `name` fields are the most commonly accessed. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level group for all documentation settings. |
| `docs.languages` | Required | string[] | — | List of language codes for which documentation is generated (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Primary output language; must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Documentation generation mode. `"translate"` derives non-default language docs from the primary; `"generate"` produces each language independently. |
| `docs.style` | Optional | object | — | Style settings applied to AI-generated text. |
| `docs.style.purpose` | Required if `docs.style` set | string | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone for generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional freeform style instruction passed to the AI agent. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for files to exclude from documentation generation. |
| `lang` | Required | string | — | Project language code (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Project preset type or list of types (e.g., `"node-cli"`, `["node", "library"]`). |
| `concurrency` | Optional | number | `5` | Maximum number of parallel AI agent tasks. |
| `chapters` | Optional | object[] | — | Project-specific chapter ordering. Each entry requires `chapter` (string filename) and optionally `desc` (string) and `exclude` (boolean). |
| `agent.workDir` | Optional | string | — | Working directory override for agent process execution. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for individual agent tasks. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts for failed agent tasks. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token count per agent batch request. |
| `agent.providers` | Optional | object | — | Named AI provider configurations. Each key is a provider name; each value requires `command` (string) and `args` (array). |
| `scan.include` | Required if `scan` set | string[] | — | Glob patterns for files to include in the source scan. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from the source scan. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by the SDD flow when integrating a feature branch. |
| `flow.push.remote` | Optional | string | — | Git remote name used for push operations in the SDD flow. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search mode applied during SDD flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are available during the SDD flow. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation style**

Set `docs.style` in `.sdd-forge/config.json` to control the tone and purpose of AI-generated content. The `customInstruction` field accepts a freeform string for additional constraints.

```json
"docs": {
  "style": {
    "purpose": "Reference guide for backend engineers",
    "tone": "formal",
    "customInstruction": "Avoid passive voice and abbreviate technical terms on first use."
  }
}
```

**Chapter ordering**

Use `chapters` to override the preset chapter order or exclude specific chapters from the build.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "cli_commands.md" },
  { "chapter": "configuration.md" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Scan targets**

Use `scan.include` and `scan.exclude` to define which source files are analysed. Standard glob patterns are supported.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js", "src/fixtures/**"]
}
```

**AI agent concurrency and provider**

Adjust `concurrency` to tune parallel throughput. Define named providers under `agent.providers` to specify which AI command and arguments the tool invokes.

```json
"concurrency": 3,
"agent": {
  "timeout": 120000,
  "providers": {
    "default": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5"]
    }
  }
}
```

**SDD flow behaviour**

Configure merge strategy and GitHub CLI availability for the SDD workflow.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
},
"commands": {
  "gh": "enable"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Overrides the resolved path to the target project's source root. Used by `sdd-forge.js` to locate the project being documented when it differs from the current working directory. |
| `SDD_WORK_ROOT` | Overrides the resolved path to the working root where `.sdd-forge/` configuration and output directories are stored. Used by `sdd-forge.js` alongside `SDD_SOURCE_ROOT` to support split source/work directory layouts. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
