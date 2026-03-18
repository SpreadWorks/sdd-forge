import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/agents.js");

describe("agents CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("exits non-zero when AGENTS.md is missing", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli", docs: { languages: ["ja"], defaultLanguage: "ja" } });
    writeJson(tmp, ".sdd-forge/output/analysis.json", { analyzedAt: "2026-01-01" });

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /not found|見つかりません/i);
    }
  });

  it("exits non-zero when analysis.json is missing", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli", docs: { languages: ["ja"], defaultLanguage: "ja" } });
    writeFile(tmp, "AGENTS.md", [
      '<!-- {{data: base.agents.sdd("")}} -->',
      '<!-- {{/data}} -->',
    ].join("\n"));

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /analysis\.json/);
    }
  });

  it("exits non-zero when no agent configured (for project directive)", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli", docs: { languages: ["ja"], defaultLanguage: "ja" } });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 5 } },
    });
    writeFile(tmp, "AGENTS.md", [
      '<!-- {{data: base.agents.sdd("")}} -->',
      '<!-- {{/data}} -->',
      '',
      '<!-- {{data: base.agents.project("")}} -->',
      '<!-- {{/data}} -->',
    ].join("\n"));

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /default agent/i);
    }

    // File should remain unchanged (write only happens on success)
    const content = fs.readFileSync(join(tmp, "AGENTS.md"), "utf8");
    assert.match(content, /agents\.sdd/);
  });

  it("resolves sdd directive when no project directive exists", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli", docs: { languages: ["ja"], defaultLanguage: "ja" } });
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      files: { summary: { total: 5 } },
    });
    writeFile(tmp, "AGENTS.md", [
      '<!-- {{data: base.agents.sdd("")}} -->',
      '<!-- {{/data}} -->',
      '',
      'Custom content below',
    ].join("\n"));

    // No project directive = no AI needed = should succeed without agent
    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const content = fs.readFileSync(join(tmp, "AGENTS.md"), "utf8");
    // SDD template should be resolved
    assert.match(content, /SDD \(Spec-Driven Development\)/);
    // Custom content should remain
    assert.match(content, /Custom content below/);
    // Directive tags should still be present
    assert.match(content, /agents\.sdd/);
  });
});
