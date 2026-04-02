<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads its primary configuration from `.sdd-forge/config.json`, with supplementary reads from the project's `package.json` for package metadata. The configuration covers documentation output languages and style, AI agent behavior, source scanning patterns, chapter ordering, flow control, and GitHub CLI integration, giving teams precise control over every stage of the documentation generation process.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and fully validated by `loadConfig()` in `src/lib/config.js`. Defines all docs, agent, scan, flow, chapter, and command settings. |
| `package.json` | `<project root>/package.json` | Package manifest. Read by `loadPackageField()` to retrieve arbitrary fields such as the project name or version for use during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `lang` | Required | string | — | Language code for the project (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Project type preset name(s) (e.g., `"node-cli"`, `"laravel"`). |
| `docs` | Required | object | — | Top-level documentation output settings container. |
| `docs.languages` | Required | string[] | — | List of languages to generate documentation for. Must be non-empty. |
| `docs.defaultLanguage` | Required | string | — | Default output language. Must be a member of `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Documentation generation mode. |
| `docs.style` | Optional | object | — | Writing style settings for AI-generated documentation. |
| `docs.style.purpose` | Required if `docs.style` set | string | — | Describes the documentation's intended purpose. |
| `docs.style.tone` | Required if `docs.style` set | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to AI-generated text. |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction forwarded to the AI writer. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation output. |
| `concurrency` | Optional | number (≥1) | `5` | Maximum number of parallel AI agent tasks. |
| `chapters` | Optional | object[] | — | Chapter ordering override. Each entry requires a `chapter` string field. |
| `chapters[].chapter` | Required per entry | string | — | Chapter filename (e.g., `"overview.md"`). |
| `chapters[].desc` | Optional per entry | string | — | Human-readable description of the chapter. |
| `chapters[].exclude` | Optional per entry | boolean | — | When `true`, the chapter is excluded from the build. |
| `agent.workDir` | Optional | string | — | Working directory for agent subprocess execution. |
| `agent.timeout` | Optional | number (≥1) | — | Timeout in milliseconds for individual agent tasks. |
| `agent.retryCount` | Optional | number (≥1) | — | Number of retry attempts for failed agent tasks. |
| `agent.batchTokenLimit` | Optional | number (≥1000) | — | Maximum token count per agent batch request. |
| `agent.providers` | Optional | object | — | Named map of agent provider configurations. |
| `agent.providers.<name>.command` | Required per provider | string | — | Executable command used to invoke the provider. |
| `agent.providers.<name>.args` | Required per provider | array | — | Arguments passed to the provider command. |
| `scan.include` | Required if `scan` set | string[] | — | Glob patterns for source files to include in scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used during flow finalization. |
| `flow.push.remote` | Optional | string | — | Git remote name for push operations. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search mode used for context lookup during flow commands. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) is invoked in flow commands. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation languages and mode**

Set `docs.languages` to generate output in multiple languages and choose between `"translate"` (produce the default language first, then translate) and `"generate"` (produce each language independently).

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

Add `docs.style` to guide the AI writer's tone and purpose. `customInstruction` accepts any free-form directive appended to the AI prompt.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal API reference for contributors",
      "tone": "formal",
      "customInstruction": "Prefer passive voice and avoid marketing language."
    }
  }
}
```

**Source scanning scope**

Use `scan.include` and `scan.exclude` (glob patterns) to define which source files are analysed.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**Chapter ordering**

Override the preset's default chapter order with the `chapters` array. Each entry names a chapter file; entries marked `exclude: true` are skipped during the build.

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

**Agent provider configuration**

Define one or more named providers under `agent.providers`. Each provider specifies the executable command and its arguments. Use `agent.default` to select which provider is used by default.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 50000,
    "providers": {
      "claude": {
        "command": "claude",
        "args": []
      }
    }
  }
}
```

**Concurrency**

Adjust `concurrency` to control how many agent tasks run in parallel. The default is `5`; lower this value on resource-constrained machines.

```json
{
  "concurrency": 3
}
```

**Flow and GitHub CLI integration**

Set `flow.merge` to choose the git merge strategy applied at the end of a flow. Set `commands.gh` to `"enable"` to allow the flow finalization step to create pull requests via the GitHub CLI.

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
| `SDD_SOURCE_ROOT` | Overrides the detected project source root. `sdd-forge.js` reads this value to resolve the project directory when the tool is invoked from outside the project tree. |
| `SDD_WORK_ROOT` | Overrides the working root used for `.sdd-forge/` path resolution. Allows the config directory and output files to be stored at a location separate from the source root. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
