import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateConfig, resolveType, TYPE_ALIASES } from "../../../src/lib/types.js";

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
    docs: { languages: ["ja"], defaultLanguage: "ja" },
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
    assert.throws(() => validateConfig({ type: "cli", docs: { languages: ["ja"], defaultLanguage: "ja" } }), /lang/);
  });

  it("throws when type is missing", () => {
    assert.throws(() => validateConfig({ lang: "ja", docs: { languages: ["ja"], defaultLanguage: "ja" } }), /type/);
  });

  it("throws when docs is missing", () => {
    assert.throws(() => validateConfig({ lang: "ja", type: "cli" }), /docs/);
  });

  it("validates docs.style", () => {
    const cfg = {
      ...validConfig,
      docs: { ...validConfig.docs, style: { purpose: "developer-guide", tone: "polite" } },
    };
    const result = validateConfig(cfg);
    assert.equal(result.docs.style.purpose, "developer-guide");
  });

  it("rejects invalid docs.style tone", () => {
    assert.throws(
      () => validateConfig({
        ...validConfig,
        docs: { ...validConfig.docs, style: { purpose: "x", tone: "invalid" } },
      }),
      /tone/,
    );
  });

  it("validates agent.providers", () => {
    const cfg = {
      ...validConfig,
      agent: { providers: { claude: { command: "claude", args: ["-p", "{{PROMPT}}"] } } },
    };
    const result = validateConfig(cfg);
    assert.deepEqual(result.agent.providers.claude.args, ["-p", "{{PROMPT}}"]);
  });

  it("rejects agent.providers entry without command", () => {
    assert.throws(
      () => validateConfig({ ...validConfig, agent: { providers: { bad: { args: [] } } } }),
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

  it("validates docs config with multiple languages", () => {
    const cfg = {
      ...validConfig,
      docs: { languages: ["ja", "en"], defaultLanguage: "ja" },
    };
    const result = validateConfig(cfg);
    assert.deepEqual(result.docs.languages, ["ja", "en"]);
  });

  it("rejects docs.defaultLanguage not in languages", () => {
    assert.throws(
      () => validateConfig({
        ...validConfig,
        docs: { languages: ["ja"], defaultLanguage: "en" },
      }),
      /defaultLanguage/,
    );
  });
});
