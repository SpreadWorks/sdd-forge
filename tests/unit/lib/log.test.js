import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { Log, logger, resolveLogDir } from "../../../src/lib/log.js";
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

  it("toJSON returns null for unset fields", () => {
    const log = new AgentLog();
    const json = log.toJSON();
    assert.equal(json.spec, null);
    assert.equal(json.phase, null);
    assert.equal(json.prompt, null);
    assert.equal(json.executeStartAt, null);
    assert.equal(json.executeEndAt, null);
    assert.equal(json.executeTime, null);
  });
});

describe("logger", () => {
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
    await logger(log, tmpDir, cfg);

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
    await logger(log, tmpDir, cfg);

    const logFile = path.join(tmpDir, "prompts.jsonl");
    assert.ok(!fs.existsSync(logFile), "log file should not exist");
  });

  it("appends multiple entries", async () => {
    const cfg = { logs: { prompts: true, dir: tmpDir } };

    const log1 = new AgentLog({ spec: "s1", phase: "draft" });
    log1.prompt = "first";
    await logger(log1, tmpDir, cfg);

    const log2 = new AgentLog({ spec: "s2", phase: "spec" });
    log2.prompt = "second";
    await logger(log2, tmpDir, cfg);

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
    await assert.doesNotReject(logger(log, "/nonexistent", cfg));
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
