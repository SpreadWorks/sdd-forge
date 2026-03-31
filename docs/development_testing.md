<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/development_testing.md)
<!-- {{/data}} -->

# Development, Testing, and Distribution

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow."})}} -->

This chapter covers the steps required to set up a local development environment for sdd-forge, outlines the testing strategy and how to execute the test suite, and describes the release procedure for publishing the package to npm.
<!-- {{/text}} -->

## Content

### Local Development Setup

```bash
git clone <repository>
cd <project>
npm link          # Register as global command
<command> help    # Verify installation
```

<!-- {{text({prompt: "Explain how to run the tool itself during development and how changes are immediately reflected."})}} -->

Because sdd-forge is written in plain ES modules with no build or compilation step, any change you make to a source file under `src/` is reflected immediately the next time you run the `sdd-forge` command. After running `npm link` once in the repository root, the globally registered `sdd-forge` binary points directly to `src/sdd-forge.js`, so there is no need to reinstall or rebuild between edits.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text({prompt: "Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code."})}} -->

Feature work is developed on a dedicated branch named after the specification or issue it addresses. When work is complete, it is merged into the main branch using the **squash** strategy, as configured in `flow.merge` inside `.sdd-forge/config.json`. This keeps the main-branch history linear, with one commit per feature.

Commit messages must be written in English. Sign-off lines (`Signed-off-by`) and co-authorship trailers (`Co-authored-by`) must not be added. During the alpha phase, the version number follows the pattern `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`.
<!-- {{/text}} -->

### Testing

<!-- {{text({prompt: "Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.", mode: "deep"})}} -->

Tests are organized into three scopes under the `tests/` directory:

- **`tests/unit/`** — fast, isolated tests covering individual modules and library functions
- **`tests/e2e/`** — end-to-end tests that exercise CLI commands against temporary project directories
- **`tests/acceptance/`** — AI-assisted acceptance tests that evaluate generated documentation quality

Preset-specific tests live alongside their source code in `src/presets/<name>/tests/`.

The test runner is `tests/run.js`, which uses Node.js's built-in `--test` flag — no external testing framework is required. Available npm scripts are:

```bash
npm test              # Run all unit and e2e tests
npm run test:unit     # Run unit tests only
npm run test:e2e      # Run e2e tests only
npm run test:acceptance  # Run acceptance tests
```

The runner also accepts `--scope unit|e2e` and `--preset <name>` flags for targeted execution.
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text({prompt: "Describe the release procedure. Derive from publish settings and npm scripts in the source code."})}} -->

Before publishing, verify the package contents with `npm pack --dry-run` to confirm no sensitive files are included. The `files` field in `package.json` restricts the published payload to the `src/` directory (excluding preset test folders) along with `package.json`, `README.md`, and `LICENSE`.

Pre-release versions are published in two steps to ensure the `latest` dist-tag is updated correctly:

```bash
npm publish --tag alpha                          # Publish under the alpha tag
npm dist-tag add sdd-forge@<version> latest      # Promote to latest
```

Publishing to npm must only be performed when the user has explicitly stated a release intention. Version bumps, commits, or pushes alone do not constitute a release instruction. Because npm does not allow a version number to be reused once published, verify the version string carefully before running `npm publish`.
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text({prompt: "Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json."})}} -->

sdd-forge is implemented in JavaScript using the ES module system (`"type": "module"` in `package.json`). The runtime requirement is **Node.js 18.0.0 or later**, as declared in the `engines` field.

The project has a strict **zero external dependency policy**: only Node.js built-in modules may be used. Adding third-party packages to `dependencies` or `devDependencies` is not permitted. The package manager in use is **pnpm** (pinned via the `packageManager` field), though the package itself has no runtime dependencies that consumers need to install.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Internal Design](internal_design.md)
<!-- {{/data}} -->
