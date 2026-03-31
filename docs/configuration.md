<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured through a single project file at `.sdd-forge/config.json`, which controls documentation language, project type, AI agent behavior, source scan patterns, multi-language output, and SDD workflow settings. Preset-specific data sources extend configuration handling by parsing framework-native files — such as PHP config arrays, `.env` files, `composer.json`, service providers, and YAML package configs — for CakePHP 2, Laravel, and Symfony projects.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

The following files are read during tool operation, as identified by file-loading logic across `src/lib/config.js` and the preset data sources:

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and validated by `loadConfig()` on every command run. Governs all documentation, agent, scan, and workflow settings. |
| `package.json` | `<project root>/package.json` | Read by `loadPackageField()` for supplementary project metadata such as package name and type. |
| `.env` / `.env.example` | `<project root>/` | Parsed by the Laravel and Symfony preset data sources to extract environment variable keys and default values for documentation. |
| `config/*.php` | `<project root>/config/` | Parsed by the Laravel preset to extract top-level configuration keys (up to 20 per file). |
| `app/Providers/*.php` | Laravel project | Parsed to enumerate service provider classes and whether they define `register()` or `boot()` methods. |
| `app/Http/Middleware/*.php` | Laravel project | Parsed to list registered middleware class names. |
| `app/Http/Kernel.php` | Laravel project | Parsed to extract global middleware, middleware groups, and middleware aliases. |
| `bootstrap/app.php` | Laravel 11 project | Parsed for Laravel 11-style middleware registration via `->append()`, `->alias()`, and `->group()`. |
| `composer.json` | `<project root>/` | Parsed by the Laravel and Symfony preset data sources to extract `require` and `require-dev` dependency lists. |
| `config/bundles.php` | Symfony project | Parsed to extract registered Symfony bundle class names. |
| `config/services.yaml` | Symfony project | Parsed to detect whether `autowire` and `autoconfigure` are enabled. |
| `config/packages/*.yaml` | Symfony project | Parsed to extract top-level configuration keys per package file (up to 20 per file). |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

All fields are read from `.sdd-forge/config.json`. Validation is performed by `validateConfig()` in `src/lib/types.js`. Default values for omitted optional fields are defined in `src/lib/config.js`.

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | Non-empty array of language codes to generate documentation for (e.g., `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Multi-language strategy. `translate` generates in the default language then translates; `generate` runs AI independently per language. |
| `docs.style` | Optional | object | — | Writing style settings for AI-generated text. If provided, `purpose` and `tone` are required within it. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | Description of the documentation's intended audience and purpose, passed to the AI as context. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone for generated documentation. |
| `docs.style.customInstruction` | Optional | string | — | Additional freeform instruction appended to AI prompts during text generation. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for files to exclude from documentation generation. |
| `lang` | Required | string | `"en"` | Language code for the tool's own CLI output messages. |
| `type` | Required | string \| string[] | — | Project type identifier(s) used to select the documentation preset (e.g., `"laravel"`, `["node", "cli"]`). |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI requests during document generation. Must be a positive integer. |
| `chapters` | Optional | object[] | — | Override the chapter order defined by the preset. Each entry requires a `chapter` string (filename) and accepts optional `desc` (string) and `exclude` (boolean) fields. |
| `agent.default` | Optional | string | — | Name of the default AI agent provider key, referencing an entry in `agent.providers`. |
| `agent.workDir` | Optional | string | — | Working directory passed to the agent subprocess. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds per agent invocation. Must be a positive number. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts on agent failure. Must be a positive number. |
| `agent.providers` | Optional | object | — | Named agent provider definitions. Each key is a provider name; each value requires `command` (string) and `args` (array). |
| `agent.commands` | Optional | object | — | Agent-level command overrides. |
| `scan.include` | Required if `scan` is set | string[] | — | Non-empty array of glob patterns specifying which source files to include in scanning. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy used by the SDD flow when merging feature branches into the base branch. |
| `flow.push.remote` | Optional | string | — | Git remote name used when pushing branches during the SDD flow. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Controls whether the `gh` CLI is invoked for GitHub operations (e.g., pull request creation) in the SDD flow. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

The following areas of sdd-forge behavior can be customized through `.sdd-forge/config.json`.

**Documentation writing style**

Set a purpose description and tone, and optionally supply a free-form instruction to refine AI output:

```json
{
  "docs": {
    "style": {
      "purpose": "Internal technical reference for backend developers",
      "tone": "formal",
      "customInstruction": "Use concise bullet points for method descriptions."
    }
  }
}
```

**Multi-language output**

Configure two or more output languages. Use `mode: "translate"` to generate in the default language and then translate, or `mode: "generate"` to run the AI independently per language:

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

The language switcher (`LangSource`) supports the following language codes with built-in display names: `en` (English), `ja` (日本語), `zh` (中文), `ko` (한국어), `fr` (Français), `de` (Deutsch), `es` (Español), `pt` (Português), `it` (Italiano), `ru` (Русский).

**Chapter ordering**

Override the preset's default chapter sequence or exclude specific chapters from generation:

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "configuration.md" },
    { "chapter": "api_reference.md", "exclude": true }
  ]
}
```

**Source scan patterns**

Specify which files are included in or excluded from source analysis:

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/**/*.spec.js"]
  }
}
```

**AI agent settings**

Tune concurrency, timeout, retry behavior, and define custom agent provider commands:

```json
{
  "concurrency": 3,
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--output-format", "stream-json", "--dangerously-skip-permissions"]
      }
    }
  }
}
```

**SDD workflow behavior**

Control the git merge strategy and whether the `gh` CLI is used for pull request creation:

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

The following environment variables are referenced via `process.env` in the acceptance test fixture for the `js-webapp` preset (`src/presets/js-webapp/tests/acceptance/fixtures/src/config.js`). This fixture demonstrates how environment variables can override file-based and default configuration values using the `getEnv(name, fallback, coerce)` helper pattern.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | `3000` | HTTP server listen port. Coerced from string to `Number` by `getEnv`. |
| `LOG_LEVEL` | string | `'info'` | Logging verbosity level for the application. |
| `API_BASE_URL` | string | `'http://localhost:8080'` | Base URL for outbound API requests. |
| `TIMEOUT` | number | `30000` | Request timeout in milliseconds. Coerced from string to `Number` by `getEnv`. |

These variables belong to the fixture application used in acceptance tests and illustrate the environment-variable override pattern that sdd-forge's preset templates are designed to document when analyzing Node.js web application projects.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
