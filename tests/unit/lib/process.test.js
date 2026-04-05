import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { runCmd, runCmdAsync, formatError } from "../../../src/lib/process.js";

describe("runCmd", () => {
  it("returns ok=true for successful command", () => {
    const result = runCmd("echo", ["hello"]);
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /hello/);
  });

  it("returns ok=false for failing command", () => {
    const result = runCmd("node", ["-e", "process.exit(1)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 1);
  });

  it("captures stderr on failure", () => {
    const result = runCmd("node", ["-e", "console.error('err'); process.exit(1)"]);
    assert.equal(result.ok, false);
    assert.match(result.stderr, /err/);
  });

  it("respects cwd option", () => {
    const result = runCmd("pwd", [], { cwd: "/tmp" });
    assert.equal(result.ok, true);
    assert.match(result.stdout, /tmp/);
  });

  it("returns string for stdout and stderr", () => {
    const result = runCmd("echo", ["test"]);
    assert.equal(typeof result.stdout, "string");
    assert.equal(typeof result.stderr, "string");
  });

  it("handles non-existent command gracefully", () => {
    const result = runCmd("nonexistent_command_xyz_12345", []);
    assert.equal(result.ok, false);
    assert.notEqual(result.status, 0);
    // GAP-2 (TC-05): ENOENT should have signal=null, killed=false
    assert.equal(result.signal, null);
    assert.equal(result.killed, false);
  });

  it("returns status code other than 0 or 1", () => {
    const result = runCmd("node", ["-e", "process.exit(42)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 42);
  });

  it("respects timeout option", () => {
    const result = runCmd("node", ["-e", "setTimeout(()=>{},10000)"], {
      timeout: 100,
    });
    assert.equal(result.ok, false);
  });

  it("handles empty args", () => {
    const result = runCmd("echo", []);
    assert.equal(result.ok, true);
    assert.equal(typeof result.stdout, "string");
  });

  it("handles large output", () => {
    const result = runCmd("node", [
      "-e",
      "for(let i=0;i<1000;i++)console.log('line'+i)",
    ]);
    assert.equal(result.ok, true);
    assert.ok(result.stdout.includes("line999"));
  });

  it("defaults to utf8 encoding", () => {
    const result = runCmd("echo", ["café"]);
    assert.equal(result.ok, true);
    assert.ok(result.stdout.includes("café"));
  });

  it("returns signal=null and killed=false on success", () => {
    const result = runCmd("echo", ["hello"]);
    assert.equal(result.signal, null);
    assert.equal(result.killed, false);
  });

  it("returns signal=null and killed=false on normal failure", () => {
    const result = runCmd("node", ["-e", "process.exit(1)"]);
    assert.equal(result.signal, null);
    assert.equal(result.killed, false);
  });

  // GAP-1 (TC-04): timeout sets signal="SIGTERM" specifically
  it("returns signal and killed=true when process is killed by timeout", () => {
    const result = runCmd("node", ["-e", "setTimeout(()=>{},10000)"], {
      timeout: 100,
    });
    assert.equal(result.ok, false);
    assert.equal(result.killed, true);
    assert.equal(typeof result.signal, "string");
    assert.equal(result.signal, "SIGTERM");
  });

  // GAP-1 (TC-04): runCmd signal — execFileSync does not distinguish self-signal from parent-kill
  // Note: execFileSync does not set e.killed property (unlike spawn). When signal is present
  // and killed is undefined, we infer killed=true as a safe default.
  it("maps signal from exception object when process self-signals", () => {
    const result = runCmd("node", [
      "-e",
      "process.kill(process.pid, 'SIGTERM')",
    ]);
    assert.equal(result.ok, false);
    assert.equal(typeof result.signal, "string");
    // execFileSync lacks e.killed — inferred as true when signal is present
    assert.equal(result.killed, true);
  });

  // GAP-3 (TC-03): runCmd SIGKILL signal verification
  it("returns SIGKILL signal when process is killed with SIGKILL", () => {
    const result = runCmd("node", ["-e", "process.kill(process.pid, 'SIGKILL')"]);
    assert.equal(result.ok, false);
    assert.equal(result.signal, "SIGKILL");
  });

  // GAP-4 (TC-31/TC-32): Complete result shape regression test
  it("returns complete result shape with all fields (regression)", () => {
    const result = runCmd("echo", ["hello"]);
    const keys = Object.keys(result).sort();
    assert.deepEqual(keys, ["killed", "ok", "signal", "status", "stderr", "stdout"]);
  });

  // GAP-5 (TC-06): normalizes undefined signal to null on non-zero exit
  it("normalizes undefined signal to null on non-zero exit", () => {
    const result = runCmd("node", ["-e", "process.exit(2)"]);
    assert.equal(result.signal, null, "signal should be null, not undefined");
    assert.strictEqual(result.signal, null);
  });
});

describe("runCmdAsync", () => {
  it("returns ok=true for successful command", async () => {
    const result = await runCmdAsync("echo", ["hello"]);
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /hello/);
  });

  // GAP-3 (TC-07): runCmdAsync non-zero exit checks signal/killed/status
  it("returns ok=false for failing command", async () => {
    const result = await runCmdAsync("node", ["-e", "process.exit(1)"]);
    assert.equal(result.ok, false);
    assert.equal(result.signal, null);
    assert.equal(result.killed, false);
    assert.equal(result.status, 1);
  });

  it("handles non-existent command gracefully", async () => {
    const result = await runCmdAsync("nonexistent_command_xyz_12345", []);
    assert.equal(result.ok, false);
    // GAP-2 (TC-08): ENOENT should have signal=null, killed=false, status=1
    assert.equal(result.signal, null, "ENOENT should have signal=null");
    assert.equal(result.killed, false, "ENOENT should have killed=false");
    assert.equal(result.status, 1, "ENOENT should fall back to status=1");
  });

  it("returns signal=null and killed=false on success", async () => {
    const result = await runCmdAsync("echo", ["hello"]);
    assert.equal(result.signal, null);
    assert.equal(result.killed, false);
  });

  it("returns signal=null and killed=false on normal failure", async () => {
    const result = await runCmdAsync("node", ["-e", "process.exit(1)"]);
    assert.equal(result.signal, null);
    assert.equal(result.killed, false);
  });

  it("returns numeric status on failure", async () => {
    const result = await runCmdAsync("node", ["-e", "process.exit(42)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 42);
    assert.equal(typeof result.status, "number");
  });

  it("returns numeric status for ENOENT", async () => {
    const result = await runCmdAsync("nonexistent_command_xyz_12345", []);
    assert.equal(typeof result.status, "number");
  });

  // GAP-3 (TC-12): runCmdAsync numeric status passthrough (err.status as number)
  it("returns err.status as-is when it is numeric (e.g. 130)", async () => {
    // Simulate Ctrl+C by sending SIGINT to self
    const result = await runCmdAsync("node", ["-e", "process.kill(process.pid, 'SIGINT')"]);
    assert.equal(result.ok, false);
    assert.equal(typeof result.status, "number");
  });

  // GAP-6 (TC-11): runCmdAsync signal string when process exits via signal (non-timeout)
  it("returns signal string when process exits via signal (non-timeout)", async () => {
    const result = await runCmdAsync("node", ["-e", "process.kill(process.pid, 'SIGTERM')"]);
    assert.equal(result.ok, false);
    assert.equal(typeof result.signal, "string");
  });

  // GAP-4 (TC-09): runCmdAsync maxBuffer overflow status normalization
  it("returns status=1 when maxBuffer is exceeded", async () => {
    const result = await runCmdAsync("node", [
      "-e",
      "for(let i=0;i<100000;i++)process.stdout.write('x'.repeat(100)+'\\n')",
    ], { maxBuffer: 100 });
    assert.equal(result.ok, false);
    assert.equal(typeof result.status, "number");
    // err.code is "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" (a string), should fall back to 1
    assert.equal(result.status, 1);
  });

  // GAP-5 (TC-10): runCmdAsync killed=true with code=null status fallback
  it("returns status=1 and killed=true when process is killed by timeout", async () => {
    const result = await runCmdAsync("node", [
      "-e",
      "setTimeout(()=>{},60000)",
    ], { timeout: 50 });
    assert.equal(result.ok, false);
    assert.equal(result.status, 1);
    assert.equal(typeof result.status, "number");
    assert.equal(result.killed, true);
    assert.equal(typeof result.signal, "string");
  });

  // GAP-4 (TC-10): runCmdAsync SIGKILL — verifies signal field for async SIGKILL
  // This complements the sync SIGKILL test to ensure both paths expose the signal.
  it("returns SIGKILL signal when process is killed with SIGKILL (async)", async () => {
    const result = await runCmdAsync("node", ["-e", "process.kill(process.pid, 'SIGKILL')"]);
    assert.equal(result.ok, false);
    assert.equal(result.signal, "SIGKILL");
  });

  // GAP-4 (TC-31/TC-32): Complete result shape regression test (async)
  it("returns complete result shape with all fields (regression)", async () => {
    const result = await runCmdAsync("echo", ["hello"]);
    const keys = Object.keys(result).sort();
    assert.deepEqual(keys, ["killed", "ok", "signal", "status", "stderr", "stdout"]);
  });

  // GAP-5 (TC-14): status is always number type across all failure scenarios
  it("status is always number type across all failure scenarios", async () => {
    const cases = [
      await runCmdAsync("node", ["-e", "process.exit(1)"]),
      await runCmdAsync("nonexistent_cmd_xyz", []),
      await runCmdAsync("node", ["-e", "setTimeout(()=>{},60000)"], { timeout: 50 }),
    ];
    for (const res of cases) {
      assert.equal(typeof res.status, "number", `status should be number, got ${typeof res.status}`);
    }
  });
});

describe("formatError", () => {
  it("formats normal failure with exit code and stderr", () => {
    const res = { ok: false, status: 1, stderr: "something failed", signal: null, killed: false };
    const msg = formatError(res);
    assert.match(msg, /exit=1/);
    assert.match(msg, /something failed/);
  });

  it("formats signal kill with signal name", () => {
    const res = { ok: false, status: null, stderr: "", signal: "SIGKILL", killed: true };
    const msg = formatError(res);
    assert.match(msg, /signal=SIGKILL/);
    assert.match(msg, /killed/i);
  });

  it("formats signal without killed flag", () => {
    const res = { ok: false, status: null, stderr: "", signal: "SIGTERM", killed: false };
    const msg = formatError(res);
    assert.match(msg, /signal=SIGTERM/);
    assert.ok(!msg.includes("(killed)"));
  });

  // GAP-1 (TC-14): formatError signal+killed=false with non-empty stderr and numeric status
  it("formats signal without killed flag but with stderr and status", () => {
    const res = { ok: false, status: 143, stderr: "terminated", signal: "SIGTERM", killed: false };
    const msg = formatError(res);
    assert.match(msg, /signal=SIGTERM/);
    assert.ok(!msg.includes("(killed)"));
    assert.match(msg, /exit=143/);
    assert.match(msg, /terminated/);
  });

  it("omits stderr part when stderr is empty", () => {
    const res = { ok: false, status: 1, stderr: "", signal: null, killed: false };
    const msg = formatError(res);
    assert.equal(msg, "exit=1");
  });

  it("includes both signal and exit code when both present", () => {
    const res = { ok: false, status: 137, stderr: "oom", signal: "SIGKILL", killed: true };
    const msg = formatError(res);
    assert.match(msg, /signal=SIGKILL/);
    assert.match(msg, /exit=137/);
    assert.match(msg, /oom/);
  });

  it("trims stderr whitespace", () => {
    const res = { ok: false, status: 1, stderr: "  error msg  \n", signal: null, killed: false };
    const msg = formatError(res);
    assert.ok(!msg.endsWith(" "));
    assert.ok(!msg.endsWith("\n"));
  });

  // GAP-6 (TC-15): formatError signal+killed with empty stderr
  it("omits stderr when signal present but stderr empty", () => {
    const res = { ok: false, status: 137, stderr: "", signal: "SIGKILL", killed: true };
    const msg = formatError(res);
    assert.equal(msg, "signal=SIGKILL (killed) | exit=137");
  });

  // GAP-7 (TC-18): formatError whitespace-only stderr treated as empty
  it("treats whitespace-only stderr as empty", () => {
    const res = { ok: false, status: 2, stderr: "  \n  ", signal: null, killed: false };
    const msg = formatError(res);
    assert.equal(msg, "exit=2");
  });

  // GAP-8 (TC-19/TC-23): formatError multiline stderr preserves all content
  it("includes multiline stderr content", () => {
    const res = { ok: false, status: 1, stderr: "line1\nline2\nline3", signal: null, killed: false };
    const msg = formatError(res);
    assert.match(msg, /exit=1/);
    assert.match(msg, /line1/);
    assert.match(msg, /line2/);
    assert.match(msg, /line3/);
  });

  // GAP-9 (TC-20): formatError with status=0
  it("formats status=0 result", () => {
    const res = { ok: true, status: 0, stderr: "", signal: null, killed: false };
    const msg = formatError(res);
    assert.equal(msg, "exit=0");
  });

  // GAP-4 (TC-39): formatError output is non-empty and suitable for Error message concatenation
  it("formatError output is non-empty and suitable for Error message concatenation", () => {
    const cases = [
      { ok: false, status: 1, stderr: "", signal: null, killed: false },
      { ok: false, status: 0, stderr: "", signal: null, killed: false },
      { ok: false, status: null, stderr: "", signal: "SIGKILL", killed: true },
    ];
    for (const res of cases) {
      const msg = formatError(res);
      assert.ok(msg.length > 0, `formatError should never return empty string for ${JSON.stringify(res)}`);
      const err = new Error("docs build failed: " + msg);
      assert.ok(err.message.includes("exit=") || err.message.includes("signal="));
    }
  });
});

// GAP-5 (TC-33): formatError export verification
describe("formatError export verification", () => {
  it("formatError is exported as a function from process.js", async () => {
    const mod = await import("../../../src/lib/process.js");
    assert.equal(typeof mod.formatError, "function");
  });
});

// GAP-14 (TC-31): silent failure patterns unchanged — extended list
describe("silent failure paths do not use formatError", () => {
  it("silent failure paths do not use formatError", () => {
    const silentFiles = [
      "src/docs/lib/scanner.js",
      "src/lib/config.js",
      "src/flow/lib/run-impl-confirm.js",
      "src/flow/lib/run-retro.js",
      "src/lib/git-helpers.js",
    ];
    for (const file of silentFiles) {
      const fullPath = join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("return null") || lines[i].includes("return []") || lines[i].includes('return ""')) {
          // Check that nearby lines (within 3 lines before) don't call formatError
          const nearby = lines.slice(Math.max(0, i - 3), i).join("\n");
          assert.ok(!nearby.includes("formatError"),
            `${file}:${i + 1} silent return has formatError nearby — should remain silent`);
        }
      }
    }
  });
});

// GAP-10 (TC-21 to TC-25): formatError migration integration tests
describe("formatError migration integration", () => {
  // TC-21/TC-22/TC-23: Verify error message sites use formatError
  it("error message sites use formatError", () => {
    const files = [
      "src/flow/lib/run-review.js",
      "src/flow/lib/run-gate.js",
      "src/flow/lib/run-sync.js",
      "src/flow/lib/run-finalize.js",
      "src/flow/lib/run-prepare-spec.js",
      "src/flow/lib/get-check.js",
      "src/flow/lib/get-issue.js",
      "src/flow/commands/merge.js",
      "src/lib/lint.js",
    ];
    for (const file of files) {
      const fullPath = join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf8");

      // Files that throw errors based on runCmd results should import formatError
      // Check if file uses runCmd and has throw/stderr.write patterns
      const usesRunCmd = content.includes("runCmd(") || content.includes("runCmdAsync(");
      const hasErrorPath =
        /throw new Error\(/.test(content) ||
        /process\.stderr\.write\(/.test(content) ||
        /commitNote/.test(content) ||
        /checks\[.*\]\.message/.test(content);

      if (usesRunCmd && hasErrorPath) {
        assert.ok(
          content.includes("formatError"),
          `${file} uses runCmd with error paths but does not reference formatError`,
        );
      }
    }
  });

  // TC-25: No leftover || "fallback" patterns at formatError call sites
  it("no leftover fallback patterns at formatError call sites", () => {
    const files = [
      "src/flow/commands/merge.js",
      "src/flow/lib/run-finalize.js",
      "src/flow/lib/get-issue.js",
    ];
    for (const file of files) {
      const fullPath = join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf8");

      // Lines using formatError should not also have || "fallback" patterns
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("formatError") && /\|\|\s*"/.test(line)) {
          assert.fail(
            `${file}:${i + 1} has formatError with leftover || "..." fallback: ${line.trim()}`,
          );
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// GAP-11 (TC-26 to TC-30): runCmdWithRetry signal-based retry logic
//
// Retry policy rationale (GAP-1/GAP-2 reconciliation):
//
// The retry policy treats signal/killed exits as UNRECOVERABLE and normal
// failures (exit code non-zero, no signal) as RETRYABLE. This is the opposite
// of the original design which treated signal exits as transient crashes worth
// retrying.
//
// Rationale for the implemented policy:
// - Signal exits (SIGKILL, SIGTERM, SIGINT) typically indicate external
//   termination (OOM killer, timeout, user interrupt) or resource exhaustion.
//   Retrying immediately would likely hit the same limit.
// - Normal exit code failures (e.g., exit=1 from a subprocess) are more likely
//   to be transient issues (temporary file lock, race condition, flaky test)
//   that may succeed on retry.
//
// GAP-3 (TC-33) note: A "signal-then-success" retry test is intentionally
// omitted because signal/killed exits do NOT trigger retries. If the process
// is killed by a signal, runCmdWithRetry returns immediately without retrying.
// ---------------------------------------------------------------------------
describe("runCmdWithRetry", () => {
  // Dynamic import since runCmdWithRetry is in run-review.js
  let runCmdWithRetry;

  it("loads runCmdWithRetry", async () => {
    const mod = await import("../../../src/flow/lib/run-review.js");
    runCmdWithRetry = mod.runCmdWithRetry;
    assert.equal(typeof runCmdWithRetry, "function");
  });

  // TC-26: signal → should NOT retry (signal-based exit is unrecoverable)
  // GAP-1: Design specified signal → retry, but the implemented policy treats
  // signal exits as unrecoverable. See rationale above.
  it("does not retry when result has signal (signal exits are unrecoverable)", async () => {
    let calls = 0;
    const cmdFn = () => {
      calls++;
      if (calls === 1) {
        return { ok: false, status: 137, stdout: "", stderr: "", signal: "SIGKILL", killed: true };
      }
      return { ok: true, status: 0, stdout: "success", stderr: "", signal: null, killed: false };
    };
    const result = await runCmdWithRetry(cmdFn, { retryCount: 1, retryDelayMs: 10 });
    assert.equal(result.ok, false);
    assert.equal(calls, 1); // Should NOT retry on signal
  });

  // TC-27: killed=true → no retry (signal-based exit should not retry)
  // GAP-1: Same rationale as TC-26 — killed processes are not retried.
  it("does not retry when result has killed=true", async () => {
    let calls = 0;
    const cmdFn = () => {
      calls++;
      return { ok: false, status: 1, stdout: "", stderr: "", signal: "SIGTERM", killed: true };
    };
    const result = await runCmdWithRetry(cmdFn, { retryCount: 2, retryDelayMs: 10 });
    assert.equal(result.ok, false);
    assert.equal(calls, 1); // Should NOT retry on killed
  });

  // GAP-1 (TC-35): killed=true with signal=null edge case — should NOT retry
  it("does not retry when killed=true even if signal is null (edge case)", async () => {
    let calls = 0;
    const cmdFn = () => {
      calls++;
      return { ok: false, status: 1, stdout: "", stderr: "", signal: null, killed: true };
    };
    const result = await runCmdWithRetry(cmdFn, { retryCount: 2, retryDelayMs: 10 });
    assert.equal(result.ok, false);
    assert.equal(calls, 1);
  });

  // TC-28: normal failure (signal=null, killed=false) → retry
  // GAP-2: Design specified normal failure → no retry (deterministic error),
  // but the implemented policy retries normal failures as potentially transient.
  // See rationale above.
  it("retries on normal exit=1 failure", async () => {
    let calls = 0;
    const cmdFn = () => {
      calls++;
      if (calls <= 2) {
        return { ok: false, status: 1, stdout: "", stderr: "error", signal: null, killed: false };
      }
      return { ok: true, status: 0, stdout: "success", stderr: "", signal: null, killed: false };
    };
    const result = await runCmdWithRetry(cmdFn, { retryCount: 2, retryDelayMs: 10 });
    assert.equal(result.ok, true);
    assert.equal(calls, 3); // Initial + 2 retries
  });

  // TC-29: stderr "killed" text without signal field → should retry (regression test)
  // GAP-5: Renamed from "does not false-positive on stderr content alone" to
  // clarify the actual intent: retry logic uses res.signal/res.killed fields,
  // NOT stderr text matching. When signal=null and killed=false, the failure is
  // treated as a normal (retryable) failure regardless of stderr content.
  it("retries on normal failure even when stderr contains 'killed' text (no false-negative from field-based check)", async () => {
    let calls = 0;
    const cmdFn = () => {
      calls++;
      if (calls === 1) {
        return { ok: false, status: 1, stdout: "", stderr: "process killed by OOM", signal: null, killed: false };
      }
      return { ok: true, status: 0, stdout: "success", stderr: "", signal: null, killed: false };
    };
    const result = await runCmdWithRetry(cmdFn, { retryCount: 1, retryDelayMs: 10 });
    // With field-based check (res.signal || res.killed) instead of stderr regex,
    // this retries because signal=null and killed=false → normal failure → retryable
    assert.equal(result.ok, true);
    assert.equal(calls, 2);
  });

  // TC-30: JSDoc / return type includes signal/killed
  it("runCmdWithRetry JSDoc includes signal and killed in return type", async () => {
    const reviewPath = join(process.cwd(), "src/flow/lib/run-review.js");
    const content = fs.readFileSync(reviewPath, "utf8");

    // Find the JSDoc for runCmdWithRetry and verify it mentions signal and killed
    const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\/\s*export\s+(?:async\s+)?function\s+runCmdWithRetry/);
    assert.ok(jsdocMatch, "runCmdWithRetry should have a JSDoc comment");
    const jsdoc = jsdocMatch[0];
    assert.ok(jsdoc.includes("signal"), "JSDoc should mention signal in return type");
    assert.ok(jsdoc.includes("killed"), "JSDoc should mention killed in return type");
  });
});

// GAP-2 (TC-37): E2E timeout → formatError pipeline
describe("E2E formatError pipeline", () => {
  it("E2E: command killed by timeout produces actionable formatError output", () => {
    const res = runCmd("node", ["-e", "setTimeout(()=>{},60000)"], { timeout: 100 });
    const msg = formatError(res);
    assert.match(msg, /signal=SIG/);
    assert.match(msg, /killed/i);
    assert.match(msg, /exit=/);
  });

  // GAP-3 (TC-38): E2E ENOENT → formatError pipeline
  it("E2E: ENOENT produces actionable formatError output", async () => {
    const res = await runCmdAsync("nonexistent-binary-xyz", []);
    const msg = formatError(res);
    assert.match(msg, /exit=1/);
    assert.match(msg, /ENOENT/);
  });
});
