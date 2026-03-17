# 02. Technology Stack and Operations

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions.}} -->

sdd-forge is built entirely in JavaScript (ES Modules) running on Node.js >=18.0.0, with no external dependencies. This chapter describes the technology stack, dependency policy, and the procedures for deploying and operating the tool.

<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{data: config.stack("Category|Technology|Version")}} -->
| Category | Technology | Version |
| --- | --- | --- |
| Runtime | Node.js | >=18.0.0 |
| Module | ES Modules | — |
<!-- {{/data}} -->

### Dependencies

<!-- {{text: Describe the project's dependency management approach.}} -->

sdd-forge adopts a **zero external dependencies** policy. The project relies exclusively on Node.js built-in modules (`node:fs`, `node:path`, `node:test`, `node:assert`, etc.) for all functionality.

Adding third-party packages to `package.json` is strictly prohibited. This policy keeps the package lightweight, eliminates supply-chain risks, and ensures that no dependency auditing or lockfile maintenance is required.

The `"files"` field in `package.json` is set to `["src/"]`, so only the source directory along with `package.json`, `README.md`, and `LICENSE` are included in the published package.

<!-- {{/text}} -->

### Deployment Flow

<!-- {{text: Describe the deployment procedure and flow.}} -->

sdd-forge is distributed as an npm package. The release process follows a manual two-step procedure:

1. **Pre-publish check** — Run `npm pack --dry-run` to verify that no sensitive files (credentials, `.env`, etc.) are included in the package.
2. **Version bump** — Update the version in `package.json` using `npm version patch`, `npm version minor`, or by editing the field directly.
3. **Publish with alpha tag** — Run `npm publish --tag alpha` to publish the package under the `alpha` dist-tag.
4. **Promote to latest** — Run `npm dist-tag add sdd-forge@<version> latest` to update the `latest` tag on the npm registry.

Both steps 3 and 4 are required. Publishing with `--tag alpha` alone does not update the `latest` tag, which means the npmjs.com package page will not reflect the new version.

There is no automated CI/CD pipeline. Publishing is performed manually and only when the maintainer explicitly indicates a release intent.

<!-- {{/text}} -->

### Operations Flow

<!-- {{text: Describe the operations procedures.}} -->

Local development and day-to-day operations follow a straightforward workflow:

- **Local setup** — Run `npm link` in the repository root to register `sdd-forge` as a global CLI command for development.
- **Running tests** — Execute `npm test`, which discovers all `*.test.js` files under `tests/` and runs them with the Node.js built-in test runner (`node --test`). Tests use `node:assert/strict` for assertions and helper utilities in `tests/helpers/` for temporary directories and mock projects.
- **Package validation** — The test suite includes `tests/package.test.js`, which verifies that `npm pack --dry-run` output contains only the expected files from `src/`, preventing accidental inclusion of sensitive data.
- **Documentation generation** — Run `sdd-forge docs build` to execute the full documentation pipeline (`scan → enrich → init → data → text → readme → agents → [translate]`). Individual stages can also be run independently.
- **SDD workflow** — Feature development follows the Spec-Driven Development flow: `sdd-forge flow --request "<request>"` to start planning, then proceed through implementation and merge stages.

<!-- {{/text}} -->
