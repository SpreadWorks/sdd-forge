# Feature Specification: 080-guardrail-draft-design-impl-expansion

**Feature Branch**: `feature/080-guardrail-draft-design-impl-expansion`
**Created**: 2026-03-20
**Status**: Draft
**Input**: GitHub Issue #3

## Goal

Expand the guardrail system across three areas:
1. Inject guardrail into the draft phase via a new `guardrail show` command that merges preset chain + project guardrail and filters by phase
2. Add design-oriented guardrail article templates in a new `web-design` preset under a `principle` grouping
3. Extend guardrail to the implementation phase via the same `guardrail show` command + SKILL.md integration

## Scope

### 1. `guardrail show` command
- New subcommand: `sdd-forge spec guardrail show --phase <draft|spec|impl|lint>`
- Merges guardrail articles from preset chain (base → arch → leaf) AND `.sdd-forge/guardrail.md` (project-specific)
- Filters merged articles by `filterByPhase`
- Outputs matching articles to stdout in markdown format
- No file / no articles → empty output (no error)

### 2. `phase: ["draft"]` support
- Add "draft" as a valid phase value in `filterByPhase`
- Add draft-phase articles to base preset:
  - "When requirements exceed 3 items, specify priority order"
  - "List impact on existing features"
- These articles use `{%meta: {phase: [draft, spec]}%}`

### 3. Existing preset guardrail.md phase metadata
- Add explicit `<!-- {%meta: {phase: [...]}%} -->` to all existing articles across all presets (base, webapp, cli, node-cli, library, cakephp2, laravel, symfony) in both en/ and ja/
- Assign phases based on each article's nature (e.g. "No Hardcoded Secrets" → [draft, spec, impl])

### 4. `web-design` preset (principle/web-design)
- New preset: `src/presets/web-design/` with `parent: "webapp"`
- 7 design articles in `templates/{en,ja}/guardrail.md`:
  1. Generic Font Prohibition
  2. Color System Required (CSS variable color management)
  3. Animation Method Constraint (CSS animation preferred)
  4. No Inline Styles in Components
  5. Responsive Breakpoints Must Use Design Tokens
  6. Accessibility Minimum for Interactive Elements
  7. Image Format and Optimization Required
- NOTICE file for items 1-3 (inspired by Anthropic frontend-design plugin, Apache 2.0)

### 5. SKILL.md integration
- flow-plan SKILL.md: Add `sdd-forge spec guardrail show --phase draft` call in step 4 (draft phase)
- flow-impl SKILL.md: Add `sdd-forge spec guardrail show --phase impl` call at implementation start

### 6. gate.js refactor
- Refactor guardrail loading logic in `gate.js` to reuse the same merge+filter pipeline as `guardrail show`
- Eliminate duplicate guardrail loading code

## Out of Scope

- scope/severity metadata (deprecated)
- Guardrail auto-update via AI (existing `guardrail update` command unchanged)
- `--yes` auto-approve mode for flow
- New lint patterns for design articles

## Clarifications (Q&A)

- Q: Where to place design articles?
  - A: New `web-design` preset (parent: webapp), under `principle` grouping
- Q: How to inject guardrail into draft/impl phases?
  - A: Via `guardrail show` command — each SKILL.md calls the command, not hardcoded logic
- Q: What about AI attention dilution (Issue #3, direction 4)?
  - A: Phase filtering itself is the mitigation — only relevant articles are shown per phase
- Q: scope/severity metadata (Issue #3, direction 3)?
  - A: Deprecated, skipped

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-20
- Notes: User approved all 6 requirements

## Requirements

1. Implement `sdd-forge spec guardrail show --phase <phase>` command with preset chain + project guardrail merge and phase filtering
2. Add "draft" phase support to `filterByPhase` and add draft-phase articles to base preset (en/ja)
3. Add explicit phase metadata to all existing preset guardrail articles (base, webapp, cli, node-cli, library, cakephp2, laravel, symfony, en/ja)
4. Create `web-design` preset with 7 design articles (en/ja) and NOTICE file
5. Add guardrail show calls to flow-plan SKILL.md (draft phase) and flow-impl SKILL.md (impl phase)
6. Refactor gate.js to share guardrail loading pipeline with guardrail show

## Acceptance Criteria

1. `sdd-forge spec guardrail show --phase draft` outputs only draft-phase articles from merged preset chain + project guardrail
2. `sdd-forge spec guardrail show --phase spec` outputs same results as current gate behavior
3. `sdd-forge spec guardrail show --phase impl` outputs implementation-phase articles
4. Articles without metadata default to `phase: ["spec"]` (backward compatible)
5. Empty output (no error) when no guardrail files exist or no articles match
6. All existing preset guardrail articles have explicit phase metadata
7. `web-design` preset is discoverable via `sdd-forge presets` and inherits from webapp
8. gate.js uses shared pipeline — no duplicate guardrail loading logic
9. All existing tests pass; new tests cover guardrail show command

## Open Questions
- (none)
