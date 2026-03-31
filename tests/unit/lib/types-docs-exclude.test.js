import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateConfig } from "../../../src/lib/types.js";

const base = {
  lang: "ja",
  type: "node-cli",
  docs: { languages: ["ja"], defaultLanguage: "ja" },
};

describe("validateConfig docs.exclude", () => {
  it("accepts docs.exclude as string array", () => {
    const result = validateConfig({
      ...base,
      docs: { ...base.docs, exclude: ["src/presets/*/tests/**"] },
    });
    assert.ok(result);
  });

  it("accepts docs without exclude", () => {
    const result = validateConfig({ ...base });
    assert.ok(result);
  });

  it("accepts empty docs.exclude array", () => {
    const result = validateConfig({
      ...base,
      docs: { ...base.docs, exclude: [] },
    });
    assert.ok(result);
  });

  it("rejects non-array docs.exclude", () => {
    assert.throws(
      () => validateConfig({
        ...base,
        docs: { ...base.docs, exclude: "src/presets/**" },
      }),
      /docs\.exclude/i,
    );
  });

  it("rejects docs.exclude with non-string entries", () => {
    assert.throws(
      () => validateConfig({
        ...base,
        docs: { ...base.docs, exclude: [123] },
      }),
      /docs\.exclude/i,
    );
  });
});
