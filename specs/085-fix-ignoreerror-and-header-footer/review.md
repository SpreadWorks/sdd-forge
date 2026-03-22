# Code Review Results

### [x] 1. ### 1. Merge Block Content Mutation Paths
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `replaceBlockDirective()` and `clearBlockContent()` are nearly identical and differ only in whether they insert `content`. This duplicates splice logic and creates two code paths for the same block mutation pattern.
**Suggestion:** Replace both with a single helper such as `rewriteBlockDirective(lines, directive, contentLines = [])` or make `replaceBlockDirective()` accept empty content. That keeps block replacement/clearing behavior in one place and reduces maintenance risk.

2. ### 2. Extract Inline Directive Rebuild Logic
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `resolveDataDirectives()` rebuilds inline `{{data}}...{{/data}}` content in two places, including duplicate `openTag` extraction and replacement logic. The branching is already growing with `ignoreError`, `header`, and `footer`.
**Suggestion:** Introduce a helper like `replaceInlineDirectiveContent(lines, directive, content = "")` that handles `openTag` parsing and string replacement once. Then call it for both the resolved and `ignoreError` cases.

3. ### 3. Remove Unused `removeDirective`
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `removeDirective()` is dead code in this patch. The previous `ignoreError` branch no longer uses it, and there is no other caller in the repository.
**Suggestion:** Delete `removeDirective()` if the new behavior is intentional. If deletion behavior is still needed conceptually, keep it only after reintroducing an actual caller and test coverage.

4. ### 4. Isolate Quoted String Unescaping Behind a Named Helper
**File:** `src/docs/lib/directive-parser.js`
**Issue:** `parseOptions()` now contains inline string normalization via `.replace(/\\n/g, "\n")`, but the function name and comment still suggest generic option parsing. The escape handling is also partial and easy to miss when more string-valued params are added.
**Suggestion:** Extract a helper such as `parseQuotedOptionValue()` or `unescapeDirectiveString()` and call it from `parseOptions()`. That makes the new behavior explicit, improves naming, and gives one place to extend escaping rules later.

5. ### 5. Reduce Repetition in Template-Level Optional Sections
**File:** `src/presets/**/*.md`
**Issue:** The same pattern is repeated across many templates: move a heading into `header`, add `ignoreError: true`, and keep `labels`. This spreads one design choice across dozens of files and makes future wording or behavior changes expensive.
**Suggestion:** Introduce a higher-level template construct for optional data sections, for example a helper/directive that takes `title`, `source`, and `labels`, then internally applies `ignoreError` and header rendering. That keeps templates declarative and avoids repeating the same option bundle everywhere.

**Verdict:** APPROVED
**Reason:** `replaceBlockDirective()` and `clearBlockContent()` share the same splice-based block mutation logic, differing only in whether content lines are inserted. Merging them into a single function with a default-empty content parameter genuinely reduces duplication and eliminates a class of inconsistency bugs. The behavioral equivalence is straightforward to verify.
