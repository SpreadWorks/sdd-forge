<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

The tool reads project-level JSON configuration from `.sdd-forge/config.json`, package metadata from `package.json`, and selected documentation-related inputs such as chapter file paths used for language switching. These settings control documentation languages and output mode, document style, chapter definitions, scan targets, agent execution, flow behavior, command toggles, and provider-specific command configuration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `.sdd-forge/config.json` | `<project root>/.sdd-forge/config.json` | Primary SDD configuration file. It provides validated settings for docs, language, type, concurrency, chapters, agent behavior, scan targets, flow options, command toggles, and agent providers. |
| `package.json` | `<project root>/package.json` | Supplies project metadata used by documentation data sources, including `name`, `description`, `version`, and `scripts`. |
| Current docs file path | Relative path under `docs/`, such as `docs/configuration.md` or `docs/ja/configuration.md` | Used by the language-switcher data source to detect the current language and compute links to corresponding translated chapters. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required / Optional | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Required | object | None | Container for documentation output settings. |
| `docs.languages` | Required | string[] | None | Non-empty list of configured documentation languages. |
| `docs.defaultLanguage` | Required | string | None | Default documentation language; it must be included in `docs.languages`. |
| `docs.mode` | Optional | string | `translate` | Documentation output mode. Accepted values are `translate` and `generate`. |
| `docs.style` | Optional | object | None | Container for document writing style settings. |
| `docs.style.purpose` | Required when `docs.style` is present | string | None | Non-empty purpose string for document generation. |
| `docs.style.tone` | Required when `docs.style` is present | string | None | Writing tone. Accepted values are `polite`, `formal`, and `casual`. |
| `docs.style.customInstruction` | Optional | string | None | Additional custom instruction text for documentation generation. |
| `lang` | Required | string | `en` in tolerant loading only | Primary language setting stored in config. Strict validation requires a non-empty string; tolerant loading falls back to `en` if the file is missing or unreadable. |
| `type` | Required | string or string[] | None | Project type definition. It must be a non-empty string or a non-empty array of non-empty strings. |
| `concurrency` | Optional | number | `5` | Concurrency value used by the tool. Non-numeric, falsy, or missing values resolve to `5`. |
| `chapters` | Optional | object[] | None | Chapter configuration array. Each entry must use the object-based format. |
| `chapters[].chapter` | Required when `chapters` is present | string | None | Chapter file name. |
| `chapters[].desc` | Optional | string | None | Optional chapter description. |
| `chapters[].exclude` | Optional | boolean | None | Optional flag to exclude a chapter. |
| `agent` | Optional | object | None | Container for agent execution settings. |
| `agent.workDir` | Optional | string | None | Working directory for agent execution. |
| `agent.timeout` | Optional | number | None | Positive timeout value for the agent. |
| `agent.retryCount` | Optional | number | None | Positive retry count for the agent. |
| `agent.providers` | Optional | object | None | Map of named agent providers. |
| `agent.providers.<name>.command` | Required when that provider is defined | string | None | Command used to invoke the provider. |
| `agent.providers.<name>.args` | Required when that provider is defined | array | None | Argument list passed to the provider command. |
| `scan` | Optional | object | None | Container for source scanning rules. |
| `scan.include` | Required when `scan` is present | string[] | None | Non-empty list of include patterns for scanning. |
| `scan.exclude` | Optional | string[] | None | Exclude patterns for scanning. |
| `flow` | Optional | object | None | Container for workflow behavior settings. |
| `flow.merge` | Optional | string | None | Merge strategy. Accepted values are `squash`, `ff-only`, and `merge`. |
| `flow.push` | Optional | object | None | Push-related workflow settings. |
| `flow.push.remote` | Optional | string | None | Remote name used for push operations. |
| `commands` | Optional | object | None | Container for command feature toggles. |
| `commands.gh` | Optional | string | None | GitHub command toggle. Accepted values are `enable` and `disable`. |
| `package.json.name` | Optional | string | Basename of the project root directory | Project name exposed to docs templates. |
| `package.json.description` | Optional | string | None | Project description exposed to docs templates. |
| `package.json.version` | Optional | string | `0.0.0` | Project version exposed to docs templates. |
| `package.json.scripts` | Optional | object | None | Script definitions rendered into documentation tables when present. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize documentation output languages with `docs.languages` and `docs.defaultLanguage`. When two or more languages are configured, the docs language-switcher generates links between translated chapter files.

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en"
  }
}
```

Users can choose how docs are produced with `docs.mode` and can define writing guidance through `docs.style.purpose`, `docs.style.tone`, and `docs.style.customInstruction`.

```json
{
  "docs": {
    "mode": "translate",
    "style": {
      "purpose": "User guide for project operators",
      "tone": "formal",
      "customInstruction": "Prefer concise procedural explanations."
    }
  }
}
```

Users can set the primary config language and project type with `lang` and `type`.

```json
{
  "lang": "en",
  "type": ["cli", "library"]
}
```

Users can tune execution behavior with `concurrency`, chapter definitions, and scan rules.

```json
{
  "concurrency": 8,
  "chapters": [
    { "chapter": "configuration.md", "desc": "Settings reference" },
    { "chapter": "internal_notes.md", "exclude": true }
  ],
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["test/**"]
  }
}
```

Users can customize agent execution and workflow behavior through `agent`, `agent.providers`, `flow`, and `commands`.

```json
{
  "agent": {
    "workDir": ".tmp",
    "timeout": 120,
    "retryCount": 2,
    "providers": {
      "example": {
        "command": "my-agent",
        "args": ["run", "--json"]
      }
    }
  },
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

| Environment Variable | Purpose |
| --- | --- |
| `PORT` | Used by fixture config loaders to override the configured or default application port. |
| `LOG_LEVEL` | Used by fixture config loaders to override the configured or default log level. |
| `API_BASE_URL` | Used by fixture config loaders to override the configured or default API base URL. |
| `TIMEOUT` | Used by fixture config loaders to override the configured or default timeout value. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
