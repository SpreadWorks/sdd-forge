<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from `.sdd-forge/config.json` and the project's `package.json`, covering settings such as documentation languages, project type, AI agent behavior, source scanning targets, and SDD workflow options. Customization spans writing style and tone, chapter ordering, concurrency limits, merge strategy, and external command integrations.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. Defines documentation languages, project type, agent settings, scan targets, chapter overrides, and flow behavior. Loaded and validated by `src/lib/config.js` via `loadConfig()`. |
| `package.json` | `<project-root>/package.json` | Project package manifest. Read for arbitrary fields via `loadPackageField()` in `src/lib/config.js`. Used to retrieve metadata such as package name during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | `string` | — | Language code for the project (e.g., `"en"`, `"ja"`). |
| `type` | Required | `string` \| `string[]` | — | Project type identifier(s) determining the preset chain (e.g., `"node-cli"`). Must be a non-empty string or non-empty array of strings. |
| `docs` | Required | `object` | — | Top-level documentation generation settings. |
| `docs.languages` | Required | `string[]` | — | Non-empty list of output languages for generated documentation. |
| `docs.defaultLanguage` | Required | `string` | — | Default output language. Must be a value present in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Documentation generation mode. |
| `docs.style` | Optional | `object` | — | Writing style settings applied to generated documentation. |
| `docs.style.purpose` | Required if `docs.style` is set | `string` | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied throughout generated content. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional freeform instructions passed to the documentation AI. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from documentation generation. |
| `concurrency` | Optional | `number` (≥ 1) | `5` | Maximum number of concurrent AI agent tasks. |
| `chapters` | Optional | `object[]` | — | Overrides chapter order and inclusion. Each entry: `{ chapter: string, desc?: string, exclude?: boolean }`. |
| `agent.workDir` | Optional | `string` | — | Working directory for agent execution. |
| `agent.timeout` | Optional | `number` (≥ 1) | — | Agent task timeout in milliseconds. |
| `agent.retryCount` | Optional | `number` (≥ 1) | — | Number of retries on agent task failure. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Maximum token count per agent batch request. |
| `agent.providers` | Optional | `object` | — | Named agent provider definitions. Each key maps to `{ command: string, args: string[] }`. |
| `scan.include` | Required if `scan` is set | `string[]` | — | Non-empty glob patterns specifying source files to include in scanning. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when finalizing an SDD flow. |
| `flow.push.remote` | Optional | `string` | — | Git remote name for push operations during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search strategy used during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used in flow operations. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation Style and Tone**

Set `docs.style` to control how generated documentation is written. The `purpose` field describes the intended audience, `tone` selects one of three writing registers, and `customInstruction` passes additional freeform guidance to the AI.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal technical reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Always include code examples where applicable."
    }
  }
}
```

**Chapter Order and Exclusion**

Use `chapters` in `config.json` to reorder chapters or mark specific ones as excluded. The order of entries in the array defines the output order, overriding the preset default.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md" },
    { "chapter": "configuration.md", "desc": "Configuration reference" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**Concurrency**

Set `concurrency` to limit the number of parallel AI agent tasks. The default is `5`.

```json
{ "concurrency": 3 }
```

**Agent Providers**

Define named agent providers under `agent.providers` to control how AI agents are invoked. Each provider specifies a `command` and an `args` array.

```json
{
  "agent": {
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    },
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2
  }
}
```

**Flow Behavior**

Configure the SDD flow merge strategy and push remote:

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" },
    "commands": { "context": { "search": { "mode": "ai" } } }
  }
}
```

**Source Scanning Scope**

Control which files are analyzed by the `sdd-forge scan` command using glob patterns:

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js"]
  }
}
```

**GitHub CLI Integration**

Enable or disable GitHub CLI usage in flow operations:

```json
{ "commands": { "gh": "enable" } }
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Overrides the source project root directory. Used by `sdd-forge.js` to resolve the project context when the tool is invoked from outside the target project directory. |
| `SDD_WORK_ROOT` | Overrides the working root directory for sdd-forge operations. Used alongside `SDD_SOURCE_ROOT` in `sdd-forge.js` to establish the correct project context at runtime. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
