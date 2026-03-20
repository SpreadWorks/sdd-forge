# Code Review Results

### [x] 1. Reuse Shared `text` Directive Detection
**File:** `src/docs/commands/text.js`
**Issue:** The same `{{text ...}}` opening-tag regex is now duplicated in `stripFillContent()` and `countFilledInBatch()`. This spreads directive syntax knowledge across multiple call sites and makes future syntax changes easy to miss.
**Suggestion:** Restore a shared constant or helper from `src/docs/lib/directive-parser.js` such as `TEXT_OPEN_RE` or `isTextDirectiveStart(line)`, and use it in both places.

**Verdict:** APPROVED
**Reason:** The diff confirms `TEXT_OPEN_RE` was previously exported from `directive-parser.js` and used in `text.js`, but the revert replaced it with duplicated inline regex `/^<!--\s*\{\{text\s*(?:\[[^\]]*\])?\s*:/.test(...)` in both `stripFillContent()` and `countFilledInBatch()`. Re-exporting a shared constant centralizes directive syntax knowledge and prevents drift if the syntax changes again.

### [x] 2. Extract Repeated Directive Block Scanning
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `parseDirectives()` has near-identical loops for finding `{{/data}}` and `{{/text}}`, and `findHeaderFooter()` repeats the same nested scan pattern for `header` and `footer`. This increases maintenance cost and makes parser behavior harder to keep consistent.
**Suggestion:** Introduce small helpers like `findClosingLine(lines, start, closeRe, reopenRe)` and `findDelimitedSection(lines, start, end, openRe, closeRe)` to remove duplication and keep block-scanning behavior centralized.

**Verdict:** APPROVED
**Reason:** The reverted `directive-parser.js` shows near-identical closing-tag scan loops for `{{/data}}` (lines ~130-140) and `{{/text}}` (lines ~155-165), and `findHeaderFooter()` repeats nested scan patterns for header and footer. The previous version had a `findClosingTag()` helper that was removed in this revert. Restoring such helpers reduces maintenance cost with minimal risk.

### [x] 3. Remove or Integrate Unused GitHub CLI Availability Logic
**File:** `src/flow/commands/merge.js`
**Issue:** `isGhAvailable()` is added but never used. In the same change, `commands.gh` is added to config typing/validation but is not consumed either. That leaves dead code and an unused configuration surface.
**Suggestion:** Either delete `isGhAvailable()` and the unused `commands.gh` config for now, or wire both into the `--pr` path so PR creation capability is checked consistently before invoking `gh`.

**Verdict:** APPROVED
**Reason:** The diff adds `isGhAvailable()` to `merge.js` but it is never called — the `--pr` path directly invokes `gh pr create` without checking availability first. Similarly, `commands.gh` is added to `types.js` validation but never consumed. This is dead code and an unused config surface. Either wire it in or remove it.

### [x] 4. Unify Guardrail Article Serialization
**File:** `src/spec/commands/guardrail.js`
**Issue:** `serializeArticle()` and the inline formatter inside `runShow()` both build article output, but they do it differently. One supports `phase/scope/lint`, while the other only emits `phase`, creating inconsistent formatting rules in one module.
**Suggestion:** Extract a single formatter, for example `formatArticle(article, { includeMeta: true })`, and reuse it from both `serializeArticle()` and `runShow()`.

**Verdict:** APPROVED
**Reason:** The diff shows `serializeArticle()` (line ~196) outputs `phase`, `scope`, and `lint` fields, while the inline formatter in `runShow()` (line ~298) only emits `phase`. This creates inconsistent output for the same articles depending on the code path. A shared formatter eliminates this discrepancy and is low-risk since both functions are in the same module.

### [ ] 5. Centralize Directive Syntax Examples/Docs
**File:** `src/docs/commands/translate.js`
**Issue:** Human-facing directive examples are hardcoded in multiple places across the diff, and some files were changed inconsistently before. This kind of duplicated literal syntax is easy to let drift when directive rules evolve.
**Suggestion:** Define shared syntax example strings or a small helper module for directive examples/messages, then reuse it in `translate.js`, `review.js`, comments, and help text.

**Verdict:** REJECTED
**Reason:** The directive example strings in `translate.js` and `review.js` serve different purposes (translation instructions vs. review rules) and are embedded in natural-language prompts sent to an LLM. Extracting them into a shared module adds indirection for strings that are contextually different and rarely change together. This is cosmetic abstraction with marginal benefit.

### [x] 6. Remove Stale Parser Responsibilities from Header Comments
**File:** `src/docs/lib/directive-parser.js`
**Issue:** The file header now describes old responsibilities, stale syntax, and even an incorrect path (`tools/engine/directive-parser.js`). That makes the module harder to understand and weakens naming/design consistency.
**Suggestion:** Rewrite the module header to match the current implementation only: current file path, supported `{{data: ...}}` / `{{text: ...}}` syntax, and current `@extends` / `@block` handling.

**Verdict:** APPROVED
**Reason:** The diff reverts the file header to describe `tools/engine/directive-parser.js` (wrong path), `@block` / `@endblock` / `@extends` syntax, and mentions no longer-existing features. The actual file path is `src/docs/lib/directive-parser.js`. Stale documentation in the module header actively misleads developers about what the parser supports. Updating it to match reality is zero-risk and improves code comprehension.
