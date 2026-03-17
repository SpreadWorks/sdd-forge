# 02. Technology Stack and Operations

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions.}} -->

sdd-forge is built entirely in JavaScript (ES Modules) on Node.js >=18.0.0 with zero external dependencies. This chapter covers the technology stack, dependency policy, and the procedures for publishing and operating the CLI tool.

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

sdd-forge enforces a strict **zero-dependency** policy. Only Node.js built-in modules (such as `fs`, `path`, `child_process`, and `node:test`) are permitted. Adding third-party packages from npm is explicitly prohibited.

This approach eliminates supply-chain risks, keeps the package lightweight, and ensures that the tool runs on any Node.js >=18 environment without an `npm install` step beyond the package itself. Testing relies on the Node.js native test runner (`node --test`), which is invoked through the `npm test` script:

```
find tests -name '*.test.js' | xargs node --test
```

Because there is no build or transpilation step, the source code in `src/` is shipped as-is to npm. Changes to source files take effect immediately when running the `sdd-forge` command.

<!-- {{/text}} -->

### Deployment Flow

<!-- {{text: Describe the deployment procedure and flow.}} -->

sdd-forge is distributed as a public npm package under the name `sdd-forge`. The release process follows a two-step pre-release workflow:

1. **Pre-publish check** — Run `npm pack --dry-run` to verify that only the intended files (`src/`, `package.json`, `README.md`, `LICENSE`) are included and no secrets or credentials are present.
2. **Run tests** — Execute `npm test` to confirm all test suites pass.
3. **Version bump** — Update the version in `package.json` (e.g., `npm version prerelease --preid=alpha`).
4. **Publish with alpha tag** — Run `npm publish --tag alpha` to push the package to the registry without updating the `latest` tag.
5. **Promote to latest** — Run `npm dist-tag add sdd-forge@<version> latest` to make the release visible as the default install version on npmjs.com.

Note that npm does not allow overwriting a published version. Once a version number is used, it cannot be reused even after unpublishing (24-hour cooldown applies). There is no CI/CD pipeline at this time; publishing is performed manually by the maintainer.

<!-- {{/text}} -->

### Operations Flow

<!-- {{text: Describe the operations procedures.}} -->

**Initial setup** is performed by running `sdd-forge setup`, which launches an interactive wizard to create the `.sdd-forge/` configuration directory, generate `config.json`, scaffold the `docs/` and `specs/` directories, produce `AGENTS.md`, and deploy skill templates to `.agents/skills/` and `.claude/skills/`.

**Upgrading** template-managed files (such as skill definitions) is handled by `sdd-forge upgrade`. This command re-deploys skill templates from `src/templates/skills/` into the project without modifying `config.json` or other user-owned files. A `--dry-run` flag is available to preview changes before applying them.

**Documentation generation** follows the pipeline `scan → enrich → init → data → text → readme → agents`, orchestrated by `sdd-forge docs build`. Each stage can also be run independently as a subcommand (e.g., `sdd-forge docs scan`).

**Development workflow** for contributors:

1. Clone the repository and run `npm link` to register the CLI globally.
2. Edit files in `src/` — changes take effect immediately (no build step).
3. Run `npm test` to validate changes against the test suite.
4. Use the SDD flow (`sdd-forge flow start`) for spec-driven feature development, and finalize with `sdd-forge flow merge`.

<!-- {{/text}} -->
