import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { callAgent, callAgentAsync, resolveAgent, BUILTIN_PROVIDERS, DEFAULT_AGENT_TIMEOUT_MS } from "../../../src/lib/agent.js";

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

  // --- GAP-2: callAgent timeoutMs fallback chain ---

  it("uses explicit timeoutMs argument when provided", () => {
    const agent = { command: "node", args: ["-e", "setTimeout(()=>{},5000)"], timeoutMs: 120000 };
    // Explicit 50ms timeout should kill the process
    assert.throws(() => callAgent(agent, "", 50));
  });

  it("falls back to agent.timeoutMs when timeoutMs argument is falsy", () => {
    const agent = { command: "node", args: ["-e", "setTimeout(()=>{},5000)"], timeoutMs: 50 };
    // agent.timeoutMs = 50 should cause timeout (undefined as explicit arg triggers fallback)
    assert.throws(() => callAgent(agent, "", undefined));
  });

  it("falls back to DEFAULT_AGENT_TIMEOUT_MS when both are missing", () => {
    const agent = { command: "echo", args: ["ok"] };
    // Should succeed since DEFAULT (300s) is far longer than echo
    const result = callAgent(agent, "test");
    assert.equal(result, "ok test");
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

  // --- GAP-3: callAgentAsync timeoutMs fallback chain ---

  it("uses explicit timeoutMs argument when provided (async)", async () => {
    const agent = { command: "node", args: ["-e", "setTimeout(()=>{},5000)"], timeoutMs: 120000 };
    await assert.rejects(callAgentAsync(agent, "", 50));
  });

  it("falls back to agent.timeoutMs when timeoutMs argument is falsy (async)", async () => {
    const agent = { command: "node", args: ["-e", "setTimeout(()=>{},5000)"], timeoutMs: 50 };
    await assert.rejects(callAgentAsync(agent, "", undefined));
  });

  it("falls back to DEFAULT_AGENT_TIMEOUT_MS when both are missing (async)", async () => {
    const agent = { command: "echo", args: ["{{PROMPT}}"] };
    const result = await callAgentAsync(agent, "test");
    assert.equal(result, "test");
  });
});

describe("callAgentAsync retry", () => {
  it("retries on empty response and succeeds", async () => {
    // node script: first call outputs nothing, second call outputs "ok"
    const script = `
      const fs = require("fs");
      const f = process.argv[1];
      let n = 0;
      try { n = Number(fs.readFileSync(f, "utf8")); } catch {}
      n++;
      fs.writeFileSync(f, String(n));
      if (n === 1) process.stdout.write("");
      else process.stdout.write("ok");
    `;
    const tmp = `/tmp/agent-retry-test-${Date.now()}`;
    const agent = { command: "node", args: ["-e", script, tmp] };
    const result = await callAgentAsync(agent, "", undefined, undefined, { retryCount: 2, retryDelayMs: 10 });
    assert.equal(result, "ok");
    const { unlinkSync } = await import("node:fs");
    try { unlinkSync(tmp); } catch {}
  });

  it("does not retry when retryCount is 0", async () => {
    const agent = { command: "node", args: ["-e", ""] };
    // Empty output, no retry — resolves with empty string
    const result = await callAgentAsync(agent, "");
    assert.equal(result, "");
  });

  it("retries on non-zero exit and succeeds", async () => {
    const tmp = `/tmp/agent-retry-exit-${Date.now()}`;
    const script = `
      const fs = require("fs");
      const f = process.argv[1];
      let n = 0;
      try { n = Number(fs.readFileSync(f, "utf8")); } catch {}
      n++;
      fs.writeFileSync(f, String(n));
      if (n === 1) process.exit(1);
      process.stdout.write("recovered");
    `;
    const agent = { command: "node", args: ["-e", script, tmp] };
    const result = await callAgentAsync(agent, "", undefined, undefined, { retryCount: 1, retryDelayMs: 10 });
    assert.equal(result, "recovered");
    const { unlinkSync } = await import("node:fs");
    try { unlinkSync(tmp); } catch {}
  });

  it("does not retry on signal kill (timeout)", async () => {
    const agent = { command: "node", args: ["-e", "setTimeout(() => {}, 60000)"] };
    await assert.rejects(
      callAgentAsync(agent, "", 50, undefined, { retryCount: 2, retryDelayMs: 10 }),
      (err) => err.killed === true || err.signal != null,
    );
  });

  it("throws last error after all retries exhausted", async () => {
    const agent = { command: "node", args: ["-e", "process.exit(1)"] };
    await assert.rejects(
      callAgentAsync(agent, "", undefined, undefined, { retryCount: 1, retryDelayMs: 10 }),
      /exit=1/,
    );
  });
});

describe("resolveAgent", () => {
  it("uses default agent when commandId not provided", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        providers: { "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.command, "claude");
    assert.equal(result.timeoutMs, 300000);
    assert.equal(result.providerKey, "claude");
  });

  it("returns null when no agent configured", () => {
    const result = resolveAgent({});
    assert.equal(result, null);
  });

  it("resolves agent via useProfile and profile entry", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        providers: {
          "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"] },
        },
        useProfile: "high",
        profiles: { high: { docs: "claude/opus" } },
      },
    };
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("opus"));
  });

  it("falls back to agent.default via prefix match when profile entry matches parent command", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        providers: {
          "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"] },
        },
        useProfile: "high",
        profiles: { high: { docs: "claude/opus" } },
      },
    };
    // "docs" prefix matches "docs.review" via prefix match
    const result = resolveAgent(cfg, "docs.review");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("opus"));
  });

  it("returns null when provider not found in providers or builtins", () => {
    const cfg = {
      agent: {
        default: "unknown-provider",
        providers: {},
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result, null);
  });

  it("includes timeoutMs from config agent.timeout (seconds to ms)", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        timeout: 600,
        providers: { "claude/sonnet": { command: "claude", args: [] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.timeoutMs, 600000);
  });

  it("uses DEFAULT_AGENT_TIMEOUT_MS when agent.timeout is not set", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        providers: { "claude/sonnet": { command: "claude", args: [] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.timeoutMs, 300000);
  });

  // --- GAP-1: resolveAgent boundary values ---

  it("handles agent.timeout = 0 (returns timeoutMs: 0)", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        timeout: 0,
        providers: { "claude/sonnet": { command: "claude", args: [] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.timeoutMs, 0);
  });

  it("falls back to DEFAULT_AGENT_TIMEOUT_MS when agent.timeout is null", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        timeout: null,
        providers: { "claude/sonnet": { command: "claude", args: [] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.timeoutMs, DEFAULT_AGENT_TIMEOUT_MS);
  });

  it("handles agent.timeout as string number via implicit coercion", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        timeout: "120",
        providers: { "claude/sonnet": { command: "claude", args: [] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.timeoutMs, 120000);
  });

  it("uses built-in providers when config has no providers field", () => {
    const cfg = { agent: { default: "claude/sonnet" } };
    const result = resolveAgent(cfg);
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("sonnet"));
  });

  it("user-defined provider overrides built-in with same key", () => {
    const cfg = {
      agent: {
        default: "claude/opus",
        providers: { "claude/opus": { command: "my-claude", args: ["{{PROMPT}}"] } },
      },
    };
    const result = resolveAgent(cfg);
    assert.equal(result.command, "my-claude");
  });

  it("throws when useProfile references a non-existent profile", () => {
    const cfg = {
      agent: {
        default: "claude/sonnet",
        useProfile: "nonexistent",
        profiles: { fast: { docs: "claude/sonnet" } },
      },
    };
    assert.throws(() => resolveAgent(cfg, "docs"), /Profile "nonexistent" is not defined/);
  });

  it("BUILTIN_PROVIDERS exports all 4 standard providers", () => {
    assert.ok(BUILTIN_PROVIDERS["claude/opus"]);
    assert.ok(BUILTIN_PROVIDERS["claude/sonnet"]);
    assert.ok(BUILTIN_PROVIDERS["codex/gpt-5.4"]);
    assert.ok(BUILTIN_PROVIDERS["codex/gpt-5.3"]);
  });
});
