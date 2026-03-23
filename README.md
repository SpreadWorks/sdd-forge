# <!-- {{data("cli.project.name")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data("cli.docs.langSwitcher", {labels: "absolute"})}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

<!-- {{text({prompt: "Write a 1-2 sentence overview of this project."})}} -->
**sdd-forge** is a CLI tool that automatically generates structured documentation from source code analysis and provides a Spec-Driven Development (SDD) workflow to keep your specs, docs, and implementation in sync. It streamlines the development process by turning your codebase into living documentation — with minimal manual effort.
<!-- {{/text}} -->

## Quick Start

### Installation

<pre>
# npm
npm install -g <!-- {{data("node-cli.project.name")}} -->sdd-forge<!-- {{/data}} -->

# yarn
yarn global add <!-- {{data("node-cli.project.name")}} -->sdd-forge<!-- {{/data}} -->

# pnpm
pnpm add -g <!-- {{data("node-cli.project.name")}} -->sdd-forge<!-- {{/data}} -->
</pre>

### Basic Commands

<pre>
# Show help
<!-- {{data("node-cli.project.name")}} -->sdd-forge<!-- {{/data}} --> help

# Project setup
<!-- {{data("node-cli.project.name")}} -->sdd-forge<!-- {{/data}} --> setup

# Generate all documentation
<!-- {{data("node-cli.project.name")}} -->sdd-forge<!-- {{/data}} --> build
</pre>
<!-- {{data("cli.docs.chapters", {header: "## Documentation\n", labels: "Chapter|Description", ignoreError: true})}} -->
## Documentation

| Chapter | Description |
| --- | --- |
| [Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter provides a comprehensive overview of sdd-forge, a CLI tool that automates documentation generation throu… |
| [Technology Stack and Operations](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/stack_and_ops.md) | This chapter documents the technology stack analysis and operations capabilities provided by sdd-forge's preset modules. |
| [Project Structure](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/project_structure.md) | This chapter describes the directory layout of the sdd-forge package, which is organized into seven major directories… |
| [CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge provides over 25 commands organized into five groups — Project, Docs, Spec, Flow, and Info — accessed throu… |
| [Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge is configured primarily through .sdd-forge/config.json, which controls documentation output, preset selecti… |
| [Internal Design](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/internal_design.md) | This chapter details the internal architecture of sdd-forge, covering its three-layer directory structure (src/lib/ →… |
| [Development, Testing, and Distribution](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/development_testing.md) | This chapter covers the local development environment setup for sdd-forge, the testing strategy based on Node.js buil… |
<!-- {{/data}} -->

