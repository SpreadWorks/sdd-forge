# 03. Configuration and Customization

## Description

<!-- {{text: Describe the overview of this chapter in 1–2 sentences. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

## Contents

### Configuration Files

<!-- {{text: List the configuration files loaded by this tool in a table, including the location and role of each. Main files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

### Configuration Reference

<!-- {{text: Describe all fields in .sdd-forge/config.json in a table format. Include field name, whether required, type, default value, and description. Main fields: output.languages (list of output languages), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

### Customization Points

<!-- {{text: Describe the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency level (limits.concurrency). Include JSON configuration examples for each item.}} -->

### Environment Variables

<!-- {{text: List the environment variables referenced by the tool and their purposes in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location where .sdd-forge/ is placed), CLAUDECODE (internal variable deleted to prevent Claude CLI from hanging).}} -->