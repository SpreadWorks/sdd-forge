import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { Log, Logger, writeLogEntry, resolveLogDir } from "../../../src/lib/log.js";
import { AgentLog } from "../../../src/lib/agent-log.js";

describe("Log base class", () => {
  it("has static filename as undefined by default", () => {
    assert.equal(Log.filename, undefined);
  });

  it("isEnabled returns true by default", () => {
    const log = new Log();
    assert.equal(log.isEnabled({}), true);
  });

  it("toJSON returns an object", () => {
    const log = new Log();
    const json = log.toJSON();
    assert.equal(typeof json, "object");
  });
});

describe("AgentLog extends Log", () => {
  it("is an instance of Log", () => {
    const log = new AgentLog();
    assert.ok(log instanceof Log, "AgentLog should extend Log");
  });

  it("has static filename = 'prompts.jsonl'", () => {
    assert.equal(AgentLog.filename, "prompts.jsonl");
  });

  it("isEnabled returns cfg.logs.prompts value", () => {
    const log = new AgentLog();
    assert.equal(log.isEnabled({ logs: { prompts: true } }), true);
    assert.equal(log.isEnabled({ logs: { prompts: false } }), false);
  });

  it("isEnabled returns falsy when cfg.logs.prompts is missing", () => {
    const log = new AgentLog();
    assert.ok(!log.isEnabled({}));
    assert.ok(!log.isEnabled(null));
    assert.ok(!log.isEnabled({ logs: {} }));
  });

  it("toJSON returns expected fields", () => {
    const log = new AgentLog({ spec: "test-spec", phase: "draft" });
    log.prompt = "test prompt";
    log.executeStartAt = new Date("2026-01-01T00:00:00Z");
    log.executeEndAt = new Date("2026-01-01T00:00:05Z");
    log.executeTime = 5;

    const json = log.toJSON();
    assert.equal(json.spec, "test-spec");
    assert.equal(json.phase, "draft");
    assert.equal(json.prompt, "test prompt");
    assert.equal(json.executeStartAt, "2026-01-01T00:00:00.000Z");
    assert.equal(json.executeEndAt, "2026-01-01T00:00:05.000Z");
    assert.equal(json.executeTime, 5);
  });

  it("toJSON returns null for unset fields (except executeStartAt)", () => {
    const log = new AgentLog();
    const json = log.toJSON();
    assert.equal(json.spec, null);
    assert.equal(json.phase, null);
    assert.equal(json.prompt, null);
    assert.ok(json.executeStartAt !== null, "executeStartAt is auto-set in constructor");
    assert.equal(json.executeEndAt, null);
    assert.equal(json.executeTime, null);
  });
});

describe("writeLogEntry", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "log-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes JSONL entry when isEnabled is true", async () => {
    const log = new AgentLog({ spec: "s1", phase: "draft" });
    log.prompt = "hello";
    log.executeStartAt = new Date("2026-01-01T00:00:00Z");
    log.executeEndAt = new Date("2026-01-01T00:00:01Z");
    log.executeTime = 1;

    const cfg = { logs: { prompts: true, dir: tmpDir } };
    await writeLogEntry(log, tmpDir, cfg);

    const logFile = path.join(tmpDir, "prompts.jsonl");
    assert.ok(fs.existsSync(logFile), "log file should exist");

    const lines = fs.readFileSync(logFile, "utf8").trim().split("\n");
    assert.equal(lines.length, 1);

    const entry = JSON.parse(lines[0]);
    assert.equal(entry.spec, "s1");
    assert.equal(entry.phase, "draft");
    assert.equal(entry.prompt, "hello");
  });

  it("skips writing when isEnabled returns false", async () => {
    const log = new AgentLog({ spec: "s1", phase: "draft" });
    const cfg = { logs: { prompts: false, dir: tmpDir } };
    await writeLogEntry(log, tmpDir, cfg);

    const logFile = path.join(tmpDir, "prompts.jsonl");
    assert.ok(!fs.existsSync(logFile), "log file should not exist");
  });

  it("appends multiple entries", async () => {
    const cfg = { logs: { prompts: true, dir: tmpDir } };

    const log1 = new AgentLog({ spec: "s1", phase: "draft" });
    log1.prompt = "first";
    await writeLogEntry(log1, tmpDir, cfg);

    const log2 = new AgentLog({ spec: "s2", phase: "spec" });
    log2.prompt = "second";
    await writeLogEntry(log2, tmpDir, cfg);

    const logFile = path.join(tmpDir, "prompts.jsonl");
    const lines = fs.readFileSync(logFile, "utf8").trim().split("\n");
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[0]).prompt, "first");
    assert.equal(JSON.parse(lines[1]).prompt, "second");
  });

  it("does not reject on write failure (writes to stderr)", async () => {
    const log = new AgentLog({ spec: "s1", phase: "draft" });
    const cfg = { logs: { prompts: true, dir: "/nonexistent/path/that/cannot/exist" } };

    // Should not reject
    await assert.doesNotReject(writeLogEntry(log, "/nonexistent", cfg));
  });
});

describe("Logger singleton", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-test-"));
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

  it("init stores cwd and cfg", () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { prompts: true, dir: tmpDir } });
    assert.equal(inst.initialized, true);
  });

  it("log writes entry when initialized and enabled", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { prompts: true, dir: tmpDir } });

    const log = new AgentLog({ spec: "s1", phase: "draft" });
    log.prompt = "test";
    await inst.log(log);

    const logFile = path.join(tmpDir, "prompts.jsonl");
    assert.ok(fs.existsSync(logFile));
    const entry = JSON.parse(fs.readFileSync(logFile, "utf8").trim());
    assert.equal(entry.spec, "s1");
    assert.equal(entry.prompt, "test");
  });

  it("log warns and skips when not initialized", async () => {
    const inst = Logger.getInstance();
    const log = new AgentLog({ spec: "s1", phase: "draft" });

    const warnings = [];
    const origWrite = process.stderr.write;
    process.stderr.write = (msg) => { warnings.push(msg); return true; };
    try {
      await inst.log(log);
    } finally {
      process.stderr.write = origWrite;
    }

    assert.ok(warnings.some(w => w.includes("not initialized")), "should warn about not initialized");
  });

  it("log calls finalize before writing", async () => {
    const inst = Logger.getInstance();
    inst.init(tmpDir, { logs: { prompts: true, dir: tmpDir } });

    const log = new AgentLog({ spec: "s1", phase: "draft" });
    log.prompt = "test";
    // executeStartAt is set in constructor, executeEndAt/Time should be set by finalize
    assert.ok(log.executeStartAt instanceof Date, "executeStartAt should be set in constructor");
    assert.equal(log.executeEndAt, null, "executeEndAt should be null before log()");

    await inst.log(log);

    assert.ok(log.executeEndAt instanceof Date, "executeEndAt should be set after log()");
    assert.equal(typeof log.executeTime, "number", "executeTime should be a number after log()");
  });
});

describe("Log finalize hook", () => {
  it("Log base class finalize is a no-op", () => {
    const log = new Log();
    assert.doesNotThrow(() => log.finalize());
  });

  it("AgentLog finalize sets executeEndAt and executeTime", () => {
    const log = new AgentLog({ spec: "s1", phase: "draft" });
    // executeStartAt is set in constructor
    assert.ok(log.executeStartAt instanceof Date);

    log.finalize();

    assert.ok(log.executeEndAt instanceof Date);
    assert.equal(typeof log.executeTime, "number");
    assert.ok(log.executeTime >= 0);
  });
});

describe("AgentLog constructor sets executeStartAt", () => {
  it("sets executeStartAt automatically", () => {
    const before = new Date();
    const log = new AgentLog({ spec: "test", phase: "draft" });
    const after = new Date();

    assert.ok(log.executeStartAt instanceof Date);
    assert.ok(log.executeStartAt >= before);
    assert.ok(log.executeStartAt <= after);
  });

  it("accepts prompt in constructor", () => {
    const log = new AgentLog({ spec: "test", phase: "draft", prompt: "hello" });
    assert.equal(log.prompt, "hello");
  });
});

describe("resolveLogDir", () => {
  it("uses cfg.logs.dir when set", () => {
    const result = resolveLogDir("/some/cwd", { logs: { dir: "/custom/logs" } });
    assert.equal(result, "/custom/logs");
  });

  it("falls back to workDir/logs when logs.dir is not set", () => {
    const result = resolveLogDir("/some/cwd", { agent: { workDir: ".mywork" } });
    assert.ok(result.endsWith(path.join(".mywork", "logs")));
  });

  it("uses .tmp as default workDir", () => {
    const result = resolveLogDir("/some/cwd", {});
    assert.ok(result.endsWith(path.join(".tmp", "logs")));
  });
});
