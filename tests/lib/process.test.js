import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runSync } from "../../src/lib/process.js";

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
});
