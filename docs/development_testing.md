# 05. Development, Testing, and Distribution

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow.}} -->

This chapter covers the local development workflow for sdd-forge, including environment setup, testing with Node.js built-in test runner, and the two-step npm release process for publishing alpha and latest versions.
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

Since sdd-forge is an ES Modules package with its entry point at `src/sdd-forge.js`, running `npm link` creates a global symlink that points directly to the local source files. Any edits to files under `src/` are reflected immediately on the next invocation without requiring a build or compilation step.

You can also run the CLI directly during development without `npm link`:

```bash
node src/sdd-forge.js help
```

The project has zero external dependencies — only Node.js built-in modules are used — so there is no `npm install` step required after cloning.
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text: Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code.}} -->

Commit messages must be written in English. Messages should be concise and describe the purpose of the change. Do not include sign-off lines or co-authored-by trailers in commits.

The project follows a Spec-Driven Development (SDD) workflow. Feature branches are created per specification, and implementation proceeds through the SDD flow (`flow start` → `flow review` → `flow merge`). The `flow merge` command handles the final merge and cleanup of the working branch.
<!-- {{/text}} -->

### Testing

<!-- {{text[mode=deep]: Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.}} -->

sdd-forge uses the Node.js built-in test runner (`node:test`) with no external test framework dependencies. Tests are located in the `tests/` directory and follow the `*.test.js` naming convention.

To run the full test suite:

```bash
npm test
```

This executes the script defined in `package.json`, which discovers all test files under `tests/` and runs them via `node --test`:

```bash
find tests -name '*.test.js' | xargs node --test
```

An important project rule applies to test maintenance: **test code must not be modified to make tests pass.** When a test fails, first verify that the test scenario is valid. If it is, fix the product code rather than altering the test expectations.

sdd-forge also includes automatic test environment detection via `src/docs/lib/test-env-detection.js`. The `detectTestEnvironment()` function inspects `analysis.json` to identify test frameworks present in the target project's `devDependencies` (npm) or `require-dev` (Composer). It recognizes Jest, Mocha, Vitest, AVA, TAP, Jasmine, PHPUnit, and Pest, as well as `node:test` when the test script contains `node --test`. This detection is used by the SDD flow to determine whether a test phase should be included automatically.

For CakePHP 2.x projects, a dedicated scanner (`src/presets/cakephp2/scan/testing.js`) analyzes the `app/Test/` directory structure, counting controller tests, model tests, and fixtures under their respective conventional paths.
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text: Describe the release procedure. Derive from publish settings and npm scripts in the source code.}} -->

The package is published to npm under the name `sdd-forge`. Only the `src/` directory, `package.json`, `README.md`, and `LICENSE` are included in the published package, as controlled by the `"files"` field in `package.json`.

Before publishing, always verify the package contents for sensitive information:

```bash
npm pack --dry-run
```

The release follows a two-step process for pre-release versions:

1. `npm publish --tag alpha` — publishes the package under the `alpha` dist-tag.
2. `npm dist-tag add sdd-forge@<version> latest` — promotes the version to the `latest` tag so it appears on the npmjs.com landing page.

Publishing with `--tag alpha` alone does not update the `latest` tag, so both steps are required. Note that npm does not allow overwriting a previously published version — once a version number is used, it cannot be reused even after unpublishing (24-hour cooldown applies).
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text: Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json.}} -->

sdd-forge is written in JavaScript using ES Modules (`"type": "module"` in `package.json`). It requires **Node.js 18.0.0 or later**.

The project enforces a strict zero-dependency policy: only Node.js built-in modules (such as `fs`, `path`, and `child_process`) are permitted. Adding external npm dependencies is prohibited. This keeps the package lightweight, reduces supply-chain risk, and ensures portability across environments where only a Node.js runtime is available.
<!-- {{/text}} -->
