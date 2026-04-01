/**
 * src/lib/flow-state.js
 *
 * SDD フロー状態の永続化。
 * .sdd-forge/.active-flow (ポインタ) + specs/NNN/flow.json (実体) 方式。
 * flow-plan / flow-impl / flow-finalize / flow-sync 間の状態引き継ぎに使用。
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { sddDir } from "./config.js";
import { isInsideWorktree, getMainRepoPath } from "./cli.js";

const STATE_FILE = "flow.json";
const ACTIVE_FLOW_FILE = ".active-flow";

/** SDD workflow step IDs in order. */
export const FLOW_STEPS = [
  "approach", "branch", "prepare-spec", "draft", "spec",
  "gate", "approval", "test", "implement", "review", "finalize",
  "commit", "push", "merge", "pr-create", "branch-cleanup",
  "pr-merge", "sync-cleanup", "docs-update", "docs-review", "docs-commit",
];

/** Step ID → phase mapping. */
export const PHASE_MAP = {
  approach: "plan", branch: "plan", "prepare-spec": "plan", draft: "plan",
  spec: "plan", gate: "plan", approval: "plan", test: "plan",
  implement: "impl", review: "impl", finalize: "impl",
  commit: "finalize", push: "finalize", merge: "finalize",
  "pr-create": "finalize", "branch-cleanup": "finalize",
  "pr-merge": "sync", "sync-cleanup": "sync",
  "docs-update": "sync", "docs-review": "sync", "docs-commit": "sync",
};

/**
 * Derive current phase from steps.
 * Returns the phase of the first in_progress step,
 * or the phase after the last done/skipped step.
 * @param {StepEntry[]} [steps]
 * @returns {"plan"|"impl"|"finalize"|"sync"}
 */
export function derivePhase(steps) {
  if (!steps?.length) return "plan";
  const inProgress = steps.find((s) => s.status === "in_progress" && PHASE_MAP[s.id]);
  if (inProgress) return PHASE_MAP[inProgress.id];
  let lastDone = null;
  for (const s of steps) {
    if ((s.status === "done" || s.status === "skipped") && PHASE_MAP[s.id]) lastDone = s;
  }
  if (!lastDone) return "plan";
  return PHASE_MAP[lastDone.id];
}

/**
 * @typedef {Object} StepEntry
 * @property {string} id     - step ID (one of FLOW_STEPS)
 * @property {"pending"|"in_progress"|"done"|"skipped"} status
 */

/**
 * @typedef {Object} RequirementEntry
 * @property {string} desc   - requirement description
 * @property {"pending"|"in_progress"|"done"} status
 */

/**
 * @typedef {Object} FlowState
 * @property {string} spec          - spec.md の相対パス (e.g. "specs/003-xxx/spec.md")
 * @property {string} baseBranch    - 分岐元ブランチ名
 * @property {string} featureBranch - feature ブランチ名
 * @property {boolean} [worktree]      - worktree モードかどうか
 * @property {string}  [request]        - ユーザーの元のリクエスト
 * @property {string[]} [notes]         - 選択肢結果・メモの配列
 * @property {StepEntry[]} [steps]          - workflow step tracking
 * @property {RequirementEntry[]} [requirements] - spec requirements tracking
 * @property {number|null} [issue]      - 紐付く GitHub Issue 番号
 * @property {"squash"|"pr"|null} [mergeStrategy] - finalize 時に記録されるマージ方式
 * @property {boolean} [autoApprove] - autoApprove モード（true の場合 AI が選択肢を自動選択して進む）
 */

/**
 * @typedef {Object} ActiveFlowEntry
 * @property {string} spec - spec ID (e.g. "086-migrate-flow-state")
 * @property {"worktree"|"branch"|"local"} mode
 */

// ── .active-flow pointer ────────────────────────────────────────────────────

function activeFlowPath(mainRoot) {
  return path.join(sddDir(mainRoot), ACTIVE_FLOW_FILE);
}

/**
 * Resolve the main repo root from any working directory.
 * If inside a worktree, resolves to the main repo.
 * Otherwise returns workRoot as-is.
 */
function resolveMainRoot(workRoot) {
  if (isInsideWorktree(workRoot)) {
    return getMainRepoPath(workRoot);
  }
  return workRoot;
}

/**
 * Load all active flow entries from .active-flow.
 * @param {string} workRoot
 * @returns {ActiveFlowEntry[]}
 */
export function loadActiveFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const p = activeFlowPath(mainRoot);
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`[flow-state] WARN: failed to parse .active-flow (${p}): ${err.message}`);
    }
    return [];
  }
}

/**
 * Add an active flow entry to .active-flow.
 * @param {string} workRoot
 * @param {string} specId
 * @param {"worktree"|"branch"|"local"} mode
 */
export function addActiveFlow(workRoot, specId, mode) {
  const mainRoot = resolveMainRoot(workRoot);
  const flows = loadActiveFlows(mainRoot);
  if (flows.some((f) => f.spec === specId)) return;
  flows.push({ spec: specId, mode });
  const p = activeFlowPath(mainRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(flows, null, 2) + "\n", "utf8");
}

/**
 * Remove an active flow entry from .active-flow.
 * Deletes the file if no entries remain.
 * @param {string} workRoot
 * @param {string} specId
 */
export function removeActiveFlow(workRoot, specId) {
  const mainRoot = resolveMainRoot(workRoot);
  const flows = loadActiveFlows(mainRoot);
  const filtered = flows.filter((f) => f.spec !== specId);
  const p = activeFlowPath(mainRoot);
  if (filtered.length === 0) {
    try { fs.unlinkSync(p); } catch (err) { if (err.code !== "ENOENT") console.error(err); }
    return;
  }
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + "\n", "utf8");
}

// ── stale detection ─────────────────────────────────────────────────────────

/**
 * Check if a git worktree exists for the given branch.
 * @param {string} mainRoot
 * @param {string} branch
 * @returns {boolean}
 */
function worktreeExists(mainRoot, branch) {
  try {
    const output = execFileSync("git", ["-C", mainRoot, "worktree", "list", "--porcelain"], {
      encoding: "utf8",
    });
    return output.includes(`branch refs/heads/${branch}`);
  } catch (_) {
    return true; // on error, assume exists (avoid accidental deletion)
  }
}

/**
 * Check if a git branch exists.
 * @param {string} mainRoot
 * @param {string} branch
 * @returns {boolean}
 */
function branchExists(mainRoot, branch) {
  try {
    const output = execFileSync("git", ["-C", mainRoot, "branch", "--list", branch], {
      encoding: "utf8",
    });
    return output.trim().length > 0;
  } catch (_) {
    return true; // on error, assume exists
  }
}

/**
 * Remove stale entries from .active-flow.
 * Returns cleaned active flows.
 * @param {string} workRoot
 * @returns {ActiveFlowEntry[]}
 */
export function cleanStaleFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const flows = loadActiveFlows(mainRoot);
  if (flows.length === 0) return [];

  const valid = [];
  for (const entry of flows) {
    const branch = `feature/${entry.spec}`;
    let isStale = false;

    if (entry.mode === "worktree") {
      isStale = !worktreeExists(mainRoot, branch);
    } else if (entry.mode === "branch") {
      isStale = !branchExists(mainRoot, branch);
    } else {
      // local mode: check if flow.json exists on disk in main repo
      isStale = !fs.existsSync(path.join(mainRoot, "specs", entry.spec, STATE_FILE));
    }

    if (!isStale) valid.push(entry);
  }

  if (valid.length !== flows.length) {
    const p = activeFlowPath(mainRoot);
    if (valid.length === 0) {
      try { fs.unlinkSync(p); } catch (err) { if (err.code !== "ENOENT") console.error(err); }
    } else {
      fs.writeFileSync(p, JSON.stringify(valid, null, 2) + "\n", "utf8");
    }
  }

  return valid;
}

// ── spec ID helpers ─────────────────────────────────────────────────────────

/**
 * Extract spec ID from spec path.
 * e.g. "specs/086-migrate-flow-state/spec.md" → "086-migrate-flow-state"
 * @param {string} specPath
 * @returns {string}
 */
export function specIdFromPath(specPath) {
  const parts = specPath.replace(/\\/g, "/").split("/");
  const idx = parts.indexOf("specs");
  if (idx >= 0 && idx + 1 < parts.length) return parts[idx + 1];
  return parts[0];
}

// ── flow.json in specs/NNN/ ─────────────────────────────────────────────────

/**
 * Resolve the flow.json path for a given spec ID.
 * @param {string} workRoot
 * @param {string} specId
 * @returns {string}
 */
function specFlowPath(workRoot, specId) {
  return path.join(workRoot, "specs", specId, STATE_FILE);
}

/**
 * Resolve which spec ID is "current" based on context.
 * 1. If inside a worktree, match by current branch name.
 * 2. If on a feature branch, match by branch name.
 * 3. If only one active flow, use that.
 * @param {string} workRoot
 * @param {ActiveFlowEntry[]} flows
 * @returns {ActiveFlowEntry|null}
 */
function resolveCurrentFlow(workRoot, flows) {
  if (flows.length === 0) return null;
  if (flows.length === 1) return flows[0];

  // Try matching by current branch
  let currentBranch;
  try {
    currentBranch = execFileSync("git", ["-C", workRoot, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch (_) {
    return null;
  }

  // Match feature/<spec-id>
  for (const entry of flows) {
    if (currentBranch === `feature/${entry.spec}`) return entry;
  }

  return null;
}

/**
 * Build initial steps array with all steps set to "pending".
 * @returns {StepEntry[]}
 */
export function buildInitialSteps() {
  return FLOW_STEPS.map((id) => ({ id, status: "pending" }));
}

/**
 * flow.json を specs/NNN/ に書き込む。
 * spec フィールドから spec ID を導出する。
 * @param {string} workRoot
 * @param {FlowState} state
 */
export function saveFlowState(workRoot, state) {
  const specId = specIdFromPath(state.spec);
  const p = specFlowPath(workRoot, specId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

/**
 * flow.json を読み込む。存在しなければ null。
 *
 * Worktree 内の場合は branch 名から spec ID を導出し、
 * .active-flow を経由せず直接 specs/NNN/flow.json を読む。
 *
 * @param {string} workRoot
 * @param {string} [specId] - 明示的に spec ID を指定する場合
 * @returns {FlowState|null}
 */
export function loadFlowState(workRoot, specId) {
  if (specId) {
    const p = specFlowPath(workRoot, specId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }

  // Worktree shortcut: derive spec ID from branch name directly
  if (isInsideWorktree(workRoot)) {
    const id = specIdFromBranch(workRoot);
    if (id) {
      const p = specFlowPath(workRoot, id);
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  }

  const flows = loadActiveFlows(workRoot);
  const current = resolveCurrentFlow(workRoot, flows);
  if (!current) return null;

  const p = specFlowPath(workRoot, current.spec);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * Derive spec ID from the current branch name inside a worktree.
 * Branch format: feature/<spec-id>
 * @param {string} workRoot
 * @returns {string|null}
 */
function specIdFromBranch(workRoot) {
  try {
    const branch = execFileSync("git", ["-C", workRoot, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
    }).trim();
    const prefix = "feature/";
    if (branch.startsWith(prefix)) return branch.slice(prefix.length);
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * .active-flow からエントリを削除する。flow.json 自体は残す。
 * @param {string} workRoot
 * @param {string} [specId] - 省略時はコンテキストから判別
 */
export function clearFlowState(workRoot, specId) {
  if (!specId) {
    const flows = loadActiveFlows(workRoot);
    const current = resolveCurrentFlow(workRoot, flows);
    if (!current) return;
    specId = current.spec;
  }
  removeActiveFlow(workRoot, specId);
}

/**
 * Load flow.json, apply a mutation, and save.
 * @param {string} workRoot
 * @param {(state: FlowState) => void} mutator
 */
export function mutateFlowState(workRoot, mutator) {
  const state = loadFlowState(workRoot);
  if (!state) throw new Error("no active flow (flow.json not found)");
  mutator(state);
  saveFlowState(workRoot, state);
}

/**
 * Update a single step's status.
 * @param {string} workRoot
 * @param {string} stepId
 * @param {string} status
 */
export function updateStepStatus(workRoot, stepId, status) {
  mutateFlowState(workRoot, (state) => {
    if (!state.steps) throw new Error("flow.json has no steps");
    const step = state.steps.find((s) => s.id === stepId);
    if (!step) throw new Error(`unknown step: ${stepId}`);
    step.status = status;
  });
}

/**
 * Set requirements list (replaces existing).
 * @param {string} workRoot
 * @param {string[]} descriptions - array of requirement descriptions
 */
export function setRequirements(workRoot, descriptions) {
  mutateFlowState(workRoot, (state) => {
    state.requirements = descriptions.map((desc) => ({ desc, status: "pending" }));
  });
}

/**
 * Update a single requirement's status.
 * @param {string} workRoot
 * @param {number} index
 * @param {string} status
 */
export function updateRequirement(workRoot, index, status) {
  mutateFlowState(workRoot, (state) => {
    if (!state.requirements?.[index]) throw new Error(`requirement index out of range: ${index}`);
    state.requirements[index].status = status;
  });
}

/**
 * Set the request field in flow.json.
 * @param {string} workRoot
 * @param {string} text
 */
export function setRequest(workRoot, text) {
  mutateFlowState(workRoot, (state) => {
    state.request = text;
  });
}

/**
 * Set the issue number in flow.json.
 * @param {string} workRoot
 * @param {number} issue - GitHub Issue number
 */
export function setIssue(workRoot, issue) {
  mutateFlowState(workRoot, (state) => {
    state.issue = issue;
  });
}

/**
 * Append a note to the notes array in flow.json.
 * @param {string} workRoot
 * @param {string} text
 */
export function addNote(workRoot, text) {
  mutateFlowState(workRoot, (state) => {
    if (!state.notes) state.notes = [];
    state.notes.push(text);
  });
}

/**
 * flow.json のパスを返す。
 * .active-flow からコンテキストに対応する spec ID を解決し、specs/NNN/flow.json を返す。
 * @param {string} workRoot
 * @returns {string|null}
 */
export function flowStatePath(workRoot) {
  const flows = loadActiveFlows(workRoot);
  const current = resolveCurrentFlow(workRoot, flows);
  if (!current) return null;
  return specFlowPath(workRoot, current.spec);
}

/**
 * worktree モードのパスを実行時に算出する。
 * flow.json には絶対パスを保存せず、featureBranch から導出する。
 *
 * @param {string} root - 現在の作業ディレクトリ (repoRoot())
 * @param {FlowState} state - flow.json の内容
 * @returns {{ worktreePath: string|null, mainRepoPath: string|null }}
 */
export function resolveWorktreePaths(root, state) {
  if (!state.worktree) return { worktreePath: null, mainRepoPath: null };

  if (isInsideWorktree(root)) {
    return {
      worktreePath: root,
      mainRepoPath: getMainRepoPath(root),
    };
  }

  // main repo にいる場合: featureBranch から worktree パスを算出
  const dirName = state.featureBranch.replace(/\//g, "-");
  return {
    worktreePath: path.join(sddDir(root), "worktree", dirName),
    mainRepoPath: root,
  };
}

// ── scan all flows ──────────────────────────────────────────────────────────

/**
 * Scan all flow.json files across worktrees, branches, and local specs.
 * Returns an array of { specId, mode, state, location }.
 * @param {string} workRoot
 * @returns {Array<{specId: string, mode: string|null, state: FlowState, location: string}>}
 */
export function scanAllFlows(workRoot) {
  const mainRoot = resolveMainRoot(workRoot);
  const results = [];
  const seen = new Set();

  // 1. Local: specs/*/ in main repo (with or without flow.json)
  const specsDir = path.join(mainRoot, "specs");
  if (fs.existsSync(specsDir)) {
    for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^\d{3}-/.test(entry.name)) continue;
      const fp = path.join(specsDir, entry.name, STATE_FILE);
      if (fs.existsSync(fp)) {
        const state = JSON.parse(fs.readFileSync(fp, "utf8"));
        const mode = state.worktree ? "worktree" : (state.featureBranch && state.featureBranch !== state.baseBranch) ? "branch" : "local";
        results.push({ specId: entry.name, mode, state, location: mainRoot });
      } else {
        results.push({ specId: entry.name, mode: null, state: null, location: mainRoot });
      }
      seen.add(entry.name);
    }
  }

  // 2. Worktrees: scan each worktree's specs/*/flow.json
  try {
    const output = execFileSync("git", ["-C", mainRoot, "worktree", "list", "--porcelain"], {
      encoding: "utf8",
    });
    let wtPath = null;
    for (const line of output.split("\n")) {
      if (line.startsWith("worktree ")) {
        wtPath = line.slice("worktree ".length);
      } else if (line === "" && wtPath && wtPath !== mainRoot) {
        const wtSpecs = path.join(wtPath, "specs");
        if (fs.existsSync(wtSpecs)) {
          for (const entry of fs.readdirSync(wtSpecs, { withFileTypes: true })) {
            if (!entry.isDirectory() || seen.has(entry.name)) continue;
            const fp = path.join(wtSpecs, entry.name, STATE_FILE);
            if (fs.existsSync(fp)) {
              const state = JSON.parse(fs.readFileSync(fp, "utf8"));
              results.push({ specId: entry.name, mode: "worktree", state, location: wtPath });
              seen.add(entry.name);
            }
          }
        }
        wtPath = null;
      }
    }
  } catch (_) {
    // git worktree list failed, skip
  }

  // 3. Branches: check feature/* branches for specs/*/flow.json
  try {
    const output = execFileSync("git", ["-C", mainRoot, "branch", "--list", "feature/*"], {
      encoding: "utf8",
    });
    for (const line of output.split("\n")) {
      const branch = line.replace(/^[*+ ]+/, "").trim();
      if (!branch) continue;
      const specId = branch.replace("feature/", "");
      if (seen.has(specId)) continue;
      try {
        const content = execFileSync(
          "git", ["-C", mainRoot, "show", `${branch}:specs/${specId}/flow.json`],
          { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
        );
        const state = JSON.parse(content);
        results.push({ specId, mode: "branch", state, location: `branch:${branch}` });
        seen.add(specId);
      } catch (_) {
        // no flow.json on this branch
      }
    }
  } catch (_) {
    // git branch list failed, skip
  }

  return results;
}
