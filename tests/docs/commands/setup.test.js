import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync, spawnSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/setup.js");

/** Non-interactive CLI args that satisfy hasAllRequired */
const NI_ARGS = [
  "--name", "test-proj",
  "--type", "webapp",
  "--purpose", "developer-guide",
  "--tone", "polite",
];

describe("setup CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows help with --help", () => {
    tmp = createTmpDir();
    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      cwd: tmp,
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /setup/i);
  });

  it("runs interactive setup and prompts for input", () => {
    tmp = createTmpDir();
    writeJson(tmp, "package.json", { name: "test-proj" });

    // Send empty input to trigger interactive prompt; it should ask for language
    const result = spawnSync("node", [CMD], {
      encoding: "utf8",
      cwd: tmp,
      input: "\n",
      timeout: 5000,
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    // Should prompt for UI language selection
    const output = result.stdout + result.stderr;
    assert.match(output, /Setup|language|lang/i);
  });

  it("skips projects.json when source is cwd (local single-project)", () => {
    tmp = createTmpDir();
    writeJson(tmp, "package.json", { name: "test-proj" });

    const result = spawnSync("node", [CMD, ...NI_ARGS], {
      encoding: "utf8",
      cwd: tmp,
      timeout: 10000,
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    // projects.json must NOT exist
    assert.ok(
      !fs.existsSync(join(tmp, ".sdd-forge", "projects.json")),
      "projects.json should not be created for local single-project setup",
    );
    // config.json must exist
    assert.ok(
      fs.existsSync(join(tmp, ".sdd-forge", "config.json")),
      "config.json should be created",
    );
    // directory structure must exist
    assert.ok(fs.existsSync(join(tmp, ".sdd-forge", "output", ".gitkeep")));
    assert.ok(fs.existsSync(join(tmp, "docs")));
    assert.ok(fs.existsSync(join(tmp, "specs")));
  });

  it("creates projects.json and .gitignore when --path differs from cwd", () => {
    tmp = createTmpDir();
    const srcDir = join(tmp, "src-project");
    fs.mkdirSync(srcDir, { recursive: true });
    writeJson(tmp, "package.json", { name: "test-proj" });

    const result = spawnSync(
      "node",
      [CMD, ...NI_ARGS, "--path", srcDir],
      {
        encoding: "utf8",
        cwd: tmp,
        timeout: 10000,
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      },
    );
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    // projects.json must exist
    assert.ok(
      fs.existsSync(join(tmp, ".sdd-forge", "projects.json")),
      "projects.json should be created when --path differs from cwd",
    );

    // .gitignore must contain projects.json
    const gitignorePath = join(tmp, ".sdd-forge", ".gitignore");
    assert.ok(
      fs.existsSync(gitignorePath),
      ".sdd-forge/.gitignore should be created",
    );
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    assert.ok(
      gitignoreContent.split("\n").some((l) => l.trim() === "projects.json"),
      ".gitignore should contain projects.json entry",
    );
  });
});
