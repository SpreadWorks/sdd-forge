<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single `config.json` file stored inside the `.sdd-forge/` project directory, alongside an optional `package.json` read for project metadata. The configuration covers a wide range of items — from output language and documentation style to agent behaviour, source scanning patterns, and SDD flow merge strategy — giving teams precise control over how documentation is generated and how the development workflow operates.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` (project root) | Primary configuration file. Loaded and validated on every command run via `loadConfig()`. Defines all project-level settings. |
| `package.json` | `<project root>/package.json` | Read selectively by `loadPackageField()` to retrieve named fields (e.g. project name or version) when needed by commands. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | `string` | — | Primary language code for the project (e.g. `"en"`, `"ja"`). |
| `type` | Required | `string` or `string[]` | — | Project type identifier(s) used to select the appropriate preset (e.g. `"node-cli"`, `"laravel"`). |
| `docs` | Required | `object` | — | Container for all documentation output settings. |
| `docs.languages` | Required | `string[]` | — | Non-empty list of language codes for which documentation is generated. |
| `docs.defaultLanguage` | Required | `string` | — | The default output language. Must be present in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Controls whether additional languages are produced by translating the default-language output or by generating them independently. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for source paths to exclude from documentation generation. |
| `docs.style` | Optional | `object` | — | Writing style overrides applied to AI-generated text. |
| `docs.style.purpose` | Required (if `docs.style` set) | `string` | — | A short description of the documentation's intended audience or purpose. |
| `docs.style.tone` | Required (if `docs.style` set) | `"polite"` \| `"formal"` \| `"casual"` | — | Tone of generated prose. |
| `docs.style.customInstruction` | Optional | `string` | — | Free-form additional instruction appended to AI prompts. |
| `concurrency` | Optional | `number` (≥ 1) | `5` | Maximum number of parallel AI requests during document generation. |
| `chapters` | Optional | `{ chapter: string, desc?: string, exclude?: boolean }[]` | — | Project-level chapter order override. Each entry specifies a filename and optional description or exclusion flag. |
| `agent.workDir` | Optional | `string` | — | Working directory passed to the agent subprocess. |
| `agent.timeout` | Optional | `number` (≥ 1) | — | Timeout in milliseconds for individual agent calls. |
| `agent.retryCount` | Optional | `number` (≥ 1) | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Maximum token budget per agent batch request. |
| `agent.providers` | Optional | `object` | — | Named map of agent provider definitions. Each entry requires `command` (string) and `args` (array). |
| `scan.include` | Required (if `scan` set) | `string[]` | — | Non-empty list of glob patterns identifying source files to scan. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns for source files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when finalising an SDD flow. |
| `flow.push.remote` | Optional | `string` | — | Git remote name to push to during flow finalisation. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search strategy used to locate relevant context during flow commands. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used in the SDD flow (e.g. for pull request creation). |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation output language**

Set `docs.languages` and `docs.defaultLanguage` to control which languages are generated. When `docs.mode` is `"translate"`, additional languages are derived from the default; when set to `"generate"`, each language is produced independently.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate"
}
```

**Writing style**

Supply a `docs.style` block to shape the tone and focus of AI-generated prose. The `customInstruction` field accepts free-form text that is appended directly to the generation prompt.

```json
"docs": {
  "style": {
    "purpose": "Internal developer reference for contributors",
    "tone": "formal",
    "customInstruction": "Avoid passive voice. Keep sentences under 25 words."
  }
}
```

**Source scanning scope**

Use `scan.include` and `scan.exclude` to define exactly which files are analysed. Both accept standard glob patterns.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js", "src/fixtures/**"]
}
```

**Chapter ordering**

The `chapters` array overrides the preset's default chapter order for a specific project. Each entry names a chapter file and may carry an optional `desc` or set `exclude: true` to omit it.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "cli_commands.md", "desc": "Full command reference" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Concurrency**

Adjust the `concurrency` field to tune parallel AI request throughput. The default is `5`.

```json
"concurrency": 3
```

**SDD flow behaviour**

Configure merge strategy and GitHub CLI integration to match your team's workflow.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
},
"commands": {
  "gh": "enable"
}
```

**Agent providers**

Define named agent backends under `agent.providers`. Each provider requires a `command` and an `args` array.

```json
"agent": {
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5"]
    }
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Absolute path to the project's source root. Used by the CLI dispatcher (`sdd-forge.js`) to resolve project context when running commands outside the project directory. |
| `SDD_WORK_ROOT` | Absolute path to the working root used for SDD flow operations. Allows flow commands to target a directory different from the current working directory. |
| `SDD_DIR_NAME` | Internal constant (`.sdd-forge`) that names the configuration directory. Not an environment variable — it is a fixed value defined in `config.js` and cannot be overridden at runtime. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
