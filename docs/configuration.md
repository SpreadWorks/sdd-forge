<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads two configuration files — `package.json` at the project root and `config.json` inside the `.sdd-forge/` directory — to control every aspect of documentation generation and workflow execution. Configurable items span language output settings, project type classification, AI agent behavior, scan scope, chapter ordering, and GitHub integration, each with a defined set of accepted values enforced at load time.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded by `loadConfig()` in `src/lib/config.js` and validated through `validateConfig()` in `src/lib/types.js`. Controls documentation output, agent settings, scan scope, and workflow behavior. |
| `package.json` | `<project-root>/package.json` | npm package manifest. Read on demand by `loadPackageField()` in `src/lib/config.js` to retrieve arbitrary top-level fields (e.g., `name`, `version`) for use in documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | `string` | — | Primary language code for the project (e.g., `"en"`, `"ja"`). |
| `type` | Required | `string` \| `string[]` | — | Project preset type (e.g., `"node-cli"`). Determines which preset chain is loaded. |
| `docs` | Required | `object` | — | Top-level documentation settings container. |
| `docs.languages` | Required | `string[]` | — | List of output languages. Must be a non-empty array. |
| `docs.defaultLanguage` | Required | `string` | — | Default output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls whether additional language docs are translated from the default or generated independently. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for files to exclude from documentation output. |
| `docs.style` | Optional | `object` | — | Writing style overrides. When present, both `purpose` and `tone` are required. |
| `docs.style.purpose` | Required (if `docs.style`) | `string` | — | Short description of the documentation's intended audience and goal. |
| `docs.style.tone` | Required (if `docs.style`) | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to all generated prose. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional free-form instruction appended to AI generation prompts. |
| `concurrency` | Optional | `number` (≥ 1) | `5` | Maximum number of concurrent AI requests during documentation generation. |
| `chapters` | Optional | `object[]` | — | Array of `{ chapter, desc?, exclude? }` objects overriding the preset chapter order. |
| `chapters[].chapter` | Required (each entry) | `string` | — | Filename of the chapter (e.g., `"overview.md"`). |
| `chapters[].desc` | Optional | `string` | — | Human-readable description of the chapter. |
| `chapters[].exclude` | Optional | `boolean` | — | When `true`, the chapter is omitted from the build. |
| `agent.workDir` | Optional | `string` | — | Working directory passed to the agent subprocess. |
| `agent.timeout` | Optional | `number` (≥ 1) | — | Timeout in milliseconds for each agent invocation. |
| `agent.retryCount` | Optional | `number` (≥ 1) | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Maximum token budget per batch request. |
| `agent.providers` | Optional | `object` | — | Map of named provider configs, each requiring `command` (string) and `args` (array). |
| `scan.include` | Required (if `scan`) | `string[]` | — | Glob patterns for source files to include in analysis. Must be non-empty. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from analysis. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when finalizing an SDD flow. |
| `flow.push.remote` | Optional | `string` | — | Remote name to push to during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search strategy used during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation language and mode**
Set `docs.languages`, `docs.defaultLanguage`, and `docs.mode` to control which languages are generated and how secondary languages are produced.
```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Writing style**
Provide `docs.style` to adjust the tone and purpose of all AI-generated prose. The optional `customInstruction` field appends free-form guidance to every generation prompt.
```json
{
  "docs": {
    "style": {
      "purpose": "Internal reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Use active voice and avoid jargon."
    }
  }
}
```

**Scan scope**
Use `scan.include` and `scan.exclude` to define exactly which source files are analysed. Both fields accept glob patterns.
```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js"]
  }
}
```

**Chapter ordering**
Override the preset chapter order with a `chapters` array. Set `exclude: true` on any entry to omit that chapter entirely from the build.
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

**AI agent concurrency and limits**
Tune `concurrency`, `agent.timeout`, `agent.retryCount`, and `agent.batchTokenLimit` to match the capacity of your AI provider.
```json
{
  "concurrency": 3,
  "agent": {
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 8000
  }
}
```

**Agent providers**
Define one or more named providers under `agent.providers`. Each entry must specify the `command` to invoke and the `args` array to pass.
```json
{
  "agent": {
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "json"]
      }
    }
  }
}
```

**Flow and GitHub integration**
Set `flow.merge` to control the Git merge strategy and `commands.gh` to enable or disable GitHub CLI usage during flow finalization.
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
| `SDD_SOURCE_ROOT` | Absolute path to the source project root. Set by the harness to tell `sdd-forge.js` which directory contains the project's source code and `.sdd-forge/` config folder. |
| `SDD_WORK_ROOT` | Absolute path to the working directory used during flow execution. Allows the tool to separate the source tree from any temporary or output directories used by the running flow. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
