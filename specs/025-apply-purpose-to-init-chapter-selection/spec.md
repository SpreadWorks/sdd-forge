# Feature Specification: 025-apply-purpose-to-init-chapter-selection

**Feature Branch**: `feature/025-apply-purpose-to-init-chapter-selection`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User request

## Goal
- Make chapter selection in `sdd-forge init` aware of `documentStyle.purpose` so generated docs better match target readers.
- Reduce mismatched output (e.g., maintainer-centric chapters appearing in user/reference-focused docs).

## Scope
- Add purpose-aware filtering logic to init chapter selection flow.
- Keep existing analysis-based and AI-based selection behavior, but make AI chapter selection explicitly purpose-aware.
- Add or update tests for purpose-aware chapter selection.

## Out of Scope
- Redesigning all existing preset templates.
- Changing setup questionnaire UX.
- Reworking text generation prompts beyond what is required for chapter selection behavior.

## Clarifications (Q&A)
- Q: Where should purpose be enforced first?
  - A: In AI chapter selection during `init`, by injecting purpose into the chapter-selection prompt.
- Q: Should this replace analysis-based filtering?
  - A: No. Purpose-based filtering should complement existing analysis-based filtering.
- Q: Should `chapters.json` be extended for purpose rules?
  - A: No. This spec avoids static purpose rules and uses AI chapter assembly logic.

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-07
- Notes: Approved by user (option 1: implement)

## Requirements
- `init` must read `documentStyle.purpose` from config and use it during chapter selection.
- Purpose must be explicitly provided to AI chapter selection prompt, together with analysis summary and available chapter list.
- Existing deterministic `requires`-based filtering remains as-is (no purpose schema changes in `chapters.json`).
- If no purpose is configured, behavior must remain backward-compatible.
- Tests must cover at least:
  - purpose configured -> prompt contains purpose context and selection changes are applied from AI response
  - no purpose configured -> backward-compatible behavior
  - unknown purpose value -> safe fallback behavior

## Acceptance Criteria
- Running `sdd-forge init` with `documentStyle.purpose: "user-guide"` passes purpose context to AI chapter selection and produces purpose-aligned chapter set.
- Running `sdd-forge init` with `documentStyle.purpose: "developer-guide"` passes developer-oriented purpose context and can produce different chapter selection.
- Existing deterministic `requires` filtering remains unchanged.
- Relevant tests pass (`npm run test` or targeted init tests validating purpose-aware AI chapter selection).

## Open Questions
- [x] Should purpose be controlled via static `chapters.json` schema?
  - Decision: No. Use AI chapter selection with purpose-aware prompt instead.
