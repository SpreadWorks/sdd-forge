import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync, spawnSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/scan.js");

describe("scan CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("generates analysis.json with --stdout including modules", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      output: { languages: ["ja"], default: "ja" },
      scan: { include: ["src/**/*.js"], exclude: [] },
    });
    writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\n');

    const result = execFileSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    const analysis = JSON.parse(result);
    assert.ok(analysis.analyzedAt);
    assert.ok(analysis.modules, "modules category should be in analysis");
    assert.equal(analysis.modules.summary.total, 1);
  });

  it("does not emit WARN or legacy prefix on stderr for node-cli type", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      output: { languages: ["ja"], default: "ja" },
      scan: { include: ["src/**/*.js"], exclude: [] },
    });
    writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\n');

    const proc = spawnSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.equal(proc.status, 0);
    assert.ok(!proc.stderr.includes("WARN"), `unexpected WARN in stderr: ${proc.stderr}`);
    assert.ok(!proc.stderr.includes("[analyze]"), `legacy [analyze] prefix found in stderr: ${proc.stderr}`);
  });

  it("writes analysis.json and summary.json with modules to output dir", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      output: { languages: ["ja"], default: "ja" },
      scan: { include: ["src/**/*.js"], exclude: [] },
    });
    fs.mkdirSync(join(tmp, ".sdd-forge/output"), { recursive: true });
    writeFile(tmp, "src/main.js", "function main() {}\n");

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const outputPath = join(tmp, ".sdd-forge/output/analysis.json");
    assert.ok(fs.existsSync(outputPath));
    const analysis = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert.ok(analysis.analyzedAt);
    assert.ok(analysis.modules, "modules should be in analysis.json");

    const summaryPath = join(tmp, ".sdd-forge/output/summary.json");
    assert.ok(fs.existsSync(summaryPath));
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    assert.ok(summary.modules, "modules should be in summary.json");
    assert.equal(summary.modules.total, 1);
  });

  it("--dry-run outputs to stdout without writing file", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      output: { languages: ["ja"], default: "ja" },
      scan: { include: ["src/**/*.js"], exclude: [] },
    });
    writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\n');
    fs.mkdirSync(join(tmp, ".sdd-forge/output"), { recursive: true });

    const result = execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    const analysis = JSON.parse(result);
    assert.ok(analysis.analyzedAt);
    // File should NOT be written
    assert.ok(!fs.existsSync(join(tmp, ".sdd-forge/output/analysis.json")));
  });

  it("shows help with --help", () => {
    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: "/tmp" },
    });
    assert.match(result, /--stdout/);
  });

  it("scans webapp/cakephp2 with parent-child DataSource inheritance", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "webapp/cakephp2",
      output: { languages: ["ja"], default: "ja" },
    });
    writeFile(tmp, "app/Controller/UsersController.php", [
      "<?php",
      "class UsersController extends AppController {",
      "  public $uses = array('User');",
      "  public function index() {}",
      "  public function view() {}",
      "}",
    ].join("\n"));

    const result = execFileSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    const analysis = JSON.parse(result);
    assert.ok(analysis.analyzedAt);
    // CakePHP controllers DataSource overrides webapp parent
    assert.ok(analysis.controllers, "controllers category should exist");
    assert.equal(analysis.controllers.summary.total, 1);
    assert.equal(analysis.controllers.controllers[0].className, "UsersController");
  });

  it("includes extras from universal analyzeExtras", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      output: { languages: ["ja"], default: "ja" },
    });
    writeJson(tmp, "package.json", {
      dependencies: { "express": "^4.0.0" },
    });

    const result = execFileSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    const analysis = JSON.parse(result);
    assert.ok(analysis.extras);
    assert.ok(analysis.extras.packageDeps);
    assert.deepEqual(analysis.extras.packageDeps.dependencies, { "express": "^4.0.0" });
  });
});
