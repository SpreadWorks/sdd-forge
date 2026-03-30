#!/usr/bin/env node
/**
 * src/flow/get/resolve-context.js
 *
 * flow get resolve-context — Resolve worktree/repo paths and active flow
 * for context recovery after compaction.
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { getWorktreeStatus, getCurrentBranch, getAheadCount, getLastCommit, isGhAvailable } from "../../lib/git-state.js";
import {
  loadFlowState, loadActiveFlows, scanAllFlows,
  derivePhase, resolveWorktreePaths,
} from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

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

function main() {
  const root = repoRoot(import.meta.url);

  let state = loadFlowState(root);
  let mainRepoPath = root;
  let worktreePath = null;
  let activeFlowSpec = null;
  let flowJsonPath = null;

  if (state) {
    const specId = state.spec.match(/specs\/([^/]+)\//)?.[1];
    activeFlowSpec = specId;
    if (state.worktree) {
      const resolved = resolveWorktreePaths(root, state);
      worktreePath = resolved.worktreePath;
    }
    flowJsonPath = path.resolve(root, `specs/${specId}/flow.json`);
  } else {
    const activeFlows = loadActiveFlows(root);
    if (activeFlows.length === 1) {
      activeFlowSpec = activeFlows[0].spec;
      state = loadFlowState(root, activeFlows[0].spec);
      if (state?.worktree) {
        const resolved = resolveWorktreePaths(root, state);
        worktreePath = resolved.worktreePath;
        if (worktreePath && fs.existsSync(worktreePath)) {
          state = loadFlowState(worktreePath, activeFlows[0].spec);
        }
      }
      if (state) {
        flowJsonPath = path.resolve(root, `specs/${activeFlowSpec}/flow.json`);
      }
    } else if (activeFlows.length > 1) {
      output(fail("get", "resolve-context", "MULTIPLE_FLOWS",
        activeFlows.map((f) => `${f.spec} (${f.mode})`)));
      return;
    }
  }

  if (!state) {
    output(fail("get", "resolve-context", "NO_FLOW", "no active flow found"));
    return;
  }

  const steps = state.steps || [];
  const phase = derivePhase(steps);
  const currentStep = steps.find((s) => s.status === "in_progress");
  const doneSteps = steps.filter((s) => s.status === "done" || s.status === "skipped");

  // Read spec summary
  let goal = null;
  let scope = null;
  const effectiveRoot = worktreePath && fs.existsSync(worktreePath) ? worktreePath : mainRepoPath;
  const specPath = path.resolve(effectiveRoot, state.spec);
  if (fs.existsSync(specPath)) {
    const specText = fs.readFileSync(specPath, "utf8");
    goal = extractSection(specText, "Goal") || null;
    scope = extractSection(specText, "Scope") || null;
  }

  // Git/gh state (read-only)
  const { dirty, dirtyFiles } = getWorktreeStatus(effectiveRoot);
  const currentBranch = getCurrentBranch(effectiveRoot);
  const aheadCount = getAheadCount(effectiveRoot, state.baseBranch || "main");
  const lastCommit = getLastCommit(effectiveRoot);
  const ghAvailable = isGhAvailable();

  // Determine recommended skill
  const phaseSkill = phase === "plan" ? "flow-plan"
    : phase === "impl" ? "flow-impl"
    : phase === "finalize" ? "flow-finalize"
    : phase === "sync" ? "flow-sync"
    : "flow-finalize";

  output(ok("get", "resolve-context", {
    mainRepoPath,
    worktreePath,
    activeFlow: activeFlowSpec,
    flowJsonPath,
    spec: state.spec,
    baseBranch: state.baseBranch,
    featureBranch: state.featureBranch,
    worktree: state.worktree || false,
    issue: state.issue || null,
    phase,
    currentStep: currentStep?.id || null,
    progress: { done: doneSteps.length, total: steps.length },
    request: state.request || null,
    goal,
    scope,
    requirements: state.requirements || [],
    notes: state.notes || [],
    dirty,
    dirtyFiles,
    currentBranch,
    aheadCount,
    lastCommit,
    ghAvailable,
    recommendedSkill: phaseSkill,
  }));
}

export { main };
runIfDirect(import.meta.url, main);
