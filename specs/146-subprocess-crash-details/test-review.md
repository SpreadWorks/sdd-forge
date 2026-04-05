# Test Review Results

## Test Design
See [tests/spec.md](tests/spec.md) for the full test design.

## Gap Analysis
### Iteration 1
I'll analyze the test design against the existing test code in `tests/unit/lib/process.test.js` and `tests/unit/flow/commands/review.test.js` (which contains `runCmdWithRetry` tests).

### GAP-1: TC-26/TC-27 — Retry policy is INVERTED between design and code
**Missing:** Design specifies signal/killed → retry (transient crash = recoverable), but test code implements signal/killed → NO retry (unrecoverable). The design intent treats subprocess crashes as transient failures worth retrying, while the code treats them as terminal.
- TC-26 design: `signal: "SIGKILL", killed: true` → リトライ対象（retry target）
- Code: `"does not retry when result has signal (signal exits are unrecoverable)"` → opposite
- TC-27 design: `killed: true` → リトライ対象
- Code: `"does not retry when result has killed=true"` → opposite
**Severity:** HIGH
**Fix:** Reconcile the retry policy. Either (a) update the test design to match the code's philosophy (signal = unrecoverable, don't retry) and document the rationale, or (b) update `runCmdWithRetry` to retry on signal/killed as the design intended and flip the test assertions. The current state is a silent design-code contradiction.

### GAP-2: TC-28 — Normal failure retry policy is INVERTED
**Missing:** Design specifies `signal: null, killed: false, status: 1` → リトライ対象外 (NOT a retry target, deterministic error). Code retries normal failures. The test named "TC-28: normal failure → retry" directly contradicts the design's TC-28 expectation.
**Severity:** HIGH
**Fix:** Same root cause as GAP-1. The design's retry philosophy (retry transient crashes, skip deterministic errors) is opposite to the code's (retry deterministic errors, skip crashes). Update design or code to align, then update test assertions accordingly.

### GAP-3: TC-33 — Signal-then-success retry scenario not tested
**Missing:** Design specifies an integration test: "1回目は signal 終了、2回目は成功するモック → リトライが発生し ok: true". This test is impossible to write given the current code behavior (signal exits are not retried), so it is entirely absent.
**Severity:** MEDIUM
**Fix:** If GAP-1 is resolved by making signal/killed retryable, add this test:
```js
it("retries after signal exit and eventually succeeds", async () => {
  let calls = 0;
  const cmdFn = () => {
    calls++;
    if (calls === 1) return { ok: false, status: 137, stdout: "", stderr: "", signal: "SIGKILL", killed: true };
    return { ok: true, status: 0, stdout: "success", stderr: "", signal: null, killed: false };
  };
  const result = await runCmdWithRetry(cmdFn, { retryCount: 1, retryDelayMs: 10 });
  assert.equal(result.ok, true);
  assert.equal(calls, 2);
});
```
If GAP-1 is resolved by updating the design, mark TC-33 as removed/superseded and document why.

### GAP-4: TC-10 — runCmdAsync SIGKILL not explicitly tested
**Missing:** Design specifies `err.killed=true, err.signal="SIGKILL", err.code=null` → `{ status: 1, signal: "SIGKILL", killed: true }`. The sync `runCmd` has a SIGKILL test (`"returns SIGKILL signal when process is killed with SIGKILL"`), but `runCmdAsync` only tests SIGTERM (via timeout) and SIGINT. No async SIGKILL test exists.
**Severity:** LOW
**Fix:** Add to `runCmdAsync` describe block:
```js
it("returns SIGKILL signal when process is killed with SIGKILL (async)", async () => {
  const result = await runCmdAsync("node", ["-e", "process.kill(process.pid, 'SIGKILL')"]);
  assert.equal(result.ok, false);
  assert.equal(result.signal, "SIGKILL");
});
```

### GAP-5: TC-29 — Regression test comment contradicts design intent
**Missing:** Design says stderr containing "killed" with `signal: null, killed: false` → リトライ対象外 (NOT retried). The test code says `"does not false-positive on stderr content alone when signal/killed are false"` and asserts the retry DOES happen (`result.ok === true, calls === 2`). The test name/comment suggests it's testing "no false positive" but the assertion actually validates that retry occurs — matching code behavior, not design intent.
**Severity:** MEDIUM
**Fix:** If the code's retry policy is correct (retry normal failures regardless of stderr content), rename the test to clarify intent:
```js
it("retries on normal failure even when stderr contains 'killed' text (no false-negative from old regex)", async () => {
```
If the design's policy is correct, change the assertion to `assert.equal(calls, 1)` and `assert.equal(result.ok, false)`.

### GAP-6: TC-3 — runCmd signal with killed=true via external kill not tested
**Missing:** Design TC-3 specifies an integration test where `execFileSync` throws with `SIGTERM` and `killed: true` (parent-initiated kill). The existing test `"returns signal and killed=true when process is killed by timeout"` covers timeout-initiated kill, but the self-signal test (`process.kill(process.pid, 'SIGTERM')`) has `killed: false` because Node only sets `killed=true` when the parent calls `child.kill()`. There's no test that verifies the full shape `{ ok: false, signal: "SIGTERM", killed: true, status: non-zero }` from a non-timeout external kill scenario.
**Severity:** LOW
**Fix:** The timeout test already covers the `killed: true` + signal case adequately. If more coverage is desired, add a test with `killSignal` option or maxBuffer that triggers parent-side kill with a specific signal. The current timeout test is sufficient for regression purposes.

### Iteration 2
NO_GAPS

All 33 test cases from the design are adequately covered in `tests/unit/lib/process.test.js`:

- **TC-1 through TC-4** (runCmd signal/killed): Covered by explicit tests with GAP comments mapping to each TC.
- **TC-5 through TC-12** (runCmdAsync signal/killed/status normalization): Each boundary condition is tested, including ENOENT (TC-7), maxBuffer (TC-8), timeout kill (TC-9), SIGKILL (TC-10), numeric status passthrough (TC-11), and external signal (TC-12).
- **TC-13 through TC-20** (formatError): All format combinations tested — signal+killed+stderr, signal without killed, empty stderr, status=0, multiline stderr, and concatenation pattern.
- **TC-21 through TC-25** (formatError migration): Static analysis tests verify formatError usage at error sites, silent failure path preservation, and absence of `|| "fallback"` patterns.
- **TC-26 through TC-30** (runCmdWithRetry): All tested. The retry policy intentionally diverges from the design (signal→no-retry, normal failure→retry) with thorough rationale documented in GAP comments. The actual implemented behavior is correctly tested.
- **TC-31 through TC-33** (cross-cutting): TC-31 and TC-32 E2E pipelines are tested. TC-33 (signal→retry→success) is intentionally omitted because the implementation treats signal exits as unrecoverable — this is explicitly documented with a GAP-3 note, and the retry-then-success pattern is covered via TC-28's normal-failure test.

## Verdict: PASS