<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads two configuration files — the project-level `.sdd-forge/config.json` and the repository's `package.json` — to control documentation generation, source scanning, agent behaviour, and flow integration. Configurable items range from output language settings and preset type selection through to AI agent parameters, chapter ordering, and GitHub CLI integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and validated on every command that requires project context. Defines language, preset type, docs output settings, agent parameters, scan patterns, flow options, and chapter overrides. |
| `package.json` | `<project-root>/package.json` | Read on demand via `loadPackageField()` to retrieve arbitrary manifest fields (e.g. `name`, `version`) for use in documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | List of language codes for which documentation is generated (e.g. `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Primary language code; must be a member of `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls whether non-default languages are produced by translation or independent generation. |
| `docs.style` | Optional | object | — | Writing-style hints passed to the AI agent. When provided, all sub-fields below are enforced. |
| `docs.style.purpose` | Required (if `docs.style` set) | string | — | One-sentence description of the documentation's audience and intent. |
| `docs.style.tone` | Required (if `docs.style` set) | `"polite"` \| `"formal"` \| `"casual"` | — | Desired writing tone for generated text. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to AI generation prompts. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files excluded from documentation generation. |
| `lang` | Required | string | — | UI/output locale for sdd-forge messages (e.g. `"en"`). |
| `type` | Required | string \| string[] | — | Preset type identifier(s) that determine chapter structure and data sources (e.g. `"node-cli"`). |
| `concurrency` | Optional | number (≥ 1) | `5` | Maximum number of parallel AI agent calls during generation. |
| `chapters` | Optional | `{ chapter: string, desc?: string, exclude?: boolean }[]` | — | Project-level override of chapter order and inclusion. Each entry names a chapter file; `exclude: true` removes a chapter from the build. |
| `agent.workDir` | Optional | string | — | Working directory passed to the AI agent process. |
| `agent.timeout` | Optional | number (≥ 1) | — | Per-call timeout in seconds for AI agent invocations. |
| `agent.retryCount` | Optional | number (≥ 1) | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token budget per agent batch request. |
| `agent.providers` | Optional | `{ [name]: { command: string, args: string[] } }` | — | Named AI agent provider definitions. Each entry specifies the executable command and its argument list. |
| `scan.include` | Required (if `scan` set) | string[] | — | Glob patterns that define which source files are analysed by `sdd-forge scan`. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files excluded from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by the SDD flow finalize step. |
| `flow.push.remote` | Optional | string | — | Git remote name used when pushing branches during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search strategy used when building flow context. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used during flow finalization (e.g. for pull request creation). |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Output language and style**

Set `docs.languages`, `docs.defaultLanguage`, and optionally `docs.style` to tailor the language and tone of generated documentation.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "Internal API reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Avoid passive voice. Prefer imperative sentences in descriptions."
    }
  }
}
```

**Preset type selection**

The `type` field selects which preset (and therefore which chapter structure) is applied. Multiple types can be combined as an array.

```json
{ "type": "node-cli" }
```

```json
{ "type": ["node", "library"] }
```

**Chapter ordering and exclusion**

The `chapters` array overrides the preset-defined chapter order. Set `exclude: true` on an entry to omit that chapter from the build entirely.

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

**Source scanning scope**

The `scan.include` and `scan.exclude` glob patterns define which files are analysed. Restricting the scan to relevant directories improves analysis quality and reduces processing time.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**AI agent parameters**

Agent concurrency, timeout, retry behaviour, and token limits can all be tuned independently.

```json
{
  "concurrency": 3,
  "agent": {
    "timeout": 120,
    "retryCount": 2,
    "batchTokenLimit": 8000
  }
}
```

**Custom AI agent provider**

To use a non-default AI agent executable, define it under `agent.providers`.

```json
{
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "json"]
      }
    }
  }
}
```

**Flow and GitHub CLI integration**

Configure the merge strategy and enable `gh` for automated pull request creation during flow finalization.

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
| `SDD_SOURCE_ROOT` | Overrides the project source root directory resolved by `sdd-forge.js`. When set, the tool uses this path instead of deriving the root from the current working directory. |
| `SDD_WORK_ROOT` | Overrides the working directory used internally by the tool (e.g. for locating `.sdd-forge/` and temporary output). Primarily used in worktree and CI contexts where the source root and work root differ. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
