/**
 * Logger integration tests for the Agent service.
 *
 * The Agent service wraps every call() in Logger.agent() start/end events,
 * preserving requestId across the pair and recording exitCode on failure.
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { Agent } from "../../../src/lib/agent.js";
import { ProviderRegistry } from "../../../src/lib/provider.js";
import { Logger } from "../../../src/lib/log.js";
import { todayLocal, readJsonl } from "../../helpers/log-fixtures.js";

function makeAgentService(profile, tmpDir, configOverrides) {
  const config = {
    agent: {
      default: "test/exec",
      providers: { "test/exec": profile },
      ...(configOverrides || {}),
    },
  };
  const registry = new ProviderRegistry(config.agent.providers);
  return new Agent({
    config,
    paths: { root: tmpDir, agentWorkDir: path.join(tmpDir, ".tmp") },
    registry,
    logger: Logger.getInstance(),
  });
}

describe("Agent.call() — Logger integration", () => {
  let tmpDir;
  let logFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-log-"));
    logFile = path.join(tmpDir, `sdd-forge-${todayLocal()}.jsonl`);
    Logger._resetForTest();
    Logger.getInstance().init(tmpDir, { logs: { enabled: true, dir: tmpDir } }, { entryCommand: "test" });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Logger._resetForTest();
  });

  it("returns the trimmed response and writes start + end events", async () => {
    const agent = makeAgentService({ command: "echo", args: ["{{PROMPT}}"] }, tmpDir);
    const result = await agent.call("hello", { commandId: "test" });
    assert.equal(result, "hello");

    await Logger.getInstance().flush();

    assert.ok(fs.existsSync(logFile), "log file should exist after agent.call");
    const entries = readJsonl(logFile);
    const phases = entries.filter((e) => e.type === "agent").map((e) => e.phase);
    assert.ok(phases.includes("start"), "start event should be recorded");
    assert.ok(phases.includes("end"), "end event should be recorded");

    const startEvent = entries.find((e) => e.phase === "start");
    const endEvent = entries.find((e) => e.phase === "end");
    assert.equal(startEvent.requestId, endEvent.requestId, "start/end should share requestId");
  });

  it("records the prompt file in the end event", async () => {
    const agent = makeAgentService({ command: "echo", args: ["{{PROMPT}}"] }, tmpDir);
    const result = await agent.call("world", { commandId: "test" });
    assert.equal(result, "world");
    await Logger.getInstance().flush();

    const entries = readJsonl(logFile);
    const endEvent = entries.find((e) => e.phase === "end");
    assert.ok(endEvent, "end event should be present");
    assert.ok(endEvent.promptFile, "end event should have promptFile path");
    const promptFilePath = path.resolve(tmpDir, endEvent.promptFile);
    assert.ok(fs.existsSync(promptFilePath), "prompt file should exist");
  });

  it("records end event with non-zero exitCode when agent fails", async () => {
    const agent = makeAgentService({ command: "node", args: ["-e", "process.exit(2)"] }, tmpDir);
    await assert.rejects(agent.call("x", { commandId: "test" }));
    await Logger.getInstance().flush();

    assert.ok(fs.existsSync(logFile));
    const entries = readJsonl(logFile);
    const endEvent = entries.find((e) => e.phase === "end");
    assert.ok(endEvent, "end event should be recorded even on failure");
    assert.notEqual(endEvent.exitCode, 0, "exitCode should be non-zero on failure");
  });
});
