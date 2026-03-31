<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single project-level file, `.sdd-forge/config.json`, which governs documentation output languages, project type selection, AI agent behavior, chapter ordering, source scan patterns, and flow merge strategy. Customization points range from writing tone and multi-language routing to GitHub CLI integration and concurrent agent execution limits.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Read by `loadConfig()` and fully validated by `validateConfig()`. Controls all documentation, agent, scan, flow, and chapter settings. |
| `package.json` | Project root | Read by `loadPackageField()` to retrieve individual fields (such as `name` or `version`) for use during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level documentation output configuration block. |
| `docs.languages` | Required | string[] | — | List of output language codes (e.g., `["en", "ja"]`). Must be non-empty. |
| `docs.defaultLanguage` | Required | string | — | Primary language code; must be present in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How non-default language documents are produced. |
| `docs.style.purpose` | Required if `style` set | string | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required if `style` set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to AI-generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional freeform instruction appended to AI prompts. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for files to exclude from documentation output. |
| `lang` | Required | string | — | Language code for the project's primary interface language (used for help and CLI output). |
| `type` | Required | string \| string[] | — | Preset type identifier(s) (e.g., `"laravel"`, `["node-cli", "library"]`). |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI agent calls. Must be a positive integer. |
| `chapters` | Optional | object[] | — | Ordered list of `{ chapter, desc?, exclude? }` objects defining document chapter names and order. |
| `agent.workDir` | Optional | string | — | Working directory passed to the agent subprocess. |
| `agent.timeout` | Optional | number | — | Agent call timeout in milliseconds. Must be a positive integer. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent call failure. Must be a positive integer. |
| `agent.providers.<name>.command` | Required per provider | string | — | Shell command used to invoke the named AI agent provider. |
| `agent.providers.<name>.args` | Required per provider | string[] | — | Arguments array passed to the agent command. |
| `scan.include` | Required if `scan` set | string[] | — | Glob patterns specifying files to include in source scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns specifying files to exclude from source scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied when finalizing a Spec-Driven Development flow. |
| `flow.push.remote` | Optional | string | — | Git remote name used for push operations during flow finalization. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the GitHub CLI (`gh`) is invoked during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation languages and mode**

Configure multiple output languages and control how non-default language documents are generated. The `mode` field determines whether secondary-language documents are produced by translation or independent generation.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Documentation style**

Customize the writing tone and purpose of AI-generated documentation. An optional `customInstruction` string is appended directly to AI prompts.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Avoid marketing language. Prefer concise technical descriptions."
    }
  }
}
```

**Project type (preset selection)**

The `type` field selects one or more preset bundles that define which DataSources and templates are applied during scanning and documentation generation. Multiple types can be combined as an array.

```json
{ "type": ["node-cli", "library"] }
```

**Chapter ordering and exclusion**

The `chapters` array explicitly controls the document chapter order and allows individual chapters to be excluded from output without removing their source files.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "configuration.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**AI agent provider**

A custom agent provider can be configured to replace the default AI command. Each provider entry specifies the executable and its argument list.

```json
{
  "agent": {
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "custom": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    }
  }
}
```

**Scan scope**

The `scan.include` and `scan.exclude` arrays constrain which source files are analysed, using glob patterns relative to the project root.

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/**/*.test.js"]
  }
}
```

**Flow merge strategy and GitHub CLI**

The `flow.merge` strategy and `commands.gh` toggle govern how branches are merged and whether the `gh` CLI is used when completing a Spec-Driven Development flow.

```json
{
  "flow": { "merge": "squash", "push": { "remote": "origin" } },
  "commands": { "gh": "enable" }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Overrides the source root directory that `sdd-forge.js` uses to locate the target project. When set, the tool resolves the project context from this path instead of the current working directory. |
| `SDD_WORK_ROOT` | Overrides the working root directory used by the tool for output and temporary files. When set, `.sdd-forge/` directories and generated output are resolved relative to this path. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
