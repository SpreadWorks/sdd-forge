/**
 * tests/unit/flow/envelope.test.js
 *
 * Behavior continuity tests for `flow-envelope.js`. Spec 187 R5 replaced
 * the legacy function exports (`ok`, `fail`, `warn`, `output`) with the
 * `Envelope` class. The tests below preserve the historical behavior
 * coverage of the function API by exercising the equivalent class entry
 * points, plus a tombstone check that prevents accidental re-introduction
 * of the deprecated function exports.
 *
 * Full Envelope unit coverage (addWarning, output side effects, etc.) lives
 * in tests/unit/lib/envelope.test.js.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as envelopeModule from "../../../src/lib/flow-envelope.js";

const { Envelope } = envelopeModule;

describe("flow-envelope module surface (post spec 187 R5)", () => {
  it("does not re-export the deprecated function API", () => {
    assert.equal(typeof envelopeModule.ok, "undefined", "legacy ok() must be removed");
    assert.equal(typeof envelopeModule.fail, "undefined", "legacy fail() must be removed");
    assert.equal(typeof envelopeModule.warn, "undefined", "legacy warn() must be removed");
    assert.equal(typeof envelopeModule.output, "undefined", "legacy output() must be removed");
  });

  it("exports the Envelope class with the expected static factories", () => {
    assert.equal(typeof Envelope, "function");
    assert.equal(typeof Envelope.ok, "function");
    assert.equal(typeof Envelope.fail, "function");
    assert.equal(typeof Envelope.warn, "function");
  });
});

describe("Envelope.ok (legacy ok() behavior)", () => {
  it("returns envelope with ok: true", () => {
    const env = Envelope.ok("get", "status", { spec: "test" });
    const result = env.toJSON();
    assert.equal(result.ok, true);
    assert.equal(result.type, "get");
    assert.equal(result.key, "status");
    assert.deepEqual(result.data, { spec: "test" });
    assert.deepEqual(result.errors, []);
  });

  it("returns empty errors array by default", () => {
    const result = Envelope.ok("set", "step", {}).toJSON();
    assert.ok(Array.isArray(result.errors));
    assert.equal(result.errors.length, 0);
  });
});

describe("Envelope.fail (legacy fail() behavior)", () => {
  it("returns envelope with ok: false and fatal error", () => {
    const result = Envelope.fail("get", "status", "NO_FLOW", "no active flow").toJSON();
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
    const result = Envelope.fail("run", "gate", "GATE_FAIL", ["reason 1", "reason 2"]).toJSON();
    assert.equal(result.errors[0].messages.length, 2);
  });
});

describe("Envelope.warn (legacy warn() behavior)", () => {
  it("returns envelope with ok: true and warn-level error", () => {
    const result = Envelope.warn("get", "check", { pass: true }, "STALE_BASE", "base branch has new commits").toJSON();
    assert.equal(result.ok, true);
    assert.deepEqual(result.data, { pass: true });
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].level, "warn");
    assert.equal(result.errors[0].code, "STALE_BASE");
  });
});
