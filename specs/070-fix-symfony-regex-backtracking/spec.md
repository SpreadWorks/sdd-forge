# Feature Specification: fix-symfony-regex-backtracking

**Feature Branch**: `feature/070-fix-symfony-regex-backtracking`
**Created**: 2026-03-18
**Status**: Draft
**Input**: Fix catastrophic backtracking in symfony scan regex when PHP Route attributes contain curly braces

## Goal

Fix the `methodBlockRegex` in Symfony preset scanners that causes catastrophic backtracking (infinite hang) when PHP 8 Route attributes contain `{paramName}` path parameters.

## Scope

- Fix regex in `src/presets/symfony/scan/controllers.js` (L46)
- Fix identical regex in `src/presets/symfony/scan/routes.js` (L172)
- Add unit test to prevent regression
- Restore the symfony acceptance test fixture (`PostController.php`) to use the original `{threadId}` pattern

## Out of Scope

- Other regex in the symfony scanners (e.g. `routeAttrRegex` — not affected)
- Changes to other preset scanners
- Changes to the acceptance test infrastructure

## Clarifications (Q&A)

- Q: Why does the old regex backtrack?
  - A: The pattern `(?:[^\[\]]*(?:\[[^\[\]]*\])?)*` has nested quantifiers where `[^\[\]]*` can match empty. When the regex engine fails to find a match through `]`, it tries exponential combinations of splitting the input across iterations of the outer `*`.

- Q: Does the new regex still handle nested brackets like `methods: ['GET']`?
  - A: Yes. The alternation `(?:[^\[\]]|\[[^\]]*\])` handles: (1) single non-bracket chars, (2) complete `[...]` groups. Verified with test cases.

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-18
- Notes: Approach 1 (simplify regex) selected by user

## Requirements

1. Replace `methodBlockRegex` in `controllers.js` with backtrack-safe version
2. Replace `methodBlockRegex` in `routes.js` with identical backtrack-safe version
3. New regex must handle: simple attributes, `{}` in paths, nested `[]` (methods array), multiple stacked attributes
4. Add regression test that verifies no hang on `{paramName}` patterns
5. Restore `PostController.php` fixture to original `{threadId}` pattern

## Acceptance Criteria

- [ ] `sdd-forge scan` completes on symfony fixture with `#[Route('/threads/{threadId}/posts')]` without hanging
- [ ] Unit test covers: simple Route, Route with `{}`, Route with nested `[]`, multiple attributes, no attributes
- [ ] Existing symfony acceptance test still passes
- [ ] No changes to scan output (functional equivalence)

## Open Questions

(none)
