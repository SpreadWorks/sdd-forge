<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads project configuration from a single JSON file (`.sdd-forge/config.json`) that controls documentation generation, language settings, AI agent behavior, source scanning, and workflow options. Customization spans documentation style and tone, multi-language output, chapter ordering, agent providers, scan patterns, and merge strategies.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

The following files are read by sdd-forge during operation:

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration; loaded and validated on every command run |
| `package.json` | Project root | Optional metadata source; `loadPackageField()` reads individual fields (e.g. package name) without full parsing |

Preset-specific DataSources additionally scan framework configuration files within the target project (e.g. `config/*.php`, `.env.example`, `app/Providers/*.php` for Laravel; `config/` YAML files, `bundles.php`, `.env` for Symfony; various PHP files for CakePHP 2). These are read during the `sdd-forge scan` phase to populate analysis data, not as tool configuration.
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

All fields are read from `.sdd-forge/config.json` and validated by `validateConfig()` in `src/lib/types.js`.

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Container for all documentation output settings |
| `docs.languages` | Required | string[] | — | Non-empty list of language codes for documentation output (e.g. `["en", "ja"]`) |
| `docs.defaultLanguage` | Required | string | — | Primary language; must be present in `docs.languages` |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How non-default language docs are produced |
| `docs.style` | Optional | object | — | Writing style overrides; if provided, `purpose` and `tone` are both required |
| `docs.style.purpose` | Conditional | string | — | Describes the intended audience or goal of the documentation |
| `docs.style.tone` | Conditional | `"polite"` \| `"formal"` \| `"casual"` | — | Tone used in generated text |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction passed to the AI |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation |
| `lang` | Required | string | — | Primary language code for the project (used in CLI output and prompts) |
| `type` | Required | string \| string[] | — | Preset type identifier(s) (e.g. `"laravel"`, `["node", "cli"]`) |
| `concurrency` | Optional | number (≥1) | `5` | Maximum number of parallel AI calls; resolved by `resolveConcurrency()` |
| `chapters` | Optional | object[] | — | Ordered list of chapter overrides; each entry requires `chapter` (filename string) and accepts optional `desc` (string) and `exclude` (boolean) |
| `agent.default` | Optional | string | — | Name of the default agent provider to use |
| `agent.workDir` | Optional | string | — | Working directory passed to the agent process |
| `agent.timeout` | Optional | number (≥1) | — | Timeout in milliseconds for each agent invocation |
| `agent.retryCount` | Optional | number (≥1) | — | Number of retry attempts on agent failure |
| `agent.providers` | Optional | object | — | Map of named agent provider definitions; each requires `command` (string) and `args` (array) |
| `scan.include` | Conditional | string[] | — | Required when `scan` is present; glob patterns for source files to include |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to exclude during scanning |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by `sdd-forge flow merge` |
| `flow.push.remote` | Optional | string | — | Remote name to push to after merge |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether GitHub CLI (`gh`) commands are used in flow operations |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation Language and Mode**

Multiple output languages are enabled by listing codes in `docs.languages` and setting `docs.defaultLanguage`. When `docs.mode` is `"translate"`, non-default language files are derived from the primary output. When set to `"generate"`, each language is produced independently.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate"
}
```

**Writing Style**

The `docs.style` object controls the tone and purpose of all AI-generated text. A `customInstruction` field accepts a free-form string appended to every generation prompt.

```json
"docs": {
  "style": {
    "purpose": "Internal developer reference",
    "tone": "formal",
    "customInstruction": "Avoid marketing language. Use technical terminology."
  }
}
```

**Chapter Ordering**

The `chapters` array overrides the preset's default chapter order. Entries without a matching file are ignored; setting `exclude: true` removes a chapter from output entirely.

```json
"chapters": [
  { "chapter": "overview.md" },
  { "chapter": "configuration.md", "desc": "Config file reference" },
  { "chapter": "internal_design.md", "exclude": true }
]
```

**Agent Providers**

Custom AI agent providers can be registered under `agent.providers`. Each entry specifies the command and arguments used to invoke the agent. The `agent.default` key selects which provider is used by default.

```json
"agent": {
  "default": "claude",
  "timeout": 120000,
  "retryCount": 2,
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["-p"]
    }
  }
}
```

**Source Scan Patterns**

The `scan.include` and `scan.exclude` fields accept glob patterns to precisely control which source files are analyzed.

```json
"scan": {
  "include": ["src/**/*.js"],
  "exclude": ["src/**/*.test.js", "src/fixtures/**"]
}
```

**Concurrency**

The `concurrency` field (default: `5`) sets the maximum number of parallel AI requests. Reduce it to stay within API rate limits.

```json
"concurrency": 3
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The following environment variables are referenced via `process.env` in the analyzed source code. The entries below are drawn from the acceptance-test fixture modules (`src/presets/js-webapp` and `src/presets/node-cli`), which demonstrate the environment-variable override pattern that sdd-forge recognizes and documents in analyzed projects.

| Variable | Used In | Purpose |
|----------|---------|--------|
| `PORT` | `js-webapp` fixture | Overrides the default HTTP server port (`3000`); coerced to `Number` |
| `LOG_LEVEL` | `js-webapp` fixture | Overrides the default log level (`info`) |
| `API_BASE_URL` | `js-webapp` fixture | Overrides the default API base URL (`http://localhost:8080`) |
| `TIMEOUT` | `js-webapp` fixture | Overrides the default request timeout in milliseconds (`30000`); coerced to `Number` |

The core sdd-forge configuration loader (`src/lib/config.js`) does not read environment variables directly; all tool-level settings are sourced from `.sdd-forge/config.json`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
