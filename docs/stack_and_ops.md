<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, and operational procedures for sdd-forge. The project is a Node.js CLI tool (requiring Node.js ≥ 18.0.0) published to the npm registry as `sdd-forge`, currently at version `0.1.0-alpha.361`.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Language | JavaScript (ES Modules) | ESNext |
| Package Manager | pnpm | 10.33.0 |
| Registry | npm | — |
| Version Control | Git / GitHub | — |
| Dependency Updates | Dependabot | weekly (npm) |
| Test Runner | Node.js built-in (`node --test`) | — |

No external npm packages are used. All functionality is implemented using Node.js built-in modules only (`fs`, `path`, `child_process`, `url`, etc.).
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge has zero external npm dependencies by design. All logic relies exclusively on Node.js built-in modules, which eliminates supply-chain risk and ensures the package installs instantly with no transitive dependencies.

The package manager is **pnpm** (v10.33.0), pinned via the `packageManager` field in `package.json`. The `pnpm-lock.yaml` lockfile is committed to the repository to ensure reproducible installs.

Dependabot is configured to scan for npm dependency updates on a weekly schedule, providing automated pull requests if any future dependency is introduced.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published manually to the npm registry under the package name `sdd-forge`. The recommended two-step process ensures the `latest` dist-tag is updated correctly:

1. **Publish the alpha release**
   ```bash
   npm publish --tag alpha
   ```
2. **Promote to `latest`**
   ```bash
   npm dist-tag add sdd-forge@<version> latest
   ```

Before publishing, verify the packaged contents with `npm pack --dry-run` to confirm no sensitive files are included. Only the `src/` directory, `package.json`, `README.md`, and `LICENSE` are included in the published artifact (controlled by the `files` field in `package.json`).

Versions follow the `0.1.0-alpha.N` scheme during the alpha period, where `N` equals the total commit count (`git rev-list --count HEAD`). Published versions cannot be re-published under the same version number.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Running tests**

| Command | Scope |
|---|---|
| `pnpm test` | All tests (unit + e2e) |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:e2e` | End-to-end tests only |
| `pnpm test:acceptance` | Acceptance tests for all presets |

For long-running test commands, redirect output to a file before inspecting results:
```bash
pnpm test > /tmp/test.log 2>&1
```

**Documentation regeneration**

After source changes, rebuild the project documentation with:
```bash
sdd-forge build
```

When `src/templates/` or `src/presets/` are modified, propagate changes to project skills and configuration by running:
```bash
sdd-forge upgrade
```

**SDD workflow**

Feature development follows the Spec-Driven Development flow managed by the `sdd-forge flow` subcommand (plan → implement → merge). Flow state is persisted to `.sdd-forge/` so that work can resume after interruption.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
