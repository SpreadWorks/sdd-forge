<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/configuration.md) | **English**
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge uses a single JSON configuration file stored in the `.sdd-forge/` directory, supplemented by selective reads from the project's `package.json`. The configuration spans required fields such as project language and type, through to optional settings for documentation style, AI agent behavior, source scan targets, chapter ordering, and Spec-Driven Development flow — providing fine-grained control over every stage of the documentation pipeline.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary configuration file. Loaded and fully validated on every sdd-forge command run. Defines all required and optional project settings. |
| `package.json` | `<project-root>/package.json` | Read selectively via `loadPackageField` to retrieve individual fields such as the package name. A missing or malformed file is handled gracefully and does not cause a failure. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | — | BCP 47 language code for the project (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Project preset type(s) (e.g., `"hono"`). Determines which preset rules are applied. A non-empty string or non-empty array of strings. |
| `docs` | Required | object | — | Top-level documentation output settings. |
| `docs.languages` | Required | string[] | — | Non-empty list of language codes to generate documentation for. |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must appear in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | — | How documentation is produced: generate from source analysis or translate from a base language. |
| `docs.style` | Optional | object | — | Writing style applied to all generated documentation text. |
| `docs.style.purpose` | Required if `docs.style` is set | string | — | Describes the intended audience and purpose of the documentation. |
| `docs.style.tone` | Required if `docs.style` is set | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone for generated text. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instructions passed to the documentation generator. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from documentation generation. |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI agent tasks. |
| `chapters` | Optional | object[] | — | Ordered list of chapter definitions. Each entry requires a `chapter` string (filename) and accepts optional `desc` (string) and `exclude` (boolean) fields. |
| `agent.default` | Optional | string | — | Default AI provider key. Must match one of the built-in provider identifiers. |
| `agent.providers` | Optional | object | — | Per-provider configuration objects. Keys are provider identifier strings. |
| `agent.workDir` | Optional | string | — | Working directory used when spawning agent subprocesses. |
| `agent.timeout` | Optional | number | — | Timeout in milliseconds for individual agent tasks. |
| `agent.retryCount` | Optional | number | — | Number of retry attempts for failed agent tasks. |
| `agent.batchTokenLimit` | Optional | number (≥ 1000) | — | Maximum token count per agent batch request. |
| `scan.include` | Required if `scan` is set | string[] | — | Glob patterns specifying source files to include in the analysis scan. |
| `scan.exclude` | Optional | string[] | — | Glob patterns specifying source files to exclude from the analysis scan. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | — | Git merge strategy applied when finalizing a flow. |
| `flow.push.remote` | Optional | string | — | Git remote name to push to during flow finalization. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search algorithm used for context retrieval within the flow. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | — | Enables or disables GitHub CLI (`gh`) integration in flow commands. |
| `experimental.workflow.enable` | Optional | boolean | — | Activates the experimental workflow feature. |
| `experimental.workflow.languages.source` | Optional | string | — | Source language code for the experimental workflow. |
| `experimental.workflow.languages.publish` | Optional | string | — | Publish language code for the experimental workflow. |
| `logs.enabled` | Optional | boolean | — | Enables or disables agent prompt logging. |
| `logs.dir` | Optional | string | — | Directory path for log output files. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation Style**

Control the writing tone, audience framing, and any additional generator instructions by adding a `docs.style` block:

```json
{
  "docs": {
    "style": {
      "purpose": "Internal reference for backend engineers",
      "tone": "formal",
      "customInstruction": "Use active voice and avoid jargon."
    }
  }
}
```

**Multi-language Output**

Generate documentation in multiple languages simultaneously by listing all target language codes and designating a default:

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en"
  }
}
```

**Source Scan Targets**

Define exactly which source files are analyzed using glob patterns under the `scan` key. Use `exclude` to remove test files or fixtures:

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**AI Agent Settings**

Configure the default provider, overall concurrency, and per-task resource limits:

```json
{
  "concurrency": 3,
  "agent": {
    "default": "claude",
    "timeout": 120000,
    "retryCount": 2,
    "batchTokenLimit": 8000
  }
}
```

**Chapter Ordering and Exclusion**

Control which documentation chapters are generated, the order they appear, and whether any should be omitted from output:

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "api_reference.md", "desc": "Public API documentation" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**Flow Merge Strategy**

Set the Git merge strategy and push remote used when finalizing a Spec-Driven Development flow:

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" }
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_FORGE_WORK_ROOT` | Overrides the resolved project work directory — the directory that contains `.sdd-forge/` and `docs/`. When set, it takes precedence over automatic Git-based directory resolution. |
| `SDD_FORGE_SOURCE_ROOT` | Overrides the resolved source root directory used for file scanning. Defaults to the work root when not set. |
| `SDD_FORGE_PROFILE` | Selects the active agent profile for command execution. Takes priority over the `agent.useProfile` configuration setting when present. |

In addition, the `CLAUDECODE` variable is actively removed from the environment passed to agent child processes at spawn time; it is not read by the tool itself.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
