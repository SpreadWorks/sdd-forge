/**
 * tests/unit/flow/routing.test.js
 *
 * Tests for flow.js get/set/run dispatcher routing.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { join } from "path";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow dispatcher routing", () => {
  it("shows get/set/run in help output", () => {
    const result = execFileSync("node", [FLOW_CMD, "--help"], { encoding: "utf8" });
    assert.match(result, /get/);
    assert.match(result, /set/);
    assert.match(result, /run/);
  });

  it("exits non-zero with no subcommand", () => {
    try {
      execFileSync("node", [FLOW_CMD], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /get|set|run/);
    }
  });

  it("rejects unknown subcommand 'status'", () => {
    try {
      execFileSync("node", [FLOW_CMD, "status"], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /unknown command/i);
    }
  });

  it("rejects unknown subcommand 'start'", () => {
    try {
      execFileSync("node", [FLOW_CMD, "start"], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /unknown command/i);
    }
  });
});
