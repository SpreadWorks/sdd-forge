/**
 * src/lib/flow-state.js
 *
 * .sdd-forge/flow.json の読み書きユーティリティ。
 * flow-plan / flow-impl / flow-merge 間の状態引き継ぎに使用。
 */

import fs from "fs";
import path from "path";
import { sddDir } from "./config.js";

const STATE_FILE = "flow.json";

/** SDD workflow step IDs in order. */
export const FLOW_STEPS = [
  "approach", "branch", "spec", "draft", "fill-spec",
  "approval", "gate", "test", "implement", "review", "finalize",
  "docs-update", "docs-review", "commit", "merge", "branch-cleanup", "archive",
];

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
 * @property {boolean} [worktree]      - worktree 内で作業中かどうか
 * @property {string}  [worktreePath]  - worktree の絶対パス
 * @property {string}  [mainRepoPath]  - メインリポジトリの絶対パス
 * @property {StepEntry[]} [steps]          - workflow step tracking
 * @property {RequirementEntry[]} [requirements] - spec requirements tracking
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
 * Update a single step's status.
 * @param {string} workRoot
 * @param {string} stepId
 * @param {string} status
 */
export function updateStepStatus(workRoot, stepId, status) {
  const state = loadFlowState(workRoot);
  if (!state) throw new Error("no active flow (flow.json not found)");
  if (!state.steps) throw new Error("flow.json has no steps");
  const step = state.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`unknown step: ${stepId}`);
  step.status = status;
  saveFlowState(workRoot, state);
}

/**
 * Set requirements list (replaces existing).
 * @param {string} workRoot
 * @param {string[]} descriptions - array of requirement descriptions
 */
export function setRequirements(workRoot, descriptions) {
  const state = loadFlowState(workRoot);
  if (!state) throw new Error("no active flow (flow.json not found)");
  state.requirements = descriptions.map((desc) => ({ desc, status: "pending" }));
  saveFlowState(workRoot, state);
}

/**
 * Update a single requirement's status.
 * @param {string} workRoot
 * @param {number} index
 * @param {string} status
 */
export function updateRequirement(workRoot, index, status) {
  const state = loadFlowState(workRoot);
  if (!state) throw new Error("no active flow (flow.json not found)");
  if (!state.requirements?.[index]) throw new Error(`requirement index out of range: ${index}`);
  state.requirements[index].status = status;
  saveFlowState(workRoot, state);
}

/**
 * flow.json のパスを返す。
 * @param {string} workRoot
 * @returns {string}
 */
export function flowStatePath(workRoot) {
  return statePath(workRoot);
}
