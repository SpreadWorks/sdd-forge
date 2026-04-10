<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter summarizes the stack and operating model of `sdd-forge`, a JavaScript CLI built on Node.js with ES Modules and no external application framework. Key versions are Node.js `>= 18.0.0`, `pnpm 10.33.0`, and package version `0.1.0-alpha.702`.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Programming language | JavaScript (ES Modules) | `"type": "module"` |
| Runtime | Node.js | `>= 18.0.0` |
| Package manager | pnpm | `10.33.0` |
| Package registry | npm | N/A |
| CLI package | `sdd-forge` | `0.1.0-alpha.702` |
| CLI entry point | `./src/sdd-forge.js` | Path-based entry |
| External framework | None | N/A |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project follows a zero-external-dependency policy for Node.js packages.
`package.json` has empty `dependencies` and `devDependencies`, so runtime behavior is implemented with Node.js built-in modules.
Publish scope is controlled by the `files` field, which includes `src/` and excludes preset test fixtures (`!src/presets/*/tests/`).
Dependency-related workflows are managed through package scripts for testing (`test:unit`, `test:e2e`, `test:acceptance`).
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Deployment uses a manual npm release flow.
1. Validate package contents with `npm pack --dry-run`.
2. Publish the pre-release with `npm publish --tag alpha`.
3. Promote the published version to `latest` with `npm dist-tag add sdd-forge@<version> latest`.
Versioning follows `0.1.0-alpha.N`, where `N` is derived from `git rev-list --count HEAD`.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Operations are CLI-centered.
Use `sdd-forge setup` to initialize project configuration, then run `sdd-forge docs build` for the documentation pipeline (`scan -> enrich -> init -> data -> text -> readme -> agents`, with optional translation).
After modifying `src/templates/` or `src/presets/`, run `sdd-forge upgrade` to sync generated skills and settings.
Run validation with `node tests/run.js --scope unit`, `node tests/run.js --scope e2e`, and `node tests/acceptance/run.js`.
For long-running commands, redirect output to a log file and inspect that file.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
