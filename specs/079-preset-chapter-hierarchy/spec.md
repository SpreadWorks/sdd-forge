# Feature Specification: 079-preset-chapter-hierarchy

**Feature Branch**: `feature/079-preset-chapter-hierarchy`
**Created**: 2026-03-20
**Status**: Draft
**Input**: GitHub Issue #2

## Goal
Parent-child preset templates (api → rest, api → graphql) should use `@extends` + `@block` for shared chapters (`api_overview.md`, `authentication.md`) so that child presets can override specific blocks with framework-specific content, maintaining a unified chapter structure.

## Scope
- `rest` preset: add `api_overview.md` and `authentication.md` templates that `@extends` the parent `api` templates
- `graphql` preset: add `api_overview.md` and `authentication.md` templates that `@extends` the parent `api` templates
- Add `@block` markers to `api` parent templates where child customization is needed
- Both `en` and `ja` language templates

## Out of Scope
- Other parent-child preset pairs (webapp→cakephp2 etc. already use `@extends`)
- Changes to template-merger.js or directive-parser.js
- Changes to preset.json chapter lists (already correct)

## Rationale
The `@extends` + `@block` pattern is already used extensively (e.g., cakephp2 extends webapp's `stack_and_ops.md`). The api/rest/graphql presets were created without this pattern, making child presets unable to customize shared chapters. This fix aligns them with the established convention.

## Clarifications (Q&A)
- Q: Should `api_overview.md` title change in children?
  - A: No. The title stays `# API Overview` (inherited from parent). Children override content blocks within it, not the title. REST-specific and GraphQL-specific content goes into their own chapters (`endpoints.md`, `schema.md`).

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-20
- Notes: Proceed to implementation

## Requirements
1. `api/templates/en/api_overview.md`: wrap Description section in a `@block: description` so children can override
2. `api/templates/en/authentication.md`: wrap Description section in a `@block: description` so children can override
3. `rest/templates/en/api_overview.md`: create with `<!-- @extends -->` overriding `description` block with REST-specific prompt
4. `rest/templates/en/authentication.md`: create with `<!-- @extends -->` overriding `auth-flow` block with REST-specific prompt
5. `graphql/templates/en/api_overview.md`: create with `<!-- @extends -->` overriding `description` block with GraphQL-specific prompt
6. `graphql/templates/en/authentication.md`: create with `<!-- @extends -->` overriding `auth-flow` block with GraphQL-specific prompt
7. `ja` templates: mirror the same `@extends` structure for all of the above
8. `api/templates/ja/*`: add same `@block` markers as `en` templates

## Acceptance Criteria
- `rest` and `graphql` presets inherit `api_overview.md` and `authentication.md` structure from `api` parent
- Child presets can override specific blocks with framework-specific content
- Existing `@block` markers in `api` templates (`versioning`, `errors`, `auth-flow`, `authorization`) remain functional
- `en` and `ja` templates are consistent

## Open Questions
- (none)
