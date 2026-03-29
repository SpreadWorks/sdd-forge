/**
 * tests/unit/lib/include.test.js
 *
 * Unit tests for the include directive resolver.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import { resolveIncludes } from "../../../src/lib/include.js";

describe("resolveIncludes", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("replaces include directive with file content", () => {
    tmp = createTmpDir();
    fs.writeFileSync(path.join(tmp, "partial.md"), "Hello from partial");

    const content = '# Title\n<!-- include("partial.md") -->\n# End';
    const result = resolveIncludes(content, { baseDir: tmp });
    assert.equal(result, "# Title\nHello from partial\n# End");
  });

  it("resolves @templates/ path", () => {
    tmp = createTmpDir();
    const templatesDir = path.join(tmp, "templates");
    const partialsDir = path.join(templatesDir, "partials");
    fs.mkdirSync(partialsDir, { recursive: true });
    fs.writeFileSync(path.join(partialsDir, "shared.md"), "Shared content");

    const content = '<!-- include("@templates/partials/shared.md") -->';
    const result = resolveIncludes(content, { baseDir: tmp, templatesDir });
    assert.equal(result, "Shared content");
  });

  it("resolves @presets/<preset>/ path", () => {
    tmp = createTmpDir();
    const presetsDir = path.join(tmp, "presets");
    const presetDir = path.join(presetsDir, "base", "templates");
    fs.mkdirSync(presetDir, { recursive: true });
    fs.writeFileSync(path.join(presetDir, "fragment.md"), "Preset fragment");

    const content = '<!-- include("@presets/base/templates/fragment.md") -->';
    const result = resolveIncludes(content, { baseDir: tmp, presetsDir });
    assert.equal(result, "Preset fragment");
  });

  it("resolves /absolute path from pkgDir", () => {
    tmp = createTmpDir();
    const subDir = path.join(tmp, "sub");
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(tmp, "sub", "abs.md"), "Absolute resolved");

    const content = '<!-- include("/sub/abs.md") -->';
    const result = resolveIncludes(content, { baseDir: tmp, pkgDir: tmp });
    assert.equal(result, "Absolute resolved");
  });

  it("recursively resolves nested includes", () => {
    tmp = createTmpDir();
    fs.writeFileSync(path.join(tmp, "a.md"), '<!-- include("b.md") -->');
    fs.writeFileSync(path.join(tmp, "b.md"), "Nested content");

    const content = '<!-- include("a.md") -->';
    const result = resolveIncludes(content, { baseDir: tmp });
    assert.equal(result, "Nested content");
  });

  it("throws on ../ in path", () => {
    tmp = createTmpDir();
    const content = '<!-- include("../evil.md") -->';
    assert.throws(
      () => resolveIncludes(content, { baseDir: tmp }),
      /forbidden.*\.\.\//i,
    );
  });

  it("throws on ./ in path", () => {
    tmp = createTmpDir();
    const content = '<!-- include("./local.md") -->';
    assert.throws(
      () => resolveIncludes(content, { baseDir: tmp }),
      /forbidden.*\.\//i,
    );
  });

  it("throws on circular reference", () => {
    tmp = createTmpDir();
    fs.writeFileSync(path.join(tmp, "a.md"), '<!-- include("b.md") -->');
    fs.writeFileSync(path.join(tmp, "b.md"), '<!-- include("a.md") -->');

    const content = '<!-- include("a.md") -->';
    assert.throws(
      () => resolveIncludes(content, { baseDir: tmp }),
      /circular/i,
    );
  });

  it("throws on file not found with source file info", () => {
    tmp = createTmpDir();
    const content = '<!-- include("nonexistent.md") -->';
    assert.throws(
      () => resolveIncludes(content, { baseDir: tmp, sourceFile: "SKILL.en.md" }),
      /nonexistent\.md/,
    );
  });

  it("preserves lines without include directives", () => {
    tmp = createTmpDir();
    fs.writeFileSync(path.join(tmp, "part.md"), "Inserted");

    const content = "Line 1\n<!-- include(\"part.md\") -->\nLine 3";
    const result = resolveIncludes(content, { baseDir: tmp });
    assert.equal(result, "Line 1\nInserted\nLine 3");
  });

  it("handles multiple includes in one file", () => {
    tmp = createTmpDir();
    fs.writeFileSync(path.join(tmp, "a.md"), "AAA");
    fs.writeFileSync(path.join(tmp, "b.md"), "BBB");

    const content = '<!-- include("a.md") -->\nMiddle\n<!-- include("b.md") -->';
    const result = resolveIncludes(content, { baseDir: tmp });
    assert.equal(result, "AAA\nMiddle\nBBB");
  });
});
