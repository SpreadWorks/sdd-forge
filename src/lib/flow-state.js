/**
 * src/lib/flow-state.js
 *
 * .sdd-forge/current-spec の読み書きユーティリティ。
 * sdd-flow-start / sdd-flow-close 間の状態引き継ぎに使用。
 */

import fs from "fs";
import path from "path";
import { sddDir } from "./config.js";

const STATE_FILE = "current-spec";

function statePath(workRoot) {
  return path.join(sddDir(workRoot), STATE_FILE);
}

/**
 * @typedef {Object} FlowState
 * @property {string} spec          - spec.md の相対パス (e.g. "specs/003-xxx/spec.md")
 * @property {string} baseBranch    - 分岐元ブランチ名
 * @property {string} featureBranch - feature ブランチ名
 * @property {boolean} [worktree]      - worktree 内で作業中かどうか
 * @property {string}  [worktreePath]  - worktree の絶対パス
 * @property {string}  [mainRepoPath]  - メインリポジトリの絶対パス
 */

/**
 * current-spec を書き込む。
 * @param {string} workRoot
 * @param {FlowState} state
 */
export function saveFlowState(workRoot, state) {
  const p = statePath(workRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

/**
 * current-spec を読み込む。存在しなければ null。
 * @param {string} workRoot
 * @returns {FlowState|null}
 */
export function loadFlowState(workRoot) {
  const p = statePath(workRoot);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * current-spec を削除する。
 * @param {string} workRoot
 */
export function clearFlowState(workRoot) {
  const p = statePath(workRoot);
  try { fs.unlinkSync(p); } catch (_) {}
}
