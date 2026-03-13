# Feature Specification: 044-constitution

**Feature Branch**: `feature/044-constitution`
**Created**: 2026-03-13
**Status**: Draft
**Input**: Introduce guardrail (project principles) feature inspired by spec-kit's Constitution concept

## Goal
- Define immutable project principles in `.sdd-forge/guardrail.md` and validate spec compliance via AI in the gate command

## Scope
- `sdd-forge guardrail init` command to generate guardrail.md from preset templates
- `sdd-forge guardrail update` command to AI-propose project-specific principles from analysis.json
- Gate integration: AI-based spec vs guardrail compliance check (per-article pass/fail)
- Gate warning when guardrail.md is absent
- Preset templates: base (universal) + stack-specific (node-cli, laravel, etc.)
- Command routing via `spec.js` dispatcher

## Out of Scope
- Guardrail enforcement during docs generation (build/data/text)
- Automatic guardrail creation during setup (separate future work)
- Post-implementation guardrail checks (gate --phase post)

## Clarifications (Q&A)
- Q: Where is guardrail.md stored?
  - A: `.sdd-forge/guardrail.md`
- Q: What format do articles use?
  - A: `###` headings + description paragraphs, no ID numbering
- Q: How does gate check guardrail compliance?
  - A: AI receives spec full text + guardrail articles, judges each article pass/fail autonomously
- Q: What if guardrail.md doesn't exist?
  - A: Gate outputs WARN with suggestion to run `sdd-forge guardrail init`
- Q: How are preset templates merged?
  - A: base template + stack-specific template merged at init time (same as existing template-merger pattern)

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-13
- Notes: Approved as-is

## Requirements

### R1: `guardrail init` command
- Route: `sdd-forge guardrail init` → `spec.js` → `specs/commands/guardrail.js`
- Load base preset template from `src/presets/base/templates/{lang}/guardrail.md`
- Load stack-specific preset template (if exists) from `src/presets/{preset}/templates/{lang}/guardrail.md`
- Merge templates (base + stack) into `.sdd-forge/guardrail.md`
- Options: `--dry-run`, `--force` (overwrite existing)
- Error if guardrail.md already exists (without --force)

### R2: `guardrail update` command
- Route: `sdd-forge guardrail update` → `spec.js` → `specs/commands/guardrail.js`
- Load existing `.sdd-forge/guardrail.md`
- Load analysis.json
- AI analyzes project structure and proposes additional project-specific principles
- Append AI-proposed articles to guardrail.md (preserving existing articles)
- Options: `--dry-run`, `--agent`
- Error if guardrail.md does not exist (suggest running init first)

### R3: Gate integration
- In `gate.js`, check for `.sdd-forge/guardrail.md` existence
- If absent: output i18n WARN message with suggestion to run `guardrail init`
- If present: load guardrail.md, parse `###` articles, send spec + articles to AI
- AI judges each article: pass or fail with reason
- Any fail → gate FAIL (same as other gate failures)
- Requires agent config (defaultAgent or --agent); skip AI check with WARN if no agent

### R4: Guardrail article format
- Articles are `###` headings followed by description paragraphs
- Parser extracts all `###` headings and their body text until the next `###` or EOF
- No ID numbering; articles are referenced by heading text

### R5: Preset templates
- `src/presets/base/templates/{lang}/guardrail.md` — universal principles template
- Stack-specific presets can optionally provide `templates/{lang}/guardrail.md`
- Template content is plain Markdown (no directives needed)

### R6: Command routing
- Add `guardrail` to `spec.js` dispatcher (alongside `spec` and `gate`)
- Add `guardrail` to `sdd-forge.js` top-level router → `spec` dispatcher

### R7: i18n
- Add gate warning messages to `locale/{en,ja}/messages.json`
- Add help text to `locale/{en,ja}/ui.json`

## Acceptance Criteria
- [ ] `sdd-forge guardrail init` creates `.sdd-forge/guardrail.md` from preset templates
- [ ] `sdd-forge guardrail init` fails without `--force` when guardrail.md exists
- [ ] `sdd-forge guardrail update` appends AI-proposed articles to existing guardrail.md
- [ ] `sdd-forge gate --spec ...` warns when guardrail.md is absent
- [ ] `sdd-forge gate --spec ...` performs AI compliance check when guardrail.md exists
- [ ] Gate fails when spec violates a guardrail article
- [ ] Gate passes when spec complies with all guardrail articles
- [ ] `sdd-forge guardrail init --dry-run` outputs without writing
- [ ] `sdd-forge help` lists guardrail command

## Open Questions
- (none)
