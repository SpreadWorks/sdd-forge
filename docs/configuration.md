<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured primarily through a single JSON file stored in the `.sdd-forge/` directory at the root of each project, complemented by the project's `package.json` for package metadata. Configuration covers documentation language and output settings, source scanning scope, AI agent behavior, Spec-Driven Development flow options, writing style, and chapter structure.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Defines language, preset type, documentation output, scanning rules, agent settings, and flow behavior. Read and validated by `loadConfig()` in `src/lib/config.js`. |
| `package.json` | `<project-root>/package.json` | Package metadata. Read by `loadPackageField()` to retrieve arbitrary fields (for example, `name` and `version`) for use during documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `lang` | Required | `string` | `"en"` | Language code for the project. Falls back to `"en"` when not set. |
| `type` | Required | `string` \| `string[]` | — | Preset type or list of types that determine the documentation template and chapter structure (for example, `"node-cli"` or `"laravel"`). |
| `docs` | Required | `object` | — | Top-level documentation output settings. |
| `docs.languages` | Required | `string[]` | — | Non-empty list of language codes for which documentation is generated. |
| `docs.defaultLanguage` | Required | `string` | — | Default output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | `translate` derives additional languages from the default; `generate` produces each language independently. |
| `docs.style` | Optional | `object` | — | Writing style settings. When provided, `purpose` and `tone` are both required. |
| `docs.style.purpose` | Required if `docs.style` set | `string` | — | A description of the documentation's intended purpose, passed to the AI during generation. |
| `docs.style.tone` | Required if `docs.style` set | `"polite"` \| `"formal"` \| `"casual"` | — | Desired tone for all generated text. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional freeform instruction appended to AI prompts during text generation. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for files to exclude from documentation generation. |
| `concurrency` | Optional | `number` | `5` | Maximum number of concurrent AI agent tasks. Must be a positive integer. |
| `chapters` | Optional | `object[]` | — | Overrides the preset chapter order. Each entry must include `chapter` (filename string) and may include `desc` (string) and `exclude` (boolean). |
| `scan.include` | Required if `scan` set | `string[]` | — | Glob patterns specifying which source files to include during scanning. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from scanning. |
| `agent.workDir` | Optional | `string` | — | Working directory override for agent subprocess execution. |
| `agent.timeout` | Optional | `number` | — | Timeout in milliseconds applied to individual agent tasks. |
| `agent.retryCount` | Optional | `number` | — | Number of retry attempts for a failed agent task. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Maximum token budget per agent batch. |
| `agent.providers` | Optional | `object` | — | Named AI provider definitions. Each key is a provider name; each value requires `command` (string) and `args` (array). |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied when finalizing an SDD flow. |
| `flow.push.remote` | Optional | `string` | — | Name of the Git remote to push to during flow finalization. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are permitted in flow operations. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation Languages**

Set `docs.languages` and `docs.defaultLanguage` to control which languages are generated. Use `docs.mode` to choose between translating from one primary language (`translate`) or generating each language independently (`generate`).

```json
{
  "lang": "en",
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Writing Style**

Provide `docs.style` to guide the AI's tone and purpose when writing documentation. Add `customInstruction` for project-specific phrasing requirements.

```json
{
  "docs": {
    "style": {
      "purpose": "Technical reference for internal engineering teams",
      "tone": "formal",
      "customInstruction": "Prefer imperative mood in procedure sections."
    }
  }
}
```

**Chapter Order**

Override the preset-defined chapter sequence by providing a `chapters` array in `config.json`. Entries are processed in array order; set `exclude: true` to omit a chapter entirely.

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

**Source Scanning Scope**

Use `scan.include` to specify which files are analyzed, and `scan.exclude` to omit generated or vendor directories.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/vendor/**", "src/**/*.test.js"]
  }
}
```

**AI Agent Behavior**

Tune concurrency, timeouts, and token budgets to match your environment. Define additional AI providers under `agent.providers`.

```json
{
  "concurrency": 3,
  "agent": {
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 8000,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    }
  }
}
```

**SDD Flow Options**

Set `flow.merge` to control the Git merge strategy, and `commands.gh` to enable or disable GitHub CLI integration during flow finalization.

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
| `SDD_SOURCE_ROOT` | Overrides the source project root directory. Used by `sdd-forge.js` to resolve the project context when the tool is invoked from outside the project directory, such as in worktree-based workflows. |
| `SDD_WORK_ROOT` | Overrides the working root directory. Used alongside `SDD_SOURCE_ROOT` to support isolated worktree development flows where the source root and the active working directory differ. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
