import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
const { join } = path;
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../helpers/tmp-dir.js";
import {
  buildArgs,
  buildForgeSystemPrompt,
  buildForgeFilePrompt,
} from "../../../src/docs/commands/forge.js";

const CMD = join(process.cwd(), "src/docs/commands/forge.js");

describe("buildArgs", () => {
  it("replaces {{PROMPT}} in args with prompt text", () => {
    const agent = { command: "echo", args: ["-p", "{{PROMPT}}"] };
    const { args, cleanupFile } = buildArgs(agent, "hello");
    assert.deepEqual(args, ["-p", "hello"]);
    assert.equal(cleanupFile, undefined);
  });

  it("appends prompt when no {{PROMPT}} token", () => {
    const agent = { command: "echo", args: ["-p"] };
    const { args } = buildArgs(agent, "hello");
    assert.deepEqual(args, ["-p", "hello"]);
  });

  it("prepends --system-prompt flag when systemPromptFlag is set", () => {
    const agent = {
      command: "echo",
      args: ["-p", "{{PROMPT}}"],
      systemPromptFlag: "--system-prompt",
    };
    const { args, cleanupFile } = buildArgs(agent, "user-prompt", "sys-prompt");
    assert.equal(args[0], "--system-prompt");
    assert.equal(args[1], "sys-prompt");
    assert.equal(args[2], "-p");
    assert.equal(args[3], "user-prompt");
    assert.equal(cleanupFile, undefined);
  });

  it("writes temp file for --system-prompt-file flag", () => {
    const agent = {
      command: "echo",
      args: ["-p", "{{PROMPT}}"],
      systemPromptFlag: "--system-prompt-file",
    };
    const { args, cleanupFile } = buildArgs(agent, "user-prompt", "sys-prompt");
    assert.equal(args[0], "--system-prompt-file");
    assert.ok(fs.existsSync(args[1]), "temp file should exist");
    assert.equal(fs.readFileSync(args[1], "utf8"), "sys-prompt");
    assert.equal(cleanupFile, args[1]);
    // Cleanup
    fs.unlinkSync(cleanupFile);
    fs.rmdirSync(path.dirname(cleanupFile));
  });

  it("combines system+user prompt when no systemPromptFlag", () => {
    const agent = { command: "echo", args: ["-p", "{{PROMPT}}"] };
    const { args } = buildArgs(agent, "user-prompt", "sys-prompt");
    assert.equal(args[0], "-p");
    assert.ok(args[1].includes("sys-prompt"));
    assert.ok(args[1].includes("user-prompt"));
  });

  it("skips system prompt prefix when systemPrompt is empty", () => {
    const agent = {
      command: "echo",
      args: ["-p", "{{PROMPT}}"],
      systemPromptFlag: "--system-prompt",
    };
    const { args } = buildArgs(agent, "user-prompt", "");
    assert.deepEqual(args, ["-p", "user-prompt"]);
  });
});

describe("buildForgeSystemPrompt", () => {
  it("includes user prompt and rules", () => {
    const result = buildForgeSystemPrompt({
      userPrompt: "improve docs",
      specPath: "",
      specText: "",
      analysisSummary: "",
    });
    assert.ok(result.includes("improve docs"));
    assert.ok(result.includes("[RULES]"));
    assert.ok(result.includes("docs-forge"));
  });

  it("includes spec when provided", () => {
    const result = buildForgeSystemPrompt({
      userPrompt: "test",
      specPath: "specs/001/spec.md",
      specText: "spec content here",
      analysisSummary: "",
    });
    assert.ok(result.includes("[SPEC_PATH]"));
    assert.ok(result.includes("specs/001/spec.md"));
    assert.ok(result.includes("spec content here"));
  });

  it("includes analysis summary when provided", () => {
    const result = buildForgeSystemPrompt({
      userPrompt: "test",
      specPath: "",
      specText: "",
      analysisSummary: "Controllers: 5 files",
    });
    assert.ok(result.includes("[SOURCE_ANALYSIS]"));
    assert.ok(result.includes("Controllers: 5 files"));
  });
});

describe("buildForgeFilePrompt", () => {
  it("includes target file and round info", () => {
    const result = buildForgeFilePrompt({
      targetFile: "docs/01_overview.md",
      round: 2,
      maxRuns: 3,
      reviewFeedback: "",
    });
    assert.ok(result.includes("docs/01_overview.md"));
    assert.ok(result.includes("round: 2/3"));
    assert.ok(result.includes("[TARGET_FILE]"));
  });

  it("includes review feedback when provided", () => {
    const result = buildForgeFilePrompt({
      targetFile: "docs/01_overview.md",
      round: 2,
      maxRuns: 3,
      reviewFeedback: "[FAIL] too short",
    });
    assert.ok(result.includes("[FAIL] too short"));
  });
});

describe("forge CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("exits with error when no prompt given", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });

    try {
      execFileSync("node", [CMD], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      assert.match(err.stderr, /prompt is required/);
    }
  });

  it("shows help with --help", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });

    const result = execFileSync("node", [CMD, "--help"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /--prompt/);
  });

  it("--dry-run skips writes, review, and agent calls", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    writeFile(tmp, "docs/01_test.md", "# 01. Test\n\nContent\n");

    const result = execFileSync("node", [
      CMD,
      "--prompt", "test",
      "--dry-run",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /DRY-RUN/);
    assert.match(result, /DONE \(dry-run\)/);
    // Review was skipped
    assert.match(result, /review: \(skipped\)/);
  });

  it("runs review in local mode and handles pass", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", { lang: "ja", type: "cli/node-cli" });
    // Create docs that will pass review
    const lines = ["# 01. Test", ""];
    for (let i = 0; i < 20; i++) lines.push(`Content line ${i}`);
    writeFile(tmp, "docs/01_test.md", lines.join("\n"));

    // Use a review command that always passes
    const result = execFileSync("node", [
      CMD,
      "--prompt", "test",
      "--review-cmd", "echo review-passed",
      "--max-runs", "1",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /DONE/);
  });

  it("uses per-file mode when systemPromptFlag is set", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      defaultAgent: "echo-agent",
      providers: {
        "echo-agent": {
          name: "echo-agent",
          command: "echo",
          args: ["{{PROMPT}}"],
          systemPromptFlag: "--system-prompt",
        },
      },
    });
    writeFile(tmp, "docs/01_test.md", "# Test\n\ncontent\n");
    writeFile(tmp, "docs/02_arch.md", "# Arch\n\ncontent\n");

    const result = execFileSync("node", [
      CMD,
      "--prompt", "improve",
      "--mode", "agent",
      "--review-cmd", "echo review-passed",
      "--max-runs", "1",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    assert.match(result, /per-file mode/);
    assert.match(result, /2 files/);
    assert.match(result, /DONE/);
  });

  it("uses legacy mode when systemPromptFlag is not set", () => {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "ja",
      type: "cli/node-cli",
      defaultAgent: "echo-agent",
      providers: {
        "echo-agent": {
          name: "echo-agent",
          command: "echo",
          args: ["{{PROMPT}}"],
        },
      },
    });
    writeFile(tmp, "docs/01_test.md", "# Test\n\ncontent\n");

    const result = execFileSync("node", [
      CMD,
      "--prompt", "improve",
      "--mode", "agent",
      "--review-cmd", "echo review-passed",
      "--max-runs", "1",
    ], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
    });
    // Should NOT show per-file mode
    assert.ok(!result.includes("per-file mode"), "should not use per-file mode");
    assert.match(result, /DONE/);
  });
});
