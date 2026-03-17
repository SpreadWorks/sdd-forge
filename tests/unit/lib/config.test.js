import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { loadJsonFile, loadPackageField, loadConfig } from "../../../src/lib/config.js";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

describe("loadJsonFile", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("loads a valid JSON file", () => {
    tmp = createTmpDir();
    writeJson(tmp, "data.json", { key: "value" });
    const result = loadJsonFile(join(tmp, "data.json"));
    assert.deepEqual(result, { key: "value" });
  });

  it("throws when file is missing", () => {
    assert.throws(() => loadJsonFile("/nonexistent/file.json"), /Missing file/);
  });
});

describe("loadPackageField", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("returns the field value", () => {
    tmp = createTmpDir();
    writeJson(tmp, "package.json", { name: "test-pkg", version: "1.0.0" });
    assert.equal(loadPackageField(tmp, "name"), "test-pkg");
    assert.equal(loadPackageField(tmp, "version"), "1.0.0");
  });

  it("returns undefined when field is missing", () => {
    tmp = createTmpDir();
    writeJson(tmp, "package.json", { name: "test" });
    assert.equal(loadPackageField(tmp, "missing"), undefined);
  });

  it("returns undefined when package.json is missing", () => {
    tmp = createTmpDir();
    assert.equal(loadPackageField(tmp, "name"), undefined);
  });
});

describe("loadConfig", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("loads and validates config", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli", docs: { languages: ["ja"], defaultLanguage: "ja" } });
    const cfg = loadConfig(tmp);
    assert.equal(cfg.lang, "ja");
    assert.equal(cfg.type, "cli");
    assert.equal(cfg.docs.defaultLanguage, "ja");
  });

  it("throws when config is missing", () => {
    tmp = createTmpDir();
    assert.throws(() => loadConfig(tmp), /Missing file/);
  });
});
