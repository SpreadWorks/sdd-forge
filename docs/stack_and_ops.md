<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack and operational infrastructure of sdd-forge, a CLI tool built entirely on **Node.js** (ES modules) with **zero external dependencies**. CI/CD automation is handled through **GitHub Actions** workflow pipelines.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version / Notes |
|---|---|---|
| Runtime | Node.js | ES modules (`"type": "module"`) |
| Language | JavaScript | No transpilation required |
| Package Manager | npm | Used for publishing (`sdd-forge` on npmjs.com) |
| CI/CD | GitHub Actions | Workflow YAML under `.github/workflows/` |
| Containerization | Docker | Stub support for CakePHP 2.x preset (not yet implemented) |
| Version Control | Git | Versioning via `git rev-list --count HEAD` |

The project enforces a strict **no external dependencies** policy — only Node.js built-in modules are permitted.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge adopts a **zero-dependency** approach. The project relies exclusively on Node.js built-in modules and prohibits adding any external packages.

This design decision eliminates supply-chain risks, keeps the installation footprint minimal, and ensures the tool runs on any environment with a compatible Node.js runtime. All functionality — including YAML parsing for CI pipeline analysis — is implemented inline without third-party libraries.

The package is published to npm with the `files` field set to `["src/"]`, so only source code, `package.json`, `README.md`, and `LICENSE` are distributed.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge uses a two-step npm publishing flow for releases:

1. **Publish with alpha tag** — `npm publish --tag alpha` to push the package without updating the `latest` dist-tag.
2. **Promote to latest** — `npm dist-tag add sdd-forge@<version> latest` to make the release visible as the default installation.

Versioning during the alpha period follows the `0.1.0-alpha.N` format, where `N` is derived from the total commit count (`git rev-list --count HEAD`). Before publishing, `npm pack --dry-run` is executed to verify that no sensitive files are included in the package.

The `PipelinesSource` data source parses `.github/workflows/*.yml` files to document the project's GitHub Actions pipelines, extracting triggers, jobs, dependencies, secrets, and environment variables automatically.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

CI/CD pipeline monitoring and documentation are supported through the built-in `PipelinesSource` (from the `ci` preset). This data source performs the following:

- **Pipeline inventory** — `list()` generates a summary table of all discovered GitHub Actions workflows.
- **Job details** — `jobs()` provides per-pipeline breakdowns including runner type (`runs-on`), step counts, and action dependencies.
- **Secrets and environment variables** — `env()` extracts references to `secrets.*` and `env.*` across workflows, producing a consolidated table for audit purposes.

Workflow YAML parsing is handled entirely in-process, with `parseTriggers()` supporting inline, list, and cron schedule formats along with branch filters. Docker-based operations for CakePHP 2.x projects are defined as an extension point via `CakephpDockerSource`, though the implementation currently returns a stub response.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
