<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool written in JavaScript (ES modules), requiring Node.js 18.0.0 or later, and managed with pnpm 10.33.0. The current release is version 0.1.0-alpha.361.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | 10.33.0 |
| CLI Entry Point | sdd-forge (./src/sdd-forge.js) | 0.1.0-alpha.361 |
| External Dependencies | None (Node.js built-ins only) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has no external runtime dependencies — the implementation relies exclusively on Node.js built-in modules. The package is managed with pnpm 10.33.0. Only the `src/` directory is included in the published package (presets' test files are explicitly excluded via the `files` field in package.json), keeping the distributed bundle minimal and free of third-party code.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published to npm under the package name `sdd-forge`. The process begins with verifying the contents using `npm pack --dry-run` to confirm no sensitive files are included. The package is then published with `npm publish --tag alpha` to register it under the alpha distribution tag. A second step, `npm dist-tag add sdd-forge@<version> latest`, is required to update the `latest` tag so the release appears on the npmjs.com package page. Versions follow the `0.1.0-alpha.N` format during the alpha period, where `N` is the total commit count from `git rev-list --count HEAD`.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Testing is performed via `node tests/run.js`, which provides separate runners for unit, end-to-end, and acceptance test suites. The CLI can be invoked directly as `sdd-forge` once installed. Documentation is regenerated using `sdd-forge build`, which runs the full scan-to-docs pipeline. When templates or presets under `src/templates/` or `src/presets/` are modified, `sdd-forge upgrade` is run to propagate changes to project-level skills and configuration files.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
