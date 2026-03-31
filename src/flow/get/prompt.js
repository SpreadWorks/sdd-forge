#!/usr/bin/env node
/**
 * src/flow/get/prompt.js
 *
 * flow get prompt <kind> — Return structured prompt for a flow step.
 * Static kinds return full choices. Hybrid kinds return layout data only.
 * Responds in the language configured in .sdd-forge/config.json (lang field).
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { loadFlowState } from "../../lib/flow-state.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

/**
 * @typedef {{ id: number, label: string, description: string, recommended: boolean }} Choice
 * @typedef {{ phase: string, step: string, current: number|null, total: number|null, prompt: string, description: string, recommendation: string|null, choices: Choice[] }} PromptData
 */

/** Prompt definitions keyed by language then by kind. */
const PROMPTS_BY_LANG = {
  ja: {
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
        { id: 2, label: "スタッシュする", description: "", recommended: false },
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
      description: "テストコードの作成方法を選択してください。",
      recommendation: null,
      choices: [
        { id: 1, label: "テストコードを作成する", description: "", recommended: true },
        { id: 2, label: "テストコードを作成しない", description: "", recommended: false },
        { id: 3, label: "その他", description: "", recommended: false },
      ],
    },
    "plan.draft": {
      phase: "plan", step: "draft",
      description: "",
      recommendation: null,
      choices: [],
      _hybrid: true,
    },
    "plan.complete": {
      phase: "plan", step: "complete",
      description: "プランニングフェーズが完了しました。次の操作を選択してください。",
      recommendation: null,
      choices: [
        { id: 1, label: "実装を進める", description: "", recommended: false },
        { id: 2, label: "プランを見直す", description: "", recommended: false },
        { id: 3, label: "その他", description: "", recommended: false },
      ],
    },
    "plan.base-branch": {
      phase: "plan", step: "base-branch",
      description: "現在のブランチから分岐します。",
      recommendation: null,
      choices: [
        { id: 1, label: "はい", description: "", recommended: false },
        { id: 2, label: "ブランチを指定する", description: "", recommended: false },
        { id: 3, label: "その他", description: "", recommended: false },
      ],
    },
    "impl.review-mode": {
      phase: "impl", step: "review-mode",
      description: "コードレビューの方針を選択してください。",
      recommendation: null,
      choices: [
        { id: 1, label: "コードレビューを行い、自動で改善する", description: "", recommended: false },
        { id: 2, label: "コードレビューのみ", description: "", recommended: false },
        { id: 3, label: "しない", description: "", recommended: false },
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
        { id: 1, label: "承認する", description: "", recommended: false },
        { id: 2, label: "実装内容の概要を確認する", description: "", recommended: false },
        { id: 3, label: "実装内容を詳細に確認する", description: "", recommended: false },
        { id: 4, label: "その他", description: "", recommended: false },
      ],
    },
    "finalize.mode": {
      phase: "finalize", step: "mode",
      description: "終了処理の範囲を選択してください。",
      recommendation: null,
      choices: [
        { id: 1, label: "すべて実行", description: "コミット、マージまたは PR 作成、後片付け、必要ならドキュメント同期までまとめて進める", recommended: false },
        { id: 2, label: "個別に選択する", description: "実行する終了処理だけを選び、選んだものだけ順に進める", recommended: false },
      ],
    },
    "finalize.steps": {
      phase: "finalize", step: "steps",
      description: "実行するステップを選択してください。番号をカンマ区切りで入力（例: 1,2,3）",
      recommendation: null,
      choices: [
        { id: 1, label: "コミット", description: "", recommended: false },
        { id: 2, label: "マージ / PR 作成", description: "", recommended: false },
        { id: 3, label: "ドキュメント同期", description: "", recommended: false },
        { id: 4, label: "ブランチ削除", description: "", recommended: false },
        { id: 5, label: "作業の記録を保存", description: "", recommended: false },
      ],
    },
    "finalize.merge-strategy": {
      phase: "finalize", step: "merge-strategy",
      description: "マージ方法を選択してください。",
      recommendation: null,
      choices: [
        { id: 1, label: "squash merge", description: "", recommended: false },
        { id: 2, label: "pull request", description: "", recommended: false },
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
  },
  en: {
    "plan.approach": {
      phase: "plan", step: "approach",
      description: "Choose how to create the spec.",
      recommendation: "Recommended: organize requirements through Q&A before writing the spec.",
      choices: [
        { id: 1, label: "Organize requirements through Q&A before writing the spec", description: "", recommended: true },
        { id: 2, label: "Write the spec directly", description: "", recommended: false },
      ],
    },
    "plan.work-environment": {
      phase: "plan", step: "work-environment",
      description: "Choose a work environment.",
      recommendation: null,
      choices: [
        { id: 1, label: "Git worktree (work in an isolated environment)", description: "", recommended: false },
        { id: 2, label: "Branch (create a feature branch)", description: "", recommended: false },
        { id: 3, label: "No branch", description: "", recommended: false },
      ],
    },
    "plan.dirty-worktree": {
      phase: "plan", step: "dirty-worktree",
      description: "There are uncommitted changes. Please commit or stash first.",
      recommendation: null,
      choices: [
        { id: 1, label: "Commit", description: "", recommended: false },
        { id: 2, label: "Stash", description: "", recommended: false },
        { id: 3, label: "Other", description: "", recommended: false },
      ],
    },
    "plan.approval": {
      phase: "plan", step: "approval",
      description: "Review the spec and approve it.",
      recommendation: null,
      choices: [
        { id: 1, label: "Approve", description: "", recommended: false },
        { id: 2, label: "Revise", description: "", recommended: false },
        { id: 3, label: "Other", description: "", recommended: false },
      ],
    },
    "plan.test-mode": {
      phase: "plan", step: "test-mode",
      description: "Choose test approach.",
      recommendation: null,
      choices: [
        { id: 1, label: "Write test code", description: "", recommended: true },
        { id: 2, label: "Skip test creation", description: "", recommended: false },
        { id: 3, label: "Other", description: "", recommended: false },
      ],
    },
    "plan.draft": {
      phase: "plan", step: "draft",
      description: "",
      recommendation: null,
      choices: [],
      _hybrid: true,
    },
    "plan.complete": {
      phase: "plan", step: "complete",
      description: "Planning phase is complete. Choose next action.",
      recommendation: null,
      choices: [
        { id: 1, label: "Proceed to implementation", description: "", recommended: false },
        { id: 2, label: "Review the plan", description: "", recommended: false },
        { id: 3, label: "Other", description: "", recommended: false },
      ],
    },
    "plan.base-branch": {
      phase: "plan", step: "base-branch",
      description: "Branch from current branch.",
      recommendation: null,
      choices: [
        { id: 1, label: "Yes", description: "", recommended: false },
        { id: 2, label: "Specify a branch", description: "", recommended: false },
        { id: 3, label: "Other", description: "", recommended: false },
      ],
    },
    "impl.review-mode": {
      phase: "impl", step: "review-mode",
      description: "Choose code review policy.",
      recommendation: null,
      choices: [
        { id: 1, label: "Run code review and auto-fix", description: "", recommended: false },
        { id: 2, label: "Code review only", description: "", recommended: false },
        { id: 3, label: "Skip", description: "", recommended: false },
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
      description: "Implementation and review are complete. Choose next action.",
      recommendation: null,
      choices: [
        { id: 1, label: "Approve", description: "", recommended: false },
        { id: 2, label: "Review implementation overview", description: "", recommended: false },
        { id: 3, label: "Review implementation in detail", description: "", recommended: false },
        { id: 4, label: "Other", description: "", recommended: false },
      ],
    },
    "finalize.mode": {
      phase: "finalize", step: "mode",
      description: "Choose the scope of finalization.",
      recommendation: null,
      choices: [
        { id: 1, label: "Run all steps", description: "Commit, merge or PR, cleanup, and documentation sync in one go", recommended: false },
        { id: 2, label: "Choose individually", description: "Select only the steps you want to run", recommended: false },
      ],
    },
    "finalize.steps": {
      phase: "finalize", step: "steps",
      description: "Select steps to execute. Enter numbers separated by commas (e.g., 1,2,3).",
      recommendation: null,
      choices: [
        { id: 1, label: "Commit", description: "", recommended: false },
        { id: 2, label: "Merge / PR creation", description: "", recommended: false },
        { id: 3, label: "Documentation sync", description: "", recommended: false },
        { id: 4, label: "Branch cleanup", description: "", recommended: false },
        { id: 5, label: "Save work record", description: "", recommended: false },
      ],
    },
    "finalize.merge-strategy": {
      phase: "finalize", step: "merge-strategy",
      description: "Choose merge method.",
      recommendation: null,
      choices: [
        { id: 1, label: "squash merge", description: "", recommended: false },
        { id: 2, label: "pull request", description: "", recommended: false },
      ],
    },
    "finalize.cleanup": {
      phase: "finalize", step: "cleanup",
      description: "Remove worktree?",
      recommendation: null,
      choices: [
        { id: 1, label: "Remove", description: "", recommended: false },
        { id: 2, label: "Keep", description: "", recommended: false },
        { id: 3, label: "Other", description: "", recommended: false },
      ],
    },
  },
};

/** Resolve language from config, defaulting to "en". */
async function resolveLang(root) {
  try {
    const { loadConfig } = await import("../../lib/config.js");
    const config = loadConfig(root);
    return config.lang || "en";
  } catch {
    return "en";
  }
}

/** Get all valid kind names (from ja, which is the superset). */
function validKinds() {
  return Object.keys(PROMPTS_BY_LANG.ja);
}

async function main() {
  const root = repoRoot(import.meta.url);
  const kind = process.argv[2];

  if (!kind) {
    output(fail("get", "prompt", "MISSING_KIND",
      `kind required. valid: ${validKinds().join(", ")}`));
    return;
  }

  if (!PROMPTS_BY_LANG.ja[kind]) {
    output(fail("get", "prompt", "INVALID_KIND",
      `unknown kind '${kind}'. valid: ${validKinds().join(", ")}`));
    return;
  }

  const lang = await resolveLang(root);
  const prompts = PROMPTS_BY_LANG[lang] || PROMPTS_BY_LANG.en;
  const def = prompts[kind] || PROMPTS_BY_LANG.en[kind];

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
