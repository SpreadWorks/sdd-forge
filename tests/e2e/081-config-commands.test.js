import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateConfig } from "../../src/lib/types.js";

function baseConfig() {
  return {
    lang: "en",
    type: "node-cli",
    docs: { languages: ["en"], defaultLanguage: "en" },
  };
}

describe("081: validateConfig — commands and flow.push", () => {
  it("accepts config with commands.gh: enable", () => {
    const cfg = { ...baseConfig(), commands: { gh: "enable" } };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("accepts config with commands.gh: disable", () => {
    const cfg = { ...baseConfig(), commands: { gh: "disable" } };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("rejects commands.gh with invalid value", () => {
    const cfg = { ...baseConfig(), commands: { gh: "yes" } };
    assert.throws(() => validateConfig(cfg), /commands\.gh/);
  });

  it("accepts config without commands section", () => {
    const cfg = baseConfig();
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("accepts config with flow.push.remote", () => {
    const cfg = { ...baseConfig(), flow: { push: { remote: "upstream" } } };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("rejects flow.push.remote with non-string value", () => {
    const cfg = { ...baseConfig(), flow: { push: { remote: 123 } } };
    assert.throws(() => validateConfig(cfg), /flow\.push\.remote/);
  });

  it("accepts flow with both merge and push", () => {
    const cfg = {
      ...baseConfig(),
      flow: { merge: "squash", push: { remote: "origin" } },
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });
});
