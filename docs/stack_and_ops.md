<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**English** | [日本語](ja/stack_and_ops.md)
<!-- {{/data}} -->

# Technology Stack and Operations

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## Description

<!-- {{text({prompt: "Write a 1-2 sentence overview of this chapter. Include the programming language, framework, and key tool versions."})}} -->

This chapter covers the technology stack, dependency management, and operational procedures for sdd-forge, a Node.js CLI tool built entirely on native modules without external dependencies. Key tooling includes Node.js (ES modules, `"type": "module"`), the npm registry for distribution, and a Git-based versioning scheme.
<!-- {{/text}} -->

## Content

### Technology Stack

<!-- {{text({prompt: "Describe the technology stack in table format with category, technology name, and version."})}} -->

| Category | Technology | Notes |
|---|---|---|
| Runtime | Node.js | ES modules (`"type": "module"`) |
| Language | JavaScript | No TypeScript compilation step |
| Package Manager | npm | Published as `sdd-forge` on npmjs.com |
| Version Control | Git | Commit count used for alpha version numbering |
| Dependencies | Node.js built-ins only | No third-party packages |
| Distribution | npm registry | Tagged releases (`alpha`, `latest`) |
<!-- {{/text}} -->

### Dependencies

<!-- {{text({prompt: "Describe the project's dependency management approach."})}} -->

sdd-forge enforces a strict zero-external-dependency policy. All functionality is implemented using Node.js built-in modules only; adding third-party packages is explicitly prohibited. The package is distributed via the npm registry under the name `sdd-forge`. The `files` field in `package.json` is set to `["src/"]`, ensuring only the `src/` directory, along with `package.json`, `README.md`, and `LICENSE`, is included in published packages.
<!-- {{/text}} -->

### Deployment Flow

<!-- {{text({prompt: "Describe the deployment procedure and flow."})}} -->

Releases follow a two-step npm publish flow to ensure the `latest` tag is updated correctly on the registry.

1. Run `npm pack --dry-run` to verify the contents of the package and confirm no sensitive files are included.
2. Publish the release with the alpha tag: `npm publish --tag alpha`.
3. Promote the version to `latest`: `npm dist-tag add sdd-forge@<version> latest`.

The version number follows the format `0.1.0-alpha.N`, where `N` is the total Git commit count obtained via `git rev-list --count HEAD`. Publishing is performed only when the user explicitly states a release intent; version bumps, commits, and pushes alone do not constitute a release instruction. Note that npm does not allow republishing a version once it has been unpublished within 24 hours.
<!-- {{/text}} -->

### Operations Flow

<!-- {{text({prompt: "Describe the operations procedures."})}} -->

Day-to-day operations centre on the following procedures.

- **Documentation rebuild**: Run `sdd-forge build` to regenerate the `docs/` knowledge base from the current source code. This should be run whenever source files are newer than the corresponding docs.
- **Template upgrades**: After modifying files under `src/templates/` or `src/presets/`, run `sdd-forge upgrade` to propagate changes to project skills (`.claude/skills/`, `.agents/skills/`) and configuration files. Only changed files are updated.
- **Task board management**: Use `node experimental/workflow/board.js` for tracking tasks. Supported operations include `search`, `add`, `list`, `show`, `update`, and `to-issue`.
- **Long-running commands**: Redirect output to a file (`command > /tmp/output.log 2>&1`) and inspect results with `grep` or the `Read` tool. Re-running commands solely to pipe output is discouraged to avoid unnecessary execution cost.
- **Commit conventions**: All commit messages must be written in English. Sign-off lines and co-authored-by trailers must not be included.
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← Tool Overview and Architecture](overview.md) | [Project Structure →](project_structure.md)
<!-- {{/data}} -->
