# Development, Testing, and Distribution

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow."})}} -->

This chapter covers the local development workflow for sdd-forge, including environment setup, the testing strategy built on Node.js's built-in test runner, and the two-step alpha release process for publishing to npm.
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

Because sdd-forge is a pure Node.js CLI tool with no build step, source changes take effect immediately. Running `npm link` creates a global symlink that points directly to the local `src/` directory, so any edits to source files are reflected the next time the command is invoked—no compilation or bundling is required.

During development, you can also run commands directly via `node src/sdd-forge.js <subcommand>` without the global link. Environment variables `SDD_SOURCE_ROOT` and `SDD_WORK_ROOT` can be set to control the project context the tool operates on, which is useful when testing against sample projects.

When templates or presets under `src/templates/` or `src/presets/` are modified, run `sdd-forge upgrade` to propagate the changes to skills and project-level configuration files.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text({prompt: "Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code."})}} -->

Commit messages must always be written in English. Messages should be concise and describe the intent of the change rather than listing modified files. Sign-off lines and co-authored-by trailers are not added.

Feature work and bug fixes are typically developed on topic branches and merged via pull request. The SDD (Spec-Driven Development) flow manages branch creation and merging through the `flow-plan`, `flow-impl`, and `flow-finalize` skills, which handle worktree isolation and guard against uncommitted changes.
<!-- {{/text}} -->

### Testing

<!-- {{text({prompt: "Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.", mode: "deep"})}} -->

sdd-forge uses Node.js's built-in `node:test` module as its test framework, with `node:assert/strict` for assertions. This aligns with the project's zero-external-dependency policy. Tests are organized into two categories within each preset directory:

- **Unit tests** (`tests/unit/`): Verify individual scan parsers and DataSource methods in isolation. Each test file typically covers one or more analyzer functions, validating input/output behavior such as parsing PHP classes, GraphQL schemas, Drizzle ORM definitions, or Cloudflare Workers configuration.
- **E2E tests** (`tests/e2e/`): Execute the full `scan --stdout` pipeline against minimal project structures created in temporary directories, verifying that the analysis JSON output contains the expected top-level keys.

A shared set of test helpers (`tests/helpers/tmp-dir.js`) provides `createTmpDir()`, `removeTmpDir()`, and `writeFile()` / `writeJson()` utilities. Tests create temporary directories with fixture files that simulate real project structures, then clean up in `afterEach` hooks.

Tests can be run with:

```bash
node --test src/presets/**/tests/**/*.test.js
```

A guiding rule for testing: test code must never be modified to make a failing test pass. When a test fails, the test scenario's validity is verified first; if the scenario is correct, the product code is fixed instead.
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text({prompt: "Describe the release procedure. Derive from publish settings and npm scripts in the source code."})}} -->

During the current alpha period, version numbers follow the `0.1.0-alpha.N` format, where `N` is the total commit count obtained via `git rev-list --count HEAD`.

Publishing is a two-step process:

1. `npm publish --tag alpha` — publishes the package under the `alpha` dist-tag.
2. `npm dist-tag add sdd-forge@<version> latest` — promotes the release to the `latest` tag so it appears on the npmjs.com package page.

Before publishing, always run `npm pack --dry-run` to confirm the package contents. The `files` field in `package.json` is set to `["src/"]`, ensuring only the source directory, `package.json`, `README.md`, and `LICENSE` are included. Verify that no credentials or environment-specific files are bundled.

Note that npm does not allow re-publishing a version number once used, even after an `unpublish` (a 24-hour cooldown applies).
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text({prompt: "Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json."})}} -->

sdd-forge is written entirely in JavaScript (ES modules, `"type": "module"`) and runs on Node.js. The project enforces a strict **zero external dependencies** policy: only Node.js built-in modules (`fs`, `path`, `child_process`, `node:test`, `node:assert`, etc.) are used. Adding third-party packages to `dependencies` or `devDependencies` is not permitted.

This approach eliminates supply-chain risks, keeps the install footprint minimal, and ensures the tool runs on any environment with a compatible Node.js version without additional setup.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Internal Design](internal_design.md)
<!-- {{/data}} -->
