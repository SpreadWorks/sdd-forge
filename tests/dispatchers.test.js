import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";

const SDD_FORGE = join(process.cwd(), "src/sdd-forge.js");

describe("sdd-forge dispatcher", () => {
  it("routes 'help' to help output", () => {
    const result = execFileSync("node", [SDD_FORGE, "help"], { encoding: "utf8" });
    assert.match(result, /SDD Forge/);
    assert.match(result, /コマンド一覧/);
  });

  it("routes 'gate' to spec gate", () => {
    try {
      execFileSync("node", [SDD_FORGE, "gate"], { encoding: "utf8" });
      assert.fail("should exit non-zero without --spec");
    } catch (err) {
      assert.match(err.stderr, /--spec is required/);
    }
  });

  it("routes 'review' correctly", () => {
    try {
      execFileSync("node", [SDD_FORGE, "review"], { encoding: "utf8" });
    } catch (err) {
      // review may fail if no docs dir, but it should have run the review command
      assert.match(err.stdout, /FAIL|Found/);
    }
  });

  it("routes 'flow' to flow dispatcher", () => {
    try {
      execFileSync("node", [SDD_FORGE, "flow"], { encoding: "utf8" });
      assert.fail("should exit non-zero without subcommand");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /start|status/);
    }
  });

  it("shows help when no subcommand", () => {
    const result = execFileSync("node", [SDD_FORGE], { encoding: "utf8" });
    assert.match(result, /SDD Forge/);
  });

  it("exits non-zero for unknown subcommand", () => {
    try {
      execFileSync("node", [SDD_FORGE, "nonexistent"], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /unknown command/);
    }
  });
});
