import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { genericScan } from "../../../src/docs/lib/scanner.js";
import { createTmpDir, removeTmpDir, writeFile } from "../../helpers/tmp-dir.js";

describe("genericScan", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("scans modules category for cli type via SCAN_DEFAULTS", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/hello.js", 'export function greet() { return "hi"; }\n');
    writeFile(tmp, "src/lib/utils.js", "function parse(s) { return s; }\n");

    const result = genericScan(tmp, "cli", {});
    assert.ok(result.analyzedAt);
    assert.ok(result.modules, "modules category should exist");
    assert.ok(result.modules.summary);
    assert.equal(result.modules.summary.total, 2);
    assert.ok(result.modules.modules.length === 2);
    // Check file paths
    const files = result.modules.modules.map((m) => m.file);
    assert.ok(files.includes("src/hello.js"));
    assert.ok(files.includes("src/lib/utils.js"));
  });

  it("scans modules for node-cli type too", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/main.js", "function main() {}\n");

    const result = genericScan(tmp, "node-cli", {});
    assert.ok(result.modules);
    assert.equal(result.modules.summary.total, 1);
  });

  it("parses JS methods in generic category", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/app.js", [
      "export function start() {}",
      "export async function stop() {}",
      "function internal() {}",
    ].join("\n") + "\n");

    const result = genericScan(tmp, "cli", {});
    const app = result.modules.modules.find((m) => m.className === "app");
    assert.ok(app);
    assert.ok(app.methods.includes("start"));
    assert.ok(app.methods.includes("stop"));
    assert.ok(app.methods.includes("internal"));
  });

  it("uses scanOverrides to define custom categories", () => {
    tmp = createTmpDir();
    writeFile(tmp, "lib/plugin-a.js", "export function init() {}\n");
    writeFile(tmp, "lib/plugin-b.js", "export function init() {}\n");

    const result = genericScan(tmp, "cli", {
      plugins: { dir: "lib", pattern: "plugin-*.js", lang: "js" },
    });
    assert.ok(result.plugins, "custom category should exist");
    assert.equal(result.plugins.summary.total, 2);
    assert.ok(result.plugins.plugins.length === 2);
  });

  it("ignores non-category scan config keys like include/exclude", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/index.js", "export function main() {}\n");

    const result = genericScan(tmp, "cli", {
      include: ["src/**/*.js"],
      exclude: [],
    });
    assert.ok(result.modules);
    assert.equal(result.include, undefined);
    assert.equal(result.exclude, undefined);
  });

  it("preserves controllers output format for php-mvc type", () => {
    tmp = createTmpDir();
    writeFile(tmp, "app/Controller/UsersController.php", [
      "<?php",
      "class UsersController extends AppController {",
      "  public function index() {}",
      "  public function view() {}",
      "}",
    ].join("\n") + "\n");

    const result = genericScan(tmp, "php-mvc", {});
    assert.ok(result.controllers);
    assert.equal(result.controllers.summary.total, 1);
    assert.equal(result.controllers.summary.totalActions, 2);
    const ctrl = result.controllers.controllers[0];
    assert.equal(ctrl.className, "UsersController");
    assert.deepEqual(ctrl.actions, ["index", "view"]);
  });

  it("always includes extras", () => {
    tmp = createTmpDir();
    const result = genericScan(tmp, "cli", {});
    assert.ok("extras" in result);
  });

  it("reports totalMethods in generic category summary", () => {
    tmp = createTmpDir();
    writeFile(tmp, "src/a.js", "function x() {}\nfunction y() {}\n");
    writeFile(tmp, "src/b.js", "function z() {}\n");

    const result = genericScan(tmp, "cli", {});
    assert.equal(result.modules.summary.totalMethods, 3);
  });
});
