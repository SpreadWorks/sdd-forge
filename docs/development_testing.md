<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/development_testing.md)
<!-- {{/data}} -->

# Development, Testing, and Distribution

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow."})}} -->

This chapter covers the full development lifecycle of sdd-forge, from cloning the repository and setting up a local environment to running the test suite and publishing a release to the npm registry.
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

Because `npm link` registers the package's `bin` entry (`src/sdd-forge.js`) as the global `sdd-forge` command, edits to source files under `src/` take effect immediately the next time the command is invoked — no build or compilation step is required. You can therefore make a change and test it at the terminal in a single step.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text({prompt: "Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code."})}} -->

Feature branches are merged into the main branch using **squash merge**, as configured in `flow.merge: "squash"` inside `.sdd-forge/config.json`. This keeps the main branch history linear and each merged change represented by a single commit.

Commit messages must be written in **English**. Sign-off lines (`Signed-off-by:`) and `Co-authored-by:` trailers must not be added to commits. During the alpha phase, the version number embedded in commits follows the format `0.1.0-alpha.N`, where `N` is the total commit count (`git rev-list --count HEAD`).
<!-- {{/text}} -->

### Testing

<!-- {{text({prompt: "Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.", mode: "deep"})}} -->

The project uses **Node.js's built-in test runner** (`node --test`) — no third-party test framework is required. All test files follow the naming convention `*.test.js`.

Tests are organized into three categories:

- **`tests/unit/`** — Unit tests for individual modules and library functions.
- **`tests/e2e/`** — End-to-end tests that exercise CLI commands and multi-step pipelines.
- **`tests/acceptance/`** — Acceptance tests run via a separate runner (`tests/acceptance/run.js`).
- **`src/presets/*/tests/`** — Per-preset tests covering preset-specific behavior.

The main test runner (`tests/run.js`) supports two optional filters:

- `--scope unit` or `--scope e2e` — Run only that category.
- `--preset <name>` — Run unit and e2e tests together with the named preset's own test directory.

Available npm scripts:

```bash
npm test                  # All unit + e2e + preset tests
npm run test:unit         # Unit tests only
npm run test:e2e          # E2E tests only
npm run test:acceptance   # Acceptance suite
```
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text({prompt: "Describe the release procedure. Derive from publish settings and npm scripts in the source code."})}} -->

The published package includes only the `src/` directory (with `src/presets/*/tests/` excluded), plus `package.json`, `README.md`, and `LICENSE`, as defined by the `files` field in `package.json`.

Before publishing, verify the file list with:

```bash
npm pack --dry-run
```

For alpha releases, use a two-step process to ensure the `latest` tag on npmjs.com is updated:

```bash
npm publish --tag alpha
npm dist-tag add sdd-forge@<version> latest
```

The version number is set manually in `package.json` following the `0.1.0-alpha.N` format, where `N` equals the output of `git rev-list --count HEAD`. Publishing must only be performed when the user has explicitly stated the intent to release to npm; committing or bumping the version number alone does not constitute a release instruction.
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text({prompt: "Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json."})}} -->

sdd-forge is implemented in **JavaScript (ES Modules)**, with `"type": "module"` declared in `package.json`. All source files use the `.js` extension and native `import`/`export` syntax.

**Runtime requirement:** Node.js **18.0.0 or later** (specified in the `engines` field).

**Dependency policy:** The project has **no external runtime dependencies**. Only Node.js built-in modules (such as `node:fs`, `node:path`, and `node:child_process`) are used throughout `src/`. Adding third-party packages is explicitly prohibited.

The package manager in use is **pnpm** (v10.33.0), as declared in the `packageManager` field.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Internal Design](internal_design.md)
<!-- {{/data}} -->
