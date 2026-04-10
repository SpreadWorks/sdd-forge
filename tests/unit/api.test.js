/**
 * tests/unit/api.test.js
 *
 * Verifies that:
 *   - src/api.js exports exactly DataSource, Scannable, AnalysisEntry
 *   - package.json has an exports map with ./api and . entries
 *   - engines.node is >=18.19.0
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("sdd-forge/api — public entry point exports", () => {
  let api;

  before(async () => {
    api = await import("../../src/api.js");
  });

  it("exports exactly DataSource, Scannable, and AnalysisEntry (no extras)", () => {
    const keys = Object.keys(api).sort();
    assert.deepStrictEqual(keys, ["AnalysisEntry", "DataSource", "Scannable"]);
  });

  it("DataSource is a constructable class", () => {
    assert.strictEqual(typeof api.DataSource, "function");
    const instance = new api.DataSource();
    assert.ok(instance instanceof api.DataSource);
  });

  it("Scannable is a mixin that adds scan() to a DataSource subclass", () => {
    assert.strictEqual(typeof api.Scannable, "function");
    const Mixed = api.Scannable(api.DataSource);
    const instance = new Mixed();
    assert.strictEqual(typeof instance.scan, "function");
  });

  it("AnalysisEntry is a constructable class with file/hash/lines/mtime fields", () => {
    assert.strictEqual(typeof api.AnalysisEntry, "function");
    const instance = new api.AnalysisEntry();
    assert.ok(instance instanceof api.AnalysisEntry);
    assert.ok("file" in instance);
    assert.ok("hash" in instance);
    assert.ok("lines" in instance);
    assert.ok("mtime" in instance);
  });
});

describe("sdd-forge/api — package.json exports map and engines", () => {
  let pkg;

  before(() => {
    pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
  });

  it("package.json has an exports field", () => {
    assert.ok(pkg.exports != null, "exports field must exist");
  });

  it('exports["."] exists (root path import continues to work)', () => {
    assert.ok(pkg.exports["."], 'exports["."] must be defined');
  });

  it('exports["./api"] exists (sdd-forge/api subpath is accessible)', () => {
    assert.ok(pkg.exports["./api"], 'exports["./api"] must be defined');
  });

  it('engines.node is ">=18.19.0"', () => {
    assert.strictEqual(pkg.engines?.node, ">=18.19.0");
  });
});
