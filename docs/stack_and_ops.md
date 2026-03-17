# 02. Technology Stack and Operations

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions.}} -->

sdd-forge is built with JavaScript (ES Modules) and runs on Node.js >=18.0.0. It operates as a CLI tool with zero external dependencies, relying solely on Node.js built-in modules.

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

sdd-forge enforces a strict zero-dependency policy. The project uses only Node.js built-in modules (such as `fs`, `path`, `child_process`, etc.) and does not rely on any third-party npm packages. Adding external dependencies is explicitly prohibited by the project rules.

This approach minimizes supply-chain risk, reduces installation footprint, and ensures that the tool remains lightweight and portable across any environment that meets the minimum Node.js version requirement.

The `package.json` contains no `dependencies` or `devDependencies` fields. Testing is handled via Node.js's built-in test runner (`node --test`), further reinforcing the zero-dependency philosophy.

<!-- {{/text}} -->

### Deployment Flow

<!-- {{text: Describe the deployment procedure and flow.}} -->

sdd-forge is distributed as a public npm package. The published package includes only the `src/` directory along with `package.json`, `README.md`, and `LICENSE`, as defined by the `files` field in `package.json`.

The release procedure follows a two-step process:

1. **Pre-release publish**: Run `npm publish --tag alpha` to publish the package under the `alpha` dist-tag.
2. **Promote to latest**: Run `npm dist-tag add sdd-forge@<version> latest` to update the `latest` tag so that the new version is reflected on the npmjs.com package page.

Before publishing, `npm pack --dry-run` is executed to verify the package contents and confirm that no sensitive information is included. Note that npm does not allow overwriting a previously published version, so each release must use a unique version number.

<!-- {{/text}} -->

### Operations Flow

<!-- {{text: Describe the operations procedures.}} -->

The primary operational workflow for sdd-forge centers around its documentation generation pipeline and the SDD (Spec-Driven Development) flow.

**Documentation generation pipeline** runs in the following sequence:

`scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `[translate]`

This pipeline can be executed as a single command via `sdd-forge docs build`, or each step can be run individually for targeted updates.

**Testing** is performed using the Node.js built-in test runner with the command `npm test`, which discovers and executes all `*.test.js` files under the `tests/` directory.

**SDD workflow** for feature additions and modifications follows a structured process: planning (`flow-plan`) → implementation (`flow-impl`) → merge (`flow-merge`). Flow state is persisted via `src/lib/flow-state.js`, allowing workflows to be resumed after interruption.

<!-- {{/text}} -->
