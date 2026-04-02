<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter documents the technology stack of sdd-forge, a Node.js CLI tool built entirely on ES modules with no external runtime dependencies, requiring Node.js 18 or later and managed with pnpm 10.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=18.0.0 |
| Module System | ES Modules (ESM) | — |
| Package Manager | pnpm | 10.33.0 |
| Distribution | npm registry | — |
| Version Control | Git | — |
| License | MIT | — |

The project runs as a standard Node.js CLI binary (`sdd-forge`) registered via the `bin` field in `package.json`. No framework or transpiler is involved; source files are executed directly by the Node.js runtime.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has zero external runtime dependencies. All functionality is implemented using Node.js built-in modules only; adding third-party packages is explicitly prohibited by project policy.

Development tooling is managed with pnpm (version 10.33.0), and a `pnpm-lock.yaml` file is committed to the repository to ensure fully reproducible installs across environments.

The `files` field in `package.json` restricts the published package to the `src/` directory, keeping the distribution artifact lean and free of development-only files. Test directories inside preset folders (`src/presets/*/tests/`) are additionally excluded from the published artifact.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published to the npm registry under the package name `sdd-forge`. The versioning scheme during the alpha period follows the format `0.1.0-alpha.N`, where `N` is derived from the total commit count via `git rev-list --count HEAD`.

The publication procedure consists of the following steps:

1. Verify the package contents with `npm pack --dry-run` to confirm no sensitive or unintended files are included.
2. Publish the release candidate with `npm publish --tag alpha` to push the package without immediately updating the `latest` tag.
3. Promote the release to `latest` with `npm dist-tag add sdd-forge@<version> latest` so that the npmjs.com package page reflects the new version.

Both steps 2 and 3 are required; omitting step 3 leaves the `latest` tag pointing to the previous release.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The following operational procedures apply during day-to-day development and maintenance.

**Running tests**
Tests are executed via `node tests/run.js`. Scope can be narrowed with flags:
- `--scope unit` — unit tests only
- `--scope e2e` — end-to-end tests only

Acceptance tests are run separately with `node tests/acceptance/run.js`. Long-running test output should be redirected to a file (`command > /tmp/output.log 2>&1`) and inspected with `grep` or the Read tool rather than re-executing.

**Updating skills and templates**
After modifying files under `src/templates/` or `src/presets/`, run `sdd-forge upgrade` to propagate changes to the project's skill files (`.claude/skills/`, `.agents/skills/`) and configuration. The command detects diffs and updates only the changed files.

**Rebuilding documentation**
Run `sdd-forge docs build` to regenerate the `docs/` directory from the latest source analysis. Compare modification timestamps between `docs/` and source files before starting work; if sources are newer, rebuilding is recommended to keep documentation current.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
