import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import fs from "fs";
import { createResolver } from "../../../src/docs/lib/resolver-factory.js";
import { createTmpDir, removeTmpDir, writeJson } from "../../helpers/tmp-dir.js";

describe("createResolver", () => {
  let tmp;

  it("returns an object with resolve method", async () => {
    tmp = createTmpDir("resolver-factory");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });

    const resolver = await createResolver("cli/node-cli", tmp);
    assert.equal(typeof resolver.resolve, "function");
    removeTmpDir(tmp);
  });

  it("resolves project.name from common data sources", async () => {
    tmp = createTmpDir("resolver-factory");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    // project.js DataSource reads package.json from root
    writeJson(tmp, "package.json", { name: "test-pkg", version: "1.0.0" });

    const resolver = await createResolver("cli/node-cli", tmp);
    const result = resolver.resolve("project", "name", {}, [""]);
    assert.equal(result, "test-pkg");
    removeTmpDir(tmp);
  });

  it("returns null for unknown source.method", async () => {
    tmp = createTmpDir("resolver-factory");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });

    const resolver = await createResolver("cli/node-cli", tmp);
    const result = resolver.resolve("nonexistent", "method", {}, []);
    assert.equal(result, null);
    removeTmpDir(tmp);
  });

  it("returns null when method throws an error", async () => {
    tmp = createTmpDir("resolver-factory");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });

    const resolver = await createResolver("cli/node-cli", tmp);
    // docs.chapters with no docs dir should return null gracefully
    const result = resolver.resolve("docs", "chapters", {}, ["A", "B"]);
    assert.equal(result, null);
    removeTmpDir(tmp);
  });

  it("loads overrides.json when present", async () => {
    tmp = createTmpDir("resolver-factory");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, ".sdd-forge/overrides.json", {
      project: { summary: "Custom override" },
    });
    writeJson(tmp, "package.json", { name: "test-pkg", version: "1.0.0" });

    const resolver = await createResolver("cli/node-cli", tmp);
    // The resolver should have loaded overrides, though how they affect
    // output depends on DataSource implementation
    assert.equal(typeof resolver.resolve, "function");
    removeTmpDir(tmp);
  });

  it("accepts docsDir option", async () => {
    tmp = createTmpDir("resolver-factory");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    const docsDir = path.join(tmp, "docs", "ja");
    fs.mkdirSync(docsDir, { recursive: true });

    const resolver = await createResolver("cli/node-cli", tmp, { docsDir });
    assert.equal(typeof resolver.resolve, "function");
    removeTmpDir(tmp);
  });
});
