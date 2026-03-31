<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from a single JSON file stored in the `.sdd-forge/` directory and optionally supplements it with data from `package.json`. The configuration covers documentation output languages and style, project type selection, source scan targets, AI agent behavior, SDD workflow options, and chapter ordering.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. Loaded by `loadConfig()` and fully validated against the schema before any command runs. Required for all sdd-forge operations. |
| `package.json` | `<project root>/package.json` | Supplementary metadata source. Individual fields are accessed safely via `loadPackageField()`, which returns `undefined` if the file is absent or unparseable, without halting execution. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level documentation output configuration block. |
| `docs.languages` | Required | string[] | — | List of output language codes (e.g., `["en", "ja"]`). Must contain at least one entry. |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must be one of the values listed in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Multi-language generation mode. `translate` generates the default language first and translates; `generate` produces each language independently. |
| `docs.style` | Optional | object | — | Writing style hints passed to the AI documentation writer. |
| `docs.style.purpose` | Required if `docs.style` present | string | — | Describes the intended audience and purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` present | `"polite"` \| `"formal"` \| `"casual"` | — | Tone used in AI-generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional freeform instruction appended to AI writing prompts. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for documentation chapters to skip during generation. |
| `lang` | Required | string | — | Language code for project context and AI prompts (e.g., `"en"`, `"ja"`). Readable independently via `loadLang()` without full validation. Defaults to `"en"` when unreadable. |
| `type` | Required | string \| string[] | — | Project type identifier(s) selecting the documentation preset (e.g., `"node-cli"` or `["node", "cli"]`). |
| `concurrency` | Optional | number | `5` | Maximum number of parallel AI tasks. Must be a positive integer. Resolved via `resolveConcurrency()`. |
| `chapters` | Optional | object[] | — | Custom chapter list overriding preset ordering and metadata. |
| `chapters[i].chapter` | Required | string | — | Chapter filename (e.g., `"overview.md"`). |
| `chapters[i].desc` | Optional | string | — | Human-readable description of the chapter's content. |
| `chapters[i].exclude` | Optional | boolean | — | When `true`, the chapter is excluded from documentation builds. |
| `agent.workDir` | Optional | string | — | Working directory for agent subprocess execution. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds per agent invocation. Must be a positive integer. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. Must be a positive integer. |
| `agent.providers.<name>.command` | Required if provider defined | string | — | Executable command for the named agent provider. |
| `agent.providers.<name>.args` | Required if provider defined | array | — | Argument list passed to the agent provider command. |
| `scan.include` | Required if `scan` present | string[] | — | Glob patterns specifying source files to include in scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns specifying source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when finalizing an SDD flow. |
| `flow.push.remote` | Optional | string | — | Git remote name used when pushing during flow finalization. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the GitHub CLI (`gh`) is invoked for pull request creation during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation languages and mode**

You can configure one or more output languages and choose whether additional languages are produced by translation or independent generation.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate"
}
```

**Writing style**

Provide a purpose statement and tone to guide AI-generated documentation. An optional `customInstruction` field accepts any additional directive.

```json
"docs": {
  "style": {
    "purpose": "Developer reference for contributors",
    "tone": "formal",
    "customInstruction": "Use active voice and include code examples where possible."
  }
}
```

**Chapter ordering and exclusion**

Override the preset chapter list to reorder, annotate, or exclude specific chapters from builds.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "cli_commands.md", "desc": "All CLI subcommands" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Source scan targets**

Specify which files are analyzed during the `scan` phase using glob patterns.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js"]
}
```

**Concurrency**

Control how many AI tasks run in parallel. The built-in default is `5`.

```json
"concurrency": 3
```

**Agent providers**

Register named agent provider configurations, each specifying an executable and its argument list.

```json
"agent": {
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

**Flow merge strategy**

Choose the Git merge strategy applied when an SDD flow is finalized.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
}
```

**GitHub CLI integration**

Enable or disable automatic pull request creation via `gh` during flow finalization.

```json
"commands": {
  "gh": "enable"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The two configuration module files (`src/lib/config.js` and `src/lib/types.js`) included in this analysis do not reference environment variables directly. All project settings are read exclusively from `.sdd-forge/config.json` and `package.json` on disk. Configuration is entirely file-driven; there are no environment variable overrides defined within the configuration layer itself.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
