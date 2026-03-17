# 05. Development, Testing, and Distribution

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow.}} -->
This chapter covers the local development workflow for sdd-forge, including environment setup, testing practices using Node.js built-in test runner, and the two-step npm release process for publishing alpha and stable versions.
<!-- {{/text}} -->

## Content

### Local Development Setup

```bash
git clone <repository>
cd <project>
npm link          # Register as global command
<command> help    # Verify installation
```

<!-- {{text: Explain how to run the tool itself during development and how changes are immediately reflected.}} -->
Since sdd-forge is an ES Modules package with a `bin` entry pointing to `./src/sdd-forge.js`, running `npm link` creates a global symlink to the local source directory. Any edits to files under `src/` are immediately reflected without a build step or restart—simply run `sdd-forge` again to pick up the latest changes.

You can also invoke the CLI directly via `node src/sdd-forge.js` during development without the global link.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text: Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code.}} -->
sdd-forge uses the Spec-Driven Development (SDD) flow for feature branches. New work is started through `sdd-forge flow start`, which creates a dedicated branch and tracks progress through planning, implementation, and review stages. Once implementation is complete, `sdd-forge flow merge` finalizes the branch.

Commit messages must be written in English. Sign-off lines (`Signed-off-by`) and `Co-authored-by` trailers should not be included.
<!-- {{/text}} -->

### Testing

<!-- {{text[mode=deep]: Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.}} -->
sdd-forge uses the Node.js built-in test runner (`node:test`) with no external test framework dependencies. Tests are located in the `tests/` directory and follow the `*.test.js` naming convention.

To run the full test suite:

```bash
npm test
```

This executes the script `find tests -name '*.test.js' | xargs node --test`, which discovers and runs all test files automatically.

The project also includes automatic test environment detection via `src/docs/lib/test-env-detection.js`. This module inspects `analysis.json` to determine whether a target project has a testing setup. It checks npm `devDependencies` and Composer `require-dev` against a known list of frameworks (Jest, Mocha, Vitest, AVA, TAP, Jasmine, PHPUnit, Pest), reads the `scripts.test` field for a test command, and detects `node:test` usage when `node --test` appears in the test script.

For CakePHP 2.x projects, a dedicated scanner (`src/presets/cakephp2/scan/testing.js`) analyzes the `app/Test/` directory structure, counting controller tests, model tests, and fixture files to produce structured test metrics.

When modifying code, always run `npm test` before committing. If a test fails, the product code must be fixed—test code should not be modified to make tests pass.
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text: Describe the release procedure. Derive from publish settings and npm scripts in the source code.}} -->
sdd-forge follows a two-step release procedure during the current alpha phase:

1. **Publish with the alpha tag:** `npm publish --tag alpha`
2. **Promote to latest:** `npm dist-tag add sdd-forge@<version> latest`

Publishing with `--tag alpha` alone does not update the `latest` tag on npmjs.com, so the second step is required for the package page to reflect the new version.

Before publishing, run `npm pack --dry-run` to verify the package contents. Only the `src/` directory, `package.json`, `README.md`, and `LICENSE` are included (controlled by the `files` field in `package.json`). Confirm that no credentials or environment-specific files are present in the output.

Note that npm does not allow overwriting a previously published version. Once a version number is used, it cannot be reused even after unpublishing (a 24-hour cooldown applies).
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text: Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json.}} -->
sdd-forge is written in JavaScript using ES Modules (`"type": "module"` in `package.json`). It requires Node.js 18.0.0 or later.

The project enforces a strict zero-dependency policy: only Node.js built-in modules (such as `fs`, `path`, and `child_process`) are used. Adding external npm packages is not permitted. This ensures the tool remains lightweight, auditable, and free from supply-chain risks.
<!-- {{/text}} -->
