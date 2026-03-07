import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/init.js");

describe("init CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("creates docs/ from template", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    writeJson(tmp, "package.json", { name: "test-proj" });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 1 } },
    });

    execFileSync("node", [CMD, "--type", "cli/node-cli"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const docsDir = join(tmp, "docs");
    assert.ok(fs.existsSync(docsDir), "docs/ should be created");
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    assert.ok(files.length > 0, "should have chapter files");
  });

  it("--dry-run shows files without writing", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    writeJson(tmp, "package.json", { name: "test-proj" });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 1 } },
    });

    const result = execFileSync("node", [CMD, "--type", "cli/node-cli", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /DRY-RUN/);
    // docs/ should NOT have chapter files
    const docsDir = join(tmp, "docs");
    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
      assert.equal(files.length, 0, "no files should be written in dry-run");
    }
  });

  it("shows help with --help", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });

    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /--type/);
  });

  it("passes documentStyle.purpose to AI chapter-selection prompt", () => {
    tmp = createTmpDir();
    const promptCapture = join(tmp, "prompt.txt");
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      documentStyle: { purpose: "user-guide", tone: "polite" },
      defaultAgent: "capture",
      providers: {
        capture: {
          command: "node",
          args: [
            "-e",
            "const fs=require('fs');const prompt=process.argv[process.argv.length-1]||'';fs.writeFileSync(process.env.PROMPT_CAPTURE,prompt,'utf8');process.stdout.write('[\"01_overview.md\"]');",
            "{{PROMPT}}",
          ],
        },
      },
    });
    writeJson(tmp, "package.json", { name: "test-proj" });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 1 } },
    });
    writeJson(tmp, ".sdd-forge/output/summary.json", {
      files: { summary: { total: 1 } },
    });

    execFileSync("node", [CMD, "--type", "cli/node-cli"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SDD_WORK_ROOT: tmp,
        SDD_SOURCE_ROOT: tmp,
        PROMPT_CAPTURE: promptCapture,
      },
    });

    const prompt = fs.readFileSync(promptCapture, "utf8");
    assert.match(prompt, /## Documentation Purpose/);
    assert.match(prompt, /user-guide/);
  });
});
