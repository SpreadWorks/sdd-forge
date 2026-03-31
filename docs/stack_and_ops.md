<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool written in JavaScript using ES modules, targeting Node.js 18.0.0 or higher. The current release is version 0.1.0-alpha.361, managed with pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 |
| Language | JavaScript (ES Modules) | — |
| Package Manager | pnpm | 10.33.0 |
| Package Format | npm (ES module, `"type": "module"`) | 0.1.0-alpha.361 |
| CLI Entry Point | sdd-forge (`./src/sdd-forge.js`) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has no external runtime dependencies. All functionality is built exclusively on Node.js built-in modules, keeping the installation footprint minimal and eliminating supply-chain risk from third-party packages. Development tooling uses pnpm 10.33.0 as the package manager. The `files` field in `package.json` restricts what is published to npm — only the `src/` directory is included, with test files under `presets/*/tests/` explicitly excluded.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases follow a two-step npm publishing process. First, the package is published under the `alpha` dist-tag using `npm publish --tag alpha`. Second, the `latest` tag is explicitly updated with `npm dist-tag add sdd-forge@<version> latest` to ensure the release appears on the npmjs.com package page. Before publishing, `npm pack --dry-run` is run to verify that no sensitive files are included in the published artifact. The version number during the alpha period follows the format `0.1.0-alpha.N`, where N is the total commit count from `git rev-list --count HEAD`.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Test suites are executed through a unified runner at `tests/run.js`, which covers unit, end-to-end, and acceptance test scenarios. Output from long-running test commands is redirected to a log file (e.g., `command > /tmp/output.log 2>&1`) and reviewed with `grep` or file read tools rather than re-running commands. The `sdd-forge build` command regenerates project documentation from source analysis and should be re-run whenever source files are newer than the contents of `docs/`. The `sdd-forge upgrade` command propagates changes from `src/templates/` and `src/presets/` into project-level skills and configuration files.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
