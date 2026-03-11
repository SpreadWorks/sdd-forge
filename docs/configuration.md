# 03. Configuration and Customization

## Overview

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

This chapter covers the configuration files that control how sdd-forge operates, from project type and output language settings to AI provider definitions and document style preferences. You will find a complete reference for `.sdd-forge/config.json` along with guidance on customizing AI agents, preset selection, merge strategies, and parallel processing behavior.
<!-- {{/text}} -->

## Contents

### Configuration Files

<!-- {{text: List all configuration files loaded by this tool in a table, including their location and role. Key files: .sdd-forge/config.json (project settings), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results, including enriched data).}} -->

The following files are created and read by sdd-forge during normal operation. All paths are relative to the repository root (or the directory passed as `workRoot`).

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary project configuration. Required fields are validated on every command run. |
| `projects.json` | `.sdd-forge/projects.json` | Multi-project registry created by `sdd-forge setup`. Maps project names to source and work root paths. |
| `current-spec` | `.sdd-forge/current-spec` | JSON file that tracks the active SDD flow state (spec path, branch names, worktree info). Deleted when a flow is closed. |
| `context.json` | `.sdd-forge/context.json` | Optional free-form project context string. Takes precedence over `config.json`'s `textFill.projectContext` when present. |
| `analysis.json` | `.sdd-forge/output/analysis.json` | Full source-code analysis produced by `sdd-forge scan`. After running `sdd-forge enrich`, each entry gains `summary`, `detail`, `chapter`, and `role` fields. |
| Snapshots | `.sdd-forge/snapshots/` | Saved document snapshots for regression detection via `sdd-forge snapshot`. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Document all fields in .sdd-forge/config.json in a table. Include field name, whether it is required, type, default value, and description. Key fields: output.languages (list of output languages), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

All fields are validated by `validateConfig()` in `src/lib/types.js` at startup. Required fields must be present or the command will exit with a list of validation errors.

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | List of output languages for generated documents. Example: `["en"]` or `["en", "ja"]`. Must be non-empty. |
| `output.default` | ✅ | `string` | — | The primary output language. Must be one of the values in `output.languages`. |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | How non-default languages are produced. `translate` passes the default-language output through the AI for translation; `generate` runs the full generation pipeline independently for each language. |
| `lang` | ✅ | `string` | — | Operating language for the CLI, AGENTS.md, skill prompts, and spec files. Typical values: `"en"` or `"ja"`. |
| `type` | ✅ | `string` | — | Project type that selects the preset. Examples: `"cli/node-cli"`, `"webapp/cakephp2"`, `"webapp/laravel"`. Short aliases such as `"cakephp2"` are resolved automatically via `TYPE_ALIASES`. |
| `documentStyle.purpose` | — | `string` | — | Describes the intended audience and purpose of the docs. Examples: `"user-guide"`, `"developer-guide"`, `"api-reference"`. |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to all AI-generated text. |
| `documentStyle.customInstruction` | — | `string` | — | Additional free-text instructions passed to the AI during text generation. |
| `textFill.projectContext` | — | `string` | — | A short description of the project supplied to the AI as background context. Overridden by `.sdd-forge/context.json` when that file exists. |
| `textFill.preamblePatterns` | — | `object[]` | — | Array of `{ pattern, flags }` objects. Matching prefixes are stripped from AI output to remove boilerplate openers. |
| `defaultAgent` | — | `string` | — | Key of the provider entry to use when `--agent` is not specified on the command line. |
| `providers.<key>.command` | — | `string` | — | Executable to invoke for the named AI provider. Example: `"claude"`. |
| `providers.<key>.args` | — | `string[]` | — | Argument list for the provider command. Use `{{PROMPT}}` as a placeholder; if omitted, the prompt is appended automatically. |
| `providers.<key>.timeoutMs` | — | `number` | `120000` | Per-call timeout in milliseconds. |
| `providers.<key>.systemPromptFlag` | — | `string` | — | Flag used to pass a system prompt. Example: `"--system-prompt"`. |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Git merge strategy used by the SDD flow when closing a feature branch. |
| `limits.concurrency` | — | `number` | `5` | Maximum number of files processed in parallel during `text`, `data`, and `enrich` commands. |
| `limits.designTimeoutMs` | — | `number` | — | Overall timeout in milliseconds for long-running design-phase agent calls. |
| `chapters` | — | `string[]` | — | Overrides the chapter order defined in `preset.json`. Only the filenames listed here (without path) will be generated and in the specified order. |
| `agentWorkDir` | — | `string` | — | Working directory passed to the AI agent via `-C <dir>`. Useful when the agent needs to resolve relative imports from a specific location. |
| `uiLang` | — | `"en"` \| `"ja"` | — | Language for interactive CLI prompts and progress messages. Defaults to the value of `lang`. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Explain the items users can customize. (1) AI provider settings (providers field: command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include a JSON configuration example for each item.}} -->

#### 1. AI Provider Settings

The `providers` map lets you register one or more AI agents and select among them with `--agent`. The `{{PROMPT}}` placeholder in `args` marks where the generated prompt is injected; if the placeholder is absent, the prompt is appended at the end.

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "sonnet", "-p", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

> **Note:** The `--system-prompt-file` flag does not exist in the Claude CLI and must not be used. When the prompt exceeds 100,000 bytes, `sdd-forge` automatically switches to stdin delivery to stay within the OS `ARG_MAX` limit.

#### 2. Document Style

The `documentStyle` object controls tone and purpose across all AI-generated chapters. `customInstruction` accepts any free-text directive and is appended to every generation prompt.

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "Avoid jargon and prefer concrete examples over abstract descriptions."
  }
}
```

Valid `tone` values are `"polite"`, `"formal"`, and `"casual"`.

#### 3. Preset Selection

The `type` field selects which preset drives scanning and document generation. Short aliases are resolved automatically, so `"cakephp2"` and `"webapp/cakephp2"` are equivalent.

```json
{
  "type": "cli/node-cli"
}
```

Available built-in types include `"cli/node-cli"`, `"webapp/cakephp2"`, `"webapp/laravel"`, and `"webapp/symfony"`. Run `sdd-forge presets` to see the full list.

#### 4. Merge Strategy

The `flow.merge` field determines how feature branches are integrated when the SDD flow closes.

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

| Value | Behaviour |
|---|---|
| `"squash"` | Squashes all commits on the feature branch into a single commit on the base branch (default). |
| `"ff-only"` | Fast-forward only; fails if the base has diverged. |
| `"merge"` | Standard merge commit preserving full branch history. |

#### 5. Concurrency

`limits.concurrency` caps the number of files processed simultaneously during `text`, `data`, and `enrich` commands. Increase it on machines with many CPU cores or reduce it if AI rate limits are a concern.

```json
{
  "limits": {
    "concurrency": 10
  }
}
```

The default value is `5`. Setting this to `1` effectively serialises all AI calls.
<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hang).}} -->

sdd-forge reads the following environment variables at startup. They take precedence over paths resolved from the repository itself, making them useful in CI pipelines or monorepo setups where the source code and the `.sdd-forge/` directory live in different locations.

| Variable | Used by | Description |
|---|---|---|
| `SDD_SOURCE_ROOT` | `src/lib/cli.js` → `sourceRoot()` | Absolute path to the source code that sdd-forge should scan and document. When set, overrides the repository root detected by `git rev-parse`. |
| `SDD_WORK_ROOT` | `src/lib/cli.js` → `repoRoot()` | Absolute path to the working root — the directory that contains `.sdd-forge/`. When set, overrides both `git rev-parse` and `process.cwd()`. Set this when the config and output files should reside outside the source tree. |
| `CLAUDECODE` | `src/lib/agent.js` → `callAgentAsync()` | Detected and **deleted** from the child process environment before spawning the Claude CLI. Leaving this variable set causes the Claude CLI to hang waiting for input; removing it prevents the issue. You do not need to set or manage this variable manually. |

When neither `SDD_SOURCE_ROOT` nor `SDD_WORK_ROOT` is set, `repoRoot()` falls back to `git rev-parse --show-toplevel` and then to `process.cwd()`, so standard single-repository setups require no environment configuration at all.
<!-- {{/text}} -->
