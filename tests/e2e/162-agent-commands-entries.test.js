import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

describe("162 — agent.commands entries migration", () => {
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
