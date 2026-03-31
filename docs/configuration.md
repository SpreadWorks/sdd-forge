<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

This chapter covers the configuration files the tool reads from the project root and `.sdd-forge` directory, along with the settings that control documentation output, scanning targets, chapter definitions, flow behavior, command integration, and agent execution. It also highlights the main customization points, including multilingual documentation settings, writing style, concurrency, GitHub command handling, and pluggable agent providers.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| Main config | `.sdd-forge/config.json` | Primary validated project configuration. It defines documentation settings, language, project type, chapter entries, scan rules, flow settings, command settings, concurrency, and agent settings. |
| Package metadata | `package.json` | Source for project metadata used by documentation templates, including package name, description, version, and scripts. It is also read to fetch individual top-level fields. |
| Docs config for language links | `.sdd-forge/config.json` | Source for `docs.languages` and `docs.defaultLanguage` when generating language-switcher links between chapter files. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `docs` | Required | object | None | Top-level documentation configuration block. |
| `docs.languages` | Required | string[] | None | Non-empty list of output languages for generated documentation. |
| `docs.defaultLanguage` | Required | string | None | Default language for documentation output. It must be one of `docs.languages`. |
| `docs.mode` | Optional | string | `translate` | Output mode for documentation. Allowed values are `translate` and `generate`. |
| `docs.style` | Optional | object | None | Writing-style configuration for generated documentation. |
| `docs.style.purpose` | Required when `docs.style` is present | string | None | Non-empty purpose statement for documentation generation. |
| `docs.style.tone` | Required when `docs.style` is present | string | None | Tone used for generated documentation. Allowed values are `polite`, `formal`, and `casual`. |
| `docs.style.customInstruction` | Optional | string | None | Additional custom instruction text for documentation generation. |
| `docs.exclude` | Optional | string[] | None | List of glob patterns to exclude from documentation processing. |
| `lang` | Required | string | `en` when loaded permissively | Primary language setting used by the tool outside validated docs output settings. Strict validation requires a non-empty string. |
| `type` | Required | string or string[] | None | Project type definition. It must be a non-empty string or a non-empty array of non-empty strings. |
| `concurrency` | Optional | number | `5` | Maximum concurrent work setting. Non-numeric, falsy, or missing values resolve to the default. |
| `chapters` | Optional | object[] | None | Chapter configuration in the current object-based format. Legacy string entries are rejected and require migration with `sdd-forge upgrade`. |
| `chapters[].chapter` | Required when a chapter entry is present | string | None | Chapter file name for the entry. |
| `chapters[].desc` | Optional | string | None | Description for the chapter entry. |
| `chapters[].exclude` | Optional | boolean | None | Whether to exclude the chapter entry. |
| `scan` | Optional | object | None | Source scanning configuration block. |
| `scan.include` | Required when `scan` is present | string[] | None | Non-empty list of include patterns for scanning. |
| `scan.exclude` | Optional | string[] | None | List of exclude patterns for scanning. |
| `flow` | Optional | object | None | Workflow behavior configuration block. |
| `flow.merge` | Optional | string | None | Merge strategy for flow operations. Allowed values are `squash`, `ff-only`, and `merge`. |
| `flow.push` | Optional | object | None | Push-related workflow settings. |
| `flow.push.remote` | Optional | string | None | Remote name used for push operations. |
| `commands` | Optional | object | None | External command integration settings. |
| `commands.gh` | Optional | string | None | GitHub command availability setting. Allowed values are `enable` and `disable`. |
| `agent` | Optional | object | None | Agent execution configuration block. |
| `agent.workDir` | Optional | string | None | Working directory for agent execution. |
| `agent.timeout` | Optional | number | None | Positive timeout value for agent execution. |
| `agent.retryCount` | Optional | number | None | Positive retry count for agent execution. |
| `agent.providers` | Optional | object | None | Map of named agent providers. |
| `agent.providers.<name>.command` | Required when a provider is defined | string | None | Executable command for the provider. |
| `agent.providers.<name>.args` | Required when a provider is defined | array | None | Argument list for the provider command. |
| Package `name` | Optional | string | Basename of the project root directory | Project name exposed to documentation templates. |
| Package `description` | Optional | string | None | Project description exposed to documentation templates. |
| Package `version` | Optional | string | `0.0.0` | Project version exposed to documentation templates. |
| Package `scripts` | Optional | object | None | Script definitions exposed as a Markdown table in generated documentation. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

Users can customize documentation output languages and the default language in `.sdd-forge/config.json`.

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

Users can customize documentation style with a purpose statement, a fixed tone, and optional extra instructions.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "style": {
      "purpose": "Create a user guide for end users.",
      "tone": "formal",
      "customInstruction": "Prefer concise explanations and actionable examples."
    }
  },
  "lang": "en",
  "type": "node-cli"
}
```

Users can customize which files are scanned and which documentation chapters are included.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en",
    "exclude": ["docs/internal/**"]
  },
  "lang": "en",
  "type": ["node-cli", "library"],
  "chapters": [
    { "chapter": "overview.md", "desc": "Project overview" },
    { "chapter": "internal.md", "exclude": true }
  ],
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/fixtures/**"]
  }
}
```

Users can customize execution behavior, including concurrency, merge strategy, push remote, GitHub command handling, and agent providers.

```json
{
  "docs": {
    "languages": ["en"],
    "defaultLanguage": "en"
  },
  "lang": "en",
  "type": "node-cli",
  "concurrency": 8,
  "flow": {
    "merge": "squash",
    "push": {
      "remote": "origin"
    }
  },
  "commands": {
    "gh": "enable"
  },
  "agent": {
    "workDir": ".",
    "timeout": 120,
    "retryCount": 3,
    "providers": {
      "default": {
        "command": "codex",
        "args": ["run"]
      }
    }
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Environment Variable | Purpose |
| --- | --- |
| `PORT` | Fixture application setting for the HTTP port. When present, it overrides the port loaded from `config.json` and the built-in default. |
| `LOG_LEVEL` | Fixture application setting for log verbosity. When present, it overrides the value loaded from `config.json` and the built-in default. |
| `API_BASE_URL` | Fixture application setting for the backend API base URL. When present, it overrides the value loaded from `config.json` and the built-in default. |
| `TIMEOUT` | Fixture application setting for request timeout. When present, it overrides the value loaded from `config.json` and the built-in default. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md)
<!-- {{/data}} -->
