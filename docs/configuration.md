# 03. Configuration and Customization

## Overview

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

This chapter describes the configuration files that control sdd-forge's behavior, the full set of configurable options available in each file, and the key customization points for AI providers, document style, project types, and pipeline settings. Understanding these files gives you precise control over how documentation is generated, how multiple projects are managed, and how the SDD flow operates.

<!-- {{/text}} -->

## Contents

### Configuration Files

<!-- {{text: List all configuration files loaded by this tool in a table, including their locations and roles. Key files: .sdd-forge/config.json (project settings), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results including enriched data).}} -->

The following files are read or written by sdd-forge during normal operation. All paths are relative to the working root of the project (the directory that contains `.sdd-forge/`).

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Defines output languages, project type, AI providers, document style, and pipeline limits. Required for all doc-generation commands. |
| `projects.json` | `.sdd-forge/projects.json` | Multi-project registry. Created by `sdd-forge setup`. Maps named projects to their source and work-root paths and tracks the default project. |
| `current-spec` | `.sdd-forge/current-spec` | SDD flow state. Stores the active spec path, base/feature branch names, and worktree location while a spec-driven development flow is in progress. Deleted on flow completion. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Full source-code analysis produced by `sdd-forge scan`. After `sdd-forge enrich`, each entry is augmented with `summary`, `detail`, `chapter`, and `role` fields used by downstream doc-generation steps. |
| `context.json` | `.sdd-forge/context.json` | Optional project context string used to supplement AI prompts. Written by `saveContext()` and read by `resolveProjectContext()`. |

<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all fields in .sdd-forge/config.json in a table. Include field name, whether it is required, type, default value, and description. Key fields: output.languages (list of output languages), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

The table below covers every field accepted by `.sdd-forge/config.json`. Fields marked **Required** will cause a validation error and abort the command if omitted or set to an invalid value.

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | Non-empty list of output languages for generated docs (e.g. `["en"]`, `["ja", "en"]`). |
| `output.default` | ✅ | `string` | — | The primary output language. Must be one of the values in `output.languages`. |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | How non-default languages are produced. `translate` passes the default-language output to the AI for translation; `generate` re-runs the full generation pipeline in the target language. |
| `lang` | ✅ | `string` | — | Operating language for the CLI, AGENTS.md, skills, and spec files (e.g. `"en"`, `"ja"`). |
| `type` | ✅ | `string` | — | Project type that selects the active preset (e.g. `"cli/node-cli"`, `"webapp/cakephp2"`, `"webapp/laravel"`). Type aliases such as `"node-cli"` are automatically resolved to their canonical form. |
| `documentStyle.purpose` | — | `string` | — | Intended audience and purpose of the generated docs (e.g. `"developer-guide"`, `"user-guide"`). Required when `documentStyle` is present. |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to AI-generated text. Required when `documentStyle` is present. |
| `documentStyle.customInstruction` | — | `string` | — | Additional free-text instruction injected into AI prompts to further tailor the generated content. |
| `textFill.projectContext` | — | `string` | — | Background description of the project, used to supplement AI generation prompts when source code alone is insufficient. Superseded by `context.json` when both exist. |
| `textFill.preamblePatterns` | — | `object[]` | — | List of `{ pattern, flags }` objects defining regex patterns that sdd-forge strips from the beginning of AI responses (e.g. to remove boilerplate disclaimers). |
| `defaultAgent` | — | `string` | — | Key of the provider entry in `providers` to use when no `--agent` flag is supplied. |
| `providers.<name>.command` | — | `string` | — | Executable to invoke for this AI provider (e.g. `"claude"`). Required per provider. |
| `providers.<name>.args` | — | `string[]` | — | Argument list passed to the command. Use `{{PROMPT}}` as a placeholder for prompt injection; if absent the prompt is appended at the end. Required per provider. |
| `providers.<name>.timeoutMs` | — | `number` | `120000` | Per-invocation timeout in milliseconds for this provider. |
| `providers.<name>.systemPromptFlag` | — | `string` | `"--system-prompt"` | CLI flag used to pass a system prompt to the provider (e.g. `"--system-prompt"`). |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy used when the SDD flow merges the feature branch back to the base branch. |
| `limits.concurrency` | — | `number` | `5` | Number of source files processed in parallel during scan and enrich steps. |
| `limits.designTimeoutMs` | — | `number` | — | Overall timeout (ms) for long-running design-phase AI calls. |
| `chapters` | — | `string[]` | — | Ordered list of chapter file names that overrides the preset's default chapter order for this project. |
| `agentWorkDir` | — | `string` | — | Working directory passed to the AI agent via `-C <dir>`. Must be a valid path if specified. |
| `uiLang` | — | `"en"` \| `"ja"` | — | Language used for CLI progress messages and UI output, independent of the doc output language. |

<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Explain the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

sdd-forge exposes five principal customization areas. Each is configured in `.sdd-forge/config.json`.

**1. AI Provider Settings**

The `providers` map lets you define one or more AI backends. The `defaultAgent` key selects which provider is used by default. Each provider entry requires a `command` and an `args` array; the special placeholder `{{PROMPT}}` marks where the generated prompt is injected into the argument list.

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--system-prompt", "You are a documentation assistant.", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

> **Note:** There is no `--system-prompt-file` option in Claude CLI. Very long system prompts passed via `--system-prompt` may hit the OS `ARG_MAX` limit; keep system prompts concise.

**2. Document Style**

The `documentStyle` object controls the purpose and tone of AI-generated text. Add a `customInstruction` string to inject project-specific writing guidance.

```json
{
  "documentStyle": {
    "purpose": "developer-guide",
    "tone": "formal",
    "customInstruction": "Always include code examples when describing API methods."
  }
}
```

Valid tone values are `polite`, `formal`, and `casual`. The `purpose` field is a free string and is forwarded verbatim to AI prompts.

**3. Preset Selection**

The `type` field selects the documentation preset that determines which source files are scanned and which chapters are generated. Set it to a canonical type path or a supported alias.

```json
{
  "type": "cli/node-cli"
}
```

Supported aliases resolve automatically (for example, `"node-cli"` → `"cli/node-cli"`, `"php-mvc"` → `"webapp/cakephp2"`). Run `sdd-forge presets` to list all available presets and their keys.

**4. Merge Strategy**

The `flow.merge` field controls how the feature branch is merged into the base branch when the SDD flow completes.

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

| Value | Behavior |
|---|---|
| `squash` | Squash all commits into one before merging (default). |
| `ff-only` | Fast-forward only; fails if a fast-forward merge is not possible. |
| `merge` | Standard merge commit. |

**5. Concurrency**

The `limits.concurrency` field controls how many source files are processed in parallel during the `scan` and `enrich` pipeline steps. Increase it on machines with ample CPU/memory, or lower it to reduce load.

```json
{
  "limits": {
    "concurrency": 10,
    "designTimeoutMs": 300000
  }
}
```

The default concurrency is `5`. The optional `designTimeoutMs` sets the timeout for long-running AI design calls; if omitted, the built-in per-command timeout constants apply (`120 s` / `180 s` / `300 s` depending on the operation).

<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List the environment variables referenced by the tool and their purposes in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (working root, location of .sdd-forge/), CLAUDECODE (internal variable deleted to prevent Claude CLI hangs).}} -->

sdd-forge reads and writes the following environment variables at runtime. These are typically set automatically by the top-level dispatcher (`sdd-forge.js`) before invoking sub-commands, but they can also be set manually for advanced use cases such as running sub-commands directly or in CI pipelines.

| Variable | Direction | Description |
|---|---|---|
| `SDD_SOURCE_ROOT` | Read | Absolute path to the source code root of the project being analyzed. Used by `sourceRoot()` in `src/lib/cli.js`. When set, it takes precedence over the value derived from `git rev-parse` or `process.cwd()`. |
| `SDD_WORK_ROOT` | Read | Absolute path to the working root — the directory that contains `.sdd-forge/`. Used by `repoRoot()` in `src/lib/cli.js`. When set, it takes precedence over git-based resolution. In git worktrees the two roots may differ from each other. |
| `CLAUDECODE` | Deleted | An internal Claude CLI variable that, when present, causes the CLI to hang waiting for input. `callAgentAsync()` explicitly removes this variable from the child process environment before spawning the AI agent to prevent deadlocks. |

`SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` are the primary mechanism by which the main dispatcher communicates project context to every sub-command without requiring each command to re-resolve the project path independently.

<!-- {{/text}} -->
