import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateConfig, validateContext, resolveType, TYPE_ALIASES } from "../../src/lib/types.js";

describe("TYPE_ALIASES", () => {
  it("maps php-mvc to webapp/cakephp2", () => {
    assert.equal(TYPE_ALIASES["php-mvc"], "webapp/cakephp2");
  });

  it("maps node-cli to cli/node-cli", () => {
    assert.equal(TYPE_ALIASES["node-cli"], "cli/node-cli");
  });
});

describe("resolveType", () => {
  it("resolves aliased type", () => {
    assert.equal(resolveType("php-mvc"), "webapp/cakephp2");
  });

  it("returns type as-is when no alias", () => {
    assert.equal(resolveType("webapp"), "webapp");
  });
});

describe("validateConfig", () => {
  const validConfig = {
    lang: "ja",
    type: "cli/node-cli",
  };

  it("accepts minimal valid config", () => {
    const result = validateConfig({ ...validConfig });
    assert.equal(result.lang, "ja");
    assert.equal(result.type, "cli/node-cli");
  });

  it("throws on non-object input", () => {
    assert.throws(() => validateConfig(null), /non-null object/);
    assert.throws(() => validateConfig("string"), /non-null object/);
  });

  it("throws when lang is missing", () => {
    assert.throws(() => validateConfig({ type: "cli" }), /lang/);
  });

  it("throws when type is missing", () => {
    assert.throws(() => validateConfig({ lang: "ja" }), /type/);
  });

  it("validates documentStyle", () => {
    const cfg = {
      ...validConfig,
      documentStyle: { purpose: "developer-guide", tone: "polite" },
    };
    const result = validateConfig(cfg);
    assert.equal(result.documentStyle.purpose, "developer-guide");
  });

  it("rejects invalid documentStyle tone", () => {
    assert.throws(
      () => validateConfig({ ...validConfig, documentStyle: { purpose: "x", tone: "invalid" } }),
      /tone/,
    );
  });

  it("validates providers", () => {
    const cfg = {
      ...validConfig,
      providers: { claude: { command: "claude", args: ["-p", "{{PROMPT}}"] } },
    };
    const result = validateConfig(cfg);
    assert.deepEqual(result.providers.claude.args, ["-p", "{{PROMPT}}"]);
  });

  it("rejects provider without command", () => {
    assert.throws(
      () => validateConfig({ ...validConfig, providers: { bad: { args: [] } } }),
      /command/,
    );
  });

  it("validates flow config", () => {
    const cfg = { ...validConfig, flow: { merge: "squash" } };
    assert.equal(validateConfig(cfg).flow.merge, "squash");
  });

  it("rejects invalid flow merge strategy", () => {
    assert.throws(
      () => validateConfig({ ...validConfig, flow: { merge: "rebase" } }),
      /flow\.merge/,
    );
  });

  it("validates output config", () => {
    const cfg = {
      ...validConfig,
      output: { languages: ["ja", "en"], default: "ja" },
    };
    const result = validateConfig(cfg);
    assert.deepEqual(result.output.languages, ["ja", "en"]);
  });

  it("rejects output.default not in languages", () => {
    assert.throws(
      () => validateConfig({
        ...validConfig,
        output: { languages: ["ja"], default: "en" },
      }),
      /output\.default/,
    );
  });
});

describe("validateContext", () => {
  it("accepts empty object", () => {
    const result = validateContext({});
    assert.deepEqual(result, {});
  });

  it("accepts valid projectContext", () => {
    const result = validateContext({ projectContext: "test project" });
    assert.equal(result.projectContext, "test project");
  });

  it("throws on non-object", () => {
    assert.throws(() => validateContext(null), /non-null object/);
  });

  it("throws on non-string projectContext", () => {
    assert.throws(() => validateContext({ projectContext: 123 }), /string/);
  });
});
