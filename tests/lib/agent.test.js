import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { callAgent, resolveAgent } from "../../src/lib/agent.js";

describe("callAgent", () => {
  it("calls a command and returns trimmed output", () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = callAgent(agent, "hello world");
    assert.equal(result, "hello world");
  });

  it("replaces {{PROMPT}} token in args", () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = callAgent(agent, "test-prompt");
    assert.equal(result, "test-prompt");
  });

  it("appends prompt when no {{PROMPT}} token", () => {
    const agent = { command: "echo", args: ["-n"] };
    const result = callAgent(agent, "appended");
    assert.match(result, /appended/);
  });

  it("throws on failing command", () => {
    const agent = { command: "node", args: ["-e", "process.exit(1)"] };
    assert.throws(() => callAgent(agent, "test"));
  });
});

describe("resolveAgent", () => {
  it("returns agent config by name", () => {
    const cfg = {
      providers: { claude: { command: "claude", args: [] } },
    };
    const result = resolveAgent(cfg, "claude");
    assert.deepEqual(result, { command: "claude", args: [] });
  });

  it("uses defaultAgent when name not provided", () => {
    const cfg = {
      defaultAgent: "claude",
      providers: { claude: { command: "claude", args: [] } },
    };
    const result = resolveAgent(cfg);
    assert.deepEqual(result, { command: "claude", args: [] });
  });

  it("returns null when no agent configured", () => {
    const result = resolveAgent({});
    assert.equal(result, null);
  });

  it("returns null when provider not found", () => {
    const cfg = { providers: {} };
    const result = resolveAgent(cfg, "nonexistent");
    assert.equal(result, null);
  });
});
