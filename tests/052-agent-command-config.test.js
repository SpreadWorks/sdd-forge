import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "./helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/setup.js");

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

  describe("resolveAgent with COMMAND_ID", () => {
    // Test resolveAgent directly by importing it
    // We test the resolution logic with a mock config

    it("resolves exact command match (docs.review)", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            profiles: {
              default: [],
              opus: ["--model", "opus"],
              sonnet: ["--model", "sonnet"],
            },
          },
        },
        commands: {
          "docs": { agent: "claude", profile: "sonnet" },
          "docs.review": { agent: "claude", profile: "opus" },
        },
      };
      const agent = resolveAgent(config, "docs.review");
      assert.equal(agent.command, "claude");
      assert.deepEqual(agent.args, ["--model", "opus", "-p", "{{PROMPT}}"]);
    });

    it("falls back to parent command (docs.forge → docs)", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            profiles: {
              default: [],
              sonnet: ["--model", "sonnet"],
            },
          },
        },
        commands: {
          "docs": { agent: "claude", profile: "sonnet" },
        },
      };
      const agent = resolveAgent(config, "docs.forge");
      assert.equal(agent.command, "claude");
      assert.deepEqual(agent.args, ["--model", "sonnet", "-p", "{{PROMPT}}"]);
    });

    it("falls back to defaultAgent when no command match", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            profiles: { default: [] },
          },
        },
        commands: {},
      };
      const agent = resolveAgent(config, "docs.review");
      assert.equal(agent.command, "claude");
      assert.deepEqual(agent.args, ["-p", "{{PROMPT}}"]);
    });

    it("profile concat: profiles[name] + provider.args", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            profiles: {
              default: [],
              custom: ["--model", "sonnet", "--output-format", "json"],
            },
          },
        },
        commands: {
          "docs.text": { agent: "claude", profile: "custom" },
        },
      };
      const agent = resolveAgent(config, "docs.text");
      assert.deepEqual(agent.args, ["--model", "sonnet", "--output-format", "json", "-p", "{{PROMPT}}"]);
    });

    it("profile default produces provider.args only", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            profiles: { default: [] },
          },
        },
        commands: {
          "docs.forge": { agent: "claude", profile: "default" },
        },
      };
      const agent = resolveAgent(config, "docs.forge");
      assert.deepEqual(agent.args, ["-p", "{{PROMPT}}"]);
    });

    it("resolves different provider via commands", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
            profiles: { default: [] },
          },
          codex: {
            command: "codex",
            args: ["{{PROMPT}}"],
            profiles: {
              default: [],
              o3: ["--model", "o3"],
            },
          },
        },
        commands: {
          "spec.gate": { agent: "codex", profile: "o3" },
        },
      };
      const agent = resolveAgent(config, "spec.gate");
      assert.equal(agent.command, "codex");
      assert.deepEqual(agent.args, ["--model", "o3", "{{PROMPT}}"]);
    });

    it("backward compat: resolveAgent(config) without COMMAND_ID", async () => {
      const { resolveAgent } = await import("../src/lib/agent.js");
      const config = {
        defaultAgent: "claude",
        providers: {
          claude: {
            command: "claude",
            args: ["-p", "{{PROMPT}}"],
          },
        },
      };
      const agent = resolveAgent(config);
      assert.equal(agent.command, "claude");
      assert.deepEqual(agent.args, ["-p", "{{PROMPT}}"]);
    });
  });

  describe("setup generates full config", () => {
    it("claude default: generates both providers + all commands with default profile", () => {
      tmp = createTmpDir();
      writeJson(tmp, "package.json", { name: "test-proj" });

      const result = spawnSync("node", [CMD, ...NI_ARGS, "--agent", "claude"], {
        encoding: "utf8",
        cwd: tmp,
        timeout: 10000,
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.equal(result.status, 0, `stderr: ${result.stderr}`);

      const config = JSON.parse(fs.readFileSync(join(tmp, ".sdd-forge", "config.json"), "utf8"));
      assert.equal(config.defaultAgent, "claude");

      // Both providers exist
      assert.ok(config.providers.claude, "claude provider should exist");
      assert.ok(config.providers.codex, "codex provider should exist");

      // Profiles exist
      assert.ok(config.providers.claude.profiles, "claude profiles should exist");
      assert.ok(config.providers.codex.profiles, "codex profiles should exist");

      // Commands exist with default profile
      assert.ok(config.commands, "commands section should exist");
      const cmdKeys = Object.keys(config.commands);
      assert.ok(cmdKeys.length > 0, "should have command entries");
      for (const key of cmdKeys) {
        assert.equal(config.commands[key].agent, "claude", `${key} should use default agent claude`);
        assert.equal(config.commands[key].profile, "default", `${key} should use default profile`);
      }
    });

    it("codex default: generates both providers + all commands with default profile", () => {
      tmp = createTmpDir();
      writeJson(tmp, "package.json", { name: "test-proj" });

      const result = spawnSync("node", [CMD, ...NI_ARGS, "--agent", "codex"], {
        encoding: "utf8",
        cwd: tmp,
        timeout: 10000,
        env: { ...process.env, SDD_WORK_ROOT: tmp, SDD_SOURCE_ROOT: tmp },
      });
      assert.equal(result.status, 0, `stderr: ${result.stderr}`);

      const config = JSON.parse(fs.readFileSync(join(tmp, ".sdd-forge", "config.json"), "utf8"));
      assert.equal(config.defaultAgent, "codex");

      // Both providers exist
      assert.ok(config.providers.claude, "claude provider should exist");
      assert.ok(config.providers.codex, "codex provider should exist");

      // Commands use codex as default
      for (const key of Object.keys(config.commands)) {
        assert.equal(config.commands[key].agent, "codex", `${key} should use default agent codex`);
        assert.equal(config.commands[key].profile, "default", `${key} should use default profile`);
      }
    });

    it("setup agent choices do not include skip option", () => {
      // Verify the locale file does not have a skip option for agent choices
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
