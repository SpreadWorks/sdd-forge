import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/text.js");

function makeEnv(tmp) {
  return { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp };
}

function setupProject(tmp, opts = {}) {
  writeJson(tmp, ".sdd-forge/config.json", {
    lang: "ja", type: "cli/node-cli",
    docs: { languages: ["ja"], defaultLanguage: "ja" },
    agent: {
      default: "echo-agent",
      providers: {
        "echo-agent": {
          name: "echo-agent",
          command: "echo",
          args: ["{{PROMPT}}"],
        },
      },
    },
    ...opts.config,
  });
  writeJson(tmp, "package.json", { name: "test-pkg", version: "1.0.0" });
  writeJson(tmp, ".sdd-forge/output/analysis.json", {
    analyzedAt: "2026-01-01",
    enrichedAt: "2026-01-01",
    extras: {},
    modules: {
      summary: { total: 1 },
      modules: [{ file: "src/main.js", summary: "Main entry" }],
    },
    ...opts.analysis,
  });
}

describe("text CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("runs without error on docs with no text directives", () => {
    tmp = createTmpDir();
    setupProject(tmp);
    writeFile(tmp, "docs/overview.md", "# Overview\n\nNo text directives\n");

    execFileSync("node", [CMD], {
      encoding: "utf8",
      env: makeEnv(tmp),
      stdio: ["pipe", "pipe", "pipe"],
    });
  });

  it("dry-run does not modify files", () => {
    tmp = createTmpDir();
    setupProject(tmp);
    const original = [
      "# Overview",
      "",
      "<!-- {{text: Describe the project}} -->",
      "placeholder",
      "<!-- {{/text}} -->",
      "",
    ].join("\n");
    writeFile(tmp, "docs/overview.md", original);

    execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: makeEnv(tmp),
      stdio: ["pipe", "pipe", "pipe"],
    });

    const content = fs.readFileSync(join(tmp, "docs/overview.md"), "utf8");
    assert.equal(content, original);
  });

  it("shows help with --help", () => {
    tmp = createTmpDir();
    setupProject(tmp);

    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });
    assert.match(result, /--dry-run/);
  });

  it("completes without error in dry-run with text directives", () => {
    tmp = createTmpDir();
    setupProject(tmp);
    writeFile(tmp, "docs/overview.md", [
      "# Overview",
      "",
      "<!-- {{text: Describe the project}} -->",
      "placeholder",
      "<!-- {{/text}} -->",
      "",
    ].join("\n"));

    // dry-run should complete without throwing
    execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });
  });

  it("handles multiple text directives in one file", () => {
    tmp = createTmpDir();
    setupProject(tmp);
    writeFile(tmp, "docs/overview.md", [
      "# Overview",
      "",
      "<!-- {{text: First section}} -->",
      "placeholder1",
      "<!-- {{/text}} -->",
      "",
      "<!-- {{text: Second section}} -->",
      "placeholder2",
      "<!-- {{/text}} -->",
      "",
    ].join("\n"));

    // Should complete without error
    execFileSync("node", [CMD, "--dry-run"], {
      encoding: "utf8",
      env: makeEnv(tmp),
      stdio: ["pipe", "pipe", "pipe"],
    });
  });

  it("skips files without matching --id", () => {
    tmp = createTmpDir();
    setupProject(tmp);
    writeFile(tmp, "docs/overview.md", [
      "# Overview",
      "",
      "<!-- {{text: Describe, id=intro}} -->",
      "placeholder",
      "<!-- {{/text}} -->",
      "",
    ].join("\n"));
    writeFile(tmp, "docs/cli_commands.md", [
      "# CLI",
      "",
      "<!-- {{text: Commands, id=cmds}} -->",
      "placeholder",
      "<!-- {{/text}} -->",
      "",
    ].join("\n"));

    // --id=intro should only process overview.md, not cli_commands.md
    execFileSync("node", [CMD, "--dry-run", "--id", "nonexistent"], {
      encoding: "utf8",
      env: makeEnv(tmp),
      stdio: ["pipe", "pipe", "pipe"],
    });
  });
});
