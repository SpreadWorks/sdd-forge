/**
 * tests/unit/flow/removed-commands.test.js
 *
 * Verify that flow run merge and flow run cleanup are removed.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { join } from "path";

const FLOW_CMD = join(process.cwd(), "src/sdd-forge.js");
const FLOW_CMD_ARGS_PREFIX = ["flow"];

describe("removed flow run commands", () => {
  it("flow run merge returns unknown action error", () => {
    try {
      execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "merge"], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /unknown (action|key)/i);
    }
  });

  it("flow run cleanup returns unknown action error", () => {
    try {
      execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "cleanup"], { encoding: "utf8" });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /unknown (action|key)/i);
    }
  });

  it("flow run finalize is registered", () => {
    try {
      execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "finalize", "--help"], { encoding: "utf8" });
    } catch (err) {
      // --help may exit 0 or non-zero, but should not be "unknown action"
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.ok(!out.includes("unknown action"), "finalize should be registered");
    }
  });
});
