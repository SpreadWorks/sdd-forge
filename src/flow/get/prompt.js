#!/usr/bin/env node
/**
 * src/flow/get/prompt.js
 *
 * flow get prompt <kind> — Return structured prompt for a flow step.
 * Static kinds return full choices. Hybrid kinds return layout data only.
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

/**
 * @typedef {{ id: number, label: string, description: string, recommended: boolean }} Choice
 * @typedef {{ phase: string, step: string, current: number|null, total: number|null, prompt: string, description: string, recommendation: string|null, choices: Choice[] }} PromptData
 */

/** Static prompt definitions. */
const PROMPTS = {
  "plan.approach": {
    phase: "plan", step: "approach",
    description: "仕様書の作成方法を選択してください。",
    recommendation: "Q&A で要件を整理してから仕様書を作成することを推奨します。",
    choices: [
      { id: 1, label: "Q&A で要件を整理してから仕様書を作成する", description: "", recommended: true },
      { id: 2, label: "仕様書を作成する", description: "", recommended: false },
    ],
  },
  "plan.work-environment": {
    phase: "plan", step: "work-environment",
    description: "作業環境を選択してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "Git worktree（隔離した環境で作業）", description: "", recommended: false },
      { id: 2, label: "Branch（feature ブランチを作成）", description: "", recommended: false },
      { id: 3, label: "ブランチを作成しない", description: "", recommended: false },
    ],
  },
  "plan.dirty-worktree": {
    phase: "plan", step: "dirty-worktree",
    description: "未コミットの変更があります。先に commit または stash してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "コミットする", description: "", recommended: false },
      { id: 2, label: "stash する", description: "", recommended: false },
      { id: 3, label: "その他", description: "", recommended: false },
    ],
  },
  "plan.approval": {
    phase: "plan", step: "approval",
    description: "仕様書の内容を確認し、承認してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "承認する", description: "", recommended: false },
      { id: 2, label: "修正する", description: "", recommended: false },
      { id: 3, label: "その他", description: "", recommended: false },
    ],
  },
  "plan.test-mode": {
    phase: "plan", step: "test-mode",
    description: "テストの種類を選択してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "仕様に基づいてテストを作成する", description: "", recommended: false },
      { id: 2, label: "ユニットテスト", description: "", recommended: false },
      { id: 3, label: "E2Eテスト", description: "", recommended: false },
      { id: 4, label: "ユニットテスト + E2E", description: "", recommended: false },
    ],
  },
  "plan.draft": {
    phase: "plan", step: "draft",
    description: "",
    recommendation: null,
    choices: [],
    _hybrid: true,
  },
  "impl.review-mode": {
    phase: "impl", step: "review-mode",
    description: "実装が完了しました。コードレビューを実行しますか？",
    recommendation: null,
    choices: [
      { id: 1, label: "はい", description: "", recommended: false },
      { id: 2, label: "スキップ", description: "", recommended: false },
      { id: 3, label: "その他", description: "", recommended: false },
    ],
  },
  "impl.review-item": {
    phase: "impl", step: "review-item",
    description: "",
    recommendation: null,
    choices: [],
    _hybrid: true,
  },
  "impl.confirmation": {
    phase: "impl", step: "confirmation",
    description: "実装とレビューが完了しました。次の操作を選択してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "終了処理を開始する", description: "", recommended: false },
      { id: 2, label: "修正に戻る", description: "", recommended: false },
      { id: 3, label: "その他", description: "", recommended: false },
    ],
  },
  "finalize.mode": {
    phase: "finalize", step: "mode",
    description: "終了処理の範囲を選択してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "すべて実行", description: "", recommended: false },
      { id: 2, label: "個別に選択する", description: "", recommended: false },
    ],
  },
  "finalize.steps": {
    phase: "finalize", step: "steps",
    description: "実行するステップを選択してください。番号をカンマ区切りで入力（例: 3,4,5）",
    recommendation: null,
    choices: [
      { id: 3, label: "コミット", description: "", recommended: false },
      { id: 4, label: "マージ / PR 作成", description: "", recommended: false },
      { id: 5, label: "ブランチ削除", description: "", recommended: false },
      { id: 6, label: "ドキュメント同期", description: "", recommended: false },
      { id: 7, label: "作業の記録を保存", description: "", recommended: false },
    ],
  },
  "finalize.merge-strategy": {
    phase: "finalize", step: "merge-strategy",
    description: "マージ方法を選択してください。",
    recommendation: null,
    choices: [
      { id: 1, label: "merge", description: "", recommended: false },
      { id: 2, label: "squash merge", description: "", recommended: false },
      { id: 3, label: "pull request", description: "", recommended: false },
    ],
  },
  "finalize.cleanup": {
    phase: "finalize", step: "cleanup",
    description: "worktree を削除しますか？",
    recommendation: null,
    choices: [
      { id: 1, label: "削除する", description: "", recommended: false },
      { id: 2, label: "残す", description: "", recommended: false },
      { id: 3, label: "その他", description: "", recommended: false },
    ],
  },
};

function main() {
  const root = repoRoot(import.meta.url);
  const kind = process.argv[2];

  if (!kind) {
    output(fail("get", "prompt", "MISSING_KIND",
      `kind required. valid: ${Object.keys(PROMPTS).join(", ")}`));
    return;
  }

  const def = PROMPTS[kind];
  if (!def) {
    output(fail("get", "prompt", "INVALID_KIND",
      `unknown kind '${kind}'. valid: ${Object.keys(PROMPTS).join(", ")}`));
    return;
  }

  // Get qa-count for current/total if in draft phase
  let current = null;
  let total = null;
  const state = loadFlowState(root);
  if (state?.metrics?.draft) {
    current = state.metrics.draft.question || 0;
  }

  output(ok("get", "prompt", {
    phase: def.phase,
    step: def.step,
    current,
    total,
    prompt: "",
    description: def.description,
    recommendation: def.recommendation,
    choices: def.choices.map(({ id, label, description, recommended }) => ({ id, label, description, recommended })),
  }));
}

export { main };
runIfDirect(import.meta.url, main);
