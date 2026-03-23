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
import { loadFlowState, derivePhase, loadActiveFlows, scanAllFlows, resolveWorktreePaths } from "../../lib/flow-state.js";

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
      : phase === "finalize" ? "/sdd-forge.flow-finalize"
      : phase === "sync" ? "/sdd-forge.flow-sync"
      : "/sdd-forge.flow-finalize";
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

  // Try loading from context first (current branch/worktree)
  let state = loadFlowState(root);
  let effectiveRoot = root;

  if (!state) {
    // Scan active flows and pick one
    const activeFlows = loadActiveFlows(root);
    if (activeFlows.length === 1) {
      state = loadFlowState(root, activeFlows[0].spec);
      if (state) {
        // Resolve effective root for worktree mode
        const { worktreePath } = resolveWorktreePaths(root, state);
        if (worktreePath && fs.existsSync(worktreePath)) {
          effectiveRoot = worktreePath;
          state = loadFlowState(effectiveRoot, activeFlows[0].spec);
        }
      }
    } else if (activeFlows.length > 1) {
      console.error("multiple active flows found. specify --spec or run from the correct worktree/branch:");
      for (const f of activeFlows) {
        console.error(`  ${f.spec} (${f.mode})`);
      }
      process.exit(1);
    }
  }

  if (!state) {
    // Last resort: scan all flows
    const all = scanAllFlows(root);
    const inProgress = all.filter((f) => {
      const phase = derivePhase(f.state.steps);
      return f.state.steps?.some((s) => s.status === "in_progress" || s.status === "pending");
    });
    if (inProgress.length === 1) {
      state = inProgress[0].state;
      effectiveRoot = inProgress[0].location.startsWith("branch:") ? root : inProgress[0].location;
    } else if (inProgress.length > 1) {
      console.error("multiple in-progress flows found:");
      for (const f of inProgress) {
        console.error(`  ${f.specId} (${f.mode}) [${f.location}]`);
      }
      process.exit(1);
    }
  }

  if (!state) {
    console.error("no active flow found");
    process.exit(1);
  }

  if (effectiveRoot !== root) {
    console.error(`(found active flow in: ${path.relative(root, effectiveRoot) || effectiveRoot})`);
  }

  const summary = buildSummary(state, effectiveRoot);
  process.stdout.write(summary);
}

export { main, buildSummary };

runIfDirect(import.meta.url, main);
