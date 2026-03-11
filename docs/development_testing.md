# 05. Development, Testing & Distribution

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover local development environment setup, testing strategy, and release flow.}} -->

This chapter covers everything you need to work on sdd-forge itself — from cloning the repository and wiring up a local development environment, to running the built-in test suite, and publishing a new version to the npm registry.

<!-- {{/text}} -->

## Contents

### Local Development Environment Setup

```bash
git clone <repository>
cd <project>
npm link          # Register as a global command
<command> help    # Verify it works
```

<!-- {{text: Explain how to run the tool itself during development and how changes are reflected immediately.}} -->

Because sdd-forge is a pure Node.js CLI with no build step, changes to any file under `src/` take effect the next time you invoke the command — no compilation or restart is needed. Running `npm link` once registers the `sdd-forge` binary globally, so you can test commands directly from any directory just as end users would. The binary entry point is `src/sdd-forge.js`, which is loaded via the `bin` field in `package.json`. To verify your environment is wired up correctly, run `sdd-forge help` and confirm the command list is displayed without errors.

<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text: Explain branch management (roles of main/development, squash merge policy) and the commit message format.}} -->

The `main` branch always reflects the latest published state. Feature work and bug fixes are developed on short-lived feature branches, then integrated into `main` via **squash merge** (`flow.merge: "squash"` in `.sdd-forge/config.json`). Squash merging keeps the commit history on `main` linear and readable, with one commit per logical change. Commit messages are written in **English**. Do not add `Signed-off-by` trailers or `Co-authored-by` lines. Aim for a concise imperative subject line (e.g., `Add enrich command to build pipeline`) that describes the intent of the change rather than the mechanical details.

<!-- {{/text}} -->

### SDD Workflow

| Command | Description |
| --- | --- |
| `sdd-forge spec --title "..."` | Initialize spec |
| `sdd-forge gate --spec ...` | Spec gate check |
| `sdd-forge forge --prompt "..."` | Iterative docs improvement |
| `sdd-forge review` | Docs review |

### Testing

<!-- {{text[mode=deep]: Explain the testing strategy, frameworks used, and how to run tests. Include fixture structure as well.}} -->

sdd-forge uses the **Node.js built-in test runner** (`node:test`) — no third-party test framework is installed. This is consistent with the project's zero-external-dependency policy.

**Running the test suite:**

```bash
npm run test
# Expands to: find tests -name '*.test.js' | xargs node --test
```

All 44 test files live under the `tests/` directory and mirror the `src/` structure:

| Directory | Coverage area |
| --- | --- |
| `tests/dispatchers.test.js` | Top-level command routing |
| `tests/docs/commands/` | Individual docs subcommands (scan, init, data, text, forge, review, …) |
| `tests/docs/lib/` | Shared library modules (directive-parser, scanner, resolver-factory, …) |
| `tests/lib/` | Core utilities (cli, config, agent, i18n, projects, types, …) |
| `tests/presets/` | Framework-specific analyzers (Laravel, Symfony) |
| `tests/specs/commands/` | spec `init` and `gate` commands |

**Test helpers** (`tests/helpers/`) provide `mock-project.js` for setting up in-memory project fixtures and `tmp-dir.js` for creating isolated temporary directories.

**Important policy:** tests exist to verify that scripts behave correctly. If a test fails, investigate whether the test scenario itself is valid first; if it is, fix the production code — never adjust a test just to make it pass.

<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text: Explain the release procedure from squash merging development → main through to npm publish.}} -->

Once a feature branch has been reviewed and approved, it is squash-merged into `main`. After merging, bump the version in `package.json` using `npm version patch|minor|major`, which also creates a Git tag automatically.

Publishing to the npm registry is a **two-step process** for pre-release versions:

```bash
npm publish --tag alpha           # Publish under the "alpha" dist-tag
npm dist-tag add sdd-forge@<version> latest   # Promote to "latest"
```

The first command publishes the package without updating the `latest` tag on npmjs.com. The second command explicitly moves `latest` to the new version so that the package page and `npm install sdd-forge` reflect the release. **Never skip the second step** — omitting it leaves the npmjs.com page showing a stale version.

Before publishing, always run `npm pack --dry-run` to confirm that no sensitive files (`.env`, credentials, etc.) are included in the tarball. Note that npm does not allow re-publishing the same version number once it has been released.

<!-- {{/text}} -->

### Tech Stack and Dependencies

<!-- {{text: Explain the language used, runtime version requirements, and npm dependency policy (e.g., zero dependencies).}} -->

sdd-forge is written entirely in **JavaScript (ES Modules)** with `"type": "module"` in `package.json`. The minimum supported runtime is **Node.js 18.0.0**, which provides all built-in APIs the project relies on — `fs`, `path`, `child_process`, `os`, `crypto`, and `node:test`.

The project maintains a **strict zero-external-dependencies policy**: the `dependencies` field in `package.json` is empty. This makes installation instant, eliminates supply-chain risk, and keeps the published package self-contained. If a new capability is needed, the first choice is always a Node.js built-in; adding a third-party package requires explicit justification and is considered a last resort.

<!-- {{/text}} -->
