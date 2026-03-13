# Project Guardrail

Immutable project principles. Each article defines a rule that all specs must comply with.

### Single Responsibility
Each spec should address one concern. Avoid bundling unrelated changes into a single specification.

### No Breaking Changes Without Migration
Any change that breaks existing interfaces must include a migration path or deprecation plan.

### Test Coverage Required
All new functionality must have corresponding test cases defined in the spec's acceptance criteria.
