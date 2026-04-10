<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[日本語](ja/stack_and_ops.md) | **English**
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a JavaScript CLI tool built entirely on Node.js (>=18.0.0) with no external runtime dependencies, using only the language's built-in modules. The package exposes the `sdd-forge` command via the `bin` field and is distributed as an ES module.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Language | JavaScript (ES Modules) | — |
| Runtime | Node.js | >=18.0.0 |
| Package Manager | npm | — |
| CLI Entry Point | `src/sdd-forge.js` | — |
| Test Runner | Custom (`tests/run.js`) | — |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project declares zero runtime dependencies, relying exclusively on Node.js built-in modules. This design decision eliminates third-party supply-chain risk and keeps the installed footprint minimal. The `files` field in `package.json` restricts the published npm payload to the `src/` directory, explicitly excluding preset test directories and other development-only assets. There is no lock file burden for end users because no packages need to be resolved at install time.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published to the npm registry using the standard `npm publish` workflow. The `bin` field in `package.json` maps the `sdd-forge` command to `src/sdd-forge.js`, which is automatically linked into the user's PATH upon installation. The `files` field ensures that only `src/`, `package.json`, `README.md`, and `LICENSE` are included in the published tarball, keeping the distribution artifact clean and predictable.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Tests are executed through a custom runner at `tests/run.js`, which accepts scope flags to target unit, end-to-end, or acceptance test suites independently. The `entrypoint.js` utility detects whether a script is invoked directly or imported as a module, enabling individual source files to be run standalone for debugging. Process execution is wrapped by `src/lib/process.js`, which captures stdout, stderr, and exit codes into uniform result objects, simplifying error reporting across all CLI operations.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
