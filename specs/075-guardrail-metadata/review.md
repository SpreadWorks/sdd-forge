# Code Review Results

### [x] 1. ### 1. Extract Shared Glob Matching Logic
**File:** `src/spec/commands/guardrail.js`  
**Issue:** `matchScope()` reimplements glob-to-regex conversion inline, and the comment explicitly references existing behavior in `scanner.js`. That is duplicate logic and creates a drift risk if pattern semantics change in one place but not the other.  
**Suggestion:** Move glob/pattern conversion into a shared utility in `src/lib/` or `src/docs/lib/`, and have both `matchScope()` and the scanner use the same helper.

2. ### 2. Replace `meta: null` Sentinel With Single-Phase Article Finalization
**File:** `src/spec/commands/guardrail.js`  
**Issue:** `parseGuardrailArticles()` uses `meta: null` as a parsing sentinel and then runs a second post-processing pass to apply defaults. That makes the control flow harder to follow and mixes parsing with normalization in two separate phases.  
**Suggestion:** Normalize each article when it is finalized instead of after the loop. For example, create a small `finalizeArticle()` helper that joins the body and injects default metadata immediately, removing the `null` sentinel and the trailing normalization loop.

3. ### 3. Tighten Naming Around Meta Parsing
**File:** `src/spec/commands/guardrail.js`  
**Issue:** Names like `META_RE` and `parseMetaValue()` are vague relative to what the code actually handles: a full HTML comment directive for article metadata. The current names make the parsing contract less obvious.  
**Suggestion:** Rename to something more specific, such as `META_DIRECTIVE_RE` and `parseMetaDirectiveValue()` or `parseArticleMeta()`. That makes the purpose clearer and aligns better with the surrounding guardrail/article terminology.

4. ### 4. Avoid Mutating the Input Parameter in `parseMetaValue`
**File:** `src/spec/commands/guardrail.js`  
**Issue:** `parseMetaValue(inner)` rewrites `inner` in place after extracting `lint`. This is not a bug, but it makes the parser harder to reason about and is inconsistent with a more functional style used elsewhere in the codebase.  
**Suggestion:** Introduce a local working variable such as `let remaining = inner;` and operate on that instead. It improves readability and makes the function’s intent clearer without changing behavior.

5. ### 5. Consolidate Phase Filtering Responsibility
**File:** `src/spec/commands/gate.js`  
**Issue:** `buildGuardrailPrompt()` now applies both phase filtering and exemption filtering. That couples prompt construction to article selection policy, while other consumers will likely need the same phased selection.  
**Suggestion:** Push selection into a dedicated helper, such as `selectGuardrailArticles(articles, { phase, exemptions })`, or at least keep all article-filtering helpers in `guardrail.js`. Then `buildGuardrailPrompt()` can focus only on prompt formatting.

6. ### 6. Make Default Phase Behavior Explicit in the Type Shape
**File:** `src/spec/commands/gate.js`  
**Issue:** The JSDoc changed to `meta?: Object`, but the downstream code assumes a specific structure (`meta.phase`). Using `Object` weakens the contract and hides the actual shape introduced by this change.  
**Suggestion:** Replace `Object` with an explicit metadata shape in JSDoc, for example ``meta?: { phase?: string[], scope?: string[], lint?: RegExp }``. That improves readability, editor support, and consistency with the new parsing/filtering design.

**Verdict:** APPROVED
**Reason:** The agent confirmed identical glob-to-regex logic exists in three places: `scanner.js:patternToRegex()` (private), `scanner.js:globToRegex()` (exported), and `guardrail.js:matchScope()` (inline duplication). The comment in `matchScope` even says "same as scanner.js patternToRegex" — acknowledging the duplication. Extracting to a shared utility (or simply exporting `patternToRegex` from scanner.js) eliminates real drift risk and is a low-risk refactor.
