import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  findFiles, parseFile, parseJSFile, parsePHPFile,
  analyzeExtras, isCategoryEntry,
} from "../../../src/docs/lib/scanner.js";
import { createTmpDir, removeTmpDir, writeFile } from "../../helpers/tmp-dir.js";

describe("scanner utilities", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  describe("findFiles", () => {
    it("finds matching files in a directory", () => {
      tmp = createTmpDir();
      writeFile(tmp, "src/hello.js", "export function greet() {}");
      writeFile(tmp, "src/readme.txt", "ignored");

      const results = findFiles(`${tmp}/src`, "*.js");
      assert.equal(results.length, 1);
      assert.equal(results[0].fileName, "hello.js");
    });

    it("supports subdirectory scanning", () => {
      tmp = createTmpDir();
      writeFile(tmp, "src/hello.js", "");
      writeFile(tmp, "src/lib/utils.js", "");

      const results = findFiles(`${tmp}/src`, "*.js", [], true);
      assert.equal(results.length, 2);
      const files = results.map((r) => r.relPath);
      assert.ok(files.includes("hello.js"));
      assert.ok(files.includes("lib/utils.js"));
    });

    it("respects exclude list", () => {
      tmp = createTmpDir();
      writeFile(tmp, "src/app.js", "");
      writeFile(tmp, "src/test.js", "");

      const results = findFiles(`${tmp}/src`, "*.js", ["test.js"]);
      assert.equal(results.length, 1);
      assert.equal(results[0].fileName, "app.js");
    });
  });

  describe("parseJSFile", () => {
    it("extracts exported functions", () => {
      tmp = createTmpDir();
      writeFile(tmp, "app.js", [
        "export function start() {}",
        "export async function stop() {}",
        "function internal() {}",
      ].join("\n"));

      const result = parseJSFile(`${tmp}/app.js`);
      assert.ok(result.methods.includes("start"));
      assert.ok(result.methods.includes("stop"));
      assert.ok(result.methods.includes("internal"));
    });
  });

  describe("parsePHPFile", () => {
    it("extracts class name and public methods", () => {
      tmp = createTmpDir();
      writeFile(tmp, "UsersController.php", [
        "<?php",
        "class UsersController extends AppController {",
        "  public function index() {}",
        "  public function view() {}",
        "  private function _helper() {}",
        "}",
      ].join("\n"));

      const result = parsePHPFile(`${tmp}/UsersController.php`);
      assert.equal(result.className, "UsersController");
      assert.equal(result.parentClass, "AppController");
      assert.deepEqual(result.methods, ["index", "view"]);
    });
  });

  describe("parseFile", () => {
    it("dispatches to PHP parser for php lang", () => {
      tmp = createTmpDir();
      writeFile(tmp, "Foo.php", "<?php\nclass Foo { public function bar() {} }");

      const result = parseFile(`${tmp}/Foo.php`, "php");
      assert.equal(result.className, "Foo");
      assert.deepEqual(result.methods, ["bar"]);
    });

    it("dispatches to JS parser for js lang", () => {
      tmp = createTmpDir();
      writeFile(tmp, "foo.js", "export function bar() {}");

      const result = parseFile(`${tmp}/foo.js`, "js");
      assert.ok(result.methods.includes("bar"));
    });
  });

  describe("analyzeExtras", () => {
    it("extracts composer.json dependencies", () => {
      tmp = createTmpDir();
      writeFile(tmp, "composer.json", JSON.stringify({
        require: { "php": ">=7.4" },
        "require-dev": { "phpunit/phpunit": "^9" },
      }));

      const result = analyzeExtras(tmp);
      assert.ok(result.composerDeps);
      assert.deepEqual(result.composerDeps.require, { "php": ">=7.4" });
    });

    it("extracts package.json dependencies", () => {
      tmp = createTmpDir();
      writeFile(tmp, "package.json", JSON.stringify({
        dependencies: { "express": "^4" },
      }));

      const result = analyzeExtras(tmp);
      assert.ok(result.packageDeps);
      assert.deepEqual(result.packageDeps.dependencies, { "express": "^4" });
    });

    it("returns empty object when no package files exist", () => {
      tmp = createTmpDir();
      const result = analyzeExtras(tmp);
      assert.deepEqual(result, {});
    });
  });

  describe("isCategoryEntry", () => {
    it("returns true for objects with dir property", () => {
      assert.ok(isCategoryEntry({ dir: "src", pattern: "*.js" }));
    });

    it("returns true for objects with file property", () => {
      assert.ok(isCategoryEntry({ file: "routes.php", lang: "php" }));
    });

    it("returns false for non-objects", () => {
      assert.ok(!isCategoryEntry("string"));
      assert.ok(!isCategoryEntry(null));
      assert.ok(!isCategoryEntry([1, 2]));
    });
  });
});
