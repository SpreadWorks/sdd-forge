import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { callAgent, callAgentAsync, resolveAgent } from "../../src/lib/agent.js";

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

  it("falls back to stdin when args exceed threshold", () => {
    // cat reads from stdin and outputs it — verifies stdin piping works
    const agent = { command: "cat", args: [] };
    const largePrompt = "X".repeat(200_000);
    const result = callAgent(agent, largePrompt);
    assert.equal(result, largePrompt);
  });
});

describe("callAgentAsync", () => {
  it("returns output via promise", async () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = await callAgentAsync(agent, "async-test");
    assert.equal(result, "async-test");
  });

  it("falls back to stdin when args exceed threshold", async () => {
    const agent = { command: "cat", args: [] };
    const largePrompt = "Y".repeat(200_000);
    const result = await callAgentAsync(agent, largePrompt);
    assert.equal(result, largePrompt);
  });
});

describe("resolveAgent", () => {
  it("resolves agent via commands config", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: { claude: { command: "claude", args: ["-p", "{{PROMPT}}"], profiles: { default: [], opus: ["--model", "opus"] } } },
        commands: { "docs.review": { agent: "claude", profile: "opus" } },
      },
    };
    const result = resolveAgent(cfg, "docs.review");
    assert.equal(result.command, "claude");
    assert.deepEqual(result.args, ["--model", "opus", "-p", "{{PROMPT}}"]);
  });

  it("uses default agent when commandId not provided", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: { claude: { command: "claude", args: [] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.deepEqual(result, { command: "claude", args: [] });
  });

  it("returns null when no agent configured", () => {
    const result = resolveAgent({});
    assert.equal(result, null);
  });

  it("falls back to parent command", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: { claude: { command: "claude", args: ["-p", "{{PROMPT}}"], profiles: { default: [], sonnet: ["--model", "sonnet"] } } },
        commands: { "docs": { agent: "claude", profile: "sonnet" } },
      },
    };
    const result = resolveAgent(cfg, "docs.forge");
    assert.deepEqual(result.args, ["--model", "sonnet", "-p", "{{PROMPT}}"]);
  });

  it("returns null when provider not found", () => {
    const cfg = { agent: { providers: {} } };
    const result = resolveAgent(cfg, "nonexistent");
    assert.equal(result, null);
  });
});
