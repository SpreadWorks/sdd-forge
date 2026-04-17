import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/sdd-forge.js");
const CMD_ARGS_PREFIX = ["setup"];

/** Non-interactive CLI args */
const NI_ARGS = [
  "--name", "test-proj",
  "--type", "webapp",
  "--purpose", "developer-guide",
  "--tone", "polite",
];

describe("052: agent command config", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  describe("resolveAgent with useProfile / prefix match", () => {

    it("resolves provider via useProfile and exact profile entry", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          providers: {
            "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"] },
            "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          },
          useProfile: "high",
          profiles: {
            high: { "docs": "claude/opus" },
          },
        },
      };
      const agent = resolveAgent(config, "docs");
      assert.equal(agent.command, "claude");
      assert.ok(agent.args.includes("opus"));
    });

    it("prefix match: 'docs' profile entry matches 'docs.forge'", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          providers: {
            "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"] },
            "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          },
          useProfile: "high",
          profiles: {
            high: { "docs": "claude/opus" },
          },
        },
      };
      const agent = resolveAgent(config, "docs.forge");
      assert.equal(agent.command, "claude");
      assert.ok(agent.args.includes("opus"));
    });

    it("falls back to agent.default when no profile entry matches commandId", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          providers: {
            "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          },
          useProfile: "fast",
          profiles: {
            fast: { "docs": "claude/sonnet" },
          },
        },
      };
      // "spec.gate" doesn't match "docs" prefix
      const agent = resolveAgent(config, "spec.gate");
      assert.equal(agent.command, "claude");
      assert.ok(agent.args.includes("sonnet"));
    });

    it("more specific prefix wins: docs.review over docs", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          providers: {
            "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"] },
            "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          },
          useProfile: "mixed",
          profiles: {
            mixed: {
              "docs": "claude/sonnet",
              "docs.review": "claude/opus",
            },
          },
        },
      };
      const agent = resolveAgent(config, "docs.review");
      assert.ok(agent.args.includes("opus")); // docs.review wins over docs
    });

    it("resolves different provider via profile", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          providers: {
            "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
            "codex/gpt-5.3": { command: "codex", args: ["exec", "-m", "gpt-5.3-codex", "{{PROMPT}}"] },
          },
          useProfile: "fast",
          profiles: {
            fast: { "spec": "codex/gpt-5.3" },
          },
        },
      };
      const agent = resolveAgent(config, "spec.gate");
      assert.equal(agent.command, "codex");
    });

    it("resolveAgent(config) without COMMAND_ID returns default provider", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          providers: {
            "claude/sonnet": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "sonnet"] },
          },
        },
      };
      const agent = resolveAgent(config);
      assert.equal(agent.command, "claude");
      assert.ok(agent.args.includes("sonnet"));
    });

    it("throws when useProfile references non-existent profile", async () => {
      const { resolveAgent } = await import("../../src/lib/agent.js");
      const config = {
        agent: {
          default: "claude/sonnet",
          useProfile: "unknown",
          profiles: { fast: { docs: "claude/sonnet" } },
        },
      };
      assert.throws(() => resolveAgent(config, "docs"), /Profile "unknown" is not defined/);
    });
  });

  describe("setup generates full config", () => {
    it("claude default: generates minimal agent config with default=claude and workDir", () => {
      tmp = createTmpDir();
      writeJson(tmp, "package.json", { name: "test-proj" });

      const result = spawnSync("node", [CMD, ...CMD_ARGS_PREFIX, ...NI_ARGS, "--agent", "claude"], {
        encoding: "utf8",
        cwd: tmp,
        timeout: 10000,
        env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      });
      assert.equal(result.status, 0, `stderr: ${result.stderr}`);

      const config = JSON.parse(fs.readFileSync(join(tmp, ".sdd-forge", "config.json"), "utf8"));
      assert.equal(config.agent.default, "claude/sonnet");
      assert.equal(config.agent.workDir, ".tmp");

      // Setup no longer injects providers or commands — users add them manually
      assert.equal(config.agent.commands, undefined, "commands section should not be generated by setup");
    });

    it("codex default: generates minimal agent config with default=codex/gpt-5.4 and workDir", () => {
      tmp = createTmpDir();
      writeJson(tmp, "package.json", { name: "test-proj" });

      const result = spawnSync("node", [CMD, ...CMD_ARGS_PREFIX, ...NI_ARGS, "--agent", "codex"], {
        encoding: "utf8",
        cwd: tmp,
        timeout: 10000,
        env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp },
      });
      assert.equal(result.status, 0, `stderr: ${result.stderr}`);

      const config = JSON.parse(fs.readFileSync(join(tmp, ".sdd-forge", "config.json"), "utf8"));
      assert.equal(config.agent.default, "codex/gpt-5.4");
      assert.equal(config.agent.workDir, ".tmp");

      // Setup no longer injects providers or commands — users add them manually
      assert.equal(config.agent.commands, undefined, "commands section should not be generated by setup");
    });

    it("setup agent choices do not include skip option", () => {
      const localePath = join(process.cwd(), "src", "locale");
      const enPath = join(localePath, "en", "setup.json");
      const jaPath = join(localePath, "ja", "setup.json");

      for (const p of [enPath, jaPath]) {
        if (fs.existsSync(p)) {
          const locale = JSON.parse(fs.readFileSync(p, "utf8"));
          const choices = locale.choices?.agent;
          if (choices) {
            assert.ok(!choices.skip, `${p} should not have skip option in agent choices`);
          }
        }
      }
    });
  });

  describe("--agent CLI option removed", () => {
    it("forge command does not accept --agent", () => {
      const forgePath = join(process.cwd(), "src", "docs", "commands", "forge.js");
      const content = fs.readFileSync(forgePath, "utf8");
      assert.ok(!content.includes('"--agent"'), "forge.js should not have --agent option");
    });

    it("command-context does not resolve cli.agent", () => {
      const ctxPath = join(process.cwd(), "src", "docs", "lib", "command-context.js");
      const content = fs.readFileSync(ctxPath, "utf8");
      assert.ok(!content.includes("cli?.agent"), "command-context.js should not resolve cli.agent");
    });
  });
});
