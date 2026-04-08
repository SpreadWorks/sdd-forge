import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateConfig } from "../../src/lib/types.js";

describe("162 — agent.commands entries migration", () => {
  describe("config.example.json structure", () => {
    const example = JSON.parse(
      fs.readFileSync("src/templates/config.example.json", "utf8")
    );

    // GAP-1a: agent.commands key must be absent
    it("agent.commands key is absent", () => {
      assert.equal(example.agent?.commands, undefined);
    });

    // GAP-1b: agent.profiles.default is an object
    it("agent.profiles.default is an object", () => {
      const profileDefault = example.agent?.profiles?.default;
      assert.ok(
        profileDefault !== null &&
          profileDefault !== undefined &&
          typeof profileDefault === "object" &&
          !Array.isArray(profileDefault),
        "agent.profiles.default should be a non-null, non-array object"
      );
    });

    // GAP-1c: each provider object has no nested profiles field
    it("each provider object has no profiles field", () => {
      for (const [key, p] of Object.entries(example.agent?.providers ?? {})) {
        assert.equal(
          p.profiles,
          undefined,
          `provider "${key}" must not have a nested profiles field`
        );
      }
    });

    // GAP-1d: config.example.json passes validateConfig
    it("config.example.json passes validateConfig", () => {
      assert.doesNotThrow(() => validateConfig(example));
    });
  });

  describe("static source analysis", () => {
    // GAP-2a: init.js passes commandId to resolveCommandContext
    it("init.js passes commandId to resolveCommandContext", () => {
      const src = fs.readFileSync("src/docs/commands/init.js", "utf8");
      assert.ok(
        src.includes('"docs.init"'),
        'commandId "docs.init" should be present in init.js'
      );
      assert.ok(
        !src.includes("resolveCommandContext(cli)"),
        "1-arg call to resolveCommandContext should not exist in init.js"
      );
    });

    // GAP-2b: run-retro.js error mentions agent.profiles, not agent.commands
    it("run-retro.js error mentions agent.profiles, not agent.commands", () => {
      const src = fs.readFileSync("src/flow/lib/run-retro.js", "utf8");
      assert.ok(
        src.includes("agent.profiles"),
        'error message should reference "agent.profiles"'
      );
      assert.ok(
        !src.includes("agent.commands"),
        'error message must not reference "agent.commands"'
      );
    });
  });
});
