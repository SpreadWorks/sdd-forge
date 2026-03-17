# 05. Development, Testing, and Distribution

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow.}} -->

This chapter covers the local development workflow for sdd-forge, including environment setup, testing practices using Node.js's built-in test runner, and the two-step npm release process for alpha pre-releases.

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

Since sdd-forge is an ES Modules package with its entry point at `src/sdd-forge.js`, running `npm link` creates a global symlink to your local working copy. Any edits to source files under `src/` are reflected immediately on the next invocation — no build or compilation step is required.

You can also run the CLI directly without linking:

```bash
node src/sdd-forge.js help
```

The project has zero external dependencies; only Node.js built-in modules are used. This means there is no `npm install` step required for dependency resolution beyond the initial clone.

<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text: Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code.}} -->

The project follows Spec-Driven Development (SDD), where feature branches are created as part of the SDD flow (`sdd-forge flow`). Each feature or fix goes through a planning phase, implementation, and merge cycle managed by the flow commands.

Commit messages must be written in English. Sign-off lines (`Signed-off-by`) and co-authored-by trailers are not used. Messages should be concise and describe the intent of the change rather than mechanically listing modified files.

<!-- {{/text}} -->

### Testing

<!-- {{text[mode=deep]: Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.}} -->

sdd-forge uses the Node.js built-in test runner (`node:test`) — no external test framework is installed. Tests are located in the `tests/` directory and follow the `*.test.js` naming convention.

To run the full test suite:

```bash
npm test
```

This executes the following command defined in `package.json`:

```bash
find tests -name '*.test.js' | xargs node --test
```

The test runner discovers all files matching the `*.test.js` pattern under `tests/` and runs them via `node --test`. This approach keeps the project free from external dependencies while providing a standard test execution workflow.

sdd-forge also includes a test environment detection module (`src/docs/lib/test-env-detection.js`) that automatically identifies the testing setup of analyzed projects. It inspects `devDependencies` (npm) and `require-dev` (Composer) for known frameworks such as Jest, Mocha, Vitest, AVA, TAP, Jasmine, PHPUnit, and Pest. It also recognizes `node:test` by detecting `node --test` in the project's test script. This detection is used during the SDD flow to determine whether automated tests are available in the target project.

<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text: Describe the release procedure. Derive from publish settings and npm scripts in the source code.}} -->

The project is currently in alpha and follows a two-step pre-release procedure:

1. **Publish with the `alpha` tag** to avoid updating the `latest` tag prematurely:
   ```bash
   npm publish --tag alpha
   ```
2. **Promote to `latest`** once the release is verified:
   ```bash
   npm dist-tag add sdd-forge@<version> latest
   ```

Before publishing, always run `npm pack --dry-run` to inspect the package contents and confirm that no sensitive files are included. The `files` field in `package.json` is set to `["src/"]`, so only the `src/` directory along with `package.json`, `README.md`, and `LICENSE` are included in the published package.

Note that npm does not allow overwriting a previously published version. Once a version number is used, it cannot be reused even after unpublishing (a 24-hour cooldown applies).

<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text: Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json.}} -->

See [Technology Stack and Operations](stack_and_ops.md) for the full technology stack, dependency policy, and deployment procedures. In summary: sdd-forge is written in JavaScript (ES Modules) on Node.js >=18.0.0 with zero external dependencies.

<!-- {{/text}} -->
