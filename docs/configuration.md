<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge stores its project configuration in a single JSON file located under the `.sdd-forge/` directory, validated against a strict schema every time a command is invoked. Configurable items span documentation output languages and writing style, project type, AI agent behavior, source file scan patterns, flow merge strategy, and GitHub CLI integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Read by `loadConfig()` and passed through full schema validation via `validateConfig()` on every invocation. |
| `package.json` | `<project-root>/package.json` | Project package manifest. Arbitrary fields are read on demand via `loadPackageField()` to supplement configuration context (e.g., package name, version). |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | — | Language code for the project (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Preset type identifier(s) (e.g., `"node-cli"`, `"laravel"`). May be a single string or an array for multi-type projects. |
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | Non-empty list of output language codes to generate documentation for. |
| `docs.defaultLanguage` | Required | string | — | Default output language. Must be present in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Whether additional languages are produced by translation or by independent generation. |
| `docs.style` | Optional | object | — | Writing style settings applied to AI-generated text. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | Free-text description of the documentation's intended purpose. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to all generated content. |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form writing instructions forwarded to the AI. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for files to exclude from documentation output. |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI requests. |
| `chapters` | Optional | object[] | — | Project-specific chapter order overrides. Each entry requires a `chapter` (string) field; `desc` (string) and `exclude` (boolean) are optional. |
| `agent.workDir` | Optional | string | — | Working directory for agent process execution. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for individual agent calls. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token count per agent batch request. |
| `agent.default` | Optional | string | — | Key of the default entry under `agent.providers`. |
| `agent.providers.<name>.command` | Required if provider defined | string | — | Executable command for the named agent provider. |
| `agent.providers.<name>.args` | Required if provider defined | array | — | Command-line arguments passed to the agent provider executable. |
| `scan.include` | Required if `scan` is set | string[] | — | Glob patterns specifying source files to include in scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns specifying source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when finalizing a flow. |
| `flow.push.remote` | Optional | string | — | Git remote name used for push operations during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search mode used for context retrieval during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Enables or disables GitHub CLI (`gh`) integration for flow commands. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

The following areas can be customized by editing `.sdd-forge/config.json`.

**Documentation languages and generation mode**

Control which languages are generated and whether additional languages are produced via translation or independently:

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

Define the purpose, tone, and optional custom instructions applied to all AI-generated text:

```json
{
  "docs": {
    "style": {
      "purpose": "Internal technical reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Always include parameter types in descriptions."
    }
  }
}
```

**Source file scan scope**

Restrict or broaden which files are included in source analysis:

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/tests/**", "src/**/*.spec.js"]
  }
}
```

**Chapter ordering**

Override the preset's default chapter order or exclude specific chapters from output:

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "configuration.md" },
    { "chapter": "cli_commands.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**AI agent behavior**

Adjust concurrency, timeouts, retry behavior, and define custom agent providers:

```json
{
  "concurrency": 3,
  "agent": {
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 8000,
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    }
  }
}
```

**Flow behavior and GitHub CLI integration**

Set the merge strategy for flow finalization and enable GitHub CLI support:

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

The configuration source files analyzed for this chapter (`src/lib/config.js`, `src/lib/types.js`) do not reference environment variables directly. Environment variable resolution occurs in the tool's top-level entry point (`sdd-forge.js`) rather than in the configuration loading layer.

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Overrides the detected project source root directory used when resolving source files for analysis. |
| `SDD_WORK_ROOT` | Overrides the working root directory used for output paths and configuration file resolution. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
