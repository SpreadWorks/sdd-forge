import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/review.js");
const MIN_CONFIG = { lang: "en", type: "cli/node-cli", docs: { languages: ["en"], defaultLanguage: "en" } };

function setupTmp() {
  const tmp = createTmpDir();
  writeJson(tmp, ".sdd-forge/config.json", MIN_CONFIG);
  return tmp;
}

describe("review CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("passes with valid chapter files", () => {
    tmp = setupTmp();
    const lines = ["# 01. Introduction", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/intro.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /PASSED/);
  });

  it("fails when no chapter files found", () => {
    tmp = setupTmp();
    writeFile(tmp, "docs/.gitkeep", "");

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stderr, /no chapter files found/);
    }
  });

  it("fails when chapter is too short", () => {
    tmp = setupTmp();
    writeFile(tmp, "docs/short.md", "# 01. Short\nOnly two lines\n");

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stdout, /too short/);
    }
  });

  it("fails when chapter has no H1 heading", () => {
    tmp = setupTmp();
    const lines = ["No heading here", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/noheading.md", lines.join("\n"));

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stdout, /missing H1/);
    }
  });

  it("warns but does not fail when {{data}} directive is unfilled", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 10; i++) lines.push(`Line ${i}`);
    lines.push('<!-- {{data: controllers.list("Name|Actions")}} -->');
    lines.push(""); // empty line = unfilled
    lines.push('<!-- {{/data}} -->');
    for (let i = 0; i < 5; i++) lines.push(`More ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /unfilled \{\{data\}\}/);
  });

  it("does not fail on inline {{data}} examples in prose", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 10; i++) lines.push(`Line ${i}`);
    lines.push('Example inline syntax: `{{data: mySource.list("Col1|Col2")}}`');
    lines.push('Example comment syntax: `<!-- {{data: mySource.list("Col1|Col2")}} -->`');
    lines.push('Example closing syntax: `<!-- {{/data}} -->`');
    for (let i = 0; i < 8; i++) lines.push(`More ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.doesNotMatch(result, /unfilled \{\{data\}\}/);
    assert.match(result, /PASSED/);
  });


  it("warns when {{text}} directive is unfilled (empty block)", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 10; i++) lines.push(`Line ${i}`);
    lines.push("<!-- {{text: describe this}} -->");
    lines.push("<!-- {{/text}} -->");
    for (let i = 0; i < 5; i++) lines.push(`More ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    // unfilled text is a WARN, not FAIL — command should still pass
    assert.match(result, /unfilled \{\{text\}\}/);
  });

  it("warns when analysis.json is missing", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /analysis\.json not found/);
  });

  it("warns when analysis category is not covered by any directive", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 10; i++) lines.push(`Line ${i}`);
    lines.push('<!-- {{data: project.name("")}} -->');
    lines.push("test-project");
    lines.push("<!-- {{/data}} -->");
    for (let i = 0; i < 5; i++) lines.push(`More ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    // analysis has "modules" and "controllers" but docs only reference "project"
    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      modules: [{ name: "foo" }, { name: "bar" }],
      controllers: [{ name: "UserController" }],
    });

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /uncovered analysis category: modules/);
    assert.match(result, /uncovered analysis category: controllers/);
    assert.match(result, /PASSED/); // WARN does not cause FAIL
  });

  it("does not warn when all analysis categories are covered", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 10; i++) lines.push(`Line ${i}`);
    lines.push('<!-- {{data: modules.list("")}} -->');
    lines.push("mod list here");
    lines.push("<!-- {{/data}} -->");
    for (let i = 0; i < 5; i++) lines.push(`More ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      modules: [{ name: "foo" }],
    });

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.ok(!result.includes("uncovered analysis category"), "should not warn about covered categories");
    assert.match(result, /PASSED/);
  });

  it("skips coverage check when analysis.json does not exist", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.ok(!result.includes("uncovered analysis category"), "should not check coverage without analysis");
  });

  it("coverage warning does not cause FAIL", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      modules: [{ name: "a" }, { name: "b" }, { name: "c" }],
    });

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /uncovered analysis category: modules \(3 entries\)/);
    assert.match(result, /PASSED/); // WARN only, does not FAIL
  });

  it("does not warn for enrichedAt coverage", () => {
    tmp = setupTmp();
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Line ${i}`);
    writeFile(tmp, "docs/test.md", lines.join("\n"));

    writeJson(tmp, ".sdd-forge/output/analysis.json", {
      analyzedAt: "2026-01-01",
      enrichedAt: "2026-01-02",
      modules: [{ name: "a" }],
    });

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.doesNotMatch(result, /uncovered analysis category: enrichedAt/);
    assert.match(result, /uncovered analysis category: modules/);
    assert.match(result, /PASSED/);
  });
});
