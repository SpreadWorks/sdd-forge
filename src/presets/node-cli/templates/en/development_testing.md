<!-- {{data: docs.langSwitcher("relative")}} -->
<!-- {{/data}} -->
# 05. Development, Testing, and Distribution

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow.}} -->
<!-- {{/text}} -->

## Content

### Local Development Setup

```bash
git clone <repository>
cd <project>
npm link          # Register as global command
<command> help    # Verify installation
```

<!-- {{text: Explain how to run the tool itself during development and how changes are immediately reflected.}} -->
<!-- {{/text}} -->

### Branch Strategy and Commit Conventions

<!-- {{text: Describe branch management (main/development roles, squash merge policy) and commit message format.}} -->
<!-- {{/text}} -->

### SDD Workflow

| Command | Description |
| --- | --- |
| `sdd-forge spec --title "..."` | Initialize spec |
| `sdd-forge gate --spec ...` | Spec gate check |
| `sdd-forge forge --prompt "..."` | Iterative docs improvement |
| `sdd-forge review` | Docs review |

### Testing

<!-- {{text[mode=deep]: Describe the testing strategy, framework used, and how to run tests. Include fixture structure.}} -->
<!-- {{/text}} -->

### Release Flow

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # Publish to npm registry
```

<!-- {{text: Describe the release procedure from squash merge into main to npm publish.}} -->
<!-- {{/text}} -->

### Technology Stack and Dependencies

<!-- {{text: Describe the programming language, runtime version requirements, and npm dependency policy (zero dependencies, etc.).}} -->
<!-- {{/text}} -->
