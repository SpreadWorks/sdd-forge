/**
 * Tests for the unified JSONL Logger.
 *
 * Logger is a container-managed service. These tests construct Logger
 * instances directly via `new Logger({ ... })` and verify:
 *
 *   - No-op behavior when `enabled` is false (R7).
 *   - Daily JSONL and per-request prompt JSON output (R1, R2, R3).
 *   - spec / sddPhase auto-resolution via the injected FlowManager (R4).
 *   - Logger.git / Logger.event API surface (R9).
 *   - requestId 8-char hex linkage between start/end and prompt files (R12).
 *   - I/O failure tolerance (AC10).
 *   - Caller-frame extraction excludes Logger's own file regardless of
 *     path representation differences (spec 186 R5).
 *   - No metric accumulation is attempted by the Logger (spec 186 R3).
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { Logger } from "../../../src/lib/log.js";
import { todayLocal, readJsonl } from "../../helpers/log-fixtures.js";

/** Build a Logger with sensible defaults for tests. */
function buildLogger(tmpDir, opts = {}) {
  return new Logger({
    logDir: opts.logDir ?? tmpDir,
    enabled: opts.enabled ?? true,
    entryCommand: opts.entryCommand ?? "test",
    flowManager: opts.flowManager ?? null,
    cwd: opts.cwd ?? tmpDir,
  });
}

describe("Logger — disabled behavior", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-init-"));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("agent() is no-op when enabled=false", async () => {
    const inst = buildLogger(tmpDir, { enabled: false });
    await inst.agent({ phase: "start", requestId: "abcdef01" });
    await inst.agent({ phase: "end", requestId: "abcdef01", prompt: { user: "x" }, response: { text: "y" } });
    await inst.flush();
    assert.equal(fs.readdirSync(tmpDir).length, 0, "no files should be written when disabled");
  });

  it("git() and event() are no-op when disabled", async () => {
    const inst = buildLogger(tmpDir, { enabled: false });
    await inst.git({ cmd: ["status"], exitCode: 0, stderr: "" });
    await inst.event("test-event", { foo: "bar" });
    await inst.flush();
    assert.equal(fs.readdirSync(tmpDir).length, 0);
  });

  it("enabled flag reflects constructor value", () => {
    assert.equal(buildLogger(tmpDir, { enabled: false }).enabled, false);
    assert.equal(buildLogger(tmpDir, { enabled: true }).enabled, true);
  });
});

describe("Logger.agent — start/end events and JSONL output", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-agent-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes start event with minimal fields to daily JSONL", async () => {
    const inst = buildLogger(tmpDir, { entryCommand: "flow run gate" });
    await inst.agent({ phase: "start", requestId: "abcdef01" });
    await inst.flush();

    assert.ok(fs.existsSync(logFile));
    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const e = entries[0];
    assert.equal(e.type, "agent");
    assert.equal(e.phase, "start");
    assert.equal(e.requestId, "abcdef01");
    assert.equal(e.entryCommand, "flow run gate");
    assert.ok(typeof e.ts === "string" && e.ts.length > 0);
    assert.ok(typeof e.pid === "number");
    assert.ok(typeof e.callerFile === "string");
    assert.ok(typeof e.callerLine === "number");
  });

  it("writes end event with denormalized rich record", async () => {
    const inst = buildLogger(tmpDir, { entryCommand: "flow run gate" });
    await inst.agent({
      phase: "end",
      requestId: "abcdef01",
      agentKey: "spec.gate",
      model: "claude-opus-4-6",
      prompt: { system: "sys", user: "user prompt body" },
      response: { text: "response body", exitCode: 0 },
      durationSec: 1.234,
    });
    await inst.flush();

    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const e = entries[0];
    assert.equal(e.type, "agent");
    assert.equal(e.phase, "end");
    assert.equal(e.requestId, "abcdef01");
    assert.equal(e.agentKey, "spec.gate");
    assert.equal(e.model, "claude-opus-4-6");
    assert.equal(e.exitCode, 0);
    assert.equal(typeof e.promptChars, "number");
    assert.equal(typeof e.systemChars, "number");
    assert.equal(typeof e.userChars, "number");
    assert.equal(typeof e.promptLines, "number");
    assert.equal(typeof e.responseChars, "number");
    assert.equal(typeof e.responseLines, "number");
    assert.equal(typeof e.durationSec, "number");
    assert.equal(typeof e.promptFile, "string");
    assert.ok(e.promptFile.includes("prompts/"));
  });

  it("end event creates a self-contained prompt JSON file", async () => {
    const inst = buildLogger(tmpDir, { entryCommand: "flow run gate" });
    await inst.agent({
      phase: "end",
      requestId: "deadbeef",
      agentKey: "spec.gate",
      model: "claude-opus-4-6",
      prompt: { system: "system text", user: "user text" },
      response: { text: "response text", exitCode: 0 },
      durationSec: 0.5,
    });
    await inst.flush();

    const entries = readJsonl(logFile);
    const promptFile = path.resolve(tmpDir, entries[0].promptFile);
    assert.ok(fs.existsSync(promptFile));

    const promptJson = JSON.parse(fs.readFileSync(promptFile, "utf8"));
    assert.equal(promptJson.requestId, "deadbeef");
    assert.ok(promptJson.ts);
    assert.equal(promptJson.context.entryCommand, "flow run gate");
    assert.equal(promptJson.agent.key, "spec.gate");
    assert.equal(promptJson.agent.model, "claude-opus-4-6");
    assert.equal(promptJson.prompt.system, "system text");
    assert.equal(promptJson.prompt.user, "user text");
    assert.equal(typeof promptJson.prompt.stats.totalChars, "number");
    assert.equal(promptJson.response.text, "response text");
    assert.equal(promptJson.response.exitCode, 0);
  });

  it("spec and sddPhase are resolved via injected flowManager", async () => {
    const flowManager = {
      resolveCurrentContext: () => ({ spec: "153-unified-jsonl-logger", sddPhase: "gate" }),
    };
    const inst = buildLogger(tmpDir, { flowManager });
    await inst.agent({
      phase: "end",
      requestId: "abcdef02",
      agentKey: "spec.gate",
      model: "m",
      prompt: { user: "u" },
      response: { text: "r", exitCode: 0 },
      durationSec: 0.1,
    });
    await inst.flush();

    const entries = readJsonl(logFile);
    assert.equal(entries[0].spec, "153-unified-jsonl-logger");
    assert.equal(entries[0].sddPhase, "gate");
  });

  it("spec/sddPhase are null when no flowManager is provided", async () => {
    const inst = buildLogger(tmpDir);
    await inst.agent({
      phase: "end",
      requestId: "abcdef03",
      agentKey: "k",
      model: "m",
      prompt: { user: "u" },
      response: { text: "r", exitCode: 0 },
      durationSec: 0.1,
    });
    await inst.flush();
    const entries = readJsonl(logFile);
    assert.equal(entries[0].spec, null);
    assert.equal(entries[0].sddPhase, null);
  });

  it("requestId links start/end and prompt file name", async () => {
    const inst = buildLogger(tmpDir);
    const reqId = "12345678";
    await inst.agent({ phase: "start", requestId: reqId });
    await inst.agent({
      phase: "end",
      requestId: reqId,
      agentKey: "k",
      model: "m",
      prompt: { user: "u" },
      response: { text: "r", exitCode: 0 },
      durationSec: 0.1,
    });
    await inst.flush();

    const entries = readJsonl(logFile);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].requestId, reqId);
    assert.equal(entries[1].requestId, reqId);
    const promptFile = path.resolve(tmpDir, entries[1].promptFile);
    assert.ok(promptFile.endsWith(`${reqId}.json`));
  });

  it("appends multiple events to the same daily file", async () => {
    const inst = buildLogger(tmpDir);
    await inst.agent({ phase: "start", requestId: "aaaaaaaa" });
    await inst.agent({ phase: "start", requestId: "bbbbbbbb" });
    await inst.agent({ phase: "start", requestId: "cccccccc" });
    await inst.flush();
    const entries = readJsonl(logFile);
    assert.equal(entries.length, 3);
  });

  it("does not call accumulateAgentMetrics (metric is agent's responsibility)", async () => {
    let called = false;
    const flowManager = {
      resolveCurrentContext: () => ({ spec: "186-logger-container-service", sddPhase: "test" }),
      accumulateAgentMetrics: () => { called = true; },
    };
    const inst = buildLogger(tmpDir, { flowManager });
    await inst.agent({
      phase: "end",
      requestId: "abcdef04",
      agentKey: "k",
      model: "m",
      prompt: { user: "u" },
      response: { text: "r", exitCode: 0 },
      durationSec: 0.1,
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    await inst.flush();
    assert.equal(called, false, "Logger must not accumulate metrics directly");
  });
});

describe("Logger.git and Logger.event — API surface", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-git-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("git() writes a fixed-structure JSONL line when enabled", async () => {
    const inst = buildLogger(tmpDir);
    await inst.git({ cmd: ["git", "status"], exitCode: 0, stderr: "" });
    await inst.flush();
    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const e = entries[0];
    assert.equal(e.type, "git");
    assert.deepEqual(e.cmd, ["git", "status"]);
    assert.equal(e.exitCode, 0);
    assert.equal(e.stderr, "");
    assert.ok(e.ts);
    assert.equal(e.entryCommand, "test");
  });

  it("event() writes a named event with arbitrary fields", async () => {
    const inst = buildLogger(tmpDir);
    await inst.event("config-loaded", { provider: "claude", retries: 2 });
    await inst.flush();
    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const e = entries[0];
    assert.equal(e.type, "event");
    assert.equal(e.name, "config-loaded");
    assert.equal(e.provider, "claude");
    assert.equal(e.retries, 2);
  });
});

describe("Logger — caller frame extraction", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-caller-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("callerFile points to the test file, not the Logger module", async () => {
    const inst = buildLogger(tmpDir);
    await inst.event("caller-check");
    await inst.flush();
    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const cf = entries[0].callerFile;
    assert.ok(cf, "callerFile should be set");
    assert.ok(!cf.endsWith("/src/lib/log.js"), `callerFile should not be Logger itself: ${cf}`);
    assert.ok(cf.endsWith("log.test.js") || cf.includes("log.test.js"), `callerFile should point to the test: ${cf}`);
  });
});

describe("Logger — I/O failure tolerance", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-fail-"));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("agent() does not throw when log dir cannot be created", async () => {
    const inst = buildLogger(tmpDir, { logDir: "/nonexistent/cannot/write/here" });
    await assert.doesNotReject(inst.agent({ phase: "start", requestId: "abcdef01" }));
  });
});
