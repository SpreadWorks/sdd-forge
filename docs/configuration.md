<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single JSON file at `.sdd-forge/config.json`, which controls documentation language settings, output style, AI agent behavior, source scanning patterns, and SDD workflow options. Users can tailor every stage of the documentation pipeline — from which languages are generated and the writing tone, to chapter ordering, custom agent providers, and Git merge strategy.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. Loaded and validated at startup by `loadConfig()` in `src/lib/config.js`. All documentation, agent, scan, and flow settings are read from this file. |
| `package.json` | Project root | Project metadata source. Read selectively by `loadPackageField()` to retrieve individual fields such as `name` and `version` without loading the full config. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `docs` | Required | object | — | Top-level documentation generation settings. |
| `docs.languages` | Required | string[] | — | List of language codes to generate documentation for (e.g., `["en", "ja"]`). Must be non-empty. |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Multi-language output strategy: `translate` derives non-default languages from the default, `generate` produces each language independently. |
| `docs.style.purpose` | Required (if `docs.style` set) | string | — | Describes the intended audience and purpose of the documentation. |
| `docs.style.tone` | Required (if `docs.style` set) | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to all generated text. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction passed to the AI writer. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation generation. |
| `lang` | Required | string | — | BCP 47 language code identifying the project's primary language (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Preset type(s) for the project (e.g., `"laravel"`, `["node", "cli"]`). Must be non-empty. |
| `concurrency` | Optional | number | `5` | Maximum number of AI agent calls executed in parallel during documentation generation. |
| `chapters` | Optional | object[] | — | Overrides chapter ordering. Each entry requires a `chapter` string (filename), and accepts optional `desc` (string) and `exclude` (boolean) fields. |
| `agent.default` | Optional | string | — | Name of the default agent provider to use. |
| `agent.workDir` | Optional | string | — | Working directory passed to the agent process. |
| `agent.timeout` | Optional | number | — | Maximum execution time for a single agent call, in milliseconds. |
| `agent.retryCount` | Optional | number | — | Number of times to retry a failed agent call before giving up. |
| `agent.providers.<name>.command` | Required (per provider) | string | — | Executable command for the custom agent provider. |
| `agent.providers.<name>.args` | Required (per provider) | string[] | — | Arguments passed to the provider command. |
| `scan.include` | Required (if `scan` set) | string[] | — | Glob patterns defining which source files are included in the analysis scan. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from the analysis scan. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by the SDD flow when merging feature branches. |
| `flow.push.remote` | Optional | string | — | Name of the Git remote for push operations during the SDD flow. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) integration is active for pull request creation. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Language and localization**

Set `docs.languages` to all language codes you want documentation generated for, and `docs.defaultLanguage` to the language written by the primary author. Use `docs.mode` to choose between deriving other languages from the default (`translate`) or generating each independently (`generate`).

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  },
  "lang": "en"
}
```

**Documentation style**

Provide a `docs.style` block to guide the AI writer's output. `purpose` describes who the documentation is for, `tone` selects the register, and `customInstruction` passes any additional direction.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal reference for backend engineers maintaining the service",
      "tone": "formal",
      "customInstruction": "Use active voice. Avoid marketing language."
    }
  }
}
```

**Chapter ordering**

The `chapters` array in `config.json` overrides the preset's default chapter order. Each entry names a markdown file and can optionally exclude it from the build.

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

**Custom agent providers**

Define `agent.providers` to register non-default AI agent commands. Each key becomes a selectable provider name.

```json
{
  "agent": {
    "default": "my-agent",
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "my-agent": {
        "command": "claude",
        "args": ["-p"]
      }
    }
  }
}
```

**Scan scope**

Control which files enter the analysis pipeline via `scan.include` and `scan.exclude`. Both fields accept glob patterns.

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**SDD flow options**

Select the Git merge strategy and push remote used by the automated SDD workflow.

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

The environment variables listed below are referenced via `process.env` in the project's configuration fixture files (`src/presets/js-webapp/tests/acceptance/fixtures/src/config.js`). They demonstrate the standard Node.js pattern of overriding file-based configuration with environment variables and serve as reference examples for the js-webapp preset's acceptance tests.

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | number | `3000` | HTTP server listen port. Applied with `Number` coercion. |
| `LOG_LEVEL` | string | `"info"` | Logging verbosity level (e.g., `"debug"`, `"warn"`, `"error"`). |
| `API_BASE_URL` | string | `"http://localhost:8080"` | Base URL for outbound API requests. |
| `TIMEOUT` | number | `30000` | Request timeout in milliseconds. Applied with `Number` coercion. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
