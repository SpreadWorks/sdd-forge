# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

This chapter covers the configuration files that sdd-forge reads to tailor its behavior to your project, including the primary `.sdd-forge/config.json` for output language, project type, AI provider, and scan settings, as well as the supporting `projects.json` for multi-project registration. It also describes the customization points available for document style, concurrency limits, chapter ordering, and SDD flow behavior.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| File | Location | Role |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | Primary configuration file. Defines output language, project type, AI providers, scan patterns, document style, and flow settings. Read and validated at startup by every command. |
| `projects.json` | `.sdd-forge/projects.json` | Multi-project registry. Maps named project entries to their source and work root paths, and records the default project. Read by `setup`, `default`, and the top-level router. |
| `preset.json` | `src/presets/{key}/preset.json` | Bundled preset manifests shipped with sdd-forge. Define the preset label, architecture, aliases, default scan patterns, and chapter order for each supported project type. Not user-editable directly. |
| `package.json` | `{repoRoot}/package.json` | Read to extract package metadata (e.g. `name`, `version`, `description`) for use in generated documentation. |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

The following table describes every field recognized in `.sdd-forge/config.json`. Validation is performed by `validateConfig()` in `src/lib/types.js`; fields marked **required** will cause the command to abort if absent or invalid.

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `output` | Required | object | — | Output language configuration block. Must be a non-null object. |
| `output.languages` | Required | string[] | — | Non-empty array of language codes for generated documents (e.g. `["ja"]`, `["en", "ja"]`). |
| `output.default` | Required | string | — | The primary output language. Must be one of the values listed in `output.languages`. |
| `output.mode` | Optional | `"translate"` \| `"generate"` | `"translate"` | How non-default languages are produced. `"translate"` post-processes the default output; `"generate"` calls the AI independently for each language. |
| `lang` | Required | string | — | Operating language for the CLI, AGENTS.md, skill files, and spec documents (e.g. `"ja"`, `"en"`). |
| `type` | Required | string | — | Project type identifier (e.g. `"webapp/cakephp2"`, `"cli"`, `"webapp/laravel"`). Short aliases such as `"cakephp2"` are resolved to their canonical paths via `TYPE_ALIASES`. |
| `limits.agentTimeout` | Optional | number | — | AI agent call timeout in seconds. Overrides the provider default. |
| `limits.concurrency` | Optional | number | `5` | Maximum number of files processed in parallel during `scan` and `text` runs. Resolved by `resolveConcurrency()`. |
| `documentStyle.purpose` | Optional | string | — | Intended audience and document purpose. Accepted values include `"developer-guide"`, `"user-guide"`, and `"api-reference"`, or any free-form string. Required if `documentStyle` is present. |
| `documentStyle.tone` | Optional | `"polite"` \| `"formal"` \| `"casual"` | — | Writing tone applied to all AI-generated text. Required if `documentStyle` is present. |
| `documentStyle.customInstruction` | Optional | string | — | Additional free-form instruction appended to every AI prompt for this project. |
| `chapters` | Optional | string[] | — | Ordered list of chapter file names (without `.md` extension). Overrides the preset's default chapter order for this project. |
| `agentWorkDir` | Optional | string | — | Working directory passed to the AI agent process. Defaults to the repository root when omitted. |
| `scan.include` | Optional (required if `scan` is set) | string[] | — | Glob patterns for files to include during source scanning. Must be a non-empty array. |
| `scan.exclude` | Optional | string[] | — | Glob patterns for files to exclude from scanning. |
| `flow.merge` | Optional | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | Merge strategy used when the SDD flow merges a feature branch into the base branch. |
| `providers` | Optional | object | — | Named AI agent provider definitions. Keys are provider names; each entry must contain `command` and `args`. |
| `providers.{name}.command` | Required per provider | string | — | Executable to invoke for this AI provider (e.g. `"claude"`). |
| `providers.{name}.args` | Required per provider | string[] | — | Arguments passed to the command. Use `{{PROMPT}}` as a placeholder for the generated prompt text. |
| `providers.{name}.timeoutMs` | Optional | number | — | Per-provider timeout in milliseconds. |
| `providers.{name}.systemPromptFlag` | Optional | string | — | CLI flag used to pass a system prompt (e.g. `"--system-prompt"`). |
| `defaultAgent` | Optional | string | — | Name of the provider entry to use by default when `--agent` is not specified on the command line. |
| `textFill.projectContext` | Optional | string | — | Free-text description of the project, prepended to `{{text}}` prompts to provide context that cannot be derived from source code alone. |
| `textFill.preamblePatterns` | Optional | array | — | List of `{ pattern, flags }` objects. Matching prefixes are stripped from AI-generated text before it is written into documents. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**AI Provider (agent)**

You can register one or more AI CLI tools under `providers` and select a default with `defaultAgent`. The `{{PROMPT}}` placeholder in `args` is replaced at runtime with the generated prompt.

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["-p", "{{PROMPT}}"],
      "timeoutMs": 120000
    }
  }
}
```

**Document Style**

The `documentStyle` block controls the tone and purpose applied to every AI-generated text section. A `customInstruction` can be added for project-specific writing conventions.

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "Always refer to the end user as 'operator'."
  }
}
```

**Output Language**

Set multiple output languages and choose how non-default languages are produced. The `"generate"` mode invokes the AI independently per language; `"translate"` post-processes the default output.

```json
{
  "output": {
    "languages": ["en", "ja"],
    "default": "en",
    "mode": "translate"
  }
}
```

**Chapter Ordering**

Override the preset's default chapter order by listing chapter file names (without `.md`) in the desired sequence.

```json
{
  "chapters": ["overview", "configuration", "cli_commands", "architecture", "data_model"]
}
```

**Scan Patterns**

Restrict or expand which source files are analysed by `sdd-forge scan` using glob-based `include` and `exclude` lists.

```json
{
  "scan": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**Concurrency and Timeouts**

Tune parallel file processing and AI call timeouts under `limits` to match your environment's resources.

```json
{
  "limits": {
    "concurrency": 3,
    "agentTimeout": 90
  }
}
```

**SDD Flow Merge Strategy**

Choose how feature branches are merged into the base branch at the end of each SDD flow cycle.

```json
{
  "flow": {
    "merge": "squash"
  }
}
```
<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

sdd-forge reads two environment variables at runtime. Both are set automatically by the top-level router (`src/sdd-forge.js`) when operating in multi-project mode; they can also be set manually to target a specific project without a `projects.json` entry.

| Variable | Set by | Purpose |
|---|---|---|
| `SDD_SOURCE_ROOT` | `sdd-forge.js` (multi-project mode) | Absolute path to the source code root of the target project. When set, `sourceRoot()` in `src/lib/cli.js` returns this value directly instead of falling back to the git repository root or `process.cwd()`. |
| `SDD_WORK_ROOT` | `sdd-forge.js` (multi-project mode) | Absolute path to the work output root of the target project (where `.sdd-forge/`, `docs/`, and `specs/` reside). When set, `repoRoot()` in `src/lib/cli.js` returns this value, overriding the git-derived root. Derived from the `workRoot` field of the matching `projects.json` entry, or falls back to the project's `path` when `workRoot` is not set. |

When neither variable is set, both `repoRoot()` and `sourceRoot()` resolve the repository root through `git rev-parse --show-toplevel`, falling back to `process.cwd()` if git is unavailable.
<!-- {{/text}} -->
