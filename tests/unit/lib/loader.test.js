/**
 * tests/unit/lib/loader.test.js
 *
 * Verifies the module loader hook resolve() function:
 *   - sdd-forge/api resolves to src/api.js
 *   - sdd-forge/<any> resolves to the corresponding src/<any>.js
 *   - other specifiers are passed through to nextResolve
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

describe("module loader hook — resolve()", () => {
  let resolveHook;

  before(async () => {
    const mod = await import("../../../src/loader.js");
    resolveHook = mod.resolve;
  });

  it("exports a resolve function", () => {
    assert.strictEqual(typeof resolveHook, "function");
  });

  it("resolves 'sdd-forge/api' to a URL ending with /src/api.js", async () => {
    const nextResolve = () => { throw new Error("should not be called for sdd-forge/* specifiers"); };
    const result = await Promise.resolve(resolveHook("sdd-forge/api", {}, nextResolve));
    assert.ok(
      result.url.endsWith("/src/api.js"),
      `expected URL ending with /src/api.js, got: ${result.url}`,
    );
    assert.strictEqual(result.shortCircuit, true);
  });

  it("resolves 'sdd-forge/docs/lib/data-source' to a URL ending with /src/docs/lib/data-source.js", async () => {
    const nextResolve = () => { throw new Error("should not be called"); };
    const result = await Promise.resolve(resolveHook("sdd-forge/docs/lib/data-source", {}, nextResolve));
    assert.ok(
      result.url.endsWith("/src/docs/lib/data-source.js"),
      `got: ${result.url}`,
    );
  });

  it("passes non-sdd-forge specifiers to nextResolve unchanged", async () => {
    const nextResolve = (spec, ctx) => ({ url: `resolved:${spec}`, shortCircuit: true });
    const result = await Promise.resolve(resolveHook("some-other-package", {}, nextResolve));
    assert.strictEqual(result.url, "resolved:some-other-package");
  });

  it("passes node: built-in specifiers to nextResolve", async () => {
    const nextResolve = (spec, ctx) => ({ url: spec, shortCircuit: true });
    const result = await Promise.resolve(resolveHook("node:fs", {}, nextResolve));
    assert.strictEqual(result.url, "node:fs");
  });
});
