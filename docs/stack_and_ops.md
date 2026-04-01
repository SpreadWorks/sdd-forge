<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool implemented entirely in JavaScript using the ES module system, targeting Node.js 18.0.0 or later. The current release is version 0.1.0-alpha.361, managed with pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | — |
| Runtime | Node.js | >= 18.0.0 |
| Package Manager | pnpm | 10.33.0 |
| CLI Entry Point | sdd-forge (→ src/sdd-forge.js) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has no external runtime dependencies. All functionality is built exclusively on Node.js built-in modules, eliminating the need for a `node_modules` install in production contexts. Development tooling is managed via pnpm 10.33.0. The `files` field in `package.json` restricts the published artifact to the `src/` directory, explicitly excluding test directories under `presets/*/tests/`.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is distributed through the npm registry under the name `sdd-forge`. The published artifact consists solely of the `src/` directory along with `package.json`, `README.md`, and `LICENSE`. Before publishing, the contents can be verified using `npm pack --dry-run`. The release follows a two-step process: publishing with `npm publish --tag alpha` to attach the pre-release tag, followed by `npm dist-tag add sdd-forge@<version> latest` to update the `latest` tag on the registry.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Three categories of automated tests are provided, all executed through `node tests/run.js`: unit tests, end-to-end (e2e) tests, and acceptance tests. Each suite can be invoked via the corresponding script defined in `package.json`. No external test framework is required, as the test runner relies solely on Node.js built-in capabilities consistent with the zero-dependency policy.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
