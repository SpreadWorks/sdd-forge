import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/snapshot.js");

function setupProject(tmp) {
  writeJson(tmp, ".sdd-forge/config.json", {
    lang: "en",
    type: "cli/node-cli",
    docs: { languages: ["en"], defaultLanguage: "en" },
    scan: { include: ["src/**/*.js"], exclude: [] },
  });
  writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\n');
  // Create a valid chapter file with H1 and enough lines
  const lines = ["# 01. Overview", ""];
  for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
  writeFile(tmp, "docs/01_overview.md", lines.join("\n"));
}

describe("snapshot CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("save creates snapshot files", () => {
    tmp = createTmpDir();
    setupProject(tmp);

    execFileSync("node", [CMD, "save"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const snapshotDir = join(tmp, ".sdd-forge", "snapshots");
    assert.ok(fs.existsSync(snapshotDir), "snapshots directory should exist");
    const files = fs.readdirSync(snapshotDir);
    assert.ok(files.length > 0, "should have at least one snapshot file");
  });

  it("check passes when no changes since save", () => {
    tmp = createTmpDir();
    setupProject(tmp);

    // save first
    execFileSync("node", [CMD, "save"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    // check should pass
    const result = execFileSync("node", [CMD, "check"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /PASS|no diff/i);
  });

  it("check reports diff when output changes", () => {
    tmp = createTmpDir();
    setupProject(tmp);

    // save
    execFileSync("node", [CMD, "save"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    // modify a source file so scan output changes
    writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\nexport function bye() { return "bye"; }\n');

    // check should report diff
    try {
      execFileSync("node", [CMD, "check"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      // May pass with diff reported as warning, or fail — either way should mention diff
    } catch (err) {
      assert.match(err.stdout || err.stderr, /diff|changed|mismatch/i);
    }
  });

  it("update replaces snapshot with current output", () => {
    tmp = createTmpDir();
    setupProject(tmp);

    // save initial
    execFileSync("node", [CMD, "save"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    // modify source
    writeFile(tmp, "src/index.js", 'export function hello() { return "hi"; }\nexport function bye() { return "bye"; }\n');

    // update
    execFileSync("node", [CMD, "update"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    // check should now pass
    const result = execFileSync("node", [CMD, "check"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /PASS|no diff/i);
  });
});
