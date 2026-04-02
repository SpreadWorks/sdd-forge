<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads its project configuration from a single JSON file located under the `.sdd-forge/` directory, complemented by the project's `package.json` for package-level metadata. The configuration covers documentation output languages, source scanning rules, agent behavior, flow control, chapter ordering, and writing style, giving users fine-grained control over how the tool analyzes and generates project documentation.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Main project configuration file. Loaded and validated by `loadConfig()` in `src/lib/config.js`. Defines documentation languages, scanning rules, agent settings, flow options, and chapter ordering. |
| `package.json` | `<project-root>/package.json` | Standard Node.js package manifest. Read by `loadPackageField()` to retrieve arbitrary top-level fields (e.g., `name`, `version`) for use during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `lang` | Required | string | — | Primary language code for the project (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Project preset type(s). Determines which preset template chain is applied (e.g., `"node-cli"`, `"laravel"`). |
| `docs` | Required | object | — | Top-level documentation output settings container. |
| `docs.languages` | Required | string[] | — | List of language codes for which documentation is generated. Must be non-empty. |
| `docs.defaultLanguage` | Required | string | — | Default output language. Must be one of the values listed in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Documentation generation mode. `translate` derives additional languages from the default; `generate` creates each language independently. |
| `docs.style` | Optional | object | — | Controls the writing tone and purpose of generated documentation. |
| `docs.style.purpose` | Required if `docs.style` set | string | — | Describes the intended audience or purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to AI-generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction passed to the AI during documentation generation. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation generation. |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI agent calls. Must be a positive integer. |
| `chapters` | Optional | object[] | — | Overrides the preset-defined chapter order. Each entry requires a `chapter` string (filename); optional `desc` (string) and `exclude` (boolean) fields. |
| `scan.include` | Required if `scan` set | string[] | — | Glob patterns specifying which source files to include during scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from scanning. |
| `agent.workDir` | Optional | string | — | Working directory for the agent process. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for each agent invocation. Must be a positive number. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent call failure. Must be a positive number. |
| `agent.batchTokenLimit` | Optional | number | — | Maximum token limit per batch. Must be ≥ 1000. |
| `agent.providers` | Optional | object | — | Named map of agent provider definitions. Each provider requires a `command` string and an `args` array. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied when finalizing a flow branch. |
| `flow.push.remote` | Optional | string | — | Remote name used when pushing the flow branch. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search strategy used during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether `gh` CLI integration is active during flow finalization. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation Languages and Mode**

Configure the set of output languages and how additional languages are produced:

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Writing Style**

Control the tone and purpose of AI-generated documentation. The `tone` field accepts `"polite"`, `"formal"`, or `"casual"`. The optional `customInstruction` field passes additional guidance directly to the AI:

```json
{
  "docs": {
    "style": {
      "purpose": "Internal developer reference for onboarding engineers",
      "tone": "formal",
      "customInstruction": "Always include code examples for CLI commands."
    }
  }
}
```

**Source Scanning Scope**

Define which files are included or excluded from analysis using glob patterns:

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/generated/**"]
  }
}
```

**Chapter Ordering**

Override the preset-defined chapter order. Set `exclude: true` to omit a chapter from the output:

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md", "desc": "Available CLI commands" },
    { "chapter": "configuration.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**Agent Concurrency and Token Limits**

Tune performance and resource usage for AI agent calls:

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

**Flow Merge Strategy and GitHub CLI**

Control how flow branches are merged and whether the `gh` CLI is used during finalization:

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
|---|---|
| `SDD_SOURCE_ROOT` | Overrides the source root directory that `sdd-forge.js` uses to resolve the project under analysis. When set, the tool reads source files from this path instead of the current working directory. |
| `SDD_WORK_ROOT` | Overrides the working root directory used by `sdd-forge.js` for locating the `.sdd-forge/` configuration and output directory. Useful when the config directory is separate from the source tree. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
