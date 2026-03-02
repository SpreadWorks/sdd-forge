import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { createI18n } from "../../src/lib/i18n.js";
import { createTmpDir, removeTmpDir, writeJson } from "../helpers/tmp-dir.js";

describe("createI18n", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupLocale(lang, messages) {
    tmp = createTmpDir();
    writeJson(tmp, `${lang}/ui.json`, messages);
    return tmp;
  }

  it("translates a simple key", () => {
    const dir = setupLocale("ja", { greeting: "こんにちは" });
    const t = createI18n("ja", { localeDir: dir });
    assert.equal(t("greeting"), "こんにちは");
  });

  it("translates nested keys", () => {
    const dir = setupLocale("ja", { setup: { title: "セットアップ" } });
    const t = createI18n("ja", { localeDir: dir });
    assert.equal(t("setup.title"), "セットアップ");
  });

  it("interpolates params", () => {
    const dir = setupLocale("ja", { greet: "Hello {{name}}!" });
    const t = createI18n("ja", { localeDir: dir });
    assert.equal(t("greet", { name: "World" }), "Hello World!");
  });

  it("returns key when not found", () => {
    const dir = setupLocale("ja", {});
    const t = createI18n("ja", { localeDir: dir });
    assert.equal(t("missing.key"), "missing.key");
  });

  it("falls back to fallback language", () => {
    tmp = createTmpDir();
    writeJson(tmp, "ja/ui.json", {});
    writeJson(tmp, "en/ui.json", { hello: "Hello" });
    const t = createI18n("ja", { localeDir: tmp, fallbackLang: "en" });
    assert.equal(t("hello"), "Hello");
  });

  it("t.raw returns raw value", () => {
    const dir = setupLocale("ja", { items: ["a", "b"] });
    const t = createI18n("ja", { localeDir: dir });
    assert.deepEqual(t.raw("items"), ["a", "b"]);
  });

  it("t.lang returns language code", () => {
    const dir = setupLocale("ja", {});
    const t = createI18n("ja", { localeDir: dir });
    assert.equal(t.lang, "ja");
  });

  it("preserves unmatched placeholders", () => {
    const dir = setupLocale("ja", { msg: "Hello {{name}} and {{other}}" });
    const t = createI18n("ja", { localeDir: dir });
    assert.equal(t("msg", { name: "A" }), "Hello A and {{other}}");
  });
});
