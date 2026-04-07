import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateConfig } from "../../src/lib/types.js";

const baseConfig = {
  lang: "ja",
  type: "node-cli",
  docs: {
    languages: ["ja"],
    defaultLanguage: "ja",
  },
};

describe("config validation: experimental.workflow", () => {
  it("accepts config without experimental section", () => {
    assert.doesNotThrow(() => validateConfig(baseConfig));
  });

  it("accepts experimental.workflow with valid enable=true", () => {
    const cfg = {
      ...baseConfig,
      experimental: {
        workflow: {
          enable: true,
          languages: { source: "ja", publish: "en" },
        },
      },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("accepts experimental.workflow with valid enable=false", () => {
    const cfg = {
      ...baseConfig,
      experimental: { workflow: { enable: false } },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("accepts experimental.workflow without languages (uses fallback)", () => {
    const cfg = {
      ...baseConfig,
      experimental: { workflow: { enable: true } },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("rejects non-boolean experimental.workflow.enable", () => {
    const cfg = {
      ...baseConfig,
      experimental: { workflow: { enable: "yes" } },
    };
    assert.throws(() => validateConfig(cfg), /experimental\.workflow\.enable/);
  });

  it("rejects non-string experimental.workflow.languages.source", () => {
    const cfg = {
      ...baseConfig,
      experimental: {
        workflow: { enable: true, languages: { source: 123 } },
      },
    };
    assert.throws(() => validateConfig(cfg), /experimental\.workflow\.languages\.source/);
  });

  it("rejects non-string experimental.workflow.languages.publish", () => {
    const cfg = {
      ...baseConfig,
      experimental: {
        workflow: { enable: true, languages: { publish: true } },
      },
    };
    assert.throws(() => validateConfig(cfg), /experimental\.workflow\.languages\.publish/);
  });

  it("rejects non-object experimental", () => {
    const cfg = { ...baseConfig, experimental: "yes" };
    assert.throws(() => validateConfig(cfg), /experimental/);
  });

  it("rejects non-object experimental.workflow", () => {
    const cfg = { ...baseConfig, experimental: { workflow: true } };
    assert.throws(() => validateConfig(cfg), /experimental\.workflow/);
  });
});
