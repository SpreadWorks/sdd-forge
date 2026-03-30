/**
 * src/flow/registry.js
 *
 * Single source of truth for flow subcommand metadata.
 * Used by dispatchers (flow.js, get.js, set.js, run.js) and help.js.
 */

export const FLOW_COMMANDS = {
  get: {
    script: "flow/get.js",
    desc: { en: "Read flow state (status, check, prompt, guardrail, ...)", ja: "フロー状態を取得（status, check, prompt, guardrail, ...）" },
    keys: {
      status:            { script: "flow/get/status.js",          desc: { en: "Show current flow state", ja: "現在のフロー状態を表示" } },
      "resolve-context": { script: "flow/get/resolve-context.js", desc: { en: "Resolve worktree/repo paths for context recovery", ja: "worktree/リポジトリパスを解決" } },
      check:             { script: "flow/get/check.js",           desc: { en: "Check prerequisites (impl, finalize, dirty, gh)", ja: "前提条件チェック（impl, finalize, dirty, gh）" } },
      prompt:            { script: "flow/get/prompt.js",          desc: { en: "Get structured prompt for a flow step", ja: "フローステップの構造化プロンプトを取得" } },
      "qa-count":        { script: "flow/get/qa-count.js",        desc: { en: "Get answered question count", ja: "回答済み質問数を取得" } },
      guardrail:         { script: "flow/get/guardrail.js",       desc: { en: "Get guardrail articles filtered by phase", ja: "フェーズでフィルタしたガードレール記事を取得" } },
      issue:             { script: "flow/get/issue.js",           desc: { en: "Get GitHub issue content as JSON", ja: "GitHub Issue の内容を JSON で取得" } },
    },
  },
  set: {
    script: "flow/set.js",
    desc: { en: "Update flow state (step, req, note, metric, ...)", ja: "フロー状態を更新（step, req, note, metric, ...）" },
    keys: {
      step:    { script: "flow/set/step.js",    desc: { en: "Update step status", ja: "ステップ状態を更新" } },
      request: { script: "flow/set/request.js", desc: { en: "Set user request", ja: "ユーザーリクエストを設定" } },
      issue:   { script: "flow/set/issue.js",   desc: { en: "Set GitHub issue number", ja: "GitHub Issue 番号を設定" } },
      note:    { script: "flow/set/note.js",     desc: { en: "Append a note", ja: "メモを追記" } },
      summary: { script: "flow/set/summary.js", desc: { en: "Set requirements list", ja: "要件リストを設定" } },
      req:     { script: "flow/set/req.js",     desc: { en: "Update requirement status", ja: "要件ステータスを更新" } },
      metric:  { script: "flow/set/metric.js",  desc: { en: "Increment a metric counter", ja: "メトリクスカウンターをインクリメント" } },
      redo:    { script: "flow/set/redo.js",    desc: { en: "Record a redo entry", ja: "redo エントリーを記録" } },
    },
  },
  run: {
    script: "flow/run.js",
    desc: { en: "Execute flow actions (prepare-spec, gate, finalize, ...)", ja: "フローアクションを実行（prepare-spec, gate, finalize, ...）" },
    keys: {
      "prepare-spec":  { script: "flow/run/prepare-spec.js",  desc: { en: "Create branch/worktree and initialize spec", ja: "ブランチ/worktree 作成 + spec 初期化" } },
      gate:            { script: "flow/run/gate.js",           desc: { en: "Run spec gate check", ja: "spec ゲートチェックを実行" } },
      review:          { script: "flow/run/review.js",         desc: { en: "Run AI code quality review", ja: "AI コードレビューを実行" } },
      "impl-confirm":  { script: "flow/run/impl-confirm.js",  desc: { en: "Confirm implementation readiness", ja: "実装準備を確認" } },
      finalize:        { script: "flow/run/finalize.js",       desc: { en: "Execute finalization pipeline", ja: "ファイナライズパイプラインを実行" } },
      sync:            { script: "flow/run/sync.js",           desc: { en: "Sync documentation", ja: "ドキュメントを同期" } },
    },
  },
};
