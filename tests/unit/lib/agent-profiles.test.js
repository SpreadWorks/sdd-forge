/**
 * Tests for agent profile switching (spec 157-agent-profile-switching)
 *
 * These tests verify the new agent.profiles / agent.useProfile / SDD_FORGE_PROFILE
 * behavior introduced in spec 157. They are intentionally failing before implementation.
 *
 * Placement rationale: resolveAgent is a public API — breakage in future changes
 * indicates a bug regardless of which spec introduced it → tests/unit/lib/
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { resolveAgent, BUILTIN_PROVIDERS } from "../../../src/lib/agent.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROVIDERS = {
  "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"], systemPromptFlag: "--system-prompt" },
  "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"], systemPromptFlag: "--system-prompt" },
  "codex/gpt-5.3": { command: "codex", args: ["exec", "-m", "gpt-5.3-codex", "--full-auto", "-C", ".tmp", "{{PROMPT}}"] },
};

const PROFILES = {
  high: { docs: "claude/opus" },
  fast: { docs: "codex/gpt-5.3" },
  "claude-only": { docs: "claude/sonnet", flow: "claude/sonnet" },
};

function makeCfg(overrides = {}) {
  return {
    agent: {
      default: "claude/opus",
      providers: PROVIDERS,
      profiles: PROFILES,
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// agent.useProfile
// ---------------------------------------------------------------------------

describe("resolveAgent — agent.useProfile", () => {
  it("uses provider from matching profile when useProfile is set", () => {
    const cfg = makeCfg({ useProfile: "fast" });
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "codex");
  });

  it("uses provider from matching profile for exact commandId", () => {
    const cfg = makeCfg({ useProfile: "claude-only" });
    const result = resolveAgent(cfg, "flow");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("--model"));
    assert.ok(result.args.includes("sonnet"));
  });

  it("falls back to agent.default when useProfile is not set", () => {
    const cfg = makeCfg();
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("opus"));
  });

  it("falls back to agent.default when useProfile is empty string", () => {
    const cfg = makeCfg({ useProfile: "" });
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("opus"));
  });

  it("throws when useProfile references a non-existent profile", () => {
    const cfg = makeCfg({ useProfile: "nonexistent" });
    assert.throws(() => resolveAgent(cfg, "docs"), /profile/i);
  });
});

// ---------------------------------------------------------------------------
// SDD_FORGE_PROFILE environment variable
// ---------------------------------------------------------------------------

describe("resolveAgent — SDD_FORGE_PROFILE env var", () => {
  before(() => { process.env.SDD_FORGE_PROFILE = "fast"; });
  after(() => { delete process.env.SDD_FORGE_PROFILE; });

  it("SDD_FORGE_PROFILE overrides agent.useProfile", () => {
    const cfg = makeCfg({ useProfile: "high" }); // high → claude/opus, fast → codex
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "codex"); // env var wins
  });

  it("SDD_FORGE_PROFILE overrides when useProfile is not set", () => {
    const cfg = makeCfg();
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "codex");
  });

  it("throws when SDD_FORGE_PROFILE references a non-existent profile", () => {
    process.env.SDD_FORGE_PROFILE = "nonexistent";
    const cfg = makeCfg();
    assert.throws(() => resolveAgent(cfg, "docs"), /profile/i);
  });
});

// ---------------------------------------------------------------------------
// Prefix match
// ---------------------------------------------------------------------------

describe("resolveAgent — prefix match", () => {
  it("matches 'docs' profile entry for commandId 'docs.review'", () => {
    const cfg = makeCfg({ useProfile: "fast" });
    // profiles.fast has 'docs' but not 'docs.review' — should match via prefix
    const result = resolveAgent(cfg, "docs.review");
    assert.equal(result.command, "codex");
  });

  it("matches 'docs' entry for 'docs.review.deep' (multi-level)", () => {
    const cfg = makeCfg({ useProfile: "fast" });
    const result = resolveAgent(cfg, "docs.review.deep");
    assert.equal(result.command, "codex");
  });

  it("more specific prefix wins over shorter prefix", () => {
    const cfg = {
      agent: {
        default: "claude/opus",
        providers: PROVIDERS,
        useProfile: "mixed",
        profiles: {
          mixed: {
            docs: "claude/opus",
            "docs.review": "codex/gpt-5.3", // more specific
          },
        },
      },
    };
    const result = resolveAgent(cfg, "docs.review");
    assert.equal(result.command, "codex"); // docs.review wins over docs
  });

  it("falls back to agent.default when profile has no matching prefix", () => {
    const cfg = makeCfg({ useProfile: "claude-only" });
    // claude-only has 'docs' and 'flow' but not 'spec'
    const result = resolveAgent(cfg, "spec");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("opus")); // default
  });
});

// ---------------------------------------------------------------------------
// Built-in providers
// ---------------------------------------------------------------------------

describe("BUILTIN_PROVIDERS", () => {
  it("exports BUILTIN_PROVIDERS with claude/opus", () => {
    assert.ok(BUILTIN_PROVIDERS, "BUILTIN_PROVIDERS should be exported");
    assert.ok(BUILTIN_PROVIDERS["claude/opus"], "claude/opus should be a built-in provider");
    assert.equal(BUILTIN_PROVIDERS["claude/opus"].command, "claude");
  });

  it("exports claude/sonnet as built-in", () => {
    assert.ok(BUILTIN_PROVIDERS["claude/sonnet"]);
    assert.equal(BUILTIN_PROVIDERS["claude/sonnet"].command, "claude");
  });

  it("exports codex/gpt-5.4 as built-in", () => {
    assert.ok(BUILTIN_PROVIDERS["codex/gpt-5.4"]);
    assert.equal(BUILTIN_PROVIDERS["codex/gpt-5.4"].command, "codex");
  });

  it("exports codex/gpt-5.3 as built-in", () => {
    assert.ok(BUILTIN_PROVIDERS["codex/gpt-5.3"]);
    assert.equal(BUILTIN_PROVIDERS["codex/gpt-5.3"].command, "codex");
  });

  it("resolveAgent uses built-in provider when config has no providers", () => {
    const cfg = {
      agent: {
        default: "claude/opus",
        // no providers field — relies on built-ins
        useProfile: "fast",
        profiles: { fast: { docs: "claude/sonnet" } },
      },
    };
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "claude");
    assert.ok(result.args.includes("sonnet"));
  });

  it("user-defined provider overrides built-in with same key", () => {
    const cfg = {
      agent: {
        default: "claude/opus",
        providers: {
          "claude/opus": { command: "my-claude", args: ["{{PROMPT}}"] }, // override
        },
        useProfile: "high",
        profiles: { high: { docs: "claude/opus" } },
      },
    };
    const result = resolveAgent(cfg, "docs");
    assert.equal(result.command, "my-claude"); // user wins
  });
});
