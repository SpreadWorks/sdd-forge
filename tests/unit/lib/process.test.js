import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runSync } from "../../../src/lib/process.js";

describe("runSync", () => {
  it("returns ok=true for successful command", () => {
    const result = runSync("echo", ["hello"]);
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /hello/);
  });

  it("returns ok=false for failing command", () => {
    const result = runSync("node", ["-e", "process.exit(1)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 1);
  });

  it("captures stderr", () => {
    const result = runSync("node", ["-e", "console.error('err')"]);
    assert.match(result.stderr, /err/);
  });

  it("respects cwd option", () => {
    const result = runSync("pwd", [], { cwd: "/tmp" });
    assert.equal(result.ok, true);
    assert.match(result.stdout, /tmp/);
  });

  it("returns string for stdout and stderr", () => {
    const result = runSync("echo", ["test"]);
    assert.equal(typeof result.stdout, "string");
    assert.equal(typeof result.stderr, "string");
  });

  it("handles non-existent command gracefully", () => {
    const result = runSync("nonexistent_command_xyz_12345", []);
    assert.equal(result.ok, false);
    assert.notEqual(result.status, 0);
  });

  it("returns status code other than 0 or 1", () => {
    const result = runSync("node", ["-e", "process.exit(42)"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 42);
  });

  it("respects timeout option", () => {
    const result = runSync("node", ["-e", "setTimeout(()=>{},10000)"], {
      timeout: 100,
    });
    assert.equal(result.ok, false);
  });

  it("handles empty args", () => {
    const result = runSync("echo", []);
    assert.equal(result.ok, true);
    assert.equal(typeof result.stdout, "string");
  });

  it("handles large output", () => {
    const result = runSync("node", [
      "-e",
      "for(let i=0;i<1000;i++)console.log('line'+i)",
    ]);
    assert.equal(result.ok, true);
    assert.ok(result.stdout.includes("line999"));
  });

  it("defaults to utf8 encoding", () => {
    const result = runSync("echo", ["café"]);
    assert.equal(result.ok, true);
    assert.ok(result.stdout.includes("café"));
  });
});
