# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter describes the technology stack and operational aspects of sdd-forge, a CLI tool built entirely in JavaScript (ES modules) on Node.js 18 or later with zero external dependencies. It covers the project's runtime environment, dependency policy, release procedure via npm, and the documentation generation pipeline that forms the core operational workflow.

<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version / Details |
|---|---|---|
| Language | JavaScript (ES modules) | `"type": "module"` in package.json |
| Runtime | Node.js | >= 18.0.0 |
| Package Manager | npm | Standard Node.js toolchain |
| External Dependencies | None | Node.js built-in modules only |
| Distribution | npmjs.com | Public package `sdd-forge` |
| Version Control | Git | Commit-count-based alpha versioning (`0.1.0-alpha.N`) |
| Template Engine | Custom directive system | `{{data}}`, `{{text}}`, `{%block%}`, `{%extends%}` |
| AI Integration | Claude CLI / Codex | Invoked via `child_process.spawn()` |
| CI/CD Analysis | GitHub Actions parser | Regex-based YAML parser (`src/presets/ci/scan/workflows.js`) |
| Edge Runtime Analysis | Cloudflare Workers parser | wrangler.toml / wrangler.json support (`src/presets/edge/data/runtime.js`) |
| Asset Analysis | CakePHP 2.x asset parser | JS/CSS library detection with 8 known patterns (`src/presets/cakephp2/scan/assets.js`) |
| Testing | Custom test runner | `tests/run.js` with unit, e2e, and acceptance scopes |

<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict zero-external-dependency policy. The project relies exclusively on Node.js built-in modules such as `fs`, `path`, `child_process`, and `crypto`. No third-party packages are listed in `package.json` under `dependencies` or `devDependencies`.

This design choice ensures that the tool has no supply-chain risk from external packages and remains lightweight for distribution. Functionality that would typically require external libraries — such as YAML parsing for GitHub Actions workflows (`src/presets/ci/scan/workflows.js`) and TOML parsing for Cloudflare Workers configuration (`src/presets/edge/data/runtime.js`) — is implemented internally using regex-based or custom parsers.

The `files` field in `package.json` restricts the published package to `src/` (excluding preset test directories), along with `package.json`, `README.md`, and `LICENSE`.

<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

sdd-forge is published to npmjs.com as a public package. There is no automated CI/CD pipeline; all releases are performed manually by the maintainer. The versioning scheme during the current alpha period follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained via `git rev-list --count HEAD`.

The release procedure consists of the following steps:

1. **Pre-publish verification** — Run `npm pack --dry-run` to confirm that only intended files (`src/`, `package.json`, `README.md`, `LICENSE`) are included and no sensitive information is present.
2. **Publish with alpha tag** — Execute `npm publish --tag alpha` to upload the package to the npm registry under the `alpha` dist-tag.
3. **Update latest tag** — Execute `npm dist-tag add sdd-forge@<version> latest` to point the `latest` tag to the new version. Without this step, the npmjs.com package page will not reflect the update.

Note that npm does not allow version number reuse — once a version is published, the same version string cannot be republished even after an `unpublish`, for at least 24 hours.

<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

The core operational workflow of sdd-forge is its documentation generation pipeline, which processes source code through a series of sequential stages:

```
scan → enrich → init → data → text → readme → agents
```

- **scan** — Analyzes the project's source code and produces `analysis.json` in `.sdd-forge/output/`.
- **enrich** — Sends the analysis to an AI agent, which assigns roles, summaries, and chapter classifications to each entry.
- **init** — Scaffolds chapter Markdown files from preset templates, creating the document structure.
- **data** — Resolves `{{data}}` directives by invoking DataSource classes that generate structured tables from analysis data.
- **text** — Fills `{{text}}` directives with AI-generated prose. Supports two modes: light (derived from enriched analysis) and deep (re-reads source for detailed descriptions).
- **readme** — Assembles the final documentation output.
- **agents** — Generates or updates `AGENTS.md` to provide AI agent context for the project.

For incremental updates, the pipeline detects changed files via `git diff`, re-scans only affected entries, re-enriches them, and regenerates only the impacted chapters. The `sdd-forge build` command runs the full pipeline, while individual stages can be executed independently. An optional `translate` step can produce localized versions of the generated documentation.

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
