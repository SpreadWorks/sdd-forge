import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/default-project.js");

describe("default-project CLI", () => {
  let tmp;
  let origCwd;

  beforeEach(() => {
    tmp = createTmpDir();
    mkdirSync(join(tmp, ".sdd-forge"), { recursive: true });
    origCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(origCwd);
    removeTmpDir(tmp);
  });

  it("lists projects when no argument given", () => {
    writeJson(tmp, ".sdd-forge/projects.json", {
      projects: { myapp: { path: "/app" } },
      default: "myapp",
    });

    const result = execFileSync("node", [CMD], {
      encoding: "utf8",
      cwd: tmp,
    });
    assert.match(result, /myapp/);
    assert.match(result, /default/);
  });

  it("exits non-zero when no projects registered and no args", () => {
    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        cwd: tmp,
      });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stderr, /No projects/);
    }
  });

  it("sets default project", () => {
    writeJson(tmp, ".sdd-forge/projects.json", {
      projects: { a: { path: "/a" }, b: { path: "/b" } },
      default: "a",
    });

    const result = execFileSync("node", [CMD, "b"], {
      encoding: "utf8",
      cwd: tmp,
    });
    assert.match(result, /Default project set to 'b'/);
  });
});
