# Project Guardrail

Immutable project principles. Each article defines a rule that all specs must comply with.

### Single Responsibility
Each spec shall address one concern. Do not bundle unrelated changes into a single specification.

### Unambiguous Requirements
Requirements shall avoid vague adjectives (e.g. "appropriate", "fast", "easy") and instead state verifiable conditions.

### Complete Context
Each requirement shall pair a trigger condition (When / If) with an expected behavior (shall). Requirements without context or expected outcome are incomplete.

### No Hardcoded Secrets
Source code shall not contain API keys, passwords, tokens, or other secrets directly. Externalize them via environment variables or configuration files.

### No Silent Error Swallowing
Empty catch blocks or code that silently discards errors are prohibited. Errors shall be logged or re-thrown.
