# 03. Configuration and Customization

## Overview

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

`sdd-forge` reads several configuration files under the `.sdd-forge/` directory to control documentation generation, AI provider integration, output language, and SDD workflow behavior. This chapter describes every configuration file, all available fields in `config.json`, and the customization points available to you as a user.

<!-- {{/text}} -->

## Contents

### Configuration Files

<!-- {{text: List all configuration files read by this tool in a table, including the location and role of each. Key files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

| File | Role |
|---|---|
| `.sdd-forge/config.json` | Primary project configuration. Controls output languages, project type, AI provider, document style, merge strategy, and more. |
| `.sdd-forge/context.json` | Stores the project context string used by AI text generation. Takes priority over `textFill.projectContext` in `config.json`. |
| `.sdd-forge/projects.json` | Multi-project registry. Maps project names to their source and work root paths, and specifies which project is the default. |
| `.sdd-forge/current-spec` | Tracks the active SDD flow state as a JSON object (current spec path, base branch, feature branch, and optional worktree details). |
| `.sdd-forge/output/analysis.json` | Full source code analysis result produced by `sdd-forge scan`. Used as the ground truth for documentation generation. |
| `.sdd-forge/output/summary.json` | Lightweight version of the analysis result intended for AI consumption. Used in preference to `analysis.json` when present; falls back to `analysis.json` if absent. |
| `.sdd-forge/snapshots/` | Directory used by the `snapshot` command to store baseline outputs for regression detection. Contains a `manifest.json` plus captured file copies. |

<!-- {{/text}} -->

### Configuration Reference

<!-- {{text: Describe all fields of .sdd-forge/config.json in a table. Include field name, whether required, type, default value, and description. Key fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | List of output languages for generated documentation (e.g. `["en"]`, `["en", "ja"]`). |
| `output.default` | ✅ | `string` | — | The primary output language. Documents are generated directly in this language. |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | How non-default languages are produced. `translate` runs the `translate` command; `generate` calls the AI independently for each language. |
| `lang` | ✅ | `string` | — | Language used for CLI messages, AGENTS.md, skill prompts, and spec files (e.g. `"en"`, `"ja"`). |
| `type` | ✅ | `string` | — | Project type that selects the preset (e.g. `"cli/node-cli"`, `"webapp/cakephp2"`). Determines which chapters and data sources are applied. |
| `uiLang` | — | `"en"` \| `"ja"` | — | Language for terminal UI output. Overrides `lang` for interactive messages only. |
| `documentStyle.purpose` | — | `string` | — | Free-text description of the documentation's intended purpose, passed to the AI as context. |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | Writing style for AI-generated text sections. |
| `documentStyle.customInstruction` | — | `string` | — | Additional freeform instruction appended to every AI prompt, allowing project-specific writing rules. |
| `textFill.projectContext` | — | `string` | — | Background description of the project supplied to the AI. Overridden by `.sdd-forge/context.json` when that file exists. |
| `textFill.preamblePatterns` | — | `object[]` | — | List of pattern objects used to strip unwanted preamble text from AI responses (e.g. "Here is the generated text…"). |
| `defaultAgent` | — | `string` | — | Key name of the AI provider (from `providers`) to use when no `--agent` flag is given. |
| `providers` | — | `object` | — | Map of named AI provider definitions. Each entry specifies `command`, `args`, optional `timeoutMs`, and `systemPromptFlag`. |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy used during the SDD flow close step when merging a feature branch back to its base. |
| `limits.concurrency` | — | `number` | `5` | Maximum number of files processed in parallel during `text` and other batch operations. |
| `limits.designTimeoutMs` | — | `number` | — | Timeout in milliseconds for AI calls made during documentation generation. |

<!-- {{/text}} -->

### Customization Points

<!-- {{text: Describe the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

**1. AI Provider Settings**

The `providers` field lets you register one or more AI agents and choose which one `sdd-forge` uses by default. Each provider entry specifies how to invoke the underlying CLI tool, including how to pass the system prompt.

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

The `{{PROMPT}}` placeholder in `args` is replaced at runtime with the generated prompt. If no `{{PROMPT}}` placeholder is present, the prompt is appended at the end of the argument list. Use `"systemPromptFlag": "--system-prompt-file"` to have `sdd-forge` write the system prompt to a temporary file and pass its path instead.

**2. Document Style**

Use `documentStyle` to control the character of AI-generated text across all documentation sections.

```json
{
  "documentStyle": {
    "purpose": "Internal onboarding guide for new engineers",
    "tone": "casual",
    "customInstruction": "Always include a concrete example for each concept."
  }
}
```

**3. Preset Selection**

The `type` field selects the preset that determines which documentation chapters are generated and which source code categories are scanned.

```json
{
  "type": "cli/node-cli"
}
```

Available built-in types include `"cli/node-cli"`, `"webapp/cakephp2"`, `"webapp/laravel"`, `"webapp/symfony"`, and bare arch types such as `"webapp"` and `"library"`.

**4. Merge Strategy**

Control how feature branches are merged back to their base branch at the end of the SDD flow.

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

Choose `"squash"` to collapse all commits into one, `"ff-only"` to enforce a linear history, or `"merge"` for a standard merge commit.

**5. Concurrency**

Tune parallel processing to balance speed against resource usage or rate limits imposed by your AI provider.

```json
{
  "limits": {
    "concurrency": 3,
    "designTimeoutMs": 240000
  }
}
```

Reducing `concurrency` is useful when your AI provider enforces strict request-per-minute limits.

<!-- {{/text}} -->

### Environment Variables

<!-- {{text: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hangs).}} -->

| Variable | Purpose |
|---|---|
| `SDD_SOURCE_ROOT` | Absolute path to the source code root directory. When set, `sdd-forge` uses this path as the target for scanning and analysis instead of resolving it from the current working directory or git root. |
| `SDD_WORK_ROOT` | Absolute path to the work root — the directory that contains `.sdd-forge/`. When set, all configuration files, output artefacts, and flow state are read from and written to this location. Takes priority over the git-resolved repository root. |
| `CLAUDECODE` | An internal environment variable set by the Claude CLI. `sdd-forge` removes this variable from the child process environment before spawning AI agent calls in order to prevent the Claude CLI from hanging when `stdin` is closed. |

<!-- {{/text}} -->
