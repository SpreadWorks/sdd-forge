#!/usr/bin/env node
/**
 * src/flow/commands/status.js
 *
 * sdd-forge flow status — フロー進捗の表示・更新。
 *
 * 表示:  sdd-forge flow status
 * 更新:  sdd-forge flow status --step <id> --status <val>
 *        sdd-forge flow status --summary '<JSON array of strings>'
 *        sdd-forge flow status --req <index> --status <val>
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import {
  loadFlowState,
  saveFlowState,
  updateStepStatus,
  setRequirements,
  updateRequirement,
  setRequest,
  addNote,
  clearFlowState,
  flowStatePath,
  FLOW_STEPS,
} from "../../lib/flow-state.js";

function displayStatus(root) {
  const state = loadFlowState(root);
  if (!state) {
    console.error("no active flow (flow.json not found)");
    process.exit(1);
  }

  const SEP = "────────────────────────────────";

  // Header
  console.log("Flow Status");
  console.log(SEP);
  console.log(`  Spec:             ${state.spec}`);
  console.log(`  Feature branch:   ${state.featureBranch}`);
  console.log(`  Base branch:      ${state.baseBranch}`);
  if (state.worktree) {
    console.log(`  Worktree:         ${state.worktreePath}`);
  }

  // Steps
  if (state.steps?.length) {
    const doneCount = state.steps.filter((s) => s.status === "done").length;
    console.log(`\nSteps (${doneCount}/${state.steps.length} done)`);
    console.log(SEP);
    for (let i = 0; i < state.steps.length; i++) {
      const s = state.steps[i];
      const icon = s.status === "done" ? "✓"
        : s.status === "in_progress" ? ">"
        : s.status === "skipped" ? "-"
        : " ";
      const pad = String(i + 1).padStart(2);
      console.log(`  ${pad}. ${s.id.padEnd(14)} ${icon} ${s.status}`);
    }
  }

  // Requirements
  if (state.requirements?.length) {
    const doneCount = state.requirements.filter((r) => r.status === "done").length;
    console.log(`\nRequirements (${doneCount}/${state.requirements.length} done)`);
    console.log(SEP);
    for (let i = 0; i < state.requirements.length; i++) {
      const r = state.requirements[i];
      const icon = r.status === "done" ? "✓"
        : r.status === "in_progress" ? ">"
        : " ";
      console.log(`  ${i}. ${icon} ${r.desc}`);
    }
  }
}

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--archive", "--dry-run"],
    options: ["--step", "--status", "--summary", "--req", "--check", "--request", "--note"],
    defaults: { step: "", status: "", summary: "", req: "", check: "", request: "", note: "", archive: false, dryRun: false },
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow status [options]",
        "",
        "Options:",
        "  (no options)                        Display flow status",
        "  --step <id> --status <val>          Update step status",
        "  --summary '<JSON array>'            Set requirements list",
        "  --req <index> --status <val>        Update requirement status",
        "  --request <text>                    Set the original user request",
        "  --note <text>                       Append a note (decision/memo)",
        "  --check <phase>                     Check prerequisites (e.g. --check impl)",
        "  --archive                           Move flow.json to spec directory",
        "  --dry-run                           With --check: always exit 0",
      ].join("\n"),
    );
    return;
  }

  // Check prerequisites
  if (cli.check) {
    const CHECKS = {
      impl: ["gate", "test"],
    };
    const required = CHECKS[cli.check];
    if (!required) {
      console.error(`unknown check phase: ${cli.check}`);
      console.error(`valid phases: ${Object.keys(CHECKS).join(", ")}`);
      process.exit(1);
    }
    const state = loadFlowState(root);
    if (!state) {
      console.error("no active flow (flow.json not found)");
      process.exit(cli.dryRun ? 0 : 1);
    }
    const missing = required.filter((id) => {
      const step = state.steps?.find((s) => s.id === id);
      return !step || (step.status !== "done" && step.status !== "skipped");
    });
    if (missing.length === 0) {
      console.log(`PASS: ${cli.check} prerequisites met`);
    } else {
      console.log(`FAIL: ${cli.check} prerequisites not met — missing: ${missing.join(", ")}`);
      if (!cli.dryRun) process.exit(1);
    }
    return;
  }

  // Archive flow.json to spec directory
  if (cli.archive) {
    const state = loadFlowState(root);
    if (!state) {
      console.error("no active flow (flow.json not found)");
      process.exit(1);
    }
    const specDir = path.join(root, path.dirname(state.spec));
    if (!fs.existsSync(specDir)) {
      console.error(`spec directory not found: ${specDir}`);
      process.exit(1);
    }
    // Mark finalize and archive as done before archiving
    for (const id of ["finalize", "archive"]) {
      const step = state.steps?.find((s) => s.id === id);
      if (step && step.status !== "done") {
        step.status = "done";
      }
    }
    saveFlowState(root, state);
    const src = flowStatePath(root);
    const dest = path.join(specDir, "flow.json");
    fs.copyFileSync(src, dest);
    clearFlowState(root);
    console.log(`archived: ${dest}`);
    return;
  }

  // Set request
  if (cli.request) {
    setRequest(root, cli.request);
    console.log(`request set`);
    return;
  }

  // Append note
  if (cli.note) {
    addNote(root, cli.note);
    console.log(`note added`);
    return;
  }

  // Update step
  if (cli.step && cli.status) {
    if (!FLOW_STEPS.includes(cli.step)) {
      console.error(`unknown step: ${cli.step}`);
      console.error(`valid steps: ${FLOW_STEPS.join(", ")}`);
      process.exit(1);
    }
    updateStepStatus(root, cli.step, cli.status);
    console.log(`step ${cli.step} → ${cli.status}`);
    return;
  }

  // Set requirements
  if (cli.summary) {
    let descriptions;
    try {
      descriptions = JSON.parse(cli.summary);
    } catch (_) {
      console.error("--summary must be a valid JSON array of strings");
      process.exit(1);
    }
    if (!Array.isArray(descriptions)) {
      console.error("--summary must be a JSON array");
      process.exit(1);
    }
    setRequirements(root, descriptions);
    console.log(`requirements set (${descriptions.length} items)`);
    return;
  }

  // Update requirement
  if (cli.req !== "" && cli.status) {
    const index = Number(cli.req);
    if (Number.isNaN(index)) {
      console.error("--req must be a number");
      process.exit(1);
    }
    updateRequirement(root, index, cli.status);
    console.log(`requirement #${index} → ${cli.status}`);
    return;
  }

  // Display
  displayStatus(root);
}

export { main };

runIfDirect(import.meta.url, main);
