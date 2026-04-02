/**
 * src/flow/run/report.js
 *
 * flow run report [--dry-run]
 * Generate a work report from the current flow state.
 * Standalone runner for report generation (also called by finalize.js as post-commit).
 */

import { execFileSync } from "child_process";
import { parseArgs } from "../../lib/cli.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";
import { generateReport, saveReport } from "../commands/report.js";
import { loadRedoLog } from "../set/redo.js";
import path from "path";

export async function execute(ctx) {
  const { root } = ctx;
  const cli = parseArgs(ctx.args, {
    flags: ["--dry-run"],
    defaults: { dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow run report [options]",
        "",
        "Generate a work report from the current flow state.",
        "",
        "Options:",
        "  --dry-run   Preview only, do not write report.json",
      ].join("\n"),
    );
    return;
  }

  const state = ctx.flowState;
  if (!state) {
    output(fail("run", "report", "NO_FLOW", "no active flow (flow.json not found)"));
    return;
  }

  const baseBranch = state.baseBranch;
  if (!baseBranch) {
    output(fail("run", "report", "NO_BASE_BRANCH", "baseBranch not set in flow.json"));
    return;
  }

  let implDiffStat = "";
  let commitMessages = [];
  try {
    implDiffStat = execFileSync(
      "git", ["diff", "--stat", `${baseBranch}...HEAD`],
      { cwd: root, encoding: "utf8" },
    ).trim();
  } catch (_) { /* no diff */ }
  try {
    commitMessages = execFileSync(
      "git", ["log", "--format=%s", `${baseBranch}..HEAD`],
      { cwd: root, encoding: "utf8" },
    ).trim().split("\n").filter(Boolean);
  } catch (_) { /* no commits */ }

  let redolog = { entries: [] };
  try { redolog = loadRedoLog(root, state.spec); } catch (_) { /* no redolog */ }

  const report = generateReport({
    state,
    results: {},
    redolog,
    implDiffStat,
    commitMessages,
  });

  if (cli.dryRun) {
    output(ok("run", "report", {
      result: "dry-run",
      artifacts: { report },
    }));
    return;
  }

  try { saveReport(root, state.spec, report); } catch (e) { report.saveError = e.message; }

  const specDir = path.dirname(state.spec);
  output(ok("run", "report", {
    result: "ok",
    changed: [path.join(specDir, "report.json")],
    artifacts: { report },
  }));
}
