import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { saveFlowState, loadFlowState, FLOW_STEPS } from "../../../../src/lib/flow-state.js";
import { resolveAgent } from "../../../../src/lib/agent.js";

const FLOW_CMD = join(process.cwd(), "src/sdd-forge.js");
const FLOW_CMD_ARGS_PREFIX = ["flow"];

describe("FLOW_STEPS includes review", () => {
  it("has review between implement and finalize", () => {
    const implIdx = FLOW_STEPS.indexOf("implement");
    const reviewIdx = FLOW_STEPS.indexOf("review");
    const finalIdx = FLOW_STEPS.indexOf("finalize");
    assert.ok(reviewIdx > 0, "review step exists");
    assert.ok(reviewIdx > implIdx, "review comes after implement");
    assert.ok(reviewIdx < finalIdx, "review comes before finalize");
  });
});

describe("flow run routes review action", () => {
  it("shows review in flow run help output", () => {
    const result = execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "--help"], { encoding: "utf8" });
    assert.match(result, /review/);
  });
});

describe("flow run review CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("errors when no active flow", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "review"], {
        encoding: "utf8",
        env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });
});

describe("flow run review --phase test CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("passes --phase test through to review command", () => {
    const result = execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "review", "--help"], { encoding: "utf8" });
    assert.match(result, /--phase/);
  });

  it("errors when no active flow with --phase test", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, ...FLOW_CMD_ARGS_PREFIX, "run", "review", "--phase", "test"], {
        encoding: "utf8",
        env: { ...process.env, SDD_FORGE_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });
});

describe("resolveAgent for flow.review", () => {
  it("resolves flow.review.draft independently from flow.review.final via profiles", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
          "claude/opus": { command: "claude", args: ["-p", "{{PROMPT}}", "--model", "opus"] },
          codex: { command: "codex", args: ["exec", "{{PROMPT}}"] },
        },
        useProfile: "review",
        profiles: {
          review: {
            "flow.review.draft": "codex",
            "flow.review.final": "claude/opus",
          },
        },
      },
    };
    const draft = resolveAgent(cfg, "flow.review.draft");
    assert.equal(draft.command, "codex");

    const final = resolveAgent(cfg, "flow.review.final");
    assert.equal(final.command, "claude");
    assert.ok(final.args.includes("opus"));
  });

  it("falls back to flow.review prefix when specific phase not configured via profiles", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
          codex: { command: "codex", args: ["exec", "{{PROMPT}}"] },
        },
        useProfile: "review",
        profiles: {
          review: { "flow.review": "codex" },
        },
      },
    };
    // flow.review.draft matches "flow.review" prefix
    const draft = resolveAgent(cfg, "flow.review.draft");
    assert.equal(draft.command, "codex");
  });

  it("falls back to default agent when no flow.review configured", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
        },
      },
    };
    const draft = resolveAgent(cfg, "flow.review.draft");
    assert.equal(draft.command, "claude");
  });
});

describe("resolveAgent for flow.review.test", () => {
  it("resolves flow.review.test when explicitly configured via profiles", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
          codex: { command: "codex", args: ["exec", "{{PROMPT}}"] },
        },
        useProfile: "review",
        profiles: {
          review: {
            "flow.review.test": "codex",
            "flow.review.draft": "claude",
          },
        },
      },
    };
    const testAgent = resolveAgent(cfg, "flow.review.test");
    assert.equal(testAgent.command, "codex");
  });

  it("falls back to flow.review prefix when flow.review.test not in profile", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
          codex: { command: "codex", args: ["exec", "{{PROMPT}}"] },
        },
        useProfile: "review",
        profiles: {
          review: { "flow.review": "codex" },
        },
      },
    };
    // flow.review.test matches "flow.review" prefix
    const testAgent = resolveAgent(cfg, "flow.review.test");
    assert.equal(testAgent.command, "codex");
  });

  it("falls back to agent.default when no flow.review configured", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
        },
      },
    };
    const testAgent = resolveAgent(cfg, "flow.review.test");
    assert.equal(testAgent.command, "claude");
  });
});
