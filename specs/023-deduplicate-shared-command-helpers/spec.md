# Feature Specification: 023-deduplicate-shared-command-helpers

**Feature Branch**: `feature/023-deduplicate-shared-command-helpers`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User request

## Goal
- Remove clear duplicate helper logic in command code paths while preserving current behavior.
- Reduce maintenance overhead by consolidating identical utility implementations.

## Scope
- Replace local `loadSddTemplate()` in `src/docs/commands/upgrade.js` with import from `src/lib/agents-md.js`.
- Replace local `resolveAgent()` in `src/docs/commands/forge.js` with `resolveAgent()` from `src/lib/agent.js`.
- Replace hardcoded `.sdd-forge` path composition in `src/lib/flow-state.js` with `sddDir()` from `src/lib/config.js`.
- Keep command behavior and CLI interface unchanged.

## Out of Scope
- Chapter file discovery utility extraction (`B5`).
- summary/analysis fallback utility extraction (`B6`).
- slug/title normalization policy changes (`B3`) and other architectural refactors.

## Clarifications (Q&A)
- Q: Which refactors are included in this spec?
  - A: Only low-risk, behavior-preserving deduplication items B1/B2/B4 are included.
- Q: Should behavior changes be accepted as part of this work?
  - A: No. Any behavioral drift is out of scope; this is a structural cleanup only.

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-07
- Notes: Approved by user (option 1: implement)

## Requirements
- `upgrade` command must load SDD template via shared helper (`src/lib/agents-md.js`) without duplicate local implementation.
- `forge` command must use shared `resolveAgent(cfg, agentName)` from `src/lib/agent.js`.
- `flow-state` must build state path using shared `sddDir(workRoot)` helper.
- Existing tests must pass; if coverage is missing for modified paths, add focused tests.

## Acceptance Criteria
- There is no duplicated `loadSddTemplate()` implementation in `upgrade.js`.
- There is no local `resolveAgent()` implementation in `forge.js`; shared helper is used.
- `flow-state` no longer hardcodes `.sdd-forge` path segments.
- `npm run test` passes on the feature branch.
- Manual sanity check confirms `sdd-forge gate`, `sdd-forge forge --help`, and `sdd-forge upgrade --dry-run` still execute without regression.

## Open Questions
- [x] Should B5/B6 be handled in a follow-up spec after this low-risk cleanup lands?
  - Decision: Yes. Handle B5/B6 in a separate follow-up spec.
