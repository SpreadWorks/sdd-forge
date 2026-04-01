<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/configuration.md)
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge stores its project configuration in `.sdd-forge/config.json` and optionally reads metadata from the project root's `package.json`. Configurable items span documentation language and style, source scan patterns, AI agent behavior, SDD flow merge strategy, chapter ordering, and GitHub CLI integration.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary configuration file for all sdd-forge settings; loaded and validated by `loadConfig()` on every command invocation |
| `package.json` | `<project root>/package.json` | Project metadata; individual fields are read on demand by `loadPackageField()`; a missing file is handled without error |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `docs` | Required | object | — | Container for all documentation generation settings |
| `docs.languages` | Required | string[] | — | List of language codes for which documentation is generated (e.g., `["en", "ja"]`) |
| `docs.defaultLanguage` | Required | string | — | Primary output language; must be included in `docs.languages` |
| `docs.mode` | Optional | `translate` \| `generate` | — | Documentation generation mode |
| `docs.style` | Optional | object | — | Writing style settings for AI-generated text |
| `docs.style.purpose` | Required if `docs.style` present | string | — | Describes the intended purpose or audience of the documentation |
| `docs.style.tone` | Required if `docs.style` present | `polite` \| `formal` \| `casual` | — | Writing tone for generated content |
| `docs.style.customInstruction` | Optional | string | — | Additional free-form instruction appended to AI prompts |
| `docs.exclude` | Optional | string[] | — | Glob patterns for files excluded from documentation generation |
| `lang` | Required | string | — | Primary language of the target project's source code |
| `type` | Required | string \| string[] | — | Preset type(s) identifying the project stack (e.g., `"node-cli"`) |
| `concurrency` | Optional | number | `5` | Maximum number of parallel AI agent calls; must be a positive integer; default applied by `resolveConcurrency()` |
| `chapters` | Optional | `{ chapter, desc?, exclude? }[]` | — | Custom chapter order; each entry specifies a filename and an optional exclusion flag |
| `agent.workDir` | Optional | string | — | Working directory for the AI agent process |
| `agent.timeout` | Optional | number | — | Per-invocation timeout in milliseconds; must be a positive integer |
| `agent.retryCount` | Optional | number | — | Number of retries on agent failure; must be a positive integer |
| `agent.providers` | Optional | object | — | Named agent provider definitions; each entry requires `command` (string) and `args` (array) |
| `scan.include` | Required if `scan` present | string[] | — | Glob patterns for files to include in analysis; must be non-empty |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from analysis |
| `flow.merge` | Optional | `squash` \| `ff-only` \| `merge` | — | Git merge strategy used when finalizing an SDD flow |
| `flow.push.remote` | Optional | string | — | Git remote name used when pushing during flow finalization |
| `commands.gh` | Optional | `enable` \| `disable` | — | Controls whether the GitHub CLI is invoked during flow finalization |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Writing Style**

The `docs.style` object controls how the AI writes generated documentation. Set `purpose` to describe the intended audience, choose a `tone` from the allowed values, and add a `customInstruction` for domain-specific guidance.

```json
{
  "docs": {
    "style": {
      "purpose": "Internal developer reference for maintainers",
      "tone": "formal",
      "customInstruction": "Emphasize error handling and provide code examples where relevant."
    }
  }
}
```

**Chapter Ordering**

The `chapters` array overrides the preset's default chapter order. Each entry specifies a chapter filename, an optional short description, and an optional `exclude` flag to omit a chapter from the output.

```json
{
  "chapters": [
    { "chapter": "overview.md" },
    { "chapter": "cli_commands.md" },
    { "chapter": "internal_design.md", "exclude": true }
  ]
}
```

**Scan Patterns**

Use `scan.include` and `scan.exclude` to control which source files are analyzed. Both fields accept glob patterns.

```json
{
  "scan": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**Agent Concurrency and Providers**

`concurrency` caps the number of parallel AI agent calls (default: `5`). The `agent.providers` object defines named providers with a custom executable and argument list.

```json
{
  "concurrency": 3,
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["--model", "claude-opus-4-5"]
      }
    }
  }
}
```

**SDD Flow Options**

`flow.merge` sets the Git merge strategy applied when finalizing a spec-driven development flow. `commands.gh` enables or disables GitHub CLI integration during finalization.

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

The configuration loader (`config.js`) and the config schema validator (`types.js`) do not reference any environment variables. All configuration values are read exclusively from `.sdd-forge/config.json` and `package.json` on disk; no environment variable overrides exist at the configuration layer.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
