import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "fs";
import { join } from "path";
import { loadProjects, addProject, setDefault, resolveProject } from "../../src/lib/projects.js";
import { createTmpDir, removeTmpDir, writeJson } from "../helpers/tmp-dir.js";

describe("projects", () => {
  let tmp;
  let origCwd;

  beforeEach(() => {
    tmp = createTmpDir();
    mkdirSync(join(tmp, ".sdd-forge"), { recursive: true });
    origCwd = process.cwd();
    process.chdir(tmp);
  });

  afterEach(() => {
    process.chdir(origCwd);
    removeTmpDir(tmp);
  });

  describe("loadProjects", () => {
    it("returns null when no projects.json", () => {
      assert.equal(loadProjects(), null);
    });

    it("returns parsed data when file exists", () => {
      writeJson(tmp, ".sdd-forge/projects.json", {
        projects: { myapp: { path: "/app" } },
        default: "myapp",
      });
      const data = loadProjects();
      assert.equal(data.default, "myapp");
      assert.equal(data.projects.myapp.path, "/app");
    });
  });

  describe("addProject", () => {
    it("adds a new project and sets as default when first", () => {
      const data = addProject("myapp", "/home/test/myapp");
      assert.equal(data.default, "myapp");
      assert.ok(data.projects.myapp);
    });

    it("throws when project already exists", () => {
      addProject("myapp", "/home/test/myapp");
      assert.throws(() => addProject("myapp", "/other"), /already exists/);
    });

    it("records workRoot when different from path", () => {
      const data = addProject("app", "/src/app", { workRoot: "/work/app" });
      assert.equal(data.projects.app.workRoot, "/work/app");
    });

    it("does not record workRoot when same as path", () => {
      const data = addProject("app", "/src/app", { workRoot: "/src/app" });
      assert.equal(data.projects.app.workRoot, undefined);
    });
  });

  describe("setDefault", () => {
    it("changes the default project", () => {
      addProject("a", "/a");
      addProject("b", "/b");
      setDefault("b");
      const data = loadProjects();
      assert.equal(data.default, "b");
    });

    it("throws when no projects.json exists", () => {
      assert.throws(() => setDefault("x"), /not found/);
    });

    it("throws when project does not exist", () => {
      addProject("a", "/a");
      assert.throws(() => setDefault("nonexistent"), /not found/);
    });
  });

  describe("resolveProject", () => {
    it("resolves by name", () => {
      addProject("myapp", "/home/myapp");
      const result = resolveProject("myapp");
      assert.equal(result.name, "myapp");
    });

    it("resolves default when no name given", () => {
      addProject("myapp", "/home/myapp");
      const result = resolveProject();
      assert.equal(result.name, "myapp");
    });

    it("returns null when no projects.json", () => {
      assert.equal(resolveProject(), null);
    });

    it("throws when project not found", () => {
      addProject("a", "/a");
      assert.throws(() => resolveProject("nonexistent"), /not found/);
    });
  });
});
