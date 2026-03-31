<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single `.sdd-forge/config.json` file that governs documentation generation, output language selection, AI agent behavior, source scan targets, and SDD workflow options. Customization spans documentation tone and style, multi-language output mode, chapter ordering, agent provider definitions, and GitHub CLI integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file, loaded and validated by `loadConfig()` on every command run. Contains all documentation, agent, scan, and workflow settings. |
| `package.json` | Project root | Read by `loadPackageField()` to retrieve individual fields such as project name or version for use in documentation generation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level container for all documentation generation settings. |
| `docs.languages` | Required | string[] | — | Ordered list of language codes for documentation output (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Primary language code; must appear in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` / `"generate"` | `"translate"` | Whether additional language editions are produced by translating from the default language or generated independently. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | Describes the intended audience or use case for the generated documentation. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` / `"formal"` / `"casual"` | — | Writing tone applied to all AI-generated text. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to AI generation prompts. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation. |
| `lang` | Required | string | `"en"` | Language code for CLI output and help text. |
| `type` | Required | string / string[] | — | Project preset identifier (e.g., `"laravel"`) or an array of identifiers for multi-preset projects. |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI agent calls during documentation generation. |
| `chapters` | Optional | object[] | — | Array of `{ chapter, desc?, exclude? }` entries that override the preset-defined chapter order. |
| `agent.default` | Optional | string | — | Key of the default provider entry within `agent.providers`. |
| `agent.workDir` | Optional | string | — | Working directory path for agent subprocess execution. |
| `agent.timeout` | Optional | number | — | Per-invocation timeout in milliseconds for agent calls. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. |
| `agent.providers` | Optional | object | — | Named provider map; each entry requires `command` (string) and `args` (array). |
| `scan.include` | Required if `scan` is set | string[] | — | Non-empty array of glob patterns specifying which source files to scan. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from the scan. |
| `flow.merge` | Optional | `"squash"` / `"ff-only"` / `"merge"` | — | Git merge strategy used by the `flow merge` command. |
| `flow.push.remote` | Optional | string | — | Git remote name used when pushing branches during the SDD flow. |
| `commands.gh` | Optional | `"enable"` / `"disable"` | — | Enables or disables GitHub CLI (`gh`) integration across all commands. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Multi-language documentation output**
Set `docs.languages` to an array of language codes and `docs.defaultLanguage` to the primary language. The `LangSource` DataSource automatically generates language switcher navigation between document copies, computing relative paths for default-to-non-default, non-default-to-default, and non-default-to-non-default routes. Set `docs.mode` to `"translate"` to derive additional languages from the default, or `"generate"` to produce each independently.

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
Control AI writing style globally via `docs.style`. The `tone` field accepts `"polite"`, `"formal"`, or `"casual"`. Use `customInstruction` for any project-specific guidance to be injected into generation prompts.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal developer reference",
      "tone": "formal",
      "customInstruction": "Always include code examples where applicable."
    }
  }
}
```

**Chapter ordering**
Override the preset chapter order with a `chapters` array in `config.json`. Each entry requires a `chapter` filename; set `exclude: true` to omit a chapter from the build entirely.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "configuration.md" },
    { "chapter": "cli_commands.md" }
  ]
}
```

**Agent providers**
Register one or more named AI agent backends under `agent.providers`. Each provider requires a `command` string and an `args` array. Set `agent.default` to the key of the provider to use by default, and tune `agent.timeout` and `agent.retryCount` as needed.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "stream-json"]
      }
    }
  }
}
```

**Source scan scope**
Use `scan.include` and `scan.exclude` to control which files are analysed. Patterns follow standard glob syntax. `scan.include` is required whenever the `scan` key is present.

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/**/*.spec.js"]
  }
}
```

**Concurrency**
Adjust the number of parallel AI calls with `concurrency` to balance generation speed against API rate limits. The default value is `5`.

```json
{
  "concurrency": 3
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The core sdd-forge configuration system (`src/lib/config.js`) reads exclusively from `.sdd-forge/config.json` and does not rely on environment variables for its own operation. No `process.env` references appear in the configuration loading or validation modules.

The acceptance test fixture files bundled with certain presets demonstrate a recommended environment-variable override pattern for user projects. The `js-webapp` preset fixture (`src/presets/js-webapp/tests/acceptance/fixtures/src/config.js`) reads the following variables at runtime via its `getEnv()` helper, merging them over file-based configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server listen port. |
| `LOG_LEVEL` | `"info"` | Application log verbosity level. |
| `API_BASE_URL` | `"http://localhost:8080"` | Base URL for outbound API requests. |
| `TIMEOUT` | `30000` | Request timeout in milliseconds. |

These variables are part of fixture source used to validate preset documentation output and illustrate a configuration pattern for user projects, not configuration knobs for sdd-forge itself.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
