# Code Review Results

### [x] 1. Consolidate duplicated `data()` parsing paths
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `parseDataCall()` and `parseInlineData()` duplicate the same path splitting, option parsing, label extraction, and `params` cleanup logic. This makes future syntax changes easy to miss in one branch.
**Suggestion:** Extract a shared helper such as `parseDataTarget(pathStr, optsStr)` or `buildDataDirectiveFields(pathStr, opts)` and reuse it from both block and inline parsing.

**Verdict:** APPROVED
**Reason:** `parseDataCall()` (lines 145–171) and `parseInlineData()` (lines 206–222) contain identical logic: path splitting into preset/source/method, option parsing via `parseOptions()`, label extraction, and `params` cleanup with `delete params.labels`. This is genuine duplication — not cosmetic — and a future syntax change (e.g., adding a new option field) would need to be applied in both places. Extracting a shared `buildDataFields(pathStr, optsStr)` helper is low-risk and directly improves maintainability.

### [ ] 2. Remove unused default metadata constant
**File:** `src/spec/commands/guardrail.js`
**Issue:** `DEFAULT_META` is now dead code. After moving from `{%meta%}` lines to `{%guardrail%}` blocks, `parseGuardrailArticles()` no longer uses it, while `serializeArticle()` hardcodes the fallback phase separately.
**Suggestion:** Delete `DEFAULT_META`, or better, reuse a single shared default in both parsing and serialization to keep the default phase definition in one place.

**Verdict:** REJECTED
**Reason:** `DEFAULT_META` (line 22) is **not dead code**. It is actively used in three places: (1) the `parseGuardrailArticles` default-application loop at lines 133–139, (2) `filterByPhase` at line 153, and (3) `serializeArticle` at line 225 hardcodes the same default as a string fallback. The proposal's premise is incorrect — `DEFAULT_META` is still referenced. However, the secondary suggestion to unify the fallback in `serializeArticle` (line 225: `"{phase: [spec]}"`) with `DEFAULT_META` has merit but is a minor enhancement, not the removal described.

### [ ] 3. Rename legacy “meta” identifiers to match the new guardrail model
**File:** `src/spec/commands/guardrail.js`
**Issue:** Names like `parseMetaValue`, `currentMeta`, and `metaStr` still reflect the removed `{%meta%}` directive, even though the implementation now parses `{%guardrail ...%}` blocks.
**Suggestion:** Rename them to `parseGuardrailOptions`, `currentGuardrailMeta`, and `guardrailOptionsText` (or similar) so the code matches the current design and is easier to follow.

**Verdict:** REJECTED
**Reason:** This is a cosmetic rename of internal variable/function names (`parseMetaValue`, `currentMeta`, `metaStr`). These names are private to the module and don't leak into any public API. The function `parseMetaValue` still parses a "meta value" — the object `{phase: [...], scope: [...]}` — which is conceptually still metadata regardless of the directive tag name change. Renaming carries risk of merge conflicts with in-flight branches for no functional benefit.

### [x] 4. Generalize repeated closing-tag scan logic
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `parseDirectives()` contains nearly identical loops for locating `{{/data}}` and `{{/text}}`, differing only by regex and error message. This repetition increases maintenance cost.
**Suggestion:** Introduce a helper like `findClosingDirectiveLine(lines, startIndex, closingRe, errorLabel)` and call it for both directive types.

**Verdict:** APPROVED
**Reason:** The closing-tag scan loops for `{{/data}}` (lines 272–278) and `{{/text}}` (lines 305–311) are structurally identical — both iterate from `endIndex + 1`, test against a regex, and throw on failure with only the regex and error label differing. A helper like `findClosingTag(lines, startIndex, closingRe, label)` would reduce the risk of the two loops diverging and would make the parser easier to extend for future directive types.

### [x] 5. Replace ad hoc directive regexes with shared named constants
**File:** `src/docs/commands/text.js`
**Issue:** The new `text()` opening-tag regex appears inline in multiple places (`stripFillContent()` and `countFilledInBatch()`), while related directive logic already lives in `directive-parser.js`. This spreads syntax knowledge across files.
**Suggestion:** Export a shared `TEXT_OPEN_RE` or a small predicate from `src/docs/lib/directive-parser.js` and reuse it here to keep directive syntax changes centralized.

**Verdict:** APPROVED
**Reason:** The `text.js` file (visible in the diff at `stripFillContent` and `countFilledInBatch`) uses inline regex `/^<!--\s*\{\{text\(/.test(...)` that duplicates syntax knowledge already owned by `directive-parser.js`. If the `text()` syntax changes again, `text.js` would need a separate update. Exporting a `TEXT_OPEN_RE` or a predicate from the parser centralizes syntax knowledge and prevents drift. This is a genuine single-responsibility improvement.

### [ ] 6. Consider a generic function-call directive parser instead of separate `data()` / `text()` branches
**File:** `src/docs/lib/directive-parser.js`
**Issue:** The new parser is already moving toward a function-call syntax, but `parseDataCall()` and `parseTextCall()` still implement parallel, special-case parsing flows. That makes the design less extensible as more directives like `{%guardrail%}` are introduced elsewhere.
**Suggestion:** Introduce a small generic parser for `name(args)` comment content, then dispatch by directive name. That would simplify adding future directives and make the parser architecture more consistent.

**Verdict:** REJECTED
**Reason:** This is a premature abstraction. `parseDataCall()` and `parseTextCall()` have fundamentally different argument structures: `data("path", {opts})` takes a dotted path string + optional object, while `text({prompt: "...", ...})` takes a single options object with a required `prompt` field. A generic `name(args)` parser would still need type-specific post-processing, adding indirection without reducing code. The `{%guardrail%}` directive in `guardrail.js` uses a completely different syntax (`{%guardrail {phase: [...]}%}`) that wouldn't fit this generic parser anyway. The current two-function approach is clearer and appropriately sized for two directive types.
