# Evaluation Spec: Compliant (should PASS)

## Goal
When a user runs `sdd-forge guardrail init`, the system shall create `.sdd-forge/guardrail.md` from the base preset template.

## Scope
- `guardrail init` subcommand

## Out of Scope
- `guardrail update` subcommand
- Stack-specific preset templates

## Clarifications (Q&A)
- Q: When the user runs `guardrail init` and guardrail.md already exists, what shall happen?
  - A: The command shall exit with a non-zero status code and display an error message indicating the file already exists.

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-13
- Notes: Evaluation spec

## Requirements
- R1: When the user runs `sdd-forge guardrail init`, the system shall create `.sdd-forge/guardrail.md` containing the base template content.
- R2: When guardrail.md already exists and `--force` is not specified, the command shall exit with error code 1.
- R3: When `--dry-run` is specified, the system shall print the template content to stdout without writing a file.

## Acceptance Criteria
- [ ] `guardrail init` creates guardrail.md with base template content
- [ ] Without `--force`, existing guardrail.md causes exit code 1
- [ ] `--dry-run` prints to stdout without file creation

## Open Questions
None.
