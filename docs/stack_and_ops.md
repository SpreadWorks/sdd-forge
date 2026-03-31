<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool written in JavaScript (ES modules), currently at version 0.1.0-alpha.361, with Node.js 18.0.0 or higher as the minimum runtime requirement. The project has no external runtime dependencies and is managed with pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | 10.33.0 |
| Package Version | sdd-forge | 0.1.0-alpha.361 |
| CLI Entry Point | sdd-forge.js | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge declares no external runtime dependencies — all functionality is built exclusively on Node.js built-in modules. The project is managed with pnpm 10.33.0. Only the `src/` directory is included in the published npm package (preset test files are excluded). The package is distributed on npm under the name `sdd-forge` and follows an alpha versioning scheme (`0.1.0-alpha.N`).
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published to npm using a two-step process: first with `npm publish --tag alpha` to publish under the alpha tag, then with `npm dist-tag add sdd-forge@<version> latest` to promote the release to the `latest` tag. Before publishing, `npm pack --dry-run` is run to verify the contents of the package and confirm that no sensitive files are included. Only the `src/` directory, along with `package.json`, `README.md`, and `LICENSE`, is included in the published artifact.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The project provides three categories of automated tests, all executed via `node tests/run.js`: unit tests, end-to-end (e2e) tests, and acceptance tests. These test scripts are defined in `package.json` and can be run individually or together. Documentation is regenerated using the `sdd-forge build` pipeline, which includes the `sdd-forge agents` command to update `AGENTS.md`. Template or preset changes require running `sdd-forge upgrade` to propagate updates to project-level skills and configuration files.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
