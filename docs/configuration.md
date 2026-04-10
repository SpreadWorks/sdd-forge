<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/configuration.md) | **English**
<!-- {{/data}} -->

# Configuration and Customization

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points."})}} -->

This chapter explains how `sdd-forge` is configured through project-level JSON files (`.sdd-forge/config.json`, optional `.sdd-forge/overrides.json`) plus built-in preset manifests (`src/presets/*/preset.json`) and flow state files used by the workflow engine. It covers documentation output settings, scan scope, chapter composition, agent routing, flow behavior, logging, and extension points such as custom DataSources and descriptor overrides.
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text({prompt: "List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code."})}} -->

| File | Location | Role |
| --- | --- | --- |
| `config.json` | `<project-root>/.sdd-forge/config.json` | Primary runtime configuration loaded by command context, setup, docs, flow, check, and logger initialization. |
| `overrides.json` | `<project-root>/.sdd-forge/overrides.json` | Optional descriptor override map used by resolver factory (`desc(section,key)`). |
| `preset.json` | `<package>/src/presets/<preset-key>/preset.json` | Preset manifest auto-discovered at startup; provides preset metadata, scan include/exclude patterns, and chapter definitions. |
| `.active-flow` | `<main-repo>/.sdd-forge/.active-flow` | Active-flow pointer list for resolving current spec context across local/worktree/branch modes. |
| `flow.json` | `<project-root>/specs/<spec-id>/flow.json` | Per-spec workflow state (steps, requirements, request, issue, merge strategy, metrics, auto-approve flag). |
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text({prompt: "Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.", mode: "deep"})}} -->

| Field | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | Optional | `string` | None | Project display name written by setup wizard. |
| `lang` | Required | `string` | None in config (`"en"` fallback only when config is missing) | CLI/skill operating language. |
| `type` | Required | `string` or `string[]` | None | Preset key(s); drives scan/data/template chain resolution. |
| `docs.languages`, `docs.defaultLanguage` | Required | `string[]`, `string` | None | Output language set and default output language (`defaultLanguage` must be included in `languages`). |
| `docs.mode`, `docs.style.purpose`, `docs.style.tone`, `docs.style.customInstruction`, `docs.exclude` | Optional | `"translate"\|"generate"`, object, `string[]` | `docs.mode="translate"`; others none | Controls multilingual generation mode, writing style, and path-based exclusion from docs data/enrich pipelines. |
| `chapters[]` (`chapter`, `desc`, `exclude`) | Optional | object array | None | Overrides preset chapter order/content; `exclude:true` removes a chapter. |
| `concurrency` | Optional | `number` (`>=1`) | `5` | Parallelism for per-file processing. |
| `scan.include`, `scan.exclude` | Optional (`scan` object) | `string[]` | If absent, preset scan patterns are used | Explicit scan target/exclusion globs for docs scan/check. |
| `agent.default`, `agent.workDir`, `agent.timeout`, `agent.retryCount`, `agent.batchTokenLimit`, `agent.useProfile` | Optional | `string`, `string`, `number`, `number`, `number`, `string` | `workDir=".tmp"`, `timeout=300` sec, `retryCount=0` at call sites, `batchTokenLimit=10000` in enrich, others none | Selects default agent/provider profile and execution behavior for AI calls. |
| `agent.providers.<key>`, `agent.profiles.<profile>.<commandId>` | Optional | provider/profile maps | Built-ins are merged in (`claude/*`, `codex/*`) | Defines custom providers and command-prefix routing; profile can be selected by config or env. |
| `flow.merge`, `flow.push.remote`, `flow.commands.context.search.mode`, `commands.gh`, `experimental.workflow.*`, `logs.enabled`, `logs.dir`, `monorepo.apps` | Optional | mixed | `flow.merge="squash"`, `flow.push.remote="origin"`, search mode `"ngram"`, `commands.gh="disable"`, `logs.enabled=false`, `logs.dir={agent.workDir}/logs`, others none | Controls finalize merge strategy/push remote/context-search backend, GitHub CLI mode, experimental workflow deployment, logging output, and monorepo app labeling. |
<!-- {{/text}} -->

### Customization Points

<!-- {{text({prompt: "Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.", mode: "deep"})}} -->

| Customization point | How to customize | Example |
| --- | --- | --- |
| Preset composition | Set single or multiple preset keys in `type`. | `"type": ["nextjs", "rest", "postgres"]` |
| Scan scope | Override file collection patterns in `scan`. | `"scan": { "include": ["src/**/*.ts"], "exclude": ["**/*.test.ts"] }` |
| Chapter order/content | Provide `chapters` entries to reorder, rename description, or exclude chapters. | `"chapters": [{"chapter":"overview.md"},{"chapter":"internal_design.md","exclude":true}]` |
| Doc output languages and style | Configure `docs.languages`, `docs.defaultLanguage`, `docs.mode`, and `docs.style`. | `"docs": {"languages":["en","ja"],"defaultLanguage":"en","mode":"translate","style":{"purpose":"user-guide","tone":"formal"}}` |
| Agent routing and execution | Set `agent.default`, custom `agent.providers`, command-specific `agent.profiles`, retries, timeout, and work directory. | `"agent": {"default":"codex/gpt-5.4","useProfile":"default","retryCount":1,"providers":{"my-agent":{"command":"codex","args":["exec","{{PROMPT}}"]}}}` |
| Flow/finalize behavior | Configure merge strategy, push remote, GitHub CLI mode, and context search mode. | `"flow": {"merge":"ff-only","push":{"remote":"upstream"},"commands":{"context":{"search":{"mode":"ai"}}}}, "commands":{"gh":"enable"}` |
| Extension files | Add project-local DataSources under `.sdd-forge/data/*.js` and optional text overrides in `.sdd-forge/overrides.json`. | Create `.sdd-forge/data/security.js` with a `DataSource` class and set `.sdd-forge/overrides.json` to override section/key descriptions. |
<!-- {{/text}} -->

### Environment Variables

<!-- {{text({prompt: "List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.", mode: "deep"})}} -->

| Environment variable | Purpose |
| --- | --- |
| `SDD_FORGE_WORK_ROOT` | Overrides repository root resolution; used as the working root for command context and config loading. |
| `SDD_FORGE_SOURCE_ROOT` | Overrides source root resolution for scanning/reading source files independently from work root. |
| `SDD_FORGE_PROFILE` | Selects the active `agent.profiles` entry; takes priority over `agent.useProfile` in config. |
| `CLAUDECODE` | Explicitly removed from spawned agent environments before invocation to avoid leaking that variable into agent subprocesses. |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI Command Reference](cli_commands.md) | [Internal Design →](internal_design.md)
<!-- {{/data}} -->
