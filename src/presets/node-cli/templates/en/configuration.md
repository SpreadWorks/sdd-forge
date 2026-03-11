<!-- {{data: docs.langSwitcher("relative")}} -->
<!-- {{/data}} -->
# 03. Configuration and Customization

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->
<!-- {{/text}} -->

## Content

### Configuration Files

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Main files: .sdd-forge/config.json (project settings), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results including enriched data).}} -->
<!-- {{/text}} -->

### Configuration Reference

<!-- {{text[mode=deep]: Describe all .sdd-forge/config.json fields in table format. Include field name, required/optional, type, default value, and description. Key fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/agentTimeout).}} -->
<!-- {{/text}} -->

### Customization Points

<!-- {{text[mode=deep]: Describe items that users can customize. (1) AI provider settings (providers field: command/args/timeoutMs/systemPromptFlag) with config examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON config examples for each item.}} -->
<!-- {{/text}} -->

### Environment Variables

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, where .sdd-forge/ is placed), CLAUDECODE (internal variable deleted to prevent Claude CLI hanging).}} -->
<!-- {{/text}} -->
