/**
 * Regression tests for callAgentWithLog / callAgentAwaitLog / callAgentAsyncWithLog
 * after they are rewritten to use the new Logger.agent() API.
 *
 * Spec 153-unified-jsonl-logger R5: external signature/return value preserved,
 * but the logCtx { spec, phase } argument is removed.
 *
 * Helpers should:
 *   - call Logger.agent({ phase: "start", requestId }) before invocation
 *   - call Logger.agent({ phase: "end", requestId, prompt, response, ... }) after
 *   - return the same trimmed response string as the underlying callAgent*
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  callAgentWithLog,
  callAgentAwaitLog,
  callAgentAsyncWithLog,
} from "../../../src/lib/agent.js";
import { Logger } from "../../../src/lib/log.js";
import { todayLocal, readJsonl } from "../../helpers/log-fixtures.js";

describe("callAgentWithLog (sync) — Logger integration", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-log-sync-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
    Logger._resetForTest();
    Logger.getInstance().init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("returns the same trimmed response as callAgent and writes start/end events", async () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = callAgentWithLog(agent, "hello");
    assert.equal(result, "hello");

    // callAgentWithLog fires Logger.agent without awaiting; flush deterministically.
    await Logger.getInstance().flush();

    assert.ok(fs.existsSync(logFile), "log file should exist after callAgentWithLog");
    const entries = readJsonl(logFile);
    const phases = entries.filter((e) => e.type === "agent").map((e) => e.phase);
    assert.ok(phases.includes("start"), "start event should be recorded");
    assert.ok(phases.includes("end"), "end event should be recorded");

    const startEvent = entries.find((e) => e.phase === "start");
    const endEvent = entries.find((e) => e.phase === "end");
    assert.equal(startEvent.requestId, endEvent.requestId, "start/end should share requestId");
  });

  it("does NOT accept logCtx as a positional argument (R5: logCtx removed)", () => {
    // The signature should have changed: no more logCtx between prompt and timeoutMs.
    // Concretely, callAgentWithLog(agent, prompt, timeoutMs?, cwd?, options?)
    // Passing 4 positional args (agent, prompt, timeoutMs, cwd) must work.
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = callAgentWithLog(agent, "x", 5000, process.cwd());
    assert.equal(result, "x");
  });
});

describe("callAgentAwaitLog (sync awaited) — Logger integration", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-log-await-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
    Logger._resetForTest();
    Logger.getInstance().init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("awaits Logger.log and produces start + end + prompt file", async () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = await callAgentAwaitLog(agent, "world");
    assert.equal(result, "world");

    assert.ok(fs.existsSync(logFile));
    const entries = readJsonl(logFile);
    const endEvent = entries.find((e) => e.phase === "end");
    assert.ok(endEvent, "end event should be present");
    assert.ok(endEvent.promptFile, "end event should have promptFile path");
    const promptFilePath = path.resolve(tmpDir, endEvent.promptFile);
    assert.ok(fs.existsSync(promptFilePath), "prompt file should exist");
  });
});

describe("callAgentAsyncWithLog (async) — Logger integration", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-log-async-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
    Logger._resetForTest();
    Logger.getInstance().init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("records start + end events and returns trimmed response", async () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = await callAgentAsyncWithLog(agent, "async-hello");
    assert.equal(result, "async-hello");

    const entries = readJsonl(logFile);
    const phases = entries.filter((e) => e.type === "agent").map((e) => e.phase);
    assert.ok(phases.includes("start"));
    assert.ok(phases.includes("end"));
  });

  it("records end event with non-zero exitCode when agent fails", async () => {
    const agent = { command: "node", args: ["-e", "process.exit(2)"] };
    await assert.rejects(callAgentAsyncWithLog(agent, "x"));

    assert.ok(fs.existsSync(logFile));
    const entries = readJsonl(logFile);
    const endEvent = entries.find((e) => e.phase === "end");
    assert.ok(endEvent, "end event should be recorded even on failure");
    assert.notEqual(endEvent.exitCode, 0, "exitCode should be non-zero on failure");
  });
});
