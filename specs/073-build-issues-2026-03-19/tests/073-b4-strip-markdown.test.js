import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { createResolver } from "../../../../src/docs/lib/resolver-factory.js";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../../helpers/tmp-dir.js";

// ---------------------------------------------------------------------------
// B4: README chapter description should not contain markdown formatting
// ---------------------------------------------------------------------------

describe("B4: DocsSource.chapters() strips markdown from descriptions", () => {
  let tmp;

  afterEach(() => {
    if (tmp) removeTmpDir(tmp);
    tmp = null;
  });

  it("strips **bold** from chapter description", async () => {
    tmp = createTmpDir("b4-strip-md-");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", { name: "test", version: "1.0.0" });

    const docsDir = path.join(tmp, "docs");
    fs.mkdirSync(docsDir, { recursive: true });
    writeFile(
      tmp,
      "docs/overview.md",
      "# Overview\n\n## Description\nThis introduces **sdd-forge**, a CLI tool for docs.\n",
    );

    const resolver = await createResolver("node-cli", tmp, { type: "node-cli" });
    const result = resolver.resolve("base", "docs", "chapters", {}, ["Chapter", "Description"]);

    assert.ok(result, "should return chapter table");
    assert.ok(!result.includes("**sdd-forge**"), "bold markers should be stripped");
    assert.ok(result.includes("sdd-forge"), "text content should remain");
  });

  it("strips [link](url) from chapter description", async () => {
    tmp = createTmpDir("b4-strip-link-");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", { name: "test", version: "1.0.0" });

    const docsDir = path.join(tmp, "docs");
    fs.mkdirSync(docsDir, { recursive: true });
    writeFile(
      tmp,
      "docs/overview.md",
      "# Overview\n\n## Description\nSee [the guide](https://example.com) for details.\n",
    );

    const resolver = await createResolver("node-cli", tmp, { type: "node-cli" });
    const result = resolver.resolve("base", "docs", "chapters", {}, ["Chapter", "Description"]);

    assert.ok(result, "should return chapter table");
    assert.ok(!result.includes("[the guide]"), "link syntax should be stripped");
    assert.ok(result.includes("the guide"), "link text should remain");
  });

  it("strips `code` from chapter description", async () => {
    tmp = createTmpDir("b4-strip-code-");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", { name: "test", version: "1.0.0" });

    const docsDir = path.join(tmp, "docs");
    fs.mkdirSync(docsDir, { recursive: true });
    writeFile(
      tmp,
      "docs/overview.md",
      "# Overview\n\n## Description\nRun `npm test` to verify.\n",
    );

    const resolver = await createResolver("node-cli", tmp, { type: "node-cli" });
    const result = resolver.resolve("base", "docs", "chapters", {}, ["Chapter", "Description"]);

    assert.ok(result, "should return chapter table");
    assert.ok(!result.includes("`npm test`"), "backtick code should be stripped");
    assert.ok(result.includes("npm test"), "code text should remain");
  });
});
