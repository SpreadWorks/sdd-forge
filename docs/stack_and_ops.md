<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational procedures for sdd-forge, a Node.js CLI tool built as an ES module with no external runtime dependencies, requiring Node.js >= 18.0.0 and managed via pnpm 10.33.0.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.0.0 |
| Language | JavaScript (ES Modules) | ECMAScript 2022+ |
| Package Manager | pnpm | 10.33.0 |
| Package Version | sdd-forge | 0.1.0-alpha.361 |
| External Dependencies | None | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge relies exclusively on Node.js built-in modules and declares no external runtime dependencies in its package manifest. This design choice eliminates dependency version conflicts and reduces installation overhead for end users.

The package is managed with pnpm 10.33.0. The published package includes only the `src/` directory (excluding preset test files), along with `package.json`, `README.md`, and `LICENSE`. This keeps the distributed package lean and free of development-only artifacts.

Test tooling is invoked through the scripts defined in `package.json`, running unit, end-to-end, and acceptance test suites via `node tests/run.js`.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge is published to npm under the package name `sdd-forge`. The release process follows a two-step tagging procedure to ensure the `latest` tag on npmjs.com is updated correctly.

1. Run `npm pack --dry-run` to verify the contents of the package and confirm no sensitive files are included.
2. Publish the release with the alpha tag: `npm publish --tag alpha`.
3. Promote the version to the `latest` tag: `npm dist-tag add sdd-forge@<version> latest`.

The version number follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`. Published versions cannot be overwritten on npm; unpublished versions remain unavailable for reuse for 24 hours.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Routine operations for sdd-forge center on the CLI commands bundled in the `src/` directory. The primary operational tasks are as follows.

- **Documentation generation**: Run `sdd-forge build` to execute the full scan-to-docs pipeline for the target project.
- **Analysis**: Run `sdd-forge scan` to generate or refresh `analysis.json` stored in `.sdd-forge/output/`.
- **Template and skill updates**: After modifying files under `src/templates/` or `src/presets/`, run `sdd-forge upgrade` to propagate changes to project-level skills and configuration files.
- **AGENTS.md refresh**: Run `sdd-forge agents` to regenerate the `AGENTS.md` context file for the target project.
- **Testing**: Execute `node tests/run.js` to run unit, end-to-end, and acceptance test suites. Redirect output to a file (e.g., `node tests/run.js > /tmp/test.log 2>&1`) for review when tests are long-running.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
