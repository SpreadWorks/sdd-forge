<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from a single JSON file located at `.sdd-forge/config.json`, with optional supplementary data drawn from the project's `package.json`. The configuration covers documentation output language and style, AI agent provider settings, source scanning rules, SDD workflow behavior, and GitHub CLI integration, giving each project fine-grained control over how documentation is generated and how the development workflow operates.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. Loaded and schema-validated on every command invocation. An error is thrown immediately if the file is missing or fails validation. |
| `package.json` | `<project-root>/package.json` | Supplementary project metadata. Read on demand via `loadPackageField()` to retrieve arbitrary fields such as `name` or `version`. Returns `undefined` silently if the file does not exist or cannot be parsed. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | — | Language code used when resolving preset templates and generating output (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Preset type identifier(s) that define the chapter structure (e.g., `"node-cli"` or `["node", "cli"]`). |
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | Ordered list of language codes for generated documentation. Must contain at least one entry. |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must be one of the values listed in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls whether additional languages are produced by translating the default-language output or generated independently. |
| `docs.style` | Optional | object | — | AI writing style settings. When omitted, preset defaults apply. |
| `docs.style.purpose` | Required (if `docs.style` present) | string | — | Short description of the project's purpose, injected into AI writing prompts. |
| `docs.style.tone` | Required (if `docs.style` present) | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to all generated documentation text. |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction appended to every AI writing prompt. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation generation. |
| `docs.enrichBatchSize` | Optional | number | — | Maximum number of source entries processed per batch during the enrich phase. |
| `docs.enrichBatchLines` | Optional | number | — | Maximum total lines processed per batch during the enrich phase. |
| `concurrency` | Optional | number | `5` | Maximum number of simultaneous AI agent calls. Must be a positive integer. |
| `chapters` | Optional | object[] | — | Project-specific chapter order, overriding the preset default. Each entry: `{ chapter: "name.md", desc?: string, exclude?: boolean }`. |
| `agent.default` | Optional | string | — | Key of the provider in `agent.providers` to use when no provider is explicitly requested. |
| `agent.workDir` | Optional | string | — | Working directory passed to agent processes. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds applied to each agent invocation. Must be a positive number. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. Must be a positive number. |
| `agent.providers.<name>.command` | Required (if provider defined) | string | — | Executable name or path for the provider (e.g., `"claude"`). |
| `agent.providers.<name>.args` | Required (if provider defined) | string[] | — | Fixed command-line arguments passed to the provider on every invocation. |
| `agent.providers.<name>.timeoutMs` | Optional | number | — | Provider-specific timeout in milliseconds, overrides `agent.timeout`. |
| `agent.providers.<name>.systemPromptFlag` | Optional | string | — | CLI flag name used to supply a system prompt to this provider. |
| `scan.include` | Required (if `scan` present) | string[] | — | Glob patterns identifying source files to include in scanning. Must be non-empty. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied when finalizing an SDD flow. |
| `flow.push.remote` | Optional | string | — | Git remote name to push to after merging (e.g., `"origin"`). |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Enables or disables the GitHub CLI integration for pull-request creation during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Writing style**

Set `docs.style` to influence the tone and focus of every generated document. The `purpose` field is injected into prompts so the AI understands the project's goal; `tone` selects the register; `customInstruction` appends any project-specific writing rules.

```json
"docs": {
  "languages": ["en"],
  "defaultLanguage": "en",
  "style": {
    "purpose": "A CLI tool for backend developers automating code review workflows",
    "tone": "formal",
    "customInstruction": "Avoid marketing language. Prefer concrete examples over abstract descriptions."
  }
}
```

**AI agent provider**

Define one or more named providers under `agent.providers` and set `agent.default` to select which one is used by default. Each provider requires a `command` and an `args` array.

```json
"agent": {
  "default": "claude",
  "timeout": 120000,
  "retryCount": 2,
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--output-format", "json", "--max-turns", "1"]
    }
  }
}
```

**Concurrency**

Set `concurrency` to control how many agent calls run in parallel. The default is `5`. Reduce the value if rate limits are a concern; increase it on projects with many chapters and a provider that supports higher throughput.

```json
"concurrency": 3
```

**Source scanning**

Use `scan.include` to specify which source files are analyzed, and `scan.exclude` to remove files that should not contribute to documentation (e.g., generated code, test fixtures).

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js", "src/generated/**"]
}
```

**Chapter order**

Override the preset-defined chapter order with a `chapters` array. Each entry must include `chapter` (filename) and may include `desc` (used in prompts) or `exclude: true` to suppress a chapter entirely.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "configuration.md", "desc": "Config schema and environment setup" },
  { "chapter": "cli_commands.md", "exclude": false }
]
```

**SDD workflow merge strategy**

Set `flow.merge` to control the git strategy used when an SDD flow is finalized, and `flow.push.remote` to enable automatic pushing after merge.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
}
```

**GitHub CLI integration**

Set `commands.gh` to `"enable"` to allow the flow finalization step to open a pull request automatically via the GitHub CLI, or `"disable"` to skip that step.

```json
"commands": {
  "gh": "enable"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The configuration module files analyzed for this chapter (`src/lib/config.js` and `src/lib/types.js`) contain no `process.env` references. Environment variables used by the tool are read in other modules and are outside the scope of the configuration loader.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
