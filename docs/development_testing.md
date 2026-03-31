<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/development_testing.md)
<!-- {{/data}} -->

# Development, Testing, and Distribution

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow."})}} -->

This chapter covers everything needed to work on `sdd-forge` itself: setting up a local development environment, understanding the testing approach across unit, end-to-end, and acceptance scopes, and following the release procedure to publish new versions to the npm registry.
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

After cloning the repository and running `npm link`, the `sdd-forge` command resolves directly to `src/sdd-forge.js` in your local working tree. Because the project uses ES modules with no compilation or build step, every edit to a file under `src/` is picked up immediately the next time you invoke the command — there is no watch process or rebuild required.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text({prompt: "Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code."})}} -->

Feature branches are created per specification and merged into the main branch using the squash strategy, as configured in `flow.merge: "squash"` in `.sdd-forge/config.json`. Each squash commit therefore represents one completed feature or fix.

Commit messages must be written in English. Trailer lines such as `Signed-off-by` or `Co-authored-by` must not be included. During the alpha period, the version number embedded in commit history follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`.
<!-- {{/text}} -->

### Testing

<!-- {{text({prompt: "Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.", mode: "deep"})}} -->

Tests are run with the Node.js built-in test runner (`node --test`) — no third-party test framework is required. The entry point is `tests/run.js`, which discovers all `*.test.js` files recursively and passes them to the runner in a single invocation.

Three test scopes are available:

- **Unit** (`tests/unit/`) — isolated tests for individual modules and helpers
- **End-to-end** (`tests/e2e/`) — tests that exercise CLI commands against fixture projects
- **Acceptance** (`tests/acceptance/`) — higher-level scenario tests run via `tests/acceptance/run.js`

Preset-specific tests live alongside each preset in `src/presets/<name>/tests/` and are included automatically when running the full suite.

```bash
npm test                          # Run all unit and e2e tests
npm run test:unit                 # Unit tests only
npm run test:e2e                  # E2e tests only
npm run test:acceptance           # Acceptance tests only
node tests/run.js --preset hono   # Tests for a specific preset
```

Test code must not be modified to make a failing test pass; if a test fails, first verify whether the scenario is correct, then fix the production code.
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text({prompt: "Describe the release procedure. Derive from publish settings and npm scripts in the source code."})}} -->

The package is published to the npm registry under the name `sdd-forge`. Only the `src/` directory is included in the published artifact (preset test directories are explicitly excluded via the `files` field in `package.json`).

Before publishing, run `npm pack --dry-run` to confirm the exact set of files that will be uploaded and verify that no sensitive information is included.

During the alpha period the release is a two-step process:

```bash
npm publish --tag alpha                          # Publish under the alpha dist-tag
npm dist-tag add sdd-forge@<version> latest     # Promote to latest
```

Both steps are required: publishing with `--tag alpha` alone does not update the `latest` tag, so the package page on npmjs.com will not reflect the new version until the second command is run. Once a version is published it cannot be overwritten; unpublished versions remain blocked for 24 hours.
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text({prompt: "Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json."})}} -->

The project is implemented in JavaScript using the ES module format (`"type": "module"` in `package.json`). Node.js **18.0.0 or later** is required, as declared in the `engines` field.

The package has **no external runtime dependencies**. All functionality is built on Node.js built-in modules only; adding third-party dependencies is not permitted. The project uses `pnpm` (version 10.33.0) as its package manager for development tooling.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Internal Design](internal_design.md)
<!-- {{/data}} -->
