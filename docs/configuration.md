<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single JSON file that controls every aspect of its behavior, from documentation language and writing style to AI agent settings, source scanning patterns, and Git flow strategy. Users can tailor documentation output, agent execution, and workflow automation without touching the source code.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file; loaded and schema-validated by `loadConfig()` on every command run |
| `package.json` | `<project-root>/package.json` | Supplementary metadata source; individual fields are read on demand via `loadPackageField()` and the file is silently skipped if absent |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level block for all documentation generation settings |
| `docs.languages` | Required | string[] | — | Non-empty list of output language codes (e.g., `["en", "ja"]`) |
| `docs.defaultLanguage` | Required | string | — | Primary output language; must be one of the values in `docs.languages` |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls whether secondary languages are translated from the default or generated independently |
| `docs.style` | Optional | object | — | Writing style overrides for AI-generated content |
| `docs.style.purpose` | Required (if `docs.style` set) | string | — | A non-empty string describing the intended purpose of the documentation |
| `docs.style.tone` | Required (if `docs.style` set) | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to all generated text |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction passed to the AI writer |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation output |
| `docs.enrichBatchSize` | Optional | number | — | Number of entries processed per batch during the enrich step |
| `docs.enrichBatchLines` | Optional | number | — | Maximum source lines included per enrich batch |
| `lang` | Required | string | — | Language code for the project itself (e.g., `"en"`) |
| `type` | Required | string \| string[] | — | Preset type(s) to apply (e.g., `"node-cli"` or `["node", "cli"]`) |
| `concurrency` | Optional | number | `5` | Maximum number of parallel agent invocations (`DEFAULT_CONCURRENCY = 5`) |
| `chapters` | Optional | array | — | Array of chapter objects controlling order and inclusion |
| `chapters[].chapter` | Required | string | — | Chapter filename relative to the docs directory (e.g., `"overview.md"`) |
| `chapters[].desc` | Optional | string | — | Description override for the chapter |
| `chapters[].exclude` | Optional | boolean | — | When `true`, the chapter is omitted from the output |
| `agent.workDir` | Optional | string | — | Working directory for spawned agent processes |
| `agent.timeout` | Optional | number (ms) | — | Timeout in milliseconds for a single agent invocation |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure (must be ≥ 1) |
| `agent.providers.<name>.command` | Required (per provider) | string | — | Executable name or path for the named agent provider |
| `agent.providers.<name>.args` | Required (per provider) | string[] | — | Argument array prepended when invoking the provider command |
| `scan.include` | Required (if `scan` set) | string[] | — | Non-empty list of glob patterns that determine which files are scanned |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to skip during scanning |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when the SDD flow finalizes a branch |
| `flow.push.remote` | Optional | string | — | Remote name used for automatic pushes during the flow (e.g., `"origin"`) |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the GitHub CLI (`gh`) is used for pull-request operations |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation languages and style**

Set the languages you want to publish and how text should sound:

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate",
    "style": {
      "purpose": "Developer-facing reference for a CLI tool",
      "tone": "formal",
      "customInstruction": "Prefer active voice and concise sentences."
    }
  }
}
```

**Preset type**

Select one or more preset types to control which documentation chapters and scan rules are applied:

```json
{ "type": "node-cli" }
```

or for a combined stack:

```json
{ "type": ["node", "cli"] }
```

**Source file scanning**

Define exactly which files are analysed. Use `scan.include` for glob patterns to include and `scan.exclude` for patterns to skip:

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**Chapter ordering and exclusion**

Override the preset chapter order or hide specific chapters without editing the preset:

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

**Agent concurrency and providers**

Control how many agents run in parallel and register alternative AI providers:

```json
{
  "concurrency": 3,
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
}
```

**Flow and Git integration**

Choose the merge strategy and whether the GitHub CLI is used for pull requests:

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

The configuration loading module (`config.js`) and the schema validation module (`types.js`) do not reference any environment variables directly. All configuration values are read exclusively from files on disk (`.sdd-forge/config.json` and `package.json`). Environment variables used by the broader CLI — such as those that resolve the project root — are handled in the top-level dispatcher layer, outside the configuration module.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
