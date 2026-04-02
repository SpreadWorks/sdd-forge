<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js command-line tool written in JavaScript using ES module syntax, with no external runtime dependencies and a minimum engine requirement of Node.js 18.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18 |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | — |
| CLI Entry Point | src/sdd-forge.js | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge declares no runtime dependencies and relies exclusively on Node.js built-in modules. This design choice eliminates third-party supply-chain risk and keeps the installed package lightweight. Development tooling uses pnpm for package management. The `files` field in package.json restricts the published payload to the `src/` directory, excluding preset test directories from the distributed package.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published to the npm registry using a two-step process. First, the package is published with the `alpha` distribution tag via `npm publish --tag alpha`. Second, the `latest` tag is explicitly updated with `npm dist-tag add sdd-forge@<version> latest` to ensure the release appears correctly on the npm registry page. Before publishing, `npm pack --dry-run` is run to verify the list of included files and confirm no sensitive information is bundled.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The project provides a custom test runner invoked through npm scripts, supporting three scopes: `unit`, `e2e`, and `acceptance`. Tests are executed via the scripts defined in package.json. Long-running command output is redirected to a log file and inspected with targeted reads rather than re-executed. Version numbers during the alpha period follow the format `0.1.0-alpha.N`, where N is derived from the total commit count via `git rev-list --count HEAD`.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
