/**
 * src/flow/run/impl-confirm.js
 *
 * flow run impl-confirm — check implementation readiness by comparing
 * flow.json requirements against actual file changes.
 * Returns JSON envelope with requirement status and changed files.
 */

import fs from "fs";
import path from "path";
import { parseArgs } from "../../lib/cli.js";
import { runSync } from "../../lib/process.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

/**
 * Get files changed between base branch and HEAD.
 * @param {string} root - repo root
 * @param {string} baseBranch - base branch name
 * @returns {string[]} changed file paths
 */
function getChangedFiles(root, baseBranch) {
  const res = runSync("git", ["-C", root, "diff", `${baseBranch}...HEAD`, "--name-only"]);
  if (!res.ok) return [];
  return res.stdout.trim().split("\n").filter(Boolean);
}

/**
 * Summarize requirements from flow state.
 * @param {import("../../lib/flow-state.js").RequirementEntry[]} requirements
 * @returns {{ total: number, done: number, pending: number, inProgress: number, items: Array }}
 */
function summarizeRequirements(requirements) {
  if (!requirements || requirements.length === 0) {
    return { total: 0, done: 0, pending: 0, inProgress: 0, items: [] };
  }
  const done = requirements.filter((r) => r.status === "done").length;
  const inProgress = requirements.filter((r) => r.status === "in_progress").length;
  const pending = requirements.filter((r) => r.status === "pending").length;
  return {
    total: requirements.length,
    done,
    pending,
    inProgress,
    items: requirements.map((r, i) => ({ index: i, desc: r.desc, status: r.status })),
  };
}

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
    options: ["--mode"],
    defaults: { mode: "overview" },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run impl-confirm [options]",
        "",
        "Check implementation readiness against requirements.",
        "",
        "Options:",
        "  --mode <overview|detail>  Check mode (default: overview)",
        "    overview: summarize requirements status from flow.json",
        "    detail:   also compare git diff against requirements",
      ].join("\n"),
    );
    return;
  }

  const state = ctx.flowState;
  if (!state) {
    output(fail("run", "impl-confirm", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  const mode = cli.mode === "detail" ? "detail" : "overview";
  const requirements = summarizeRequirements(state.requirements);

  // Determine readiness
  const allDone = requirements.total > 0 && requirements.done === requirements.total;
  const noRequirements = requirements.total === 0;

  let files = [];
  if (mode === "detail") {
    files = getChangedFiles(root, state.baseBranch);
  }

  // Determine next step
  let next;
  if (allDone) {
    next = "review";
  } else if (noRequirements) {
    // No requirements tracked: let the caller decide
    next = "review";
  } else {
    next = "fix";
  }

  // Check spec file for additional context
  const specPath = path.resolve(root, state.spec);
  let specExists = false;
  try {
    specExists = fs.existsSync(specPath);
  } catch (err) { if (err.code !== "ENOENT") console.error(err); }

  output(ok("run", "impl-confirm", {
    result: allDone || noRequirements ? "ready" : "incomplete",
    changed: [],
    artifacts: {
      mode,
      requirements,
      files: mode === "detail" ? files : undefined,
      spec: state.spec,
      specExists,
      baseBranch: state.baseBranch,
      featureBranch: state.featureBranch,
    },
    next,
  }));
}
