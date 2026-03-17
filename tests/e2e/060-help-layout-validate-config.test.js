import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { commands } from "../../src/help.js";
import { validateConfig } from "../../src/lib/types.js";

// ---------------------------------------------------------------------------
// A: help.js LAYOUT — flow subcommands
// ---------------------------------------------------------------------------

describe("060-A: help layout includes flow subcommands", () => {
  const names = commands.filter((c) => c.name).map((c) => c.name);

  it("includes flow review", () => {
    assert.ok(names.includes("flow review"));
  });

  it("includes flow merge", () => {
    assert.ok(names.includes("flow merge"));
  });

  it("includes flow cleanup", () => {
    assert.ok(names.includes("flow cleanup"));
  });
});

// ---------------------------------------------------------------------------
// B: validateConfig — nested agent.* structure
// ---------------------------------------------------------------------------

/** Minimal valid config (no agent section) */
function baseConfig() {
  return {
    lang: "en",
    type: "node-cli",
    docs: {
      languages: ["en"],
      defaultLanguage: "en",
    },
  };
}

describe("060-B: validateConfig with nested agent structure", () => {
  it("accepts config without agent section", () => {
    const cfg = baseConfig();
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("accepts valid nested agent.providers", () => {
    const cfg = {
      ...baseConfig(),
      agent: {
        default: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
          },
        },
      },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("rejects agent.providers entry missing command", () => {
    const cfg = {
      ...baseConfig(),
      agent: {
        default: "claude",
        providers: {
          claude: {
            args: ["-p", "{{PROMPT}}"],
          },
        },
      },
    };
    assert.throws(() => validateConfig(cfg), /agent\.providers\.claude\.command/);
  });

  it("rejects agent.providers entry missing args", () => {
    const cfg = {
      ...baseConfig(),
      agent: {
        default: "claude",
        providers: {
          claude: {
            command: "claude",
          },
        },
      },
    };
    assert.throws(() => validateConfig(cfg), /agent\.providers\.claude\.args/);
  });

  it("does not validate flat providers (removed)", () => {
    const cfg = {
      ...baseConfig(),
      providers: {
        claude: {
          command: "claude",
          args: ["-p"],
        },
      },
    };
    // flat providers should be ignored — no error, no validation
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("accepts full config matching real .sdd-forge/config.json structure", () => {
    const cfg = {
      lang: "ja",
      type: "node-cli",
      concurrency: 2,
      docs: {
        languages: ["en", "ja"],
        defaultLanguage: "en",
        mode: "generate",
        style: {
          purpose: "user-guide",
          tone: "polite",
        },
      },
      flow: { merge: "squash" },
      agent: {
        default: "claude",
        workDir: ".tmp",
        timeout: 600,
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            systemPromptFlag: "--system-prompt",
            profiles: {
              default: [],
              opus: ["--model", "opus"],
            },
          },
          codex: {
            command: "codex",
            args: ["exec", "--full-auto", "-C", ".tmp", "{{PROMPT}}"],
            profiles: { default: [] },
          },
        },
        commands: {
          "docs.enrich": { agent: "claude", profile: "opus" },
          "docs.text": { agent: "claude", profile: "opus" },
        },
      },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });
});
