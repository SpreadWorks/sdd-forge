<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

sdd-forge is a command-line tool written in JavaScript (ES Modules) running on Node.js 18 or later, with no external npm dependencies — every component is built on Node.js standard library modules. The package is managed with pnpm 10.33.0 and published to the npm registry under the `sdd-forge` package name.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Language | JavaScript (ES Modules) | — |
| Package manager | pnpm | 10.33.0 |
| Test runner | Node.js built-in `node:test` | (bundled with Node 18+) |
| Source control integration | Git CLI | system |
| GitHub integration | GitHub CLI (`gh`) | system |
| AI integration | Claude CLI (subprocess) | system |
| External npm dependencies | — | none |

All parsers (JavaScript/TypeScript, PHP, Python, YAML, TOML, PHP array syntax) and the JSON repair utility are implemented in-house as part of the `src/` directory.
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

The project enforces a strict zero-external-dependency policy: `package.json` declares no `dependencies` or `devDependencies` entries, and the pnpm lock file contains only the importers section with no resolved packages. All functionality relies exclusively on Node.js built-in modules (`fs`, `path`, `child_process`, `url`, and others).

pnpm 10.33.0 is pinned via the `packageManager` field in `package.json` (including a SHA-512 integrity hash) to guarantee reproducible installs across environments. Dependabot is configured with a weekly schedule to monitor both npm and Composer ecosystems for any future dependency additions.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases are published to the npm registry as the `sdd-forge` package. The publishing process follows a two-step procedure to ensure the `latest` dist-tag is updated correctly:

1. Run `npm pack --dry-run` to verify the contents of the tarball and confirm no sensitive files are included.
2. Execute `npm publish --tag alpha` to push the new version with the `alpha` tag.
3. Execute `npm dist-tag add sdd-forge@<version> latest` to promote the release to the `latest` tag, making it visible on the npmjs.com package page.

The version number follows the format `0.1.0-alpha.N`, where `N` is the total commit count obtained from `git rev-list --count HEAD`. Once a version is published it cannot be reused; unpublished versions remain blocked for 24 hours.

Only the `src/` directory is included in the published package, together with `package.json`, `README.md`, and `LICENSE`. Preset-specific test directories (`src/presets/*/tests/`) are excluded via the `files` field.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

**Initial setup**
Run `sdd-forge setup` in the target project root. The interactive wizard generates `.sdd-forge/config.json` with the project type (preset), language, and AI agent settings.

**Documentation generation**
Execute `npm run docs:build` (or the equivalent `sdd-forge` pipeline commands) to run the full pipeline: `scan → enrich → init → data → text → readme → agents`. Each stage writes intermediate output to `.sdd-forge/output/`. Run `sdd-forge docs review` afterward to check documentation quality.

**Keeping documentation in sync**
When templates or preset files under `src/templates/` or `src/presets/` are modified, run `sdd-forge upgrade` to propagate the changes to the project's skill files (`.claude/skills/`, `.agents/skills/`) and configuration.

**Running tests**
- `npm test` — full suite (unit + e2e + acceptance)
- `npm run test:unit` — unit tests only
- `npm run test:e2e` — end-to-end tests only
- `npm run test:acceptance` — acceptance tests only

Test output should be redirected to a file (`command > /tmp/output.log 2>&1`) and inspected with `grep` or `Read` rather than re-running the command.

**SDD workflow**
Use `sdd-forge flow start` to begin a specification phase, `sdd-forge flow status` to check progress, and `sdd-forge flow merge` after implementation is complete. Flow state is persisted to disk so that context resets do not lose progress.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
