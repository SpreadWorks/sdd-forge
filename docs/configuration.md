<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

This project reads JSON-based project configuration and package metadata, and it also includes parsers that analyze configuration files from supported application frameworks. The configurable surface covers documentation output, language settings, chapter definitions, scanning rules, flow behavior, command integration, agent providers, and concurrency, with additional customization through package scripts and framework-specific config files discovered during analysis.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `config.json` | `.sdd-forge/config.json` | Primary project configuration file. It is read for validated tool settings, output language handling, concurrency, flow settings, scan rules, commands, agent settings, and documentation language links. |
| `package.json` | `package.json` at the project root | Source of project metadata exposed to documentation templates, including package name, description, version, and scripts. |
| `composer.json` | Target project root in Laravel, Symfony, and CakePHP preset analysis | Parsed to collect Composer dependencies for generated documentation. |
| `.env.example` | Target project root in Laravel and Symfony preset analysis | Parsed to collect environment-variable names and default values for generated documentation. |
| `.env` | Target project root in Laravel and Symfony preset analysis | Parsed to collect environment-variable names and default values when present. |
| `config/*.php` | Target Laravel project `config/` directory | Scanned to extract top-level Laravel configuration keys. |
| `app/Providers/*.php` | Target Laravel project `app/Providers/` | Scanned to detect service providers and whether they implement `register()` and `boot()`. |
| `app/Http/Middleware/*.php` | Target Laravel project `app/Http/Middleware/` | Scanned to list middleware classes for documentation. |
| `app/Http/Kernel.php` | Target Laravel project | Parsed to collect global middleware, middleware groups, and aliases. |
| `bootstrap/app.php` | Target Laravel project | Parsed to collect middleware registration from the bootstrap API. |
| `config/bundles.php` | Target Symfony project | Parsed to list registered Symfony bundles. |
| `config/services.yaml` / `config/services.yml` | Target Symfony project | Parsed to detect `autowire` and `autoconfigure` settings. |
| `config/packages/*.yaml` / `config/packages/*.yml` | Target Symfony project | Scanned to extract top-level package configuration keys. |
| `src/Kernel.php` | Target Symfony project | Parsed to extract kernel class metadata. |
| `app/Config/*`, `AppController.php`, `AppModel.php`, `PermissionComponent.php`, logic classes, `TitlesGraphController.php`, `webroot` assets | Target CakePHP 2 project | Scanned to extract framework constants, bootstrap settings, auth and ACL details, logic mappings, and frontend assets. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Required | object | None | Root documentation-output settings block. |
| `docs.languages` | Required | array of strings | None | Output languages to generate. It must be a non-empty array. |
| `docs.defaultLanguage` | Required | string | None | Default documentation language. It must be one of `docs.languages`. |
| `docs.mode` | Optional | string | `translate` | Documentation generation mode. Allowed values are `translate` and `generate`. |
| `docs.style` | Optional | object | None | Writing-style settings for generated documentation. |
| `docs.style.purpose` | Required when `docs.style` is set | string | None | Non-empty statement of the document purpose. |
| `docs.style.tone` | Required when `docs.style` is set | string | None | Tone for generated documentation. Allowed values are `polite`, `formal`, and `casual`. |
| `docs.style.customInstruction` | Optional | string | None | Additional style instruction text. |
| `docs.exclude` | Optional | array of strings | None | Glob patterns for documentation content to exclude. |
| `lang` | Required | string | `en` when loaded through tolerant language lookup | Primary tool language setting. Strict validation requires a non-empty string. |
| `type` | Required | string or array of strings | None | Project or analysis type setting. It must be a non-empty string or a non-empty string array. |
| `concurrency` | Optional | number | `5` | Parallelism setting. Non-numeric, falsy, or missing values fall back to the default concurrency. |
| `chapters` | Optional | array of objects | None | Chapter definitions in the new object format. Legacy string entries are rejected and require migration with `sdd-forge upgrade`. |
| `chapters[].chapter` | Required when a chapter entry is present | string | None | Chapter file name. |
| `chapters[].desc` | Optional | string | None | Chapter description. |
| `chapters[].exclude` | Optional | boolean | None | Whether to exclude the chapter. |
| `scan` | Optional | object | None | Source scanning configuration. |
| `scan.include` | Required when `scan` is set | array of strings | None | Non-empty list of include patterns for scanning. |
| `scan.exclude` | Optional | array of strings | None | Exclude patterns for scanning. |
| `flow` | Optional | object | None | Workflow behavior settings. |
| `flow.merge` | Optional | string | None | Merge strategy for flow operations. Allowed values are `squash`, `ff-only`, and `merge`. |
| `flow.push` | Optional | object | None | Push-related flow settings. |
| `flow.push.remote` | Optional | string | None | Remote name used for flow push operations. |
| `commands` | Optional | object | None | External command integration settings. |
| `commands.gh` | Optional | string | None | GitHub command availability setting. Allowed values are `enable` and `disable`. |
| `agent` | Optional | object | None | Agent execution settings. |
| `agent.workDir` | Optional | string | None | Working directory for agent execution. |
| `agent.timeout` | Optional | number | None | Agent timeout in positive numeric form. |
| `agent.retryCount` | Optional | number | None | Agent retry count in positive numeric form. |
| `agent.providers` | Optional | object | None | Named external agent-provider definitions. |
| `agent.providers.<name>.command` | Required when a provider is defined | string | None | Command used to invoke the provider. |
| `agent.providers.<name>.args` | Required when a provider is defined | array | None | Argument list passed to the provider command. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize documentation output languages and mode in `.sdd-forge/config.json`. The tool reads `docs.languages`, `docs.defaultLanguage`, and `docs.mode`, and the docs language-link generator uses these values to build cross-language links.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

Users can customize document-writing style with `docs.style`, including purpose, tone, and an optional custom instruction.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "User guide for project contributors",
      "tone": "formal",
      "customInstruction": "Prefer concise procedural explanations."
    }
  }
}
```

Users can choose the tool language, project type, and concurrency. Concurrency falls back to `5` when omitted or invalid.

```json
{
  "lang": "en",
  "type": ["node-cli", "docs"],
  "concurrency": 8
}
```

Users can control chapter layout with `chapters` entries and can exclude specific chapters. Each entry must use the object format.

```json
{
  "chapters": [
    { "chapter": "configuration.md", "desc": "Configuration guide" },
    { "chapter": "internal.md", "exclude": true }
  ]
}
```

Users can restrict source scanning with `scan.include` and `scan.exclude` glob lists.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/tests/**"]
  }
}
```

Users can customize workflow behavior through `flow.merge` and `flow.push.remote`, and can enable or disable GitHub command integration through `commands.gh`.

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

Users can define agent execution behavior, including a working directory, timeout, retry count, and named providers with command and argument lists.

```json
{
  "agent": {
    "workDir": ".sdd-forge/output",
    "timeout": 120,
    "retryCount": 2,
    "providers": {
      "local": {
        "command": "codex",
        "args": ["run", "--json"]
      }
    }
  }
}
```

Users can also customize project scripts in `package.json`, and the documentation data source renders them as a Markdown table.

```json
{
  "scripts": {
    "build": "node src/cli.js build",
    "test": "node --test"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Environment variable | Purpose |
| --- | --- |
| `PORT` | Overrides the configured or default application port in the acceptance-test fixture webapp config loaders. |
| `LOG_LEVEL` | Overrides the configured or default log level in the acceptance-test fixture webapp config loaders. |
| `API_BASE_URL` | Overrides the configured or default API base URL in the acceptance-test fixture webapp config loaders. |
| `TIMEOUT` | Overrides the configured or default timeout value in the acceptance-test fixture webapp config loaders. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
