# Project Guardrail

Immutable project principles. Each article defines a rule that all specs must comply with.

### Single Responsibility
<!-- {%meta: {phase: [draft, spec]}%} -->
Each spec shall address one concern. Do not bundle unrelated changes into a single specification.

### Unambiguous Requirements
<!-- {%meta: {phase: [draft, spec]}%} -->
Requirements shall avoid vague adjectives (e.g. "appropriate", "fast", "easy") and instead state verifiable conditions.

### Complete Context
<!-- {%meta: {phase: [draft, spec]}%} -->
Each requirement shall pair a trigger condition (When / If) with an expected behavior (shall). Requirements without context or expected outcome are incomplete.

### No Hardcoded Secrets
<!-- {%meta: {phase: [draft, spec, impl]}%} -->
Source code shall not contain API keys, passwords, tokens, or other secrets directly. Externalize them via environment variables or configuration files.

### No Silent Error Swallowing
<!-- {%meta: {phase: [spec, impl]}%} -->
Empty catch blocks or code that silently discards errors are prohibited. Errors shall be logged or re-thrown.

### Prioritize Requirements
<!-- {%meta: {phase: [draft, spec]}%} -->
When requirements exceed three items, specify their priority order. This prevents scope creep and ensures the most critical items are addressed first.

### Impact on Existing Features
<!-- {%meta: {phase: [draft, spec]}%} -->
Changes shall list their impact on existing features. If no existing features are affected, state so explicitly.
