import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Test environment detection will be implemented in a lib module
// For now, test the scan extension for scripts extraction

describe("scan scripts extraction", () => {
  it("includes scripts.test in analysis when package.json has test script", async () => {
    const { execFileSync } = await import("child_process");
    const { join } = await import("path");
    const { createTmpDir, removeTmpDir, writeJson, writeFile } = await import("../../helpers/tmp-dir.js");

    const tmp = createTmpDir();
    try {
      writeJson(tmp, ".sdd-forge/config.json", {
        lang: "en",
        type: "cli/node-cli",
        output: { languages: ["en"], default: "en" },
        scan: { include: ["src/**/*.js", "package.json"], exclude: [] },
      });
      writeJson(tmp, "package.json", {
        name: "test-project",
        scripts: { test: "node --test", build: "tsc" },
        devDependencies: { jest: "^29.0.0" },
      });
      writeFile(tmp, "src/index.js", 'export function hello() {}\n');

      const CMD = join(process.cwd(), "src/docs/commands/scan.js");
      const result = execFileSync("node", [CMD, "--stdout"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      const analysis = JSON.parse(result);

      assert.ok(analysis.package?.packageScripts, "packageScripts should be in analysis.package");
      assert.equal(analysis.package.packageScripts.test, "node --test");
    } finally {
      removeTmpDir(tmp);
    }
  });

  it("packageScripts is absent when package.json has no scripts", async () => {
    const { execFileSync } = await import("child_process");
    const { join } = await import("path");
    const { createTmpDir, removeTmpDir, writeJson, writeFile } = await import("../../helpers/tmp-dir.js");

    const tmp = createTmpDir();
    try {
      writeJson(tmp, ".sdd-forge/config.json", {
        lang: "en",
        type: "cli/node-cli",
        output: { languages: ["en"], default: "en" },
        scan: { include: ["src/**/*.js"], exclude: [] },
      });
      writeJson(tmp, "package.json", {
        name: "test-project",
      });
      writeFile(tmp, "src/index.js", 'export function hello() {}\n');

      const CMD = join(process.cwd(), "src/docs/commands/scan.js");
      const result = execFileSync("node", [CMD, "--stdout"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      const analysis = JSON.parse(result);

      // packageScripts should not exist or be empty
      assert.ok(!analysis.package?.packageScripts || Object.keys(analysis.package.packageScripts).length === 0);
    } finally {
      removeTmpDir(tmp);
    }
  });
});

describe("test environment detection", () => {
  it("detects test environment from devDependencies", async () => {
    const { detectTestEnvironment } = await import("../../../src/docs/lib/test-env-detection.js");

    const analysis = {
      package: {
        packageDeps: {
          dependencies: {},
          devDependencies: { jest: "^29.0.0" },
        },
        packageScripts: { test: "jest" },
      },
    };

    const result = detectTestEnvironment(analysis);
    assert.equal(result.hasTestEnv, true);
    assert.ok(result.frameworks.includes("jest"));
    assert.equal(result.testCommand, "jest");
  });

  it("detects no test environment when no frameworks or scripts", async () => {
    const { detectTestEnvironment } = await import("../../../src/docs/lib/test-env-detection.js");

    const analysis = {
      package: {
        packageDeps: {
          dependencies: {},
          devDependencies: {},
        },
      },
    };

    const result = detectTestEnvironment(analysis);
    assert.equal(result.hasTestEnv, false);
    assert.equal(result.frameworks.length, 0);
  });
});
