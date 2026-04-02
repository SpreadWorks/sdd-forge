<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads two types of configuration files — a project-specific config at `.sdd-forge/config.json` and the standard `package.json` — covering output language settings, documentation style, source scan scope, AI agent behaviour, SDD flow strategy, and chapter ordering. Every aspect of how documentation is generated and how the SDD workflow runs can be tailored through these files.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` in the project root | Primary project configuration. Loaded and validated by `loadConfig()` in `src/lib/config.js` on every command run. Defines language, type, docs output, scan scope, agent settings, flow strategy, and chapter ordering. |
| `package.json` | Project root | Supplementary metadata source. Individual fields are read on demand via `loadPackageField()` in `src/lib/config.js`. Used to retrieve package-level information such as the project name or version. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | `string` | — | Language code for the tool's own output messages. |
| `type` | Required | `string \| string[]` | — | Preset type(s) that describe the project category (e.g. `"node-cli"`). |
| `docs` | Required | `object` | — | Top-level container for all documentation output settings. |
| `docs.languages` | Required | `string[]` | — | List of languages in which documentation is generated. Must be non-empty. |
| `docs.defaultLanguage` | Required | `string` | — | The primary output language. Must appear in `docs.languages`. |
| `docs.mode` | Optional | `"translate" \| "generate"` | `"translate"` | Controls how additional language variants are produced. |
| `docs.style` | Optional | `object` | — | Writing style settings passed to the AI generator. When provided, both `purpose` and `tone` are required. |
| `docs.style.purpose` | Required if `docs.style` set | `string` | — | Short description of the document's intended purpose. |
| `docs.style.tone` | Required if `docs.style` set | `"polite" \| "formal" \| "casual"` | — | Desired writing tone for generated text. |
| `docs.style.customInstruction` | Optional | `string` | — | Additional free-form instruction appended to AI prompts. |
| `docs.exclude` | Optional | `string[]` | — | Glob patterns for source paths to omit from documentation. |
| `concurrency` | Optional | `number` (≥ 1) | `5` | Maximum number of parallel AI calls during document generation. |
| `chapters` | Optional | `{ chapter: string, desc?: string, exclude?: boolean }[]` | — | Override chapter order and visibility. Each entry names a chapter file; `exclude: true` suppresses it. |
| `agent.workDir` | Optional | `string` | — | Working directory used when invoking the AI agent process. |
| `agent.timeout` | Optional | `number` (ms) | — | Maximum time in milliseconds allowed for a single agent call. |
| `agent.retryCount` | Optional | `number` (≥ 1) | — | Number of retry attempts on agent failure. |
| `agent.batchTokenLimit` | Optional | `number` (≥ 1000) | — | Token budget per batch when processing large analyses. |
| `agent.default` | Optional | `string` | — | Key of the default provider entry inside `agent.providers`. |
| `agent.providers.<name>.command` | Required per provider | `string` | — | Executable command for the named AI provider. |
| `agent.providers.<name>.args` | Required per provider | `string[]` | — | Argument list passed to the provider command. |
| `scan.include` | Required if `scan` set | `string[]` | — | Glob patterns identifying source files to scan. |
| `scan.exclude` | Optional | `string[]` | — | Glob patterns identifying source files to skip during scan. |
| `flow.merge` | Optional | `"squash" \| "ff-only" \| "merge"` | — | Git merge strategy used when finalising an SDD flow branch. |
| `flow.push.remote` | Optional | `string` | — | Name of the git remote to push to during flow finalize. |
| `commands.gh` | Optional | `"enable" \| "disable"` | — | Controls whether GitHub CLI integration is active during flow operations. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Output languages**

Set `docs.languages` to an array of language codes and choose one as `docs.defaultLanguage`. All listed languages receive generated or translated documentation.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**Documentation writing style**

Provide `docs.style` to guide the AI's tone and purpose. `customInstruction` appends a free-form directive to every generation prompt.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal developer reference for onboarding and maintenance",
      "tone": "formal",
      "customInstruction": "Avoid abbreviations and always spell out acronyms on first use."
    }
  }
}
```

**Source scan scope**

Use `scan.include` and `scan.exclude` to control which source files are analysed. Patterns follow glob syntax.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**Chapter ordering and exclusion**

Override the preset's default chapter list with `chapters`. Set `exclude: true` on any entry to suppress that chapter from the output.

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

**AI agent providers**

Define one or more named providers under `agent.providers` and set `agent.default` to select which one runs by default.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "json"]
      }
    }
  }
}
```

**SDD flow merge strategy**

Set `flow.merge` to control how feature branches are integrated when a flow is finalised.

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" }
  }
}
```

**Parallel concurrency**

Adjust `concurrency` to limit or increase the number of simultaneous AI calls during document generation. The default is `5`.

```json
{
  "concurrency": 3
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_SOURCE_ROOT` | Overrides the project root directory that sdd-forge uses as the source base. When set, the tool resolves all source paths relative to this value instead of the current working directory. |
| `SDD_WORK_ROOT` | Overrides the working root used for `.sdd-forge/` artefacts (config, output, data). Allows the config and generated files to be stored in a location separate from the source tree. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
