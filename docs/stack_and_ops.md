<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a Node.js CLI tool written in JavaScript (ES modules), targeting Node.js 18.0.0 or later, with version 0.1.0-alpha.361 managed via pnpm 10.33.0.
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
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has no external runtime dependencies — only Node.js built-in modules are used. This is an intentional design constraint that keeps the package lightweight and eliminates supply-chain risk. Development tooling and package lifecycle are managed with pnpm. The `files` field in package.json restricts published content to the `src/` directory, excluding preset test fixtures, so that only production-relevant source is distributed to npm consumers.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

The package is published to npm under the name `sdd-forge`. The release procedure follows a two-step process: first publish with the `alpha` dist-tag using `npm publish --tag alpha`, then promote to the `latest` tag with `npm dist-tag add sdd-forge@<version> latest`. Before publishing, `npm pack --dry-run` is run to verify the contents of the package and confirm that no sensitive files are included. Because npm does not allow a version number to be reused once published, each release must carry a unique version string.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The CLI entry point is `sdd-forge` (mapped to `./src/sdd-forge.js`). Three categories of automated tests are available and executed via `node tests/run.js`: unit tests, end-to-end (e2e) tests, and acceptance tests. The version number follows the pattern `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`, allowing the current build state to be identified precisely from the version string alone.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
