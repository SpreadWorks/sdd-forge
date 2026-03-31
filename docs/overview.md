<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/overview.md)
<!-- {{/data}} -->

# Tool Overview and Architecture

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases."})}} -->

This chapter introduces `sdd-forge`, a CLI tool for source-code-based documentation generation and Spec-Driven Development workflows. It is used to generate documentation structure and navigation from project files, expose package metadata to templates, and support documentation and workflow commands such as build, upgrade, and flow execution.
<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text({prompt: "Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README."})}} -->

`sdd-forge` is designed for projects that want documentation content and navigation to be derived from the codebase and project configuration instead of being maintained entirely by hand. The analyzed sources show that it targets maintainers and contributors who need generated chapter listings, language switching, repository links, package metadata in templates, and workflow support for Spec-Driven Development.
<!-- {{/text}} -->

### Architecture Overview

<!-- {{text({prompt: "Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.", mode: "deep"})}} -->

```mermaid
flowchart TD
  A[CLI Entry Point: sdd-forge] --> B[Subcommand Dispatch]
  B --> C[build]
  B --> D[flow]
  B --> E[upgrade]

  C --> F[Load project root and docs configuration]
  D --> F
  E --> F

  F --> G[Scan project files and docs directory]
  G --> H[Load package metadata]
  G --> I[Resolve chapter files]
  G --> J[Read localized UI labels]

  H --> K[ProjectSource]
  I --> L[DocsSource]
  J --> L

  K --> M[Fill {{data}} directives]
  L --> M
  M --> N[Generate Markdown tables, links, navigation, and metadata output]

  E --> O[Update skills and template-derived project files]
```
<!-- {{/text}} -->

### Key Concepts

<!-- {{text({prompt: "Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code."})}} -->

| Concept | Meaning |
| --- | --- |
| DataSource | A documentation data provider that resolves values for template directives and can format markdown output such as tables. |
| DocsSource | A documentation-specific data source that builds language switchers, chapter tables, and previous/next navigation links from the docs directory and repository metadata. |
| ProjectSource | A package-metadata data source that exposes the project name, description, version, and npm scripts from `package.json`. |
| Directive | A placeholder such as `{{data}}` or `{{text}}` that is replaced with generated content during documentation processing. |
| Chapter files | Ordered markdown files in the docs directory that are scanned to extract titles, summaries, and navigation relationships. |
| Language switcher | A generated set of links for multilingual documentation that highlights the current language and links to translated equivalents. |
| Repository URL resolution | Logic that converts the `repository` field in `package.json` into browser-friendly links for generated documentation. |
| Analysis entry | A structured record produced while scanning files so template data sources can expose extracted metadata to documentation templates. |
| Scannable source | A data source that matches supported files such as `package.json` or `composer.json` and parses them into analysis entries. |
| Navigation | Generated previous/next chapter links based on the configured chapter order and extracted chapter titles. |
<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text({prompt: "Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code."})}} -->

1. Open the project at its root so the tool can access `package.json`, `.sdd-forge/config.json`, and the docs directory.
2. Ensure the documentation structure and configuration are present, including chapter files and any configured documentation languages.
3. Run `sdd-forge build` to scan the project and docs files, resolve repository metadata, and fill documentation directives.
4. Review the generated markdown output, which can include chapter tables, language-switch links, navigation links, and package metadata such as scripts.
5. If templates or presets were changed, run `sdd-forge upgrade` so project skills and generated settings are refreshed from the updated templates.
6. For workflow-driven authoring, use `sdd-forge flow --request "<request>"` to start the Spec-Driven Development flow from a user request.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[Technology Stack and Operations →](stack_and_ops.md)
<!-- {{/data}} -->
