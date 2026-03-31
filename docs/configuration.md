<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

Configuration in this project centers on `.sdd-forge/config.json`, with supporting reads from `package.json` and a small set of preset-specific project files such as Wrangler, Composer, Symfony, and Laravel config files. The configurable surface covers documentation output, language settings, project type, concurrency, scanning, flow behavior, command availability, and agent execution options, with additional customization points for multilingual docs and preset-driven source analysis.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `config.json` | `.sdd-forge/config.json` | Main project configuration file loaded by `loadConfig()` and `loadLang()`, and also read by the language-switcher data source. |
| `package.json` | `package.json` at the project root | Optional metadata source read by `loadPackageField()` to fetch a specific package field. |
| `wrangler.toml` | Project root or scanned source tree | Cloudflare Wrangler configuration parsed for R2 bucket metadata. |
| `wrangler.json` | Project root or scanned source tree | JSON-based Wrangler configuration parsed for R2 bucket metadata. |
| `wrangler.jsonc` | Project root or scanned source tree | JSONC-based Wrangler configuration parsed for R2 bucket metadata. |
| `composer.json` | Project root or scanned source tree | Parsed by PHP-oriented presets to read Composer dependencies. |
| `.env` | Project root or scanned source tree | Parsed by Laravel and Symfony analyzers to collect environment keys and defaults. |
| `.env.example` | Project root or scanned source tree | Parsed by Laravel, Symfony, and shared Composer utilities as an environment template source. |
| `.env.local` | Project root or scanned source tree | Parsed by the Symfony preset as an additional environment source. |
| `config/*.php` | `config/` | Laravel preset scans PHP config files and extracts top-level keys. |
| `config/bundles.php` | `config/bundles.php` | Symfony preset reads bundle registrations. |
| `config/services.yaml` / `config/services.yml` | `config/` | Symfony preset reads service autowire and autoconfigure settings. |
| `config/packages/*.yaml` / `config/packages/*.yml` | `config/packages/` | Symfony preset reads package-level top keys from YAML config files. |
| `app/Providers/*.php` | `app/Providers/` | Laravel preset inspects provider classes and lifecycle methods. |
| `app/Http/Middleware/*.php` | `app/Http/Middleware/` | Laravel preset inspects middleware classes. |
| `app/Http/Kernel.php` | `app/Http/Kernel.php` | Laravel analyzer reads middleware registration from the HTTP kernel when present. |
| `bootstrap/app.php` | `bootstrap/app.php` | Laravel analyzer reads middleware registration from bootstrap configuration when present. |
| `src/Kernel.php` | `src/Kernel.php` | Symfony analyzer reads kernel class metadata. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Required | object | None | Top-level documentation configuration group. |
| `docs.languages` | Required | array of strings | None | Available documentation languages; must be non-empty. |
| `docs.defaultLanguage` | Required | string | None | Default documentation language; must also appear in `docs.languages`. |
| `docs.mode` | Optional | string | `translate` | Output mode for multilingual docs. Accepted values: `translate`, `generate`. |
| `docs.style` | Optional | object | None | Documentation style settings. |
| `docs.style.purpose` | Required when `docs.style` is present | string | None | Purpose statement for generated documentation. |
| `docs.style.tone` | Required when `docs.style` is present | string | None | Tone for generated documentation. Accepted values: `polite`, `formal`, `casual`. |
| `docs.style.customInstruction` | Optional | string | None | Additional free-form instruction for documentation generation. |
| `lang` | Required | string | `en` for early fallback only | Primary UI or help language. `loadLang()` falls back to English if the config file is missing or invalid. |
| `type` | Required | string or array of non-empty strings | None | Project type definition used by the tool. |
| `concurrency` | Optional | positive number | `5` | Worker concurrency used when no valid explicit value is provided. |
| `chapters` | Optional | array of strings | None | Ordered chapter list for documentation generation. |
| `agent.workDir` | Optional | string | None | Agent working directory. |
| `agent.timeout` | Optional | positive number | None | Agent timeout value. |
| `agent.retryCount` | Optional | positive number | None | Number of agent retries. |
| `agent.providers` | Optional | object | None | Map of agent provider definitions. |
| `agent.providers.<name>.command` | Required when a provider is defined | string | None | Executable command for the provider. |
| `agent.providers.<name>.args` | Required when a provider is defined | array | None | Argument list for the provider command. |
| `scan` | Optional | object | None | Source scanning configuration. |
| `scan.include` | Required when `scan` is present | array of strings | None | Include patterns for scanning; must be non-empty. |
| `scan.exclude` | Optional | array of strings | None | Exclude patterns for scanning. |
| `flow` | Optional | object | None | Spec flow behavior settings. |
| `flow.merge` | Optional | string | None | Merge strategy. Accepted values: `squash`, `ff-only`, `merge`. |
| `flow.push` | Optional | object | None | Push-related flow settings. |
| `flow.push.remote` | Optional | string | None | Remote name used for flow push operations. |
| `commands` | Optional | object | None | Command availability settings. |
| `commands.gh` | Optional | string | None | GitHub command mode. Accepted values: `enable`, `disable`. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize documentation languages, output mode, style, scan scope, flow behavior, command toggles, and agent execution settings through `.sdd-forge/config.json`.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate",
    "style": {
      "purpose": "Create a user guide for the project",
      "tone": "formal",
      "customInstruction": "Use a professional and approachable tone."
    }
  },
  "lang": "en",
  "type": ["cli", "node"],
  "concurrency": 5,
  "chapters": ["overview", "configuration", "cli_commands"],
  "scan": {
    "include": ["src", "docs"],
    "exclude": ["dist", "node_modules"]
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
      "default": {
        "command": "codex",
        "args": ["run"]
      }
    }
  }
}
```

Multilingual navigation is also driven by `docs.languages` and `docs.defaultLanguage`; when at least two languages are configured, the language-switcher source generates relative links between translated documents.
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Environment Variable | Purpose |
| --- | --- |
| `PORT` | Overrides the configured or default application port in the acceptance-test webapp fixture loaders. |
| `LOG_LEVEL` | Overrides the configured or default log level in the acceptance-test webapp fixture loaders. |
| `API_BASE_URL` | Overrides the configured or default API base URL in the acceptance-test webapp fixture loaders. |
| `TIMEOUT` | Overrides the configured or default timeout in the acceptance-test webapp fixture loaders. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
