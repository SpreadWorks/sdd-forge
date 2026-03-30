<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge is configured primarily through JSON in `.sdd-forge/config.json`, with optional package metadata from `package.json` and additional project-specific files that are analyzed by some presets. The configuration covers documentation languages and style, project type, concurrency, chapter selection, scan targets, agent execution settings, flow behavior, and selected command toggles.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `config.json` | `.sdd-forge/config.json` | Main project configuration file. It is loaded by `loadConfig()` for validated runtime settings and by `loadLang()` for early language fallback behavior. |
| `config.json` | `.sdd-forge/config.json` | Source for multilingual documentation settings used by `LangSource`, including `docs.languages` and `docs.defaultLanguage` when language-switcher links are generated. |
| `package.json` | `<project root>/package.json` | Optional metadata source read by `loadPackageField()` to retrieve a single package field when available. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Yes | object | None | Top-level documentation configuration block. |
| `docs.languages` | Yes | `string[]` | None | Non-empty list of documentation languages. |
| `docs.defaultLanguage` | Yes | `string` | None | Default documentation language; it must also appear in `docs.languages`. |
| `docs.mode` | No | `"translate" | "generate"` | `"translate"` | Controls output mode returned by `resolveOutputConfig()`. |
| `docs.style` | No | object | None | Optional documentation writing-style settings. |
| `docs.style.purpose` | Yes, when `docs.style` is set | `string` | None | Non-empty purpose string for documentation style. |
| `docs.style.tone` | Yes, when `docs.style` is set | `"polite" | "formal" | "casual"` | None | Allowed tone for generated documentation. |
| `docs.style.customInstruction` | No | `string` | None | Additional free-form style instruction. |
| `lang` | Yes | `string` | No validated default; early fallback is `"en"` in `loadLang()` | Primary interface language setting. |
| `type` | Yes | `string` or `string[]` | None | Project type definition; must be a non-empty string or a non-empty string array. |
| `concurrency` | No | positive `number` | `5` | Worker/concurrency setting resolved by `resolveConcurrency()`. |
| `chapters` | No | `string[]` | None | Optional ordered list of chapter identifiers. |
| `agent.workDir` | No | `string` | None | Agent working directory. |
| `agent.timeout` | No | positive `number` | None | Agent timeout value. |
| `agent.retryCount` | No | positive `number` | None | Agent retry count. |
| `agent.providers` | No | object | None | Provider definitions for agent backends. |
| `agent.providers.<name>.command` | Yes, when that provider is defined | `string` | None | Command used to start the provider. |
| `agent.providers.<name>.args` | Yes, when that provider is defined | `array` | None | Argument list passed to the provider command. |
| `scan` | No | object | None | File scanning configuration block. |
| `scan.include` | Yes, when `scan` is set | `string[]` | None | Non-empty include patterns for scanning. |
| `scan.exclude` | No | `string[]` | None | Optional exclude patterns for scanning. |
| `flow` | No | object | None | Flow behavior settings. |
| `flow.merge` | No | `"squash" | "ff-only" | "merge"` | None | Merge strategy for flow operations. |
| `flow.push.remote` | No | `string` | None | Remote name used for push behavior. |
| `commands.gh` | No | `"enable" | "disable"` | None | Enables or disables GitHub command usage. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize documentation output by choosing supported languages, a default language, and the output mode.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

Documentation style is customizable through purpose, tone, and an optional custom instruction.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "User guide for application developers",
      "tone": "formal",
      "customInstruction": "Prefer short, direct explanations."
    }
  }
}
```

You can define the project language and project type explicitly.

```json
{
  "lang": "en",
  "type": ["cli", "node"]
}
```

Execution behavior can be tuned with concurrency, chapter selection, and scan targets.

```json
{
  "concurrency": 8,
  "chapters": ["overview", "configuration", "cli_commands"],
  "scan": {
    "include": ["src", "docs"],
    "exclude": ["dist", "coverage"]
  }
}
```

Agent execution can be customized with a working directory, timeout, retry count, and named providers.

```json
{
  "agent": {
    "workDir": ".tmp",
    "timeout": 300,
    "retryCount": 2,
    "providers": {
      "local": {
        "command": "node",
        "args": ["agent.js"]
      }
    }
  }
}
```

Flow and command behavior can also be adjusted.

```json
{
  "flow": {
    "merge": "squash",
    "push": {
      "remote": "origin"
    }
  },
  "commands": {
    "gh": "enable"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

The main `.sdd-forge` configuration loader does not read environment variables directly in the analyzed core modules. The only direct `process.env` reads in the provided analysis data appear in acceptance-test fixture applications, where they override JSON-based settings.

| Environment Variable | Purpose |
| --- | --- |
| `PORT` | Overrides the configured application port in fixture config loaders. |
| `LOG_LEVEL` | Overrides the configured logging level in fixture config loaders. |
| `API_BASE_URL` | Overrides the configured API base URL in fixture config loaders. |
| `TIMEOUT` | Overrides the configured timeout value in fixture config loaders. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
