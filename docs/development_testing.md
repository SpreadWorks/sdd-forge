# 05. Development, Testing, and Distribution

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow.}} -->

This chapter covers the local development setup for sdd-forge, the testing approach using Node.js's built-in test runner, and the step-by-step release flow for publishing to the npm registry.

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

Because sdd-forge is a CLI tool distributed as a Node.js package, running `npm link` in the project root registers the `sdd-forge` binary globally by creating a symlink to `src/sdd-forge.js`. Since Node.js resolves the symlink at runtime, any edits made to files under `src/` take effect immediately on the next command invocation — no rebuild or reinstall step is required. You can verify the linked version is active by running `sdd-forge help` and confirming the expected command list appears.

<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text: Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code.}} -->

Feature branches are typically created via `sdd-forge spec --title "<feature-name>"`, which provisions a dedicated branch alongside the spec file as part of the SDD workflow. For hotfixes or standalone changes, a short-lived branch from the base branch is recommended.

Commit messages must be written in **English**. Use the imperative mood and keep the subject line concise (e.g., `Add snapshot check subcommand`). Sign-off lines (`Signed-off-by:`) and `Co-authored-by:` trailers must not be included. Amending published commits should be avoided; create a new commit to address review feedback instead.

<!-- {{/text}} -->

### Testing

<!-- {{text[mode=deep]: Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.}} -->

sdd-forge uses the **Node.js built-in test runner** (`node:test`), which requires no external test framework dependency. Test files follow the `*.test.js` naming convention and are located under the `tests/` directory at the project root.

Run the full test suite with:

```bash
npm test
# Expands to: find tests -name '*.test.js' | xargs node --test
```

In addition to unit tests, the `sdd-forge snapshot` command provides **regression detection** for deterministic command outputs. It captures `analysis.json`, all `docs/*.md` files (including subdirectories), and `README.md` into `.sdd-forge/snapshots/`, then compares them on subsequent runs to detect unintended changes.

```bash
sdd-forge snapshot save    # Capture current outputs as baseline
sdd-forge snapshot check   # Diff current outputs against baseline (exits 1 on diff)
sdd-forge snapshot update  # Refresh baseline with current outputs
```

The `test-env-detection.js` utility automatically identifies the test environment from `analysis.json` by inspecting `devDependencies` (for Jest, Mocha, Vitest, AVA, TAP, Jasmine, PHPUnit, and Pest) and the `scripts.test` field. This information is consumed by the SDD gate flow to surface relevant test observations before implementation begins.

When a test fails, the correct response is to verify the test scenario's validity first; only modify test code if the scenario itself is wrong. If the scenario is valid, fix the production code.

<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text: Describe the release procedure. Derive from publish settings and npm scripts in the source code.}} -->

Publishing sdd-forge requires a deliberate **two-step process** because the package is currently distributed as a pre-release under the `alpha` dist-tag:

```bash
npm pack --dry-run                              # Verify no sensitive files are included
npm publish --tag alpha                         # Publish with alpha tag (latest not updated yet)
npm dist-tag add sdd-forge@<version> latest     # Promote to latest on npmjs.com
```

Skipping the second step leaves the `latest` tag pointing at an older version, which means the npmjs.com package page will not reflect the new release. Only `src/`, `package.json`, `README.md`, and `LICENSE` are included in the published artifact (controlled by the `files` field in `package.json`). Once a version is published, npm does not allow re-publishing the same version number even after an unpublish for 24 hours, so always verify the version bump before publishing.

<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text: Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json.}} -->

sdd-forge is written in **JavaScript** using the **ES Modules** format (`"type": "module"` in `package.json`) and requires **Node.js >=18.0.0**. The minimum version is chosen to ensure availability of the built-in test runner, the `fs.readdirSync` `withFileTypes` option, and stable ESM support.

The project maintains a strict **zero external dependency** policy: only Node.js built-in modules (`fs`, `path`, `child_process`, etc.) are used throughout `src/`. Adding third-party packages is prohibited. This policy keeps the installation footprint minimal, eliminates supply-chain risk, and ensures the tool works in air-gapped environments where npm access may be restricted.

<!-- {{/text}} -->
