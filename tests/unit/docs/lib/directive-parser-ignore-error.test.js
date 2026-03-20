import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseDirectives,
  resolveDataDirectives,
} from "../../../../src/docs/lib/directive-parser.js";

// ---------------------------------------------------------------------------
// {{data(..., {ignoreError: true})}} パラメータ解析
// ---------------------------------------------------------------------------

describe("parseDirectives — data params", () => {
  it("parses ignoreError: true parameter on block data directive", () => {
    const text = [
      "# Title",
      '<!-- {{data("base.monorepo.apps", {ignoreError: true})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    const d = result[0];
    assert.equal(d.type, "data");
    assert.equal(d.preset, "base");
    assert.equal(d.source, "monorepo");
    assert.equal(d.method, "apps");
    assert.deepEqual(d.params, { ignoreError: true });
  });

  it("parses data directive without params (backward compatible)", () => {
    const text = [
      '<!-- {{data("base.project.name")}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].params, {});
  });

  it("parses multiple params on data directive", () => {
    const text = [
      '<!-- {{data("base.monorepo.apps", {ignoreError: true, maxRows: 10})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].params, { ignoreError: true, maxRows: 10 });
  });

  it("parses ignoreError: true on inline data directive", () => {
    const text =
      '<!-- {{data("base.monorepo.apps", {ignoreError: true})}} --><!-- {{/data}} -->';
    const result = parseDirectives(text);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].params, { ignoreError: true });
  });
});

// ---------------------------------------------------------------------------
// resolveDataDirectives — ignoreError behavior
// ---------------------------------------------------------------------------

describe("resolveDataDirectives — ignoreError", () => {
  it("resolves to empty string when DataSource returns null and ignoreError=true", () => {
    const text = [
      "# Title",
      '<!-- {{data("base.monorepo.apps", {ignoreError: true})}} -->',
      "<!-- {{/data}} -->",
      "footer",
    ].join("\n");

    const resolveFn = () => null;
    const result = resolveDataDirectives(text, resolveFn);

    // Should not contain the directive tags, should be empty between
    assert.ok(!result.text.includes("monorepo.apps"));
    assert.equal(result.replaced, 1);
  });

  it("resolves normally when DataSource returns content and ignoreError=true", () => {
    const text = [
      "# Title",
      '<!-- {{data("base.monorepo.apps", {ignoreError: true})}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");

    const resolveFn = () => "> 対象: Frontend, Backend";
    const result = resolveDataDirectives(text, resolveFn);

    assert.ok(result.text.includes("> 対象: Frontend, Backend"));
    assert.equal(result.replaced, 1);
  });

  it("does not resolve when DataSource returns null without ignoreError", () => {
    const text = [
      "# Title",
      '<!-- {{data("base.monorepo.apps")}} -->',
      "<!-- {{/data}} -->",
    ].join("\n");

    const resolveFn = () => null;
    const result = resolveDataDirectives(text, resolveFn);

    // Original text should be unchanged
    assert.ok(result.text.includes("monorepo.apps"));
    assert.equal(result.replaced, 0);
  });
});
