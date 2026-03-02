import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/readme.js");

describe("readme CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("generates README.md from chapter files", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    writeJson(tmp, "package.json", { name: "test-project", description: "A test" });

    const chapter = [
      "# 01. Overview",
      "## 説明",
      "This is an overview",
      "## 内容",
      "Some content",
    ].join("\n");
    writeFile(tmp, "docs/01_overview.md", chapter);

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    const readme = join(tmp, "README.md");
    assert.ok(fs.existsSync(readme), "README.md should be created");
    const content = fs.readFileSync(readme, "utf8");
    assert.match(content, /test-project/);
  });

  it("skips when type is not set", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja" });

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /type.*設定されていません/);
  });

  it("dry-run does not write README", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    writeJson(tmp, "package.json", { name: "test" });
    writeFile(tmp, "docs/01_test.md", "# 01. Test\n## 説明\ndesc\n## 内容\ncontent\n");

    execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });

    assert.ok(!fs.existsSync(join(tmp, "README.md")));
  });
});
