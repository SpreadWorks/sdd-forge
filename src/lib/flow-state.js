/**
 * src/lib/flow-state.js
 *
 * .sdd-forge/flow.json の読み書きユーティリティ。
 * flow-plan / flow-impl / flow-finalize / flow-sync 間の状態引き継ぎに使用。
 */

import fs from "fs";
import path from "path";
import { sddDir } from "./config.js";
import { isInsideWorktree, getMainRepoPath } from "./cli.js";

const STATE_FILE = "flow.json";

/** SDD workflow step IDs in order. */
export const FLOW_STEPS = [
  "approach", "branch", "spec", "draft", "fill-spec",
  "approval", "gate", "test", "implement", "review", "finalize",
  "commit", "push", "merge", "pr-create", "branch-cleanup", "archive",
  "pr-merge", "sync-cleanup", "docs-update", "docs-review", "docs-commit",
];

/** Step ID → phase mapping. */
export const PHASE_MAP = {
  approach: "plan", branch: "plan", spec: "plan", draft: "plan",
  "fill-spec": "plan", approval: "plan", gate: "plan", test: "plan",
  implement: "impl", review: "impl", finalize: "impl",
  commit: "finalize", push: "finalize", merge: "finalize",
  "pr-create": "finalize", "branch-cleanup": "finalize", archive: "finalize",
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
  const inProgress = steps.find((s) => s.status === "in_progress");
  if (inProgress) return PHASE_MAP[inProgress.id] || "plan";
  let lastDone = null;
  for (const s of steps) {
    if (s.status === "done" || s.status === "skipped") lastDone = s;
  }
  if (!lastDone) return "plan";
  return PHASE_MAP[lastDone.id] || "plan";
}

function statePath(workRoot) {
  return path.join(sddDir(workRoot), STATE_FILE);
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
 */

/**
 * Build initial steps array with all steps set to "pending".
 * @returns {StepEntry[]}
 */
export function buildInitialSteps() {
  return FLOW_STEPS.map((id) => ({ id, status: "pending" }));
}

/**
 * flow.json を書き込む。
 * @param {string} workRoot
 * @param {FlowState} state
 */
export function saveFlowState(workRoot, state) {
  const p = statePath(workRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

/**
 * flow.json を読み込む。存在しなければ null。
 * @param {string} workRoot
 * @returns {FlowState|null}
 */
export function loadFlowState(workRoot) {
  const p = statePath(workRoot);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * flow.json を削除する。
 * @param {string} workRoot
 */
export function clearFlowState(workRoot) {
  const p = statePath(workRoot);
  try { fs.unlinkSync(p); } catch (_) {}
}

/**
 * Load flow.json, apply a mutation, and save.
 * @param {string} workRoot
 * @param {(state: FlowState) => void} mutator
 */
function mutateFlowState(workRoot, mutator) {
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
 * @param {string} workRoot
 * @returns {string}
 */
export function flowStatePath(workRoot) {
  return statePath(workRoot);
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
