# Code Review Results

### [x] 1. Remove unused batch import
**File:** `src/docs/commands/readme.js`  
**Issue:** After switching the README flow from `processTemplateFileBatch(...)` to `processTemplate(...)`, `processTemplateFileBatch` remains imported but is no longer used. This is dead code at the import boundary and makes the dependency change look larger than it is.  
**Suggestion:** Remove `processTemplateFileBatch` from the import list so the file only imports the function it actually uses.

**Verdict:** APPROVED
**Reason:** The diff clearly shows `processTemplateFileBatch` is still imported but no longer called — the only call site was changed to `processTemplate`. Dead imports are a genuine quality issue: they obscure actual dependencies and can confuse readers into thinking the batch path is still used. Removing it is trivial, safe, and unambiguously correct.

### [x] 2. Replace the positional-argument API with an options object or dedicated helper
**File:** `src/docs/commands/readme.js`  
**Issue:** `processTemplate(...)` is now called with many positional arguments, including several `undefined` placeholders. That is hard to read, easy to misuse, and inconsistent with the intent of this change, which is specifically “per-directive mode” for README generation.  
**Suggestion:** Expose a clearer API such as `processTemplatePerDirective(text, { analysis, fileName, agent, timeoutMs, root, systemPrompt, lang, srcRoot })` or convert `processTemplate(...)` itself to accept an options object.

**Verdict:** APPROVED
**Reason:** The call `processTemplate(resolved, analysis, "README.md", agent, timeoutMs, root, false, [], systemPrompt, undefined, undefined, lang, ctx.srcRoot || root)` contains 13 positional arguments including multiple `undefined` placeholders and a bare `false`. This is a real readability and correctness hazard — one shifted argument silently breaks behavior with no compile-time protection. Converting to an options object is a well-established improvement pattern that directly reduces misuse risk.

### [ ] 3. Align naming between batch and per-directive processors
**File:** `src/docs/commands/text.js`  
**Issue:** The pair `processTemplateFileBatch` and `processTemplate` is asymmetric. One name encodes the strategy, the other is generic, even though both are strategy-specific text-fill implementations. This makes the README change harder to understand at a glance.  
**Suggestion:** Rename them to a matched pair such as `processTemplateBatch` / `processTemplatePerDirective` or `fillTextDirectivesBatch` / `fillTextDirectivesPerDirective`.

**Verdict:** REJECTED
**Reason:** This is a cosmetic rename with no behavioral improvement. The names `processTemplateFileBatch` and `processTemplate` are adequate — one is clearly batch-oriented, the other is the single-file/per-directive variant. Renaming both functions would touch all call sites and all imports across the codebase for marginal naming symmetry, introducing unnecessary churn and merge-conflict risk with no functional benefit.

### [ ] 4. Avoid leaking low-level text-fill internals into `readme.js`
**File:** `src/docs/commands/readme.js`  
**Issue:** `readme.js` now reaches directly into the low-level text-fill function exported from `text.js`. That couples the README command to an internal implementation detail and duplicates orchestration logic that already exists around agent/config setup in the text command flow.  
**Suggestion:** Add a higher-level helper in `text.js` dedicated to single-document text filling for non-docs files like README, and let `readme.js` call that helper instead of importing the raw processor directly.

**Verdict:** REJECTED
**Reason:** The diff comments explicitly explain *why* README needs per-directive mode (batch mode fails because the resolved content is too large for AI to maintain structure). This is a deliberate, documented architectural choice — not an accidental coupling leak. Introducing a wrapper "higher-level helper" would add an indirection layer that obscures the intent, and `readme.js` already performs its own orchestration (agent setup, system prompt, config). The proposed abstraction would either duplicate that orchestration or require a complex parameterization that's no simpler than the current direct call. The real coupling problem (if any) is better addressed by Proposal #2's options object, not by a new abstraction boundary.
