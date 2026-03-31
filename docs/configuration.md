<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

This chapter covers the configuration files the project reads, centered on `.sdd-forge/config.json` and `package.json`, along with framework-specific and fixture configuration files used by the documentation and analysis system. Configuration spans documentation languages and style, project type, concurrency, chapters, scan and flow behavior, agent providers, and command integration, with additional customization points for multilingual output, language switcher links, and project metadata tables.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `config.json` | `.sdd-forge/config.json` | Main sdd-forge configuration file. It is used for validated runtime configuration, language fallback loading, and docs language-switcher generation. |
| `package.json` | project root | Provides project metadata such as package name, description, version, and scripts for documentation output. |
| `composer.json` | analyzed PHP project root | Read by Laravel, Symfony, and CakePHP-related analyzers to extract Composer dependencies. |
| `.env.example` | analyzed project root | Read by Laravel and Symfony analyzers to extract environment-variable keys and default values. |
| `.env` | analyzed project root | Read by Laravel and Symfony analyzers as an environment configuration source. |
| `config/*.php` | Laravel project `config/` | Read by the Laravel analyzer to list config files and their top-level keys. |
| `config/packages/*.yaml` / `config/packages/*.yml` | Symfony project `config/packages/` | Read by the Symfony analyzer to list package config files and their top-level keys. |
| `config/services.yaml` / `config/services.yml` | Symfony project `config/` | Read by the Symfony analyzer to detect `autowire` and `autoconfigure` settings. |
| `config/bundles.php` | Symfony project `config/` | Read by the Symfony analyzer to extract registered bundles. |
| `src/Kernel.php` | Symfony project `src/` | Read by the Symfony analyzer to extract kernel class information. |
| `app/Http/Kernel.php` | Laravel project `app/Http/` | Read by the Laravel analyzer to extract middleware registration. |
| `bootstrap/app.php` | Laravel project `bootstrap/` | Read by the Laravel analyzer to extract fluent middleware registration. |
| `app/Providers/*.php` | Laravel project `app/Providers/` | Read by the Laravel analyzer to list service providers and whether they implement `register` and `boot`. |
| `app/Http/Middleware/*.php` | Laravel project `app/Http/Middleware/` | Read by the Laravel analyzer to list middleware classes. |
| `app/Config/*`, `AppController.php`, `AppModel.php`, `PermissionComponent.php`, logic classes, `TitlesGraphController.php`, `webroot` assets | CakePHP 2 project | Read by the CakePHP analyzer to extract constants, bootstrap settings, auth, ACL, logic mappings, and assets. |
| `wrangler.toml`-style TOML files | generic TOML input | Supported by the built-in TOML parser for simple TOML-based configuration shapes. |
| `config.json` | acceptance-test fixture project root | Fixture application config file merged with defaults and environment overrides in webapp fixture sources. |
| `.mdparserrc.json` | acceptance-test fixture project root | Fixture CLI config file merged with defaults in CLI fixture sources. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Required | object | None | Root documentation-output configuration block. |
| `docs.languages` | Required | `string[]` | None | Output languages. It must be a non-empty array. |
| `docs.defaultLanguage` | Required | string | None | Default documentation language. It must be included in `docs.languages`. |
| `docs.mode` | Optional | string | `translate` | Output mode. Allowed values are `translate` and `generate`. |
| `docs.style` | Optional | object | None | Style settings for generated documentation. |
| `docs.style.purpose` | Required when `docs.style` is present | string | None | Non-empty description of the documentation purpose. |
| `docs.style.tone` | Required when `docs.style` is present | string | None | Documentation tone. Allowed values are `polite`, `formal`, and `casual`. |
| `docs.style.customInstruction` | Optional | string | None | Additional custom instruction for document generation. |
| `docs.exclude` | Optional | `string[]` | None | Glob patterns for documentation items to exclude. |
| `lang` | Required | string | `en` for tolerant loading only | Project language used by the tool. Strict validation requires a non-empty string; permissive loading falls back to `en`. |
| `type` | Required | `string` or `string[]` | None | Project type definition. It must be a non-empty string or a non-empty array of non-empty strings. |
| `concurrency` | Optional | number | `5` | Worker concurrency. Non-numeric or falsy values resolve to the default of `5`; validated values must be positive. |
| `chapters` | Optional | object[] | None | Chapter configuration in the new object format only. Legacy string entries are rejected with a migration error. |
| `chapters[].chapter` | Required when a chapter entry is present | string | None | Chapter file name. |
| `chapters[].desc` | Optional | string | None | Chapter description. |
| `chapters[].exclude` | Optional | boolean | None | Whether to exclude the chapter. |
| `scan` | Optional | object | None | Source scanning configuration. |
| `scan.include` | Required when `scan` is present | `string[]` | None | Non-empty array of include patterns. |
| `scan.exclude` | Optional | `string[]` | None | Exclude patterns for scanning. |
| `flow` | Optional | object | None | Workflow configuration block. |
| `flow.merge` | Optional | string | None | Merge strategy. Allowed values are `squash`, `ff-only`, and `merge`. |
| `flow.push` | Optional | object | None | Push-related workflow settings. |
| `flow.push.remote` | Optional | string | None | Remote name used for push operations. |
| `commands` | Optional | object | None | External command configuration block. |
| `commands.gh` | Optional | string | None | GitHub CLI availability setting. Allowed values are `enable` and `disable`. |
| `agent` | Optional | object | None | Agent execution settings. |
| `agent.workDir` | Optional | string | None | Working directory for agent execution. |
| `agent.timeout` | Optional | number | None | Agent timeout. It must be a positive number if provided. |
| `agent.retryCount` | Optional | number | None | Agent retry count. It must be a positive number if provided. |
| `agent.providers` | Optional | object | None | Named external agent providers. |
| `agent.providers.<name>.command` | Required when a provider is present | string | None | Command used to launch the provider. It must be non-empty. |
| `agent.providers.<name>.args` | Required when a provider is present | array | None | Argument list for the provider command. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize multilingual documentation output by configuring the language list, the default language, and the output mode in `.sdd-forge/config.json`. When more than one language is configured, the docs language data source generates relative links between the default-language `docs/` path and translated `docs/<lang>/` paths.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  },
  "lang": "en",
  "type": "node-cli"
}
```

Users can customize document-writing style through `docs.style`, including purpose, tone, and an optional custom instruction.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "Create an end-user guide",
      "tone": "formal",
      "customInstruction": "Keep examples concise and practical."
    }
  },
  "lang": "en",
  "type": "node-cli"
}
```

Users can control project processing behavior through `type`, `concurrency`, chapter entries, scan filters, flow options, command integration, and agent settings.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en"
  },
  "lang": "en",
  "type": ["node-cli", "webapp"],
  "concurrency": 8,
  "chapters": [
    { "chapter": "configuration.md", "desc": "Configuration details" },
    { "chapter": "internals.md", "exclude": true }
  ],
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/tests/**"]
  },
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" }
  },
  "commands": {
    "gh": "enable"
  },
  "agent": {
    "workDir": ".tmp",
    "timeout": 300,
    "retryCount": 2,
    "providers": {
      "local": {
        "command": "codex",
        "args": ["run"]
      }
    }
  }
}
```

Project metadata shown in generated docs can also be customized indirectly through `package.json`, because the project data source reads the package name, description, version, and scripts.

```json
{
  "name": "sdd-forge",
  "description": "CLI for source-based documentation and Spec-Driven Development",
  "version": "0.1.0-alpha.1",
  "scripts": {
    "build": "node src/cli.js build",
    "test": "node --test"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Environment Variable | Purpose |
| --- | --- |
| `PORT` | Overrides the fixture web application `port` setting when loading `config.json`. |
| `LOG_LEVEL` | Overrides the fixture web application `logLevel` setting when loading `config.json`. |
| `API_BASE_URL` | Overrides the fixture web application `apiBaseUrl` setting when loading `config.json`. |
| `TIMEOUT` | Overrides the fixture web application `timeout` setting when loading `config.json`. |

The analyzed core configuration modules for sdd-forge do not directly read `process.env`. The explicit `process.env` reads in the analyzed source appear in acceptance-test fixture config loaders.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
