import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/scan.js");

describe("scan CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("generates analysis.json with --stdout", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      scan: { include: ["src/**/*.js"], exclude: [] },
    });
    writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\n');

    const result = execFileSync("node", [CMD, "--stdout"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    const analysis = JSON.parse(result);
    assert.ok(analysis.analyzedAt);
  });

  it("writes analysis.json to output dir", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      scan: { include: ["src/**/*.js"], exclude: [] },
    });
    fs.mkdirSync(join(tmp, ".sdd-forge/output"), { recursive: true });
    writeFile(tmp, "src/main.js", "console.log('hello');\n");

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const outputPath = join(tmp, ".sdd-forge/output/analysis.json");
    assert.ok(fs.existsSync(outputPath));
    const analysis = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert.ok(analysis.analyzedAt);
  });

  it("shows help with --help", () => {
    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: "/tmp" },
    });
    assert.match(result, /--stdout/);
  });
});
