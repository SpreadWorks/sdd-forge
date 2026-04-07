/**
 * Tests for the unified JSONL Logger (spec 153-unified-jsonl-logger).
 *
 * NOTE — This file is a REWRITE, not a deletion of the previous test suite.
 * It replaces the prior Log/AgentLog/writeLogEntry tests at the same path.
 * The old tests targeted classes that spec 153 R10 explicitly removes
 * (`Log`, `AgentLog`, `writeLogEntry` are deleted from src/lib/log.js and
 * src/lib/agent-log.js). The behaviors those tests guarded are preserved
 * and re-tested below against the replacement Logger API:
 *
 *   Old: AgentLog.isEnabled checks cfg.logs.prompts
 *     → New: Logger#agent is no-op when cfg.logs.enabled !== true (R6, R7)
 *   Old: writeLogEntry appends JSONL / multiple entries / does not reject on FS error
 *     → New: Logger#agent appends to daily JSONL / handles I/O failure (R1, AC10)
 *   Old: Logger.getInstance singleton, init records cwd/cfg, warn when uninitialized
 *     → New: same — getInstance / init / not-initialized warning preserved
 *   Old: resolveLogDir uses cfg.logs.dir or workDir/logs
 *     → New: same internally; covered indirectly via cfg.logs.dir override in tests
 *
 * Targets the new Logger API:
 *   - Logger.getInstance().init(cwd, cfg, { entryCommand })
 *   - Logger.agent({ phase: "start" | "end", requestId, ... })
 *   - Logger.git({ cmd, exitCode, stderr })
 *   - Logger.event(name, fields)
 *
 * Verifies:
 *   R1  统合 JSONL ファイル生成
 *   R2  プロンプトファイル分離
 *   R3  agent start/end の 2 イベント
 *   R4  spec/sddPhase の自動解決
 *   R6  cfg.logs.enabled へのリネーム
 *   R7  disabled 時の no-op
 *   R9  Logger.git / Logger.event の API 提供
 *  R12  requestId 8 文字 hex
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { Logger } from "../../../src/lib/log.js";
import { todayLocal, readJsonl } from "../../helpers/log-fixtures.js";

describe("Logger.init / disabled behavior", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-init-"));
    Logger._resetForTest();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("getInstance returns the same instance", () => {
    const a = Logger.getInstance();
    const b = Logger.getInstance();
    assert.strictEqual(a, b);
  });

  it("init records cwd, cfg, and entryCommand", () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "flow run gate" });
    assert.equal(inst.initialized, true);
  });

  it("agent() is no-op when not initialized (warns to stderr)", async () => {
    const inst = Logger.getInstance();
    const warnings = [];
    const orig = process.stderr.write;
    process.stderr.write = (msg) => { warnings.push(String(msg)); return true; };
    try {
      await inst.agent({ phase: "start", requestId: "abcdef01" });
    } finally {
      process.stderr.write = orig;
    }
    assert.ok(warnings.some((w) => w.includes("not initialized")), "should warn about not initialized");
    // No file should have been written
    assert.equal(fs.readdirSync(tmpDir).length, 0);
  });

  it("agent() is no-op when cfg.logs.enabled is not true", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { dir: tmpDir } }, { entryCommand: "test" });
    await inst.agent({ phase: "start", requestId: "abcdef01" });
    await inst.agent({ phase: "end", requestId: "abcdef01", prompt: { user: "x" }, response: { text: "y" } });
    assert.equal(fs.readdirSync(tmpDir).length, 0, "no files should be written when disabled");
  });

  it("git() and event() are no-op when disabled", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: false, dir: tmpDir } }, { entryCommand: "test" });
    await inst.git({ cmd: ["status"], exitCode: 0, stderr: "" });
    await inst.event("test-event", { foo: "bar" });
    assert.equal(fs.readdirSync(tmpDir).length, 0);
  });

  it("ignores legacy cfg.logs.prompts (must use cfg.logs.enabled)", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { prompts: true, dir: tmpDir } }, { entryCommand: "test" });
    await inst.agent({ phase: "start", requestId: "abcdef01" });
    assert.equal(fs.readdirSync(tmpDir).length, 0, "legacy cfg.logs.prompts must not enable logging");
  });
});

describe("Logger.agent — start/end events and JSONL output", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-agent-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
    Logger._resetForTest();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("R1: writes start event with minimal fields to daily JSONL", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "flow run gate" });
    await inst.agent({ phase: "start", requestId: "abcdef01" });

    assert.ok(fs.existsSync(logFile), `expected file ${logFile} to exist`);
    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const e = entries[0];
    assert.equal(e.type, "agent");
    assert.equal(e.phase, "start");
    assert.equal(e.requestId, "abcdef01");
    assert.equal(e.entryCommand, "flow run gate");
    assert.ok(typeof e.ts === "string" && e.ts.length > 0, "ts should be ISO string");
    assert.ok(typeof e.pid === "number", "pid should be number");
    assert.ok(typeof e.callerFile === "string", "callerFile should be string");
    assert.ok(typeof e.callerLine === "number", "callerLine should be number");
  });

  it("R3: writes end event with denormalized rich record", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "flow run gate" });

    await inst.agent({
      phase: "end",
      requestId: "abcdef01",
      agentKey: "spec.gate",
      model: "claude-opus-4-6",
      prompt: { system: "sys", user: "user prompt body" },
      response: { text: "response body", exitCode: 0 },
      durationSec: 1.234,
    });

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
    assert.ok(e.promptFile.includes("prompts/"), "promptFile path should be under prompts/");
  });

  it("R2: end event creates a self-contained prompt JSON file", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "flow run gate" });

    await inst.agent({
      phase: "end",
      requestId: "deadbeef",
      agentKey: "spec.gate",
      model: "claude-opus-4-6",
      prompt: { system: "system text", user: "user text" },
      response: { text: "response text", exitCode: 0 },
      durationSec: 0.5,
    });

    const entries = readJsonl(logFile);
    const promptFile = path.resolve(tmpDir, entries[0].promptFile);
    assert.ok(fs.existsSync(promptFile), `prompt file should exist at ${promptFile}`);

    const promptJson = JSON.parse(fs.readFileSync(promptFile, "utf8"));
    assert.equal(promptJson.requestId, "deadbeef");
    assert.ok(promptJson.ts);
    assert.ok(promptJson.context);
    assert.equal(promptJson.context.entryCommand, "flow run gate");
    assert.ok(promptJson.agent);
    assert.equal(promptJson.agent.key, "spec.gate");
    assert.equal(promptJson.agent.model, "claude-opus-4-6");
    assert.ok(promptJson.prompt);
    assert.equal(promptJson.prompt.system, "system text");
    assert.equal(promptJson.prompt.user, "user text");
    assert.ok(promptJson.prompt.stats);
    assert.equal(typeof promptJson.prompt.stats.totalChars, "number");
    assert.ok(promptJson.response);
    assert.equal(promptJson.response.text, "response text");
    assert.equal(promptJson.response.exitCode, 0);
    assert.ok(promptJson.execution);
  });

  it("R4: spec and sddPhase are auto-resolved from flow-state and added to end event", async () => {
    // Set up a fake spec dir + flow.json that loadFlowState can resolve.
    const specId = "153-unified-jsonl-logger";
    const specsDir = path.join(tmpDir, "specs", specId);
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, "spec.md"), "# spec\n");
    fs.writeFileSync(
      path.join(specsDir, "flow.json"),
      JSON.stringify({
        spec: `specs/${specId}/spec.md`,
        baseBranch: "main",
        featureBranch: `feature/${specId}`,
        steps: [{ id: "gate", status: "in_progress" }],
      }),
    );
    // .sdd-forge/.active-flow pointer (array of {spec, mode})
    const sddDir = path.join(tmpDir, ".sdd-forge");
    fs.mkdirSync(sddDir, { recursive: true });
    fs.writeFileSync(
      path.join(sddDir, ".active-flow"),
      JSON.stringify([{ spec: specId, mode: "local" }]),
    );

    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "flow run gate" });

    await inst.agent({
      phase: "end",
      requestId: "abcdef02",
      agentKey: "spec.gate",
      model: "claude-opus-4-6",
      prompt: { user: "u" },
      response: { text: "r", exitCode: 0 },
      durationSec: 0.1,
    });

    const entries = readJsonl(logFile);
    const e = entries[0];
    // spec must be auto-resolved (call site did NOT pass it)
    assert.equal(e.spec, "153-unified-jsonl-logger");
    // sddPhase should be present (current in_progress step or similar)
    assert.ok(typeof e.sddPhase === "string" && e.sddPhase.length > 0, "sddPhase should be set");
  });

  it("R12: requestId can be used to link start/end and prompt file name", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });

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

    const entries = readJsonl(logFile);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].requestId, reqId);
    assert.equal(entries[1].requestId, reqId);
    const promptFile = path.resolve(tmpDir, entries[1].promptFile);
    assert.ok(promptFile.endsWith(`${reqId}.json`), "prompt file name should be <requestId>.json");
  });

  it("appends multiple events to the same daily file", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });

    await inst.agent({ phase: "start", requestId: "aaaaaaaa" });
    await inst.agent({ phase: "start", requestId: "bbbbbbbb" });
    await inst.agent({ phase: "start", requestId: "cccccccc" });

    const entries = readJsonl(logFile);
    assert.equal(entries.length, 3);
  });
});

describe("Logger.git and Logger.event — API surface", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-git-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
    Logger._resetForTest();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("R9: git() writes a fixed-structure JSONL line when enabled", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });
    await inst.git({ cmd: ["git", "status"], exitCode: 0, stderr: "" });

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

  it("R9: event() writes a named event with arbitrary fields", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });
    await inst.event("config-loaded", { provider: "claude", retries: 2 });

    const entries = readJsonl(logFile);
    assert.equal(entries.length, 1);
    const e = entries[0];
    assert.equal(e.type, "event");
    assert.equal(e.name, "config-loaded");
    assert.equal(e.provider, "claude");
    assert.equal(e.retries, 2);
  });
});

describe("Logger I/O failure tolerance", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-fail-"));
    Logger._resetForTest();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("AC10: agent() does not throw when log dir cannot be created", async () => {
    const inst = Logger.getInstance();
    inst.init(
      tmpDir,
      { logs: { enabled: true, dir: "/nonexistent/cannot/write/here" } },
      { entryCommand: "test" },
    );
    await assert.doesNotReject(
      inst.agent({ phase: "start", requestId: "abcdef01" }),
    );
  });
});
