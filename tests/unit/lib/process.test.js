import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCmd, runCmdAsync } from "../../../src/lib/process.js";

describe("runCmd", () => {
  it("returns ok=true for successful command", () => {
    const result = runCmd("echo", ["hello"]);
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /hello/);
  });

  it("returns ok=false for failing command", () => {
    const result = runCmd("node", ["-e", "process.exit(1)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 1);
  });

  it("captures stderr on failure", () => {
    const result = runCmd("node", ["-e", "console.error('err'); process.exit(1)"]);
    assert.equal(result.ok, false);
    assert.match(result.stderr, /err/);
  });

  it("respects cwd option", () => {
    const result = runCmd("pwd", [], { cwd: "/tmp" });
    assert.equal(result.ok, true);
    assert.match(result.stdout, /tmp/);
  });

  it("returns string for stdout and stderr", () => {
    const result = runCmd("echo", ["test"]);
    assert.equal(typeof result.stdout, "string");
    assert.equal(typeof result.stderr, "string");
  });

  it("handles non-existent command gracefully", () => {
    const result = runCmd("nonexistent_command_xyz_12345", []);
    assert.equal(result.ok, false);
    assert.notEqual(result.status, 0);
  });

  it("returns status code other than 0 or 1", () => {
    const result = runCmd("node", ["-e", "process.exit(42)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 42);
  });

  it("respects timeout option", () => {
    const result = runCmd("node", ["-e", "setTimeout(()=>{},10000)"], {
      timeout: 100,
    });
    assert.equal(result.ok, false);
  });

  it("handles empty args", () => {
    const result = runCmd("echo", []);
    assert.equal(result.ok, true);
    assert.equal(typeof result.stdout, "string");
  });

  it("handles large output", () => {
    const result = runCmd("node", [
      "-e",
      "for(let i=0;i<1000;i++)console.log('line'+i)",
    ]);
    assert.equal(result.ok, true);
    assert.ok(result.stdout.includes("line999"));
  });

  it("defaults to utf8 encoding", () => {
    const result = runCmd("echo", ["café"]);
    assert.equal(result.ok, true);
    assert.ok(result.stdout.includes("café"));
  });
});

describe("runCmdAsync", () => {
  it("returns ok=true for successful command", async () => {
    const result = await runCmdAsync("echo", ["hello"]);
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /hello/);
  });

  it("returns ok=false for failing command", async () => {
    const result = await runCmdAsync("node", ["-e", "process.exit(1)"]);
    assert.equal(result.ok, false);
  });

  it("handles non-existent command gracefully", async () => {
    const result = await runCmdAsync("nonexistent_command_xyz_12345", []);
    assert.equal(result.ok, false);
  });
});
