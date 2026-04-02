<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads a project-level `config.json` placed inside the `.sdd-forge/` directory alongside the root `package.json`, together covering a broad range of configurable items including documentation language, project type, source scan patterns, AI agent settings, chapter ordering, and flow behavior.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Read by `loadConfig()` in `src/lib/config.js` and validated by `validateConfig()` before use. |
| `package.json` | `<project-root>/package.json` | Root package manifest. Individual fields are read on demand by `loadPackageField()` in `src/lib/config.js`. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `lang` | Required | `string` | — | Primary language for documentation output. |
| `type` | Required | `string \| string[]` | — | Project type identifier (e.g. `"node-cli"`). Selects the documentation preset. |
| `docs` | Required | `object` | — | Top-level documentation settings container. |
| `docs.languages` | Required | `string[]` | — | List of output languages. Must contain at least one entry. |
| `docs.defaultLanguage` | Required | `string` | — | Primary output language. Must be a member of `docs.languages`. |
| `docs.mode` | Optional | `"translate" \| "generate"` | `"translate"` | Controls whether additional languages are translated from the default or independently generated. |
| `docs.style` | Optional | `object` | — | Writing style hints for AI-generated documentation. |
| `docs.style.purpose` | Required if `docs.style` present | `string` | — | Short description of the document's purpose. |
| `docs.style.tone` | Required if `docs.style` present | `"polite" \| "formal" \| "casual"` | — | Desired tone for generated text. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional free-form instruction passed to the AI writer. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for files to exclude from documentation. |
| `concurrency` | Optional | `number` | `5` | Maximum number of parallel AI requests. Must be a positive integer. |
| `chapters` | Optional | `Array<{ chapter: string, desc?: string, exclude?: boolean }>` | — | Ordered list of chapter files, overriding the preset default order. |
| `agent.workDir` | Optional | `string` | — | Working directory passed to the agent subprocess. |
| `agent.timeout` | Optional | `number` | — | Timeout in milliseconds for each agent invocation. |
| `agent.retryCount` | Optional | `number` | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Maximum token budget per batch sent to the agent. |
| `agent.providers` | Optional | `object` | — | Named map of agent provider definitions. Each entry requires `command` (string) and `args` (array). |
| `scan.include` | Required if `scan` present | `string[]` | — | Glob patterns specifying source files to scan. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash" \| "ff-only" \| "merge"` | — | Git merge strategy used when finalizing a flow. |
| `flow.push.remote` | Optional | `string` | — | Git remote name used for push operations in a flow. |
| `flow.commands.context.search.mode` | Optional | `"ngram" \| "ai"` | — | Context search strategy used during flow execution. |
| `commands.gh` | Optional | `"enable" \| "disable"` | — | Controls whether `gh` CLI commands (e.g. PR creation) are permitted in flows. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation language and project type**
Set `lang` and `docs.languages` to control output language, and `type` to select the documentation preset that determines chapter structure.
```json
{
  "lang": "en",
  "type": "node-cli",
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en"
  }
}
```

**Writing style**
Supply `docs.style` to guide the AI writer's tone and purpose. The `customInstruction` field accepts any free-form directive.
```json
{
  "docs": {
    "style": {
      "purpose": "Developer reference for internal tooling",
      "tone": "formal",
      "customInstruction": "Avoid passive voice. Keep sentences concise."
    }
  }
}
```

**Chapter ordering**
Override the preset chapter order with a `chapters` array. Set `exclude: true` on any entry to omit that chapter from the output.
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

**Source scan patterns**
Define which files are analysed by providing `scan.include` globs and optionally `scan.exclude` to filter out generated or vendored paths.
```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/vendor/**"]
  }
}
```

**AI agent settings**
Tune concurrency, timeouts, and provider configuration under the `agent` key. Multiple named providers can be registered and referenced by name.
```json
{
  "concurrency": 3,
  "agent": {
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 8000,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    }
  }
}
```

**Flow behavior**
Control how branches are merged and whether the `gh` CLI is permitted for automated pull-request creation.
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

| Environment Variable | Purpose |
|---|---|
| `SDD_SOURCE_ROOT` | Overrides the source project root directory resolved by `sdd-forge.js`. When set, the tool treats this path as the project root instead of the current working directory. |
| `SDD_WORK_ROOT` | Overrides the working directory used for `.sdd-forge/` output. Allows the configuration and generated files to be stored in a location separate from the source root. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
