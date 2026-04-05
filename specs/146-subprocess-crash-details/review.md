# Code Review Results

### [x] 1. Extract Shared Command Result Normalization
**File:** `src/lib/process.js`
**Issue:** `runCmd` and `runCmdAsync` both assemble the same result shape manually, but with slightly different normalization rules (`killed` inference, `status` fallback, `signal` handling). That duplication makes the contract harder to reason about and increases the chance of sync/async behavior drifting again.
**Suggestion:** Introduce a small shared helper such as `normalizeCommandResult({ ok, status, stdout, stderr, signal, killed })` and use it from both `runCmd` and `runCmdAsync`. This would eliminate duplicated mapping code and enforce one consistent result contract.

**Verdict:** APPROVED
**Reason:** The diff confirms `runCmd` and `runCmdAsync` assemble result objects with overlapping but subtly different normalization logic (e.g., `e.killed != null ? !!e.killed : !!e.signal` in sync vs `!!err.killed` in async; different `status` fallback paths). A shared `normalizeCommandResult` helper would eliminate this divergence risk and enforce one contract. This is a genuine structural improvement, not cosmetic.

### [x] 2. Remove Unused Variables After Error Formatting Refactor
**File:** `src/flow/lib/run-sync.js`
**Issue:** `buildOutput` and `reviewOutput` are still computed, but they are no longer used after the switch to `formatError(res)`. This is dead code and adds noise.
**Suggestion:** Delete both variables and rely directly on `formatError(buildRes)` / `formatError(reviewRes)` in the failure paths.

**Verdict:** APPROVED
**Reason:** The diff for `run-sync.js` shows `buildOutput` and `reviewOutput` are computed (`(buildRes.stdout || "").trim()`) but the error paths now use `formatError(buildRes)` / `formatError(reviewRes)` instead. These variables are dead code. Removing them is a clear cleanup with zero behavior risk.

### [ ] 3. Rename `formatError` to Make Its Scope Explicit
**File:** `src/lib/process.js`
**Issue:** `formatError` is very generic for a helper that specifically formats `runCmd`/`runCmdAsync` results. In a larger codebase, that name is easy to confuse with unrelated exception formatting utilities.
**Suggestion:** Rename it to something like `formatCommandError` or `formatProcessError`, then update imports. That makes call sites more self-explanatory and keeps naming aligned with `runCmd`/`runCmdAsync`.

**Verdict:** REJECTED
**Reason:** Cosmetic rename. The function is exported from `process.js` alongside `runCmd`/`runCmdAsync`, making its scope already clear from context. The codebase has no other `formatError` to confuse it with. The rename would touch 10+ import sites for no functional benefit.

### [ ] 4. Collapse Repetitive Process Tests Into Table-Driven Helpers
**File:** `tests/unit/lib/process.test.js`
**Issue:** The new tests repeat the same assertions and object shapes many times for sync/async success, failure, signal, and shape checks. The file is becoming hard to scan, and the repeated literals make maintenance expensive.
**Suggestion:** Introduce small helpers or table-driven cases for repeated expectations, for example shared assertions for `{ signal, killed, status }` and shared shape validation. Keep only the behavior-specific assertions inline.

**Verdict:** REJECTED
**Reason:** The tests are new and cover distinct behavioral scenarios (sync/async, signal/killed/ENOENT/maxBuffer/timeout). While there is some repetition in shape assertions, table-driven refactoring risks obscuring the intent of individual test cases and making failures harder to diagnose. The current explicit style is appropriate for a test file covering a newly introduced contract.

### [x] 5. Remove Spec-Gap Commentary From Stable Unit Tests
**File:** `tests/unit/lib/process.test.js`
**Issue:** Many tests are prefixed with `GAP-*` comments and design-history explanations. That reads like review scratchpad material rather than long-term test documentation, and it obscures the actual intent of the test.
**Suggestion:** Replace `GAP-*` labels with short behavior-focused comments only where needed, or remove them entirely when the test name already explains the case. Keep the historical reconciliation in spec/test-review documents instead of the unit test file.

**Verdict:** APPROVED
**Reason:** The `GAP-*` labels and design-history commentary (e.g., "GAP-1 reconciliation", "Design specified X but implemented Y") are review/reconciliation artifacts that belong in spec documents (already present in `test-review.md`), not in the unit test file. Test names like `"does not retry when result has signal"` already explain intent. Removing the commentary improves signal-to-noise without changing behavior.

### [x] 6. Simplify the `formatError` Fallback Path
**File:** `src/lib/process.js`
**Issue:** `formatError` ends with `|| "unknown error"`, but under the current result contract every caller should already provide either `status` or `signal`. That fallback looks like defensive code that may never be exercised.
**Suggestion:** Either remove the fallback and trust the internal contract, or move the invariant into an assertion/helper comment. That keeps the formatter simpler and aligns with the project rule against unnecessary defensive code.

**Verdict:** APPROVED
**Reason:** The project's CLAUDE.md explicitly states: "過剰な防御コードを書かない" (don't write excessive defensive code) and "バリデーションはシステム境界でのみ行う" (validate only at system boundaries). `formatError` is an internal helper called only with `runCmd`/`runCmdAsync` results that always have `status` or `signal`. The `|| "unknown error"` fallback violates the project's own coding rules and can never be exercised under the current contract.
