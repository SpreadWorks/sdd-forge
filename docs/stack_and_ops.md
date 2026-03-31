<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool written in JavaScript using the ES modules system, currently at version 0.1.0-alpha.361, and requires Node.js 18.0.0 or later with pnpm 10.33.0 as the package manager.
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
| External Dependencies | None (Node.js built-ins only) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has no external runtime dependencies and relies exclusively on Node.js built-in modules. The package manager is pnpm at version 10.33.0. Development and test tooling is managed within the project without introducing third-party libraries, keeping the dependency surface minimal and the package lightweight. The `files` field in package.json restricts the published payload to the `src/` directory, excluding test fixtures and preset test files.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is distributed via npm under the name `sdd-forge`. Only the `src/` directory is included in the published artifact, as defined by the `files` field in package.json — this excludes test files and internal preset tests. The CLI entry point `sdd-forge` maps directly to `./src/sdd-forge.js`. Publishing uses an alpha pre-release tag during the current development phase, reflecting the `0.1.0-alpha.N` versioning scheme where `N` is the total commit count.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Automated tests are executed via `node tests/run.js` and cover three levels: unit, end-to-end (e2e), and acceptance. Each test type is available as a separate npm script (`test:unit`, `test:e2e`, `test:acceptance`), with a top-level `test` script running all suites. Before publishing, `npm pack --dry-run` is used to verify the contents of the release artifact. No external CI configuration is declared in package.json; test execution is performed locally through the pnpm script interface.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
