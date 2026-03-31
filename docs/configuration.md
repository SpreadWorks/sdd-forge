<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single JSON file (`.sdd-forge/config.json`) that controls documentation output languages, AI agent behaviour, source scanning scope, and the Spec-Driven Development workflow. Customization spans writing tone and purpose, chapter ordering, multi-language generation mode, agent provider definitions, and GitHub CLI integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

The table below lists every configuration file that sdd-forge reads directly during normal operation.

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and validated by `loadConfig()` on every command that requires project context. |
| `package.json` | `<project root>/package.json` | Read selectively via `loadPackageField()` to retrieve project metadata such as package name and version. |

During a `sdd-forge scan` run, the active preset's DataSource also reads source files from the target project (e.g., `config/*.php`, `.env.example`, `composer.json`, `bundles.php`, `config/packages/*.yaml`). Those files belong to the analysed project and are not part of sdd-forge's own configuration.
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

The following table documents every field accepted by `.sdd-forge/config.json`, derived from the validation logic in `src/lib/types.js`.

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Yes | object | — | Container for all documentation output settings. |
| `docs.languages` | Yes | string[] | — | Non-empty list of language codes to generate docs for (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Yes | string | — | Primary language; must be one of the values in `docs.languages`. |
| `docs.mode` | No | `"translate"` \| `"generate"` | `"translate"` | Strategy for producing non-default language files. |
| `docs.style` | No | object | — | AI writing style settings. When provided, `purpose` and `tone` are both required. |
| `docs.style.purpose` | Conditional | string | — | One-line description of the documentation's intended audience and use. |
| `docs.style.tone` | Conditional | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to all AI-generated text. |
| `docs.style.customInstruction` | No | string | — | Additional free-form instruction appended to AI prompts. |
| `docs.exclude` | No | string[] | — | Glob patterns for source files to omit from documentation. |
| `lang` | Yes | string | — | Primary language code for the project (e.g., `"en"`). |
| `type` | Yes | string \| string[] | — | Preset type identifier (e.g., `"laravel"`) or an array of types (e.g., `["node", "cli"]`). |
| `concurrency` | No | number | `5` | Maximum number of parallel AI calls. Must be a positive integer. |
| `chapters` | No | object[] | — | Per-chapter overrides. Each entry requires a `chapter` string (filename) and accepts an optional `desc` string and `exclude` boolean. |
| `agent.workDir` | No | string | — | Working directory passed to agent subprocess commands. |
| `agent.timeout` | No | number | — | Agent call timeout in milliseconds. |
| `agent.retryCount` | No | number | — | Number of retry attempts on agent failure. |
| `agent.providers` | No | object | — | Named agent provider map. Each provider requires a non-empty `command` string and an `args` array. |
| `scan.include` | Conditional | string[] | — | Required when `scan` is set. Glob patterns selecting files for `sdd-forge scan`. |
| `scan.exclude` | No | string[] | — | Glob patterns to exclude from scanning. |
| `flow.merge` | No | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by the SDD flow at finalization. |
| `flow.push.remote` | No | string | — | Git remote name for automatic push steps in the flow. |
| `commands.gh` | No | `"enable"` \| `"disable"` | — | Controls whether the GitHub CLI (`gh`) is used during flow commands. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Multi-language documentation**

Set `docs.languages` to an array of language codes and specify `docs.defaultLanguage` to enable multi-language output. The default language files are written directly under `docs/`; non-default languages are placed in `docs/<lang>/`.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en"
  }
}
```

**Writing style**

Define `docs.style` to guide the AI's tone and framing. The `customInstruction` field accepts any additional instruction.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal technical reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Avoid passive voice. Use bullet points for lists of three or more items."
    }
  }
}
```

**Chapter ordering and exclusion**

The `chapters` array overrides the preset's default chapter order. Set `exclude: true` on an entry to omit a chapter entirely.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "configuration.md" },
    { "chapter": "cli_commands.md", "exclude": true }
  ]
}
```

**Agent providers**

Custom AI agent commands can be registered under `agent.providers`. Each provider specifies the executable and its argument template.

```json
{
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{prompt}}"]
      }
    }
  }
}
```

**Scan scope**

Use `scan.include` and `scan.exclude` to narrow or widen the set of source files that `sdd-forge scan` processes.

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/**/*.test.js"]
  }
}
```

**Flow merge strategy**

Choose how SDD flow branches are merged back into the main branch.

```json
{
  "flow": {
    "merge": "squash"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The analysis data for the core sdd-forge configuration layer (`src/lib/config.js`, `src/lib/types.js`) does not contain direct `process.env` references; configuration is read exclusively from `.sdd-forge/config.json` and `package.json` on disk.

The acceptance-test fixture files bundled with preset packages do demonstrate environment variable patterns that sdd-forge is designed to detect and document in target projects. The table below lists these variables as they appear in the fixture source code.

| Variable | Fixture Location | Purpose in Fixture |
|----------|-----------------|--------------------|
| `PORT` | `src/presets/js-webapp/tests/acceptance/fixtures/src/config.js` | Overrides the default HTTP server port (`3000`). Coerced to `Number`. |
| `LOG_LEVEL` | `src/presets/js-webapp/tests/acceptance/fixtures/src/config.js` | Overrides the default log level (`info`). |
| `API_BASE_URL` | `src/presets/js-webapp/tests/acceptance/fixtures/src/config.js` | Overrides the default API base URL (`http://localhost:8080`). |
| `TIMEOUT` | `src/presets/js-webapp/tests/acceptance/fixtures/src/config.js` | Overrides the default request timeout (`30000` ms). Coerced to `Number`. |

These variables are part of the fixture application that exercises the js-webapp preset, not sdd-forge's own runtime environment.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
