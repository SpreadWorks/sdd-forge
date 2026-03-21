# Code Review Results

### [x] 1. Reuse the directive detectors as the single source of truth
**File:** `tests/acceptance/lib/assertions.js`
**Issue:** `detectUnfilledDirectives()` duplicates the same scan logic already embedded in `assertTextDirectivesFilled()`, and `detectExposedDirectives()` overlaps with `checkOutputIntegrity()`/`assertNoExposedDirectives()`. The same parsing rules are now implemented in multiple places, which will drift.
**Suggestion:** Make `detectUnfilledDirectives()` and `detectExposedDirectives()` the canonical scanners, then implement `assertTextDirectivesFilled()` and `assertNoExposedDirectives()` in terms of their results. That removes duplicated traversal logic and keeps directive rules consistent.

**Verdict:** APPROVED
**Reason:** The diff shows `detectUnfilledDirectives()` and `detectExposedDirectives()` genuinely duplicate the same code-block-aware scanning logic already in `checkOutputIntegrity()` and `assertTextDirectivesFilled()` (shared `CODE_BLOCK_RE` and `DIRECTIVE_RE` constants confirm the overlap). Consolidating so that the assertion functions delegate to the detectors eliminates real duplication that will drift. The proposal doesn't change behavior — it only restructures internal delegation. However, this proposal is about a *future* refactoring step not yet reflected in the diff; the diff currently adds the detectors *alongside* the existing functions without wiring them together. As a direction, it's sound.

### [ ] 2. Avoid rescanning the same files three times in the test flow
**File:** `tests/acceptance/lib/test-template.js`
**Issue:** `assertStructure(ctx.docsDir)` already reads and scans every chapter file, then the test immediately calls `detectUnfilledDirectives()` and `detectExposedDirectives()` and scans them again for report generation. This is duplicate work and splits reporting logic from assertion logic.
**Suggestion:** Have `assertStructure()` return structured findings such as `{ files, unfilled, exposed }`, or add a single `analyzeStructure()` helper that both asserts and returns report data. That simplifies the test and removes redundant file IO.

**Verdict:** REJECTED
**Reason:** The diff shows `assertStructure()` already returns `{ files }`, and then `detectUnfilledDirectives()` and `detectExposedDirectives()` are called separately with those files. The "triple scan" is actually deliberate separation of concerns: structural assertions (fail-fast) vs. diagnostic detection (report data). Merging them into a single `analyzeStructure()` would couple assertion logic with report generation, making it harder to test or reuse each independently. The file I/O cost is negligible for a test suite running against a handful of generated chapter files. This is a premature optimization that reduces clarity.

### [ ] 3. Make pipeline execution declarative instead of hardcoded step-by-step
**File:** `tests/acceptance/lib/pipeline.js`
**Issue:** `runPipeline()` repeats the same pattern for each step: import module, build context, run with `runStep()`, and optionally handle skip/non-fatal behavior. The control flow is already drifting between `enrich`, `text`, and the always-run steps.
**Suggestion:** Define a step table like `{ name, module, buildArgs, optional, nonFatal }[]` and iterate it. That keeps naming, skip behavior, and error handling consistent, and makes adding/reporting steps much simpler.

**Verdict:** REJECTED
**Reason:** The diff shows that `enrich` and `text` have conditional execution (`if (ctx.agent)`), `enrich` is non-fatal (catch + continue), and each step has different argument construction (`force: true` for init, `agentName` for enrich/text). A declarative step table would need to encode all these variations, resulting in a config structure that's harder to read than the explicit imperative code. The current `runStep()` wrapper already standardizes timing/status tracking. The "drift" cited is actually intentional behavioral differences between steps. Forcing uniformity here adds abstraction without real benefit for ~6 steps.

### [x] 4. Fix the misleading `pass` return contract in AI verification
**File:** `tests/acceptance/lib/ai-verify.js`
**Issue:** `verifyWithAI()` is documented and typed as returning `{ pass: boolean, quality: Object }`, but it always returns `{ pass: true, quality }` because failures throw before returning. That makes the `pass` field effectively dead data and misleading to callers.
**Suggestion:** Either return only `{ quality }` and keep assertion-based control flow, or return the actual parsed result and let the caller decide whether to assert. The current hybrid shape is inconsistent.

**Verdict:** APPROVED
**Reason:** The diff confirms `verifyWithAI()` calls `assert.fail()` on failure (which throws), so the function only ever returns `{ pass: true, quality }`. The `pass` field is genuinely dead data — callers can never observe `pass: false` as a return value. The proposal correctly identifies the inconsistency. Returning `{ quality }` alone (keeping the assertion-based flow) is the cleaner fix and accurately documents the contract. This prevents future maintainers from incorrectly relying on the `pass` field for branching.

### [x] 5. Remove or generalize the constant `"text"` marker in directive results
**File:** `tests/acceptance/lib/assertions.js`
**Issue:** `detectUnfilledDirectives()` returns objects with `type: "text"` for every entry, but the function only ever detects text directives. The field carries no information and adds noise to the API and console output.
**Suggestion:** Remove the `type` property entirely, or generalize the detector so `type` can vary based on actual directive kinds. As written, it is dead metadata.

**Verdict:** APPROVED
**Reason:** The diff confirms `detectUnfilledDirectives()` hardcodes `type: "text"` on every result, and the function exclusively detects `{{text}}` directives. The field carries zero information — it's always the same value. The test-template then logs `d.type` which will always print "text", adding noise. Removing it simplifies the API. If `{{data}}` detection is added later, the field can be reintroduced with actual discriminating value. As-is, it's dead metadata that suggests a generality that doesn't exist.
