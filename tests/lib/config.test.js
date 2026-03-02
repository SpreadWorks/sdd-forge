import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { loadJsonFile, loadPackageField, loadConfig, loadContext, saveContext, resolveProjectContext } from "../../src/lib/config.js";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../helpers/tmp-dir.js";

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
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli" });
    const cfg = loadConfig(tmp);
    assert.equal(cfg.lang, "ja");
    assert.equal(cfg.type, "cli");
  });

  it("throws when config is missing", () => {
    tmp = createTmpDir();
    assert.throws(() => loadConfig(tmp), /Missing file/);
  });
});

describe("loadContext / saveContext", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("returns empty object when context.json is missing", () => {
    tmp = createTmpDir();
    const ctx = loadContext(tmp);
    assert.deepEqual(ctx, {});
  });

  it("saves and loads context", () => {
    tmp = createTmpDir();
    saveContext(tmp, { projectContext: "hello" });
    const ctx = loadContext(tmp);
    assert.equal(ctx.projectContext, "hello");
  });

  it("creates directory if missing", () => {
    tmp = createTmpDir();
    saveContext(tmp, { projectContext: "test" });
    const ctx = loadContext(tmp);
    assert.equal(ctx.projectContext, "test");
  });
});

describe("resolveProjectContext", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("returns context.json value first", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/context.json", { projectContext: "from-context" });
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja", type: "cli",
      textFill: { projectContext: "from-config" },
    });
    assert.equal(resolveProjectContext(tmp), "from-context");
  });

  it("falls back to config textFill", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja", type: "cli",
      textFill: { projectContext: "from-config" },
    });
    assert.equal(resolveProjectContext(tmp), "from-config");
  });

  it("returns empty string when nothing is set", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli" });
    assert.equal(resolveProjectContext(tmp), "");
  });
});
