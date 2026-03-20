# Project Guardrail

Immutable project principles. Each article defines a rule that all specs must comply with.

<!-- {%guardrail {phase: [draft, spec]}%} -->
### Single Responsibility
Each spec shall address one concern. Do not bundle unrelated changes into a single specification.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [draft, spec]}%} -->
### Unambiguous Requirements
Requirements shall avoid vague adjectives (e.g. "appropriate", "fast", "easy") and instead state verifiable conditions.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [draft, spec]}%} -->
### Complete Context
Each requirement shall pair a trigger condition (When / If) with an expected behavior (shall). Requirements without context or expected outcome are incomplete.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [draft, spec, impl]}%} -->
### No Hardcoded Secrets
Source code shall not contain API keys, passwords, tokens, or other secrets directly. Externalize them via environment variables or configuration files.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### No Silent Error Swallowing
Empty catch blocks or code that silently discards errors are prohibited. Errors shall be logged or re-thrown.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [draft, spec]}%} -->
### Prioritize Requirements
When requirements exceed three items, specify their priority order. This prevents scope creep and ensures the most critical items are addressed first.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [draft, spec]}%} -->
### Impact on Existing Features
Changes shall list their impact on existing features. If no existing features are affected, state so explicitly.
<!-- {%/guardrail%} -->
