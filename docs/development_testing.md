<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/development_testing.md)
<!-- {{/data}} -->

# Development, Testing, and Distribution

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow."})}} -->

This chapter covers the full development lifecycle of sdd-forge — from cloning the repository and setting up a local command-line environment, through the three-tier test suite (unit, e2e, and acceptance), to the two-step alpha release process on npm.
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

Because `npm link` registers the local checkout as a global command, any edits made to files under `src/` are immediately available the next time you invoke `sdd-forge` in a terminal — no reinstallation or rebuild step is required. The entry point is `src/sdd-forge.js`, declared in the `bin` field of `package.json`. Run `npm link` once after cloning, then invoke `sdd-forge <subcommand>` directly to exercise your changes in real time.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text({prompt: "Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code."})}} -->

All feature work follows the SDD (Spec-Driven Development) flow. Feature branches are merged into `main` using squash merge, as configured by `flow.merge: "squash"` in `.sdd-forge/config.json`, keeping the main-branch history clean with one commit per feature or fix.

Commit messages must be written in English. Sign-off lines (`Signed-off-by:`) and `Co-authored-by:` trailers must not be added. The version number during the alpha period follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`.
<!-- {{/text}} -->

### Testing

<!-- {{text({prompt: "Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.", mode: "deep"})}} -->

The project uses Node.js's built-in test runner (`node --test`) with no external testing framework. Tests are divided into three scopes:

- **unit** — isolated logic tests located in `tests/unit/`
- **e2e** — command-level integration tests located in `tests/e2e/`
- **acceptance** — full pipeline tests run against preset fixtures via `tests/acceptance/run.js`

The main runner `tests/run.js` accepts `--scope unit|e2e` and `--preset <name>` flags to narrow execution. Preset-specific tests live under `src/presets/*/tests/`.

```bash
npm test                  # Run all tests (unit + e2e)
npm run test:unit         # Unit tests only
npm run test:e2e          # End-to-end tests only
npm run test:acceptance   # Acceptance tests
```

When a test fails, the product code must be corrected. Modifying test code solely to make a failing test pass is explicitly prohibited.
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text({prompt: "Describe the release procedure. Derive from publish settings and npm scripts in the source code."})}} -->

Publishing follows a mandatory two-step process to ensure the `latest` dist-tag on npmjs.com is updated correctly:

```bash
npm pack --dry-run              # Verify published file list; check for sensitive data
npm publish --tag alpha         # Publish under the alpha dist-tag
npm dist-tag add sdd-forge@<version> latest   # Promote to latest
```

The `files` field in `package.json` is set to `["src/", "!src/presets/*/tests/"]`, so preset test fixtures are excluded from the published package. Because npm does not allow a version to be re-published once it has been unpublished (for 24 hours), verify the version number carefully before executing `npm publish`. Publishing must only be performed when the user has explicitly stated the intent to release to npm.
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text({prompt: "Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json."})}} -->

sdd-forge is written in JavaScript using ES module syntax, declared via `"type": "module"` in `package.json`. The minimum supported runtime is **Node.js 18.0.0**, as specified in the `engines` field. The recommended package manager is **pnpm 10.33.0**, declared in the `packageManager` field.

The project carries **no external runtime dependencies** — only Node.js built-in modules are used throughout `src/`. Adding third-party packages to `dependencies` or `devDependencies` is explicitly prohibited by the project coding policy.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Internal Design](internal_design.md)
<!-- {{/data}} -->
