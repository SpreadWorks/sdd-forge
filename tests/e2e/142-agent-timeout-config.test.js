/**
 * Tests for spec #142: Agent Timeout Configuration
 *
 * Validates that:
 * - Command files use agent.timeoutMs from resolveAgent instead of converting cfg.agent.timeout directly
 * - Command files do not pass DEFAULT_AGENT_TIMEOUT_MS directly to callAgent/callAgentAsync
 * - resolveAgent output includes timeoutMs which propagates through the pipeline
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// GAP-5: Static analysis regression tests
// No command file should convert cfg.agent.timeout to ms directly.
// No command file should pass DEFAULT_AGENT_TIMEOUT_MS to callAgent/callAgentAsync.
// All timeout should come from agent.timeoutMs (set by resolveAgent).
// ---------------------------------------------------------------------------

describe("no direct timeout references in command files", () => {
  const commandFiles = [
    "src/docs/commands/text.js",
    "src/docs/commands/enrich.js",
    "src/docs/commands/readme.js",
    "src/docs/commands/translate.js",
    "src/docs/commands/agents.js",
    "src/docs/commands/forge.js",
    "src/flow/lib/run-review.js",
  ];

  it("no command file converts cfg.agent.timeout to ms inline", () => {
    for (const file of commandFiles) {
      const fullPath = join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf8");
      // Match patterns like: config.agent.timeout * 1000, config.agent?.timeout * 1000,
      // cfg.agent.timeout * 1000, Number(config.agent.timeout) * 1000, etc.
      const directConversion = content.match(
        /(?:config|cfg)\.agent\??\.\s*timeout\s*\*\s*1000|Number\(\s*(?:config|cfg)\.agent\??\.\s*timeout\s*\)\s*\*\s*1000/,
      );
      assert.ok(
        !directConversion,
        `${file} should not convert cfg.agent.timeout to ms directly. Found: ${directConversion?.[0]}`,
      );
    }
  });

  it("no command file passes DEFAULT_AGENT_TIMEOUT_MS to callAgent or callAgentAsync", () => {
    for (const file of commandFiles) {
      const fullPath = join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf8");
      // Match: callAgent(...DEFAULT_AGENT_TIMEOUT_MS...) or callAgentAsync(...DEFAULT_AGENT_TIMEOUT_MS...)
      const directDefault = content.match(
        /callAgent(?:Async)?\s*\([^)]*DEFAULT_AGENT_TIMEOUT_MS/,
      );
      assert.ok(
        !directDefault,
        `${file} should not pass DEFAULT_AGENT_TIMEOUT_MS directly to callAgent/callAgentAsync. Found: ${directDefault?.[0]}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// GAP-6: Acceptance — resolveAgent output carries timeoutMs
// ---------------------------------------------------------------------------

describe("resolveAgent timeout propagation", () => {
  it("configured timeout propagates via resolveAgent timeoutMs", async () => {
    const { resolveAgent } = await import("../../src/lib/agent.js");
    const cfg = {
      agent: {
        default: "echo-agent",
        timeout: 60,
        providers: {
          "echo-agent": {
            command: "echo",
            args: ["{{PROMPT}}"],
          },
        },
      },
    };
    const agent = resolveAgent(cfg);
    assert.equal(agent.timeoutMs, 60000, "resolveAgent should convert 60s to 60000ms");
    assert.equal(agent.command, "echo");
  });

  it("default timeout applies when agent.timeout is absent", async () => {
    const { resolveAgent, DEFAULT_AGENT_TIMEOUT_MS } = await import("../../src/lib/agent.js");
    const cfg = {
      agent: {
        default: "echo-agent",
        providers: {
          "echo-agent": {
            command: "echo",
            args: ["{{PROMPT}}"],
          },
        },
      },
    };
    const agent = resolveAgent(cfg);
    assert.equal(agent.timeoutMs, DEFAULT_AGENT_TIMEOUT_MS, "resolveAgent should use DEFAULT_AGENT_TIMEOUT_MS when timeout not set");
  });

  it("timeoutMs from resolveAgent is used by callAgent", async () => {
    const { resolveAgent, callAgent } = await import("../../src/lib/agent.js");
    const cfg = {
      agent: {
        default: "echo-agent",
        timeout: 60,
        providers: {
          "echo-agent": {
            command: "echo",
            args: ["{{PROMPT}}"],
          },
        },
      },
    };
    const agent = resolveAgent(cfg);
    // callAgent should work with agent.timeoutMs (60s is plenty for echo)
    const result = callAgent(agent, "hello", agent.timeoutMs);
    assert.equal(result, "hello");
  });
});
