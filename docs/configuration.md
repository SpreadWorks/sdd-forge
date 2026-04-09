<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/configuration.md) | **English**
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads a single project-level JSON configuration file alongside per-preset JSON files bundled with the package, together covering everything from documentation output languages and AI agent providers to git merge strategy and experimental features. Users can tailor document style, file scanning patterns, agent routing profiles, processing concurrency, and external tool availability through a structured set of fields in `.sdd-forge/config.json`.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` (project root) | Primary project configuration. Loaded by `loadConfig()` in `src/lib/config.js` for every command. Holds all user-facing settings such as language, preset type, docs output, agent providers, and flow strategy. |
| `preset.json` | `src/presets/<preset-name>/preset.json` (package) | Per-preset definition bundled with sdd-forge. Declares scan patterns, chapter templates, parent preset for inheritance, and aliases. Resolved at runtime by merging the preset chain. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

The table below covers all fields recognised by `validateConfig()` in `src/lib/types.js`. Fields marked **Required** cause validation to fail if absent.

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | — | Operating language for CLI text, AGENTS.md output, skills, and specs (e.g., `"en"`, `"ja"`). |
| `type` | Required | string \| string[] | — | Preset name(s) to apply (e.g., `"laravel"` or `["symfony", "postgres"]`). |
| `name` | Optional | string | — | Human-readable project name written by the setup wizard. |
| `concurrency` | Optional | number | `5` | Maximum number of files processed in parallel during docs generation. Must be a positive integer. |
| `docs` | Required | object | — | Documentation output settings (see child fields below). |
| `docs.languages` | Required | string[] | — | List of output languages (e.g., `["en"]` or `["ja", "en"]`). Must be non-empty. |
| `docs.defaultLanguage` | Required | string | — | Primary output language. Must be one of the values in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How non-default language docs are produced — translated from the default language or generated independently. |
| `docs.exclude` | Optional | string[] | — | Glob patterns for chapter files to omit from the docs build. |
| `docs.style` | Optional | object | — | Controls the tone and purpose of generated documentation. |
| `docs.style.purpose` | Required if `style` present | string | — | Document purpose, e.g., `"developer-guide"`, `"user-guide"`, or a custom string. |
| `docs.style.tone` | Required if `style` present | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to all generated text. |
| `docs.style.customInstruction` | Optional | string | — | Free-form additional instruction appended to every generation prompt. |
| `scan` | Optional | object | — | Overrides the preset's default file scanning patterns. |
| `scan.include` | Required if `scan` present | string[] | — | Non-empty array of glob patterns selecting source files to analyse. |
| `scan.exclude` | Optional | string[] | — | Glob patterns excluded from scanning (e.g., vendor, test directories). |
| `agent` | Optional | object | — | AI agent invocation settings. |
| `agent.default` | Optional | string | — | Provider key used when no profile matches the current command. |
| `agent.timeout` | Optional | number | `300` | Per-invocation timeout in seconds. Converted to milliseconds internally. |
| `agent.retryCount` | Optional | number | `0` | Number of retries for `docs enrich` agent calls. |
| `agent.batchTokenLimit` | Optional | number | `10000` | Maximum estimated tokens per batch during `docs enrich`. Must be ≥ 1000. |
| `agent.workDir` | Optional | string | — | Working directory used when invoking agent commands. |
| `agent.providers` | Optional | object | — | Custom provider definitions merged with built-in providers. |
| `agent.providers[key].command` | Required per provider | string | — | Executable name (e.g., `"claude"`, `"codex"`). |
| `agent.providers[key].args` | Required per provider | string[] | — | Argument list. Use `{{PROMPT}}` as the placeholder for the user prompt. |
| `agent.providers[key].systemPromptFlag` | Optional | string | — | CLI flag to pass a system prompt (e.g., `"--system-prompt"`). If absent, the system prompt is prepended to the user prompt. |
| `agent.providers[key].jsonOutputFlag` | Optional | string | — | CLI flag that requests JSON output from the agent (e.g., `"--output-format json"`). |
| `agent.profiles` | Optional | object | — | Named routing profiles mapping command-ID prefixes to provider keys. |
| `agent.useProfile` | Optional | string | — | Default profile to activate. Overridable by the `SDD_FORGE_PROFILE` environment variable. |
| `flow` | Optional | object | — | Git workflow settings for flow finalization. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Merge strategy used when finalizing a flow branch. |
| `flow.push.remote` | Optional | string | `"origin"` | Remote name for push operations during finalize. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Search algorithm used for context resolution in flow commands. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | `"disable"` | Whether the GitHub CLI (`gh`) is available for PR creation and related operations. |
| `logs.enabled` | Optional | boolean | `false` | Enables unified JSONL log output for agent invocations. |
| `logs.dir` | Optional | string | `{agent.workDir}/logs` | Directory where log files are written. |
| `experimental.workflow.enable` | Optional | boolean | — | Activates the experimental workflow board feature. |
| `experimental.workflow.languages.source` | Optional | string | — | Source language for workflow issue generation. |
| `experimental.workflow.languages.publish` | Optional | string | — | Target language for published workflow output. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Document output languages and style**

Set `docs.languages` to include every language you want generated. Pair it with `docs.defaultLanguage` for the primary output, and optionally set `docs.mode` to `"generate"` if you want non-default languages produced independently rather than translated.

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "generate",
  "style": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "Use active voice throughout."
  }
}
```

**Custom file scanning**

Override the preset's default scan patterns with `scan.include` and `scan.exclude` to target only the files relevant to your project structure.

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["**/__tests__/**", "**/vendor/**"]
}
```

**AI agent providers and routing profiles**

Define custom providers under `agent.providers` and create named profiles that route specific sdd-forge commands to different models. Profiles use command-ID prefix matching (e.g., `"docs"` matches `docs.text`, `docs.review`, etc.).

```json
"agent": {
  "providers": {
    "claude/sonnet": {
      "command": "claude",
      "args": ["-p", "{{PROMPT}}", "--model", "sonnet"],
      "systemPromptFlag": "--system-prompt",
      "jsonOutputFlag": "--output-format json"
    },
    "claude/opus": {
      "command": "claude",
      "args": ["-p", "{{PROMPT}}", "--model", "opus"],
      "systemPromptFlag": "--system-prompt"
    }
  },
  "profiles": {
    "standard": {
      "docs": "claude/sonnet",
      "flow": "claude/opus"
    }
  },
  "useProfile": "standard",
  "timeout": 600,
  "retryCount": 1,
  "batchTokenLimit": 20000
}
```

**Git merge strategy**

Control how sdd-forge merges feature branches during `flow finalize`. The default is `"squash"`; choose `"ff-only"` or `"merge"` to match your team's branching conventions.

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "upstream" }
}
```

**GitHub CLI integration**

Enable the `gh` command to allow sdd-forge to open pull requests automatically during flow finalization.

```json
"commands": {
  "gh": "enable"
}
```

**Processing concurrency**

Adjust the number of files processed in parallel to balance speed against API rate limits.

```json
"concurrency": 3
```

**Agent invocation logging**

Enable JSONL logs for all agent calls to support debugging and auditing.

```json
"logs": {
  "enabled": true,
  "dir": ".tmp/logs"
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Environment Variable | Purpose |
|----------------------|---------|
| `SDD_FORGE_WORK_ROOT` | Overrides the working root directory used by the CLI. When set, sdd-forge uses this path instead of the detected git repository root. Useful for running the tool from a directory outside the project root. |
| `SDD_FORGE_SOURCE_ROOT` | Overrides the source root directory (the directory whose files are scanned and documented). When unset, sdd-forge uses the work root as the source root. |
| `SDD_FORGE_PROFILE` | Overrides the active agent routing profile at runtime. Takes precedence over the `agent.useProfile` field in `config.json`. Set to a profile name defined under `agent.profiles`. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
