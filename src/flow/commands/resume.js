#!/usr/bin/env node
/**
 * src/flow/commands/resume.js
 *
 * sdd-forge flow resume — flow.json + spec.md から
 * compaction 復元用のサマリーを stdout に出力する。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { loadFlowState, derivePhase } from "../../lib/flow-state.js";

/**
 * Extract a section's content from Markdown text.
 * Returns lines between ## <heading> and the next ## heading.
 */
function extractSection(text, heading) {
  const lines = text.split("\n");
  let inSection = false;
  const result = [];
  for (const line of lines) {
    if (inSection && /^## /.test(line)) break;
    if (new RegExp(`^## ${heading}\\b`, "i").test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) result.push(line);
  }
  return result.join("\n").trim();
}

function buildSummary(state, root) {
  const lines = [];

  lines.push("# Flow Resume");
  lines.push("");

  // Request
  lines.push("## Request");
  lines.push(state.request || "(not recorded)");
  lines.push("");

  // Current Progress
  const steps = state.steps || [];
  const phase = derivePhase(steps);
  const doneSteps = steps.filter((s) => s.status === "done" || s.status === "skipped");
  const currentStep = steps.find((s) => s.status === "in_progress");
  const totalSteps = steps.length;

  lines.push("## Current Progress");
  lines.push(`- Phase: ${phase}`);
  lines.push(`- Progress: ${doneSteps.length}/${totalSteps} steps completed`);
  if (currentStep) {
    lines.push(`- Current step: ${currentStep.id} (in_progress)`);
  }
  if (doneSteps.length > 0) {
    lines.push(`- Completed: ${doneSteps.map((s) => s.id).join(", ")}`);
  }
  lines.push(`- Branch: ${state.featureBranch} (from ${state.baseBranch})`);
  lines.push(`- Spec: ${state.spec}`);
  lines.push("");

  // Spec Summary
  const specPath = path.resolve(root, state.spec);
  if (fs.existsSync(specPath)) {
    const specText = fs.readFileSync(specPath, "utf8");
    lines.push("## Spec Summary");

    const goal = extractSection(specText, "Goal");
    if (goal) {
      lines.push("### Goal");
      lines.push(goal);
      lines.push("");
    }

    const scope = extractSection(specText, "Scope");
    if (scope) {
      lines.push("### Scope");
      lines.push(scope);
      lines.push("");
    }
  }

  // Requirements
  if (state.requirements?.length) {
    lines.push("## Requirements");
    for (let i = 0; i < state.requirements.length; i++) {
      const r = state.requirements[i];
      const icon = r.status === "done" ? "x" : " ";
      lines.push(`- [${icon}] ${r.desc}`);
    }
    lines.push("");
  }

  // Notes
  lines.push("## Notes");
  if (state.notes?.length) {
    for (const note of state.notes) {
      lines.push(`- ${note}`);
    }
  } else {
    lines.push("(none)");
  }
  lines.push("");

  // Next Action
  lines.push("## Next Action");
  if (currentStep) {
    const phaseSkill = phase === "plan" ? "/sdd-forge.flow-plan"
      : phase === "impl" ? "/sdd-forge.flow-impl"
      : "/sdd-forge.flow-merge";
    lines.push(`Continue with step "${currentStep.id}" (in_progress) using ${phaseSkill}`);
  } else if (doneSteps.length === totalSteps) {
    lines.push("All steps completed.");
  } else {
    const nextPending = steps.find((s) => s.status === "pending");
    if (nextPending) {
      lines.push(`Next pending step: "${nextPending.id}"`);
    } else {
      lines.push("No pending steps.");
    }
  }
  lines.push("");

  return lines.join("\n");
}

function main() {
  const root = repoRoot(import.meta.url);
  const cli = parseArgs(process.argv.slice(2), {
    flags: [],
    options: [],
    defaults: {},
  });

  if (cli.help) {
    console.log(
      [
        "Usage: sdd-forge flow resume",
        "",
        "  Output a context summary for resuming after compaction.",
        "  Reads flow.json and spec.md to reconstruct the current",
        "  workflow state.",
      ].join("\n"),
    );
    return;
  }

  const state = loadFlowState(root);
  if (!state) {
    console.error("no active flow (flow.json not found)");
    process.exit(1);
  }

  const summary = buildSummary(state, root);
  process.stdout.write(summary);
}

export { main, buildSummary };

runIfDirect(import.meta.url, main);
