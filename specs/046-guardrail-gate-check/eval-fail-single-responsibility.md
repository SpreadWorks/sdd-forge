# Evaluation Spec: Violates Single Responsibility (should FAIL)

## Goal
Add a new CLI subcommand for exporting analysis data to CSV, and also refactor the config loader to use YAML instead of JSON, and update the i18n system to support plural forms.

## Scope
- New `export` subcommand with CSV output
- Config loader YAML migration
- i18n plural support

## Out of Scope
- GUI interface

## Clarifications (Q&A)
- Q: Are all three changes related?
  - A: No, they are independent features being bundled for convenience.

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-13
- Notes: Evaluation spec

## Requirements
- R1: When the user runs `sdd-forge export --format csv`, the system shall generate a CSV file from analysis.json.
- R2: When the config loader reads a config file, it shall accept YAML format in addition to JSON.
- R3: When an i18n key contains plural forms, the system shall select the correct form based on count.

## Acceptance Criteria
- [ ] `export --format csv` produces valid CSV output
- [ ] Config loader parses both JSON and YAML
- [ ] i18n handles plural forms correctly

## Open Questions
None.
