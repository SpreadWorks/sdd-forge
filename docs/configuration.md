<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/configuration.md) | **English**
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

sdd-forge reads its primary configuration from a single project-level JSON file and supplements it with preset definitions, guardrail files, and flow state files stored in the `.sdd-forge/` directory. The configuration covers documentation output languages, AI agent selection and provider definitions, scanning scope, flow strategy, and logging behavior, all of which can be tailored to each project.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Loaded and validated at the start of every command. |
| `guardrail.json` | `.sdd-forge/guardrail.json` | Project-specific guardrail rules applied during spec and review phases. |
| `preset.json` | `src/presets/{preset-name}/preset.json` | Defines chapter structure, scan patterns, and inheritance chain for a preset. |
| `guardrail.json` (preset) | `src/presets/{preset-name}/guardrail.json` | Preset-level guardrail rules, merged with the project-level file. |
| `flow.json` | `.sdd-forge/flow.json` | Tracks the state of the active development flow (steps, requirements, metrics). |
| `.active-flow` | `.sdd-forge/.active-flow` | JSON array that records which specs are currently active and their worktree mode. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Stores the output of `sdd-forge scan`, consumed by subsequent pipeline commands. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `lang` | Required | string | `"en"` | Operating language for CLI messages and prompts (`"en"` or `"ja"`). |
| `type` | Required | string \| string[] | — | Preset name(s) that define chapter structure and scan patterns (e.g., `"node-cli"`, `["node-cli", "document"]`). |
| `name` | Optional | string | Directory name | Human-readable project name used in generated documentation. |
| `concurrency` | Optional | number | `5` | Maximum number of concurrent AI agent calls during batch operations. |
| `docs` | Required | object | — | Top-level object for all documentation output settings. |
| `docs.languages` | Required | string[] | — | List of output languages for generated docs (e.g., `["en"]`, `["ja", "en"]`). |
| `docs.defaultLanguage` | Required | string | — | Primary language; must be an entry in `docs.languages`. |
| `docs.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | Whether secondary-language docs are produced by translating the primary language (`translate`) or generated independently (`generate`). |
| `docs.exclude` | Optional | string[] | — | Glob patterns for documentation chapters to exclude from the build pipeline. |
| `docs.style.purpose` | Optional | string | — | Intended audience and goal of the documentation (e.g., `"developer-guide"`, `"user-guide"`, `"api-reference"`, or a custom value). |
| `docs.style.tone` | Optional | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to AI-generated text. Required when `docs.style` is present. |
| `docs.style.customInstruction` | Optional | string | — | Free-text instruction passed to the AI agent to further shape writing style. |
| `scan.include` | Optional | string[] | — | Glob patterns for source files to include in the scan step. Required when `scan` object is present. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for source files to exclude from the scan step. |
| `agent.default` | Optional | string | — | Default provider key used when no profile mapping applies (e.g., `"claude/sonnet"`). |
| `agent.workDir` | Optional | string | `".tmp"` | Working directory for agent subprocess output and temporary files. |
| `agent.timeout` | Optional | number | `300` | Per-call agent timeout in seconds. |
| `agent.retryCount` | Optional | number | `0` | Number of automatic retries on agent call failure. |
| `agent.batchTokenLimit` | Optional | number | — | Token limit per batch; must be ≥ 1000. Omit to disable batching. |
| `agent.providers` | Optional | object | — | Map of provider keys to custom agent definitions (see Customization Points). |
| `agent.profiles` | Optional | object | — | Named maps from command-id prefix to provider key, enabling per-command agent routing. |
| `agent.useProfile` | Optional | string | — | Name of the active profile. Overridden by the `SDD_FORGE_PROFILE` environment variable. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy used when finalizing a feature branch. |
| `flow.push.remote` | Optional | string | `"origin"` | Git remote name used when pushing feature branches. |
| `flow.commands.context.search.mode` | Optional | `"ngram"` \| `"ai"` | — | Context search strategy used during flow execution. |
| `commands.gh` | Optional | `"enable"` \| `"disable"` | `"disable"` | Whether GitHub CLI integration (issue and PR creation) is active. |
| `logs.enabled` | Optional | boolean | `false` | Enable JSONL logging of agent prompts and responses. |
| `logs.dir` | Optional | string | `{agent.workDir}/logs` | Directory where log files are written. |
| `experimental.workflow.enable` | Optional | boolean | — | Enable the experimental workflow feature. |
| `experimental.workflow.languages.source` | Optional | string | — | Source language for the experimental workflow. |
| `experimental.workflow.languages.publish` | Optional | string | — | Publish language for the experimental workflow. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

**Documentation output languages**

Control which languages docs are generated in and which is primary:

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "en",
  "mode": "translate"
}
```

**Writing style**

Guide the AI agent's tone and purpose for all generated text:

```json
"docs": {
  "style": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "Prefer short sentences and concrete examples."
  }
}
```

**Source scan scope**

Define which files are analysed during the scan step:

```json
"scan": {
  "include": ["src/**/*.js", "package.json"],
  "exclude": ["src/experimental/**"]
}
```

**AI agent selection and custom providers**

Built-in providers (`claude/opus`, `claude/sonnet`, `codex/gpt-5.4`, `codex/gpt-5.3`) are available out of the box. Custom providers can be added under `agent.providers`:

```json
"agent": {
  "default": "claude/sonnet",
  "timeout": 600,
  "providers": {
    "my-tool": {
      "command": "custom-ai",
      "args": ["--prompt", "{{PROMPT}}"],
      "jsonOutputFlag": "--format=json"
    }
  }
}
```

**Per-command agent routing via profiles**

Route different pipeline commands to different providers using named profiles. Profile keys use prefix matching — `"docs"` matches all `docs.*` commands:

```json
"agent": {
  "profiles": {
    "default": {
      "docs.enrich": "claude/opus",
      "docs.text": "claude/opus",
      "docs": "claude/sonnet"
    },
    "fast": {
      "docs": "claude/sonnet",
      "flow": "claude/sonnet"
    }
  },
  "useProfile": "default"
}
```

**Flow and merge strategy**

Control how feature branches are merged and pushed:

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
}
```

**GitHub CLI integration**

Enable automatic issue and pull request creation:

```json
"commands": {
  "gh": "enable"
}
```

**Agent logging**

Capture all agent prompts and responses to JSONL files for debugging:

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
| `SDD_FORGE_WORK_ROOT` | Overrides the project root directory. When set, it takes precedence over the value returned by `git rev-parse --show-toplevel`. Useful when running sdd-forge from a subdirectory or a CI environment with a non-standard working directory. |
| `SDD_FORGE_SOURCE_ROOT` | Overrides the source code root directory independently of the project root. Defaults to the same value as `SDD_FORGE_WORK_ROOT` when not set. |
| `SDD_FORGE_PROFILE` | Overrides the active agent profile name. Takes precedence over the `agent.useProfile` field in `config.json`. Allows switching provider routing at runtime without editing the config file. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
