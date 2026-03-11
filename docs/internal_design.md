<!-- {{data: docs.langSwitcher("relative")}} -->
**English** | [日本語](ja/internal_design.md)
<!-- {{/data}} -->
# 04. Internal Design

## Description

<!-- {{text: Write 1–2 sentences summarizing this chapter. Cover the project structure, direction of module dependencies, and key processing flows.}} -->
<!-- {{/text}} -->

## Contents

### Project Structure

<!-- {{text[mode=deep]: Describe the directory structure of this project in a tree-format code block. Include role comments for major directories and files. Cover the dispatchers directly under src/ (sdd-forge.js, docs.js, spec.js, flow.js), docs/commands/ (subcommand implementations), docs/lib/ (document generation libraries), lib/ (shared utilities), presets/ (preset definitions), and templates/ (bundled templates).}} -->
<!-- {{/text}} -->

### Module Overview

<!-- {{text[mode=deep]: List the major modules in a table. Include module name, file path, and responsibility. Cover the dispatcher layer (sdd-forge.js, docs.js, spec.js), command layer (docs/commands/*.js, specs/commands/*.js), library layer (lib/agent.js, lib/cli.js, lib/config.js, lib/flow-state.js, lib/presets.js, lib/i18n.js), and document generation layer (docs/lib/scanner.js, directive-parser.js, template-merger.js, forge-prompts.js, text-prompts.js, review-parser.js, data-source.js, resolver-factory.js).}} -->
<!-- {{/text}} -->

### Module Dependencies

<!-- {{text[mode=deep]: Generate a mermaid graph showing inter-module dependencies. Reflect the three-layer dispatch structure and show the dependency direction from dispatcher → command → library. Output only the mermaid code block.}} -->
<!-- {{/text}} -->

### Key Processing Flows

<!-- {{text[mode=deep]: Explain the data and control flow between modules when a representative command (build or forge) is executed, using numbered steps. Include the flow from entry point → dispatch → configuration loading → analysis data preparation → AI invocation → file writing.}} -->
<!-- {{/text}} -->

### Extension Points

<!-- {{text[mode=deep]: Explain what needs to change and the extension patterns when adding new commands or features. Cover each of the following with step-by-step instructions: (1) adding a new docs subcommand, (2) adding a new spec subcommand, (3) adding a new preset, (4) adding a new DataSource ({{data}} resolver), and (5) adding a new AI prompt.}} -->
<!-- {{/text}} -->
