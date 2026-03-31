<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single `.sdd-forge/config.json` file that controls documentation generation, output languages, AI agent behavior, source scan scope, SDD workflow preferences, and chapter ordering. Preset-specific DataSources additionally parse framework configuration files from the target project—such as `.env`, `composer.json`, PHP config files, and YAML package configs—to enrich the generated documentation with project-level details.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary sdd-forge project configuration; loaded and validated by `src/lib/config.js` |
| `package.json` | Project root | Individual fields (e.g., `name`, `version`) read via `loadPackageField()` |
| `.env.example` / `.env` | Project root | Parsed by Laravel and Symfony preset DataSources to extract environment variable keys and default values |
| `config/*.php` | Laravel / CakePHP 2 project root | Scanned for top-level configuration keys by the respective preset DataSources |
| `composer.json` | Laravel / Symfony project root | Parsed for `require` and `require-dev` dependency lists |
| `bundles.php` | Symfony `config/` | Parsed to extract registered Symfony bundle class names |
| `services.yaml` | Symfony `config/` | Inspected for `autowire` and `autoconfigure` boolean settings |
| `config/packages/*.yaml` | Symfony `config/packages/` | Top-level YAML keys (up to 20 per file) extracted per package config file |
| `app/Http/Kernel.php` | Laravel project | Parsed for global middleware, middleware groups, and route middleware aliases |
| `bootstrap/app.php` | Laravel 11 project | Parsed for middleware registered via the Laravel 11 application bootstrap API |
| `app/Providers/*.php` | Laravel project | Inspected for service provider class names and presence of `register()` / `boot()` methods |
| `app/Http/Middleware/*.php` | Laravel project | Parsed to extract middleware class names |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Top-level block for all documentation output settings |
| `docs.languages` | Required | string[] | — | Ordered list of output language codes (e.g., `["en", "ja"]`); must be non-empty |
| `docs.defaultLanguage` | Required | string | — | Primary language; must appear in `docs.languages` |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Strategy for producing non-default language documents |
| `docs.style` | Optional | object | — | Documentation tone and purpose injected into AI generation prompts |
| `docs.style.purpose` | Required (if `style` set) | string | — | Describes the document's intended audience and goal |
| `docs.style.tone` | Required (if `style` set) | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone for AI-generated text |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to generation prompts |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation |
| `lang` | Required | string | — | Project language code used to guide AI prompt language |
| `type` | Required | string \| string[] | — | Preset type(s) for the target project (e.g., `"laravel"`, `["node", "cli"]`) |
| `concurrency` | Optional | number (≥1) | `5` | Maximum number of concurrent AI agent calls; resolved by `resolveConcurrency()` |
| `chapters` | Optional | object[] | — | Override the preset chapter list or order; entries with `exclude: true` are skipped |
| `chapters[].chapter` | Required (per entry) | string | — | Chapter filename (e.g., `"overview.md"`) |
| `chapters[].desc` | Optional | string | — | Human-readable description override for the chapter |
| `chapters[].exclude` | Optional | boolean | — | When `true`, omits the chapter from the build output |
| `agent.workDir` | Optional | string | — | Working directory override for agent subprocess invocations |
| `agent.timeout` | Optional | number (≥1) | — | Timeout in seconds applied to individual agent calls |
| `agent.retryCount` | Optional | number (≥1) | — | Number of retry attempts on agent call failure |
| `agent.providers` | Optional | object | — | Keyed map of named agent provider configurations |
| `agent.providers[name].command` | Required (per provider) | string | — | Executable command for the provider |
| `agent.providers[name].args` | Required (per provider) | string[] | — | Argument list passed to the provider command |
| `scan.include` | Required (if `scan` set) | string[] | — | Glob patterns specifying which source files to include in analysis |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from scanning |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used when the SDD flow finalizes a feature branch |
| `flow.push.remote` | Optional | string | — | Git remote name for automatic push during flow finalization |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the `gh` CLI is used for pull request creation in the flow |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Multi-language documentation**

Set `docs.languages` to an array of language codes to produce documentation in multiple languages. The `docs.mode` field selects whether non-default languages are produced by translating the default output (`"translate"`) or by running independent generation passes (`"generate"`).

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

The optional `docs.style` object customizes the tone and purpose injected into every AI generation prompt. Valid tone values are `"polite"`, `"formal"`, and `"casual"`. Use `customInstruction` for any additional free-form guidance.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Always include code examples where applicable."
    }
  }
}
```

**Chapter ordering and exclusion**

Provide a `chapters` array to control which chapters are included in the build and the order in which they appear. Setting `exclude: true` on an entry removes it from the output without deleting the source file.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "configuration.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**Scan scope**

The `scan.include` and `scan.exclude` fields accept glob pattern arrays that control exactly which source files are analyzed. `scan.include` is required when the `scan` block is present.

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/**/*.spec.js"]
  }
}
```

**Agent providers**

Custom AI backends are registered under `agent.providers`. Each entry requires a `command` string and an `args` array. The `agent.default` field selects which provider is used by default, while `agent.timeout` and `agent.retryCount` tune reliability.

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120,
    "retryCount": 2,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p"]
      }
    }
  }
}
```

**Flow merge strategy and push settings**

The `flow.merge` field selects the Git strategy applied when the SDD flow merges a feature branch. The optional `flow.push.remote` field enables automatic push to the named remote after merging.

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" }
  }
}
```

**Concurrency**

The `concurrency` field limits parallel AI calls. The default value is `5`, resolved internally by `resolveConcurrency()` in `src/lib/config.js`.

```json
{
  "concurrency": 3
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The core configuration loader (`src/lib/config.js`) does not read environment variables; all sdd-forge settings are sourced exclusively from `.sdd-forge/config.json`. The acceptance test fixture for the js-webapp preset (`src/presets/js-webapp/tests/acceptance/fixtures/src/config.js`) demonstrates a standard Node.js configuration pattern where environment variables override file-based defaults. That fixture is a representative example of a target application's config module, not part of sdd-forge's own runtime configuration.

| Variable | Type | Default | Purpose (fixture context) |
|----------|------|---------|---------------------------|
| `PORT` | number | `3000` | HTTP server listening port |
| `LOG_LEVEL` | string | `"info"` | Application logging verbosity |
| `API_BASE_URL` | string | `"http://localhost:8080"` | Base URL for outbound API requests |
| `TIMEOUT` | number | `30000` | Request timeout in milliseconds |

These variables are read only within the js-webapp acceptance test fixture and have no effect on sdd-forge's own behavior.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
