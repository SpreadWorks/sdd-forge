import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { saveFlowState, loadFlowState, FLOW_STEPS } from "../../../../src/lib/flow-state.js";
import { resolveAgent } from "../../../../src/lib/agent.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

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

describe("flow CLI routes review subcommand", () => {
  it("shows review in help output", () => {
    const result = execFileSync("node", [FLOW_CMD, "--help"], { encoding: "utf8" });
    assert.match(result, /review/);
  });
});

describe("flow review CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("errors when no active flow", () => {
    tmp = createTmpDir();
    try {
      execFileSync("node", [FLOW_CMD, "review"], {
        encoding: "utf8",
        env: { ...process.env, SDD_WORK_ROOT: tmp },
      });
      assert.fail("should exit non-zero");
    } catch (err) {
      const out = `${err.stdout || ""}${err.stderr || ""}`;
      assert.match(out, /no active flow/i);
    }
  });
});

describe("resolveAgent for flow.review", () => {
  it("resolves flow.review.draft independently from flow.review.final", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"], profiles: { default: [], opus: ["--model", "opus"] } },
          codex: { command: "codex", args: ["exec", "{{PROMPT}}"] },
        },
        commands: {
          "flow.review.draft": { agent: "codex" },
          "flow.review.final": { agent: "claude", profile: "opus" },
        },
      },
    };
    const draft = resolveAgent(cfg, "flow.review.draft");
    assert.equal(draft.command, "codex");

    const final = resolveAgent(cfg, "flow.review.final");
    assert.equal(final.command, "claude");
    assert.deepEqual(final.args, ["--model", "opus", "-p", "{{PROMPT}}"]);
  });

  it("falls back to flow.review when specific phase not configured", () => {
    const cfg = {
      agent: {
        default: "claude",
        providers: {
          claude: { command: "claude", args: ["-p", "{{PROMPT}}"] },
          codex: { command: "codex", args: ["exec", "{{PROMPT}}"] },
        },
        commands: {
          "flow.review": { agent: "codex" },
        },
      },
    };
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
