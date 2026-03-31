/**
 * tests/unit/flow/envelope.test.js
 *
 * Unit tests for JSON envelope utility.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ok, fail, warn } from "../../../src/lib/flow-envelope.js";

describe("flow-envelope ok()", () => {
  it("returns envelope with ok: true", () => {
    const result = ok("get", "status", { spec: "test" });
    assert.equal(result.ok, true);
    assert.equal(result.type, "get");
    assert.equal(result.key, "status");
    assert.deepEqual(result.data, { spec: "test" });
    assert.deepEqual(result.errors, []);
  });

  it("returns empty errors array by default", () => {
    const result = ok("set", "step", {});
    assert.ok(Array.isArray(result.errors));
    assert.equal(result.errors.length, 0);
  });
});

describe("flow-envelope fail()", () => {
  it("returns envelope with ok: false and fatal error", () => {
    const result = fail("get", "status", "NO_FLOW", "no active flow");
    assert.equal(result.ok, false);
    assert.equal(result.type, "get");
    assert.equal(result.key, "status");
    assert.equal(result.data, null);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].level, "fatal");
    assert.equal(result.errors[0].code, "NO_FLOW");
    assert.deepEqual(result.errors[0].messages, ["no active flow"]);
  });

  it("accepts multiple error messages", () => {
    const result = fail("run", "gate", "GATE_FAIL", ["reason 1", "reason 2"]);
    assert.equal(result.errors[0].messages.length, 2);
  });
});

describe("flow-envelope warn()", () => {
  it("returns envelope with ok: true and warn-level error", () => {
    const result = warn("get", "check", { pass: true }, "STALE_BASE", "base branch has new commits");
    assert.equal(result.ok, true);
    assert.deepEqual(result.data, { pass: true });
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].level, "warn");
    assert.equal(result.errors[0].code, "STALE_BASE");
  });
});
