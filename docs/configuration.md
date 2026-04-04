<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/configuration.md) | **English**
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads a single JSON configuration file placed inside your project's `.sdd-forge/` directory and exposes a broad range of settings covering documentation output language, writing style, source-scanning patterns, AI agent behavior, chapter ordering, and Git flow strategy. Validation is enforced at load time, reporting all constraint violations at once so you can correct every issue in one pass.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded by `loadConfig()` and fully validated by `validateConfig()` on every read. |
| `package.json` | `<project-root>/package.json` | Read on demand by `loadPackageField()` to retrieve individual fields such as `name` or `version`. Not validated by sdd-forge. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | — | Language code for the generated documentation (e.g., `"en"`). |
| `type` | Required | string \| string[] | — | Project preset identifier (e.g., `"node-cli"`, `"laravel"`). An array selects multiple presets. |
| `docs` | Required | object | — | Top-level documentation output configuration. |
| `docs.languages` | Required | string[] | — | Non-empty list of output language codes (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Default output language; must be a member of `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls whether secondary-language docs are produced by translation or independent generation. |
| `docs.style` | Optional | object | — | Writing-style hints passed to the AI text generator. |
| `docs.style.purpose` | Required if `docs.style` present | string | — | Short description of the documentation's intended audience and purpose. |
| `docs.style.tone` | Required if `docs.style` present | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to all generated prose. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to AI generation prompts. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to omit from documentation. |
| `concurrency` | Optional | number | `5` | Maximum number of simultaneous AI requests. |
| `chapters` | Optional | object[] | — | Per-project chapter ordering overrides. Each entry: `{ chapter: "name.md", desc?: string, exclude?: boolean }`. |
| `agent.workDir` | Optional | string | — | Working directory used when invoking the AI agent process. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for a single agent call. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Upper token limit per AI request batch. |
| `agent.providers` | Optional | object | — | Named AI provider definitions. Each entry requires `command` (string) and `args` (array). |
| `scan.include` | Required if `scan` present | string[] | — | Glob patterns that define which source files are scanned. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files excluded from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by flow finalization commands. |
| `flow.push.remote` | Optional | string | — | Git remote name used when the flow pushes branches. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Strategy for context retrieval during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Enables or disables GitHub CLI integration in flow commands. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation style**

Set `docs.style` to control how the AI writes prose across all generated chapters.

```json
"docs": {
  "style": {
    "purpose": "Internal reference for backend engineers",
    "tone": "formal",
    "customInstruction": "Prefer imperative mood and avoid passive voice."
  }
}
```

**Multi-language output**

Define multiple languages in `docs.languages` and choose a default. Set `docs.mode` to `"generate"` to produce each language independently rather than by translation.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "generate"
}
```

**Chapter ordering**

Override the preset's default chapter sequence or exclude chapters for the current project.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "cli_commands.md" },
  { "chapter": "configuration.md", "desc": "Project-specific config guide" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Concurrency**

Adjust the number of parallel AI requests to match your API rate limits.

```json
"concurrency": 3
```

**Agent providers**

Register one or more named AI providers with custom invocation commands.

```json
"agent": {
  "default": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5"]
    }
  },
  "timeout": 120000,
  "retryCount": 2
}
```

**Source scanning scope**

Use `scan.include` and `scan.exclude` to limit which files are analysed.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js", "src/fixtures/**"]
}
```

**Flow merge strategy**

Control how feature branches are merged when a flow is finalized.

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The configuration source files (`src/lib/config.js` and `src/lib/types.js`) do not reference any environment variables directly. Environment variable handling for sdd-forge (such as project root resolution) is performed in the top-level CLI entry point rather than in the configuration layer, and falls outside the scope of the analyzed files.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
