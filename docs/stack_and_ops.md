<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management approach, and operational procedures for sdd-forge — a Node.js CLI tool built with ES modules (Node.js ≥ 18.0.0, current release `0.1.0-alpha.361`) that carries zero external npm dependencies.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology / Tool | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Language | JavaScript (ES Modules) | ES2022+ |
| Package manager | pnpm | 10.33.0 |
| Distribution registry | npm (npmjs.com) | — |
| Source control | Git / GitHub | — |
| License | MIT | — |

No third-party npm packages are used at runtime. All functionality relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, `url`, and `readline`.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge deliberately carries **zero external npm dependencies**. All runtime functionality is implemented using Node.js built-in modules only, so no dependency installation step is required after cloning the repository.

Dependency tooling is managed with **pnpm 10.33.0** (declared in the `packageManager` field of `package.json` with a pinned SHA-512 integrity hash). A `pnpm-lock.yaml` lockfile is committed to the repository to ensure reproducible installs.

Dependabot is configured to check for npm dependency updates on a weekly schedule, keeping the lockfile and any future additions current with upstream security patches.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge is distributed as a global npm package. The release process follows these steps:

1. Verify the package contents with `npm pack --dry-run` to confirm no sensitive files are included.
2. Publish the pre-release build under the `alpha` dist-tag:
   ```
   npm publish --tag alpha
   ```
3. Promote the version to the `latest` tag so the npmjs.com page reflects the new release:
   ```
   npm dist-tag add sdd-forge@<version> latest
   ```

The version number follows the format `0.1.0-alpha.N`, where `N` is the total commit count produced by `git rev-list --count HEAD`. No CI/CD pipeline automates publishing; all steps are performed manually by a maintainer.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Installation and upgrade**

Install the tool globally via npm:
```
npm install -g sdd-forge
```

**Initial project setup**

Run the interactive setup wizard inside a target project to generate `.sdd-forge/config.json`:
```
sdd-forge setup
```
Flags such as `--name`, `--type`, `--lang`, `--agent`, and `--dry-run` are available for non-interactive use.

**Keeping skills and templates current**

After upgrading the sdd-forge package, run the following command inside each managed project to propagate updated skill files and templates:
```
sdd-forge upgrade
```
This command is idempotent and only writes files that have changed. It does not modify `config.json` or `context.json`.

**Running tests**

The test suite is invoked with:
```
npm test              # all tests
npm run test:unit     # unit tests only
npm run test:e2e      # end-to-end tests only
npm run test:acceptance
```

**Checking the installed version**
```
sdd-forge --version
```
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
