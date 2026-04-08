<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/configuration.md) | **English**
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads a single JSON configuration file per project, through which users can control documentation output languages and style, AI agent selection and execution behavior, file scanning scope, Git flow strategy, and logging. Customization spans from high-level presets and per-command agent overrides to fine-grained concurrency tuning and experimental workflow features.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and validated at startup by `loadConfig()` in `src/lib/config.js`. Required for all documentation and flow commands. |
| `package.json` | Project root | Read by `loadPackageField()` to retrieve optional project metadata fields, and by `getPackageVersion()` to resolve the sdd-forge version string. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Source-code analysis data produced by `sdd-forge scan`. Loaded in command context to supply data for documentation generation. |
| `preset.json` | `src/presets/{key}/preset.json` | Preset metadata loaded by `resolveChainSafe()` in `src/lib/presets.js`. Defines the chapter structure and DataSources for the selected preset chain. |
| `state.json` | `.sdd-forge/flow/{spec}/state.json` | Per-spec flow state snapshot read by `src/lib/flow-state.js` during flow operations. |
| Locale files | `src/locale/{lang}.json` | Internationalization strings loaded by `src/lib/i18n.js` based on the configured `lang` value. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | — | Operating language for the CLI, generated AGENTS.md, skills, and specs (e.g. `"ja"`, `"en"`). |
| `type` | Required | string \| string[] | — | Preset name or ordered list of preset names that define the documentation template chain. |
| `docs` | Required | object | — | Container for all documentation output settings. |
| `docs.languages` | Required | string[] | — | Non-empty list of output language codes (e.g. `["ja"]` or `["en", "ja"]`). |
| `docs.defaultLanguage` | Required | string | — | Default output language; must be present in `docs.languages`. |
| `docs.style.purpose` | Required (if `docs.style` is set) | string | — | Document purpose descriptor. Built-in options: `"developer-guide"`, `"user-guide"`, `"api-reference"`. Custom strings are accepted. |
| `docs.style.tone` | Required (if `docs.style` is set) | `"polite"` \| `"formal"` \| `"casual"` | — | Tone applied to AI-generated documentation. |
| `name` | Optional | string | — | Project name, typically set by the setup wizard. |
| `concurrency` | Optional | number | `5` | Maximum number of files processed in parallel during documentation generation. Must be a positive integer. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Strategy for producing non-default language output. |
| `docs.style.customInstruction` | Optional | string | `""` | Additional free-form instructions passed to the AI agent during documentation generation. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for documentation files to exclude from output. |
| `scan.include` | Optional | string[] | — | Custom glob patterns that extend the default preset scanning rules. |
| `scan.exclude` | Optional | string[] | — | Glob patterns that exclude source files from scanning. |
| `agent.default` | Optional | string | — | Default AI agent provider key (e.g. `"claude/sonnet"`). |
| `agent.workDir` | Optional | string | `".tmp"` | Working directory used for agent execution and log output. |
| `agent.timeout` | Optional | number | `300` | Agent execution timeout in seconds. |
| `agent.retryCount` | Optional | number | — | Number of retries for `docs enrich` agent calls. Must be a positive integer. |
| `agent.batchTokenLimit` | Optional | number | — | Token limit for batch operations. Minimum value: `1000`. |
| `agent.providers` | Optional | object | Built-in providers | Map of custom agent provider definitions. User-defined entries override built-in providers with the same key. |
| `agent.providers.{key}.command` | Required (per provider) | string | — | Executable command for the agent (e.g. `"claude"`). |
| `agent.providers.{key}.args` | Required (per provider) | string[] | — | Command arguments. Use `{{PROMPT}}` as a placeholder for the prompt string. |
| `agent.providers.{key}.systemPromptFlag` | Optional | string | — | CLI flag used to pass the system prompt (e.g. `"--system-prompt"`). |
| `agent.providers.{key}.jsonOutputFlag` | Optional | string | — | CLI flag that requests JSON output from the agent (e.g. `"--output-format json"`). |
| `agent.providers.{key}.profiles` | Optional | object | — | Named profile configurations within the provider definition. |
| `agent.commands` | Optional | object | — | Per-command agent and profile overrides (e.g. map `"docs.enrich"` to a specific provider/profile). |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy used by flow operations. |
| `flow.push.remote` | Optional | string | `"origin"` | Git remote used for push operations in flow commands. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search mode for resolving flow context. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | `"disable"` | Controls whether GitHub CLI integration is active in flow commands. |
| `logs.enabled` | Optional | boolean | `false` | When `true`, enables unified JSONL logging of agent activity. |
| `logs.dir` | Optional | string | `{agent.workDir}/logs` | Directory for JSONL log files. Relative paths are resolved from the main repository root. |
| `experimental.workflow.enable` | Optional | boolean | — | Enables experimental workflow board features. Requires `sdd-forge upgrade` after enabling. |
| `experimental.workflow.languages.source` | Optional | string | — | Source language for the experimental workflow. |
| `experimental.workflow.languages.publish` | Optional | string | — | Publish language for the experimental workflow. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation language and style**

Set `docs.languages` to an array of language codes to generate documentation in multiple languages. When more than one language is listed, `docs.mode` controls whether additional languages are translated from the default or generated independently. The `docs.style` block adjusts how the AI agent writes content.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate",
  "style": {
    "purpose": "user-guide",
    "tone": "formal",
    "customInstruction": "Always include a code example for each feature."
  }
}
```

**AI agent selection and per-command overrides**

Set `agent.default` to choose the agent used for all documentation commands. Use `agent.commands` to override the agent or profile for individual commands.

```json
"agent": {
  "default": "claude/sonnet",
  "timeout": 600,
  "retryCount": 2,
  "commands": {
    "docs.enrich": { "agent": "claude/sonnet", "profile": "high-quality" },
    "docs.text": { "agent": "claude/sonnet" }
  }
}
```

**Custom agent providers**

Define providers under `agent.providers` to integrate any CLI-based AI agent. The `{{PROMPT}}` placeholder in `args` is replaced with the actual prompt at runtime.

```json
"agent": {
  "providers": {
    "my-agent": {
      "command": "my-agent-cli",
      "args": ["--prompt", "{{PROMPT}}", "--format", "json"],
      "jsonOutputFlag": "--format json"
    }
  }
}
```

**File scanning scope**

Use `scan.include` and `scan.exclude` to refine which source files the tool analyses, supplementing or narrowing the default preset patterns.

```json
"scan": {
  "include": ["plugins/**/*.php"],
  "exclude": ["legacy/**", "**/*.generated.js"]
}
```

**Parallel processing concurrency**

Adjust `concurrency` to balance throughput against API rate limits. The default is `5` parallel operations.

```json
"concurrency": 3
```

**Git flow strategy**

Set `flow.merge` to control how feature branches are merged during flow operations, and `flow.push.remote` if your primary remote is not `origin`.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "upstream" }
}
```

**Unified logging**

Enable JSONL logging for all agent activity by setting `logs.enabled` to `true`. Logs are written to `logs.dir`, which defaults to `{agent.workDir}/logs`.

```json
"logs": {
  "enabled": true,
  "dir": ".tmp/logs"
}
```

**GitHub CLI integration**

Set `commands.gh` to `"enable"` to allow flow commands to interact with GitHub (e.g. creating pull requests automatically).

```json
"commands": {
  "gh": "enable"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Variable | Purpose |
|----------|---------|
| `SDD_FORGE_WORK_ROOT` | Overrides the working root directory detected via `git rev-parse`. When set, its value is used directly as the project root instead of the result of automatic detection. |
| `SDD_FORGE_SOURCE_ROOT` | Overrides the source directory used for scanning. When set, its value is used instead of the automatically detected root. Useful in monorepo layouts where source and config live in different directories. |
| `SDD_FORGE_PROFILE` | Overrides the agent profile selected by `agent.useProfile` in the configuration. Takes precedence over the config value, allowing profile selection at runtime (e.g. in CI environments). |
| `CLAUDECODE` | Internal Claude Code environment marker. sdd-forge removes this variable from the environment before invoking agent subprocesses to prevent it from being passed through to child commands. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
