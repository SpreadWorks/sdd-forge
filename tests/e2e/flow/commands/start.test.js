import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

describe("flow start CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("errors when --request is not provided", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "start"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /request.*required/i);
    }
  });

  it("errors with invalid --forge-mode", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "start", "--request", "test", "--forge-mode", "invalid"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /forge-mode/);
    }
  });

  it("shows help with --help", () => {
    tmp = createTmpDir();
    const result = execFileSync("node", [FLOW_CMD, "start", "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /--request/);
    assert.match(result, /--title/);
    assert.match(result, /--dry-run/);
  });

  it("routes start subcommand through flow dispatcher", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "start"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      // Verifies that routing works — error should be about missing --request,
      // not about unknown subcommand
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /request/i);
    }
  });
});
