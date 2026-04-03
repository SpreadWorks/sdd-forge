/**
 * src/flow/lib/run-report.js
 *
 * FlowCommand: report — generate a work report from the current flow state.
 */

import { execFileSync } from "child_process";
import { generateReport, saveReport } from "../commands/report.js";
import { loadIssueLog } from "./set-issue-log.js";
import { FlowCommand } from "./base-command.js";
import path from "path";

export class RunReportCommand extends FlowCommand {
  async execute(ctx) {
    const { root } = ctx;
    const dryRun = ctx.dryRun || false;

    const state = ctx.flowState;

    const baseBranch = state.baseBranch;
    if (!baseBranch) {
      throw new Error("baseBranch not set in flow.json");
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
    try { redolog = loadIssueLog(root, state.spec); } catch (_) { /* no redolog */ }

    const report = generateReport({
      state,
      results: {},
      redolog,
      implDiffStat,
      commitMessages,
    });

    if (dryRun) {
      return {
        result: "dry-run",
        artifacts: { report },
      };
    }

    try { saveReport(root, state.spec, report); } catch (e) { report.saveError = e.message; }

    const specDir = path.dirname(state.spec);
    return {
      result: "ok",
      changed: [path.join(specDir, "report.json")],
      artifacts: { report },
    };
  }
}

export default RunReportCommand;
