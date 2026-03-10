# Feature Specification: 037-fix-review-false-positives

**Feature Branch**: `feature/037-fix-review-false-positives`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User request

## Goal
- `review` コマンドが説明用の `{{data}}` サンプル文字列を未埋めディレクティブとして誤検知しないようにする。
- analysis coverage 警告でメタ情報をカテゴリ扱いしないようにし、警告ノイズを減らす。

## Scope
- `src/docs/commands/review.js` の未埋め `{{data}}` 判定ロジックの修正
- `src/docs/commands/review.js` の analysis coverage 用メタキー定義の修正
- 上記に対応するテストの追加または更新

## Out of Scope
- `review` の全体設計変更
- `docs/` 本文の内容修正
- `build` パイプラインへの `review` 組み込み

## Clarifications (Q&A)
- Q: 今回の修正対象は docs 本文ではなく `review` ロジック側でよいか。
  - A: はい。`review` 側の誤検知を修正する。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-10
- Notes: Fix review false positives in directive detection and analysis coverage warnings.

## Requirements
- `review` は本文中の説明用 `{{data}}` サンプル文字列を未埋めディレクティブとして FAIL 扱いしてはならない。
- 未埋め `{{data}}` 判定は、コメントベースの `{{data}}` ブロック構造に対して行う。
- analysis coverage 警告では `enrichedAt` をカテゴリ扱いしてはならない。
- 既存の `review` の基本検査機能は維持する。

## Acceptance Criteria
- `docs/04_internal_design.md` に含まれる `{{data}}` サンプル文字列だけを理由に `review` が FAIL しない。
- `.sdd-forge/output/analysis.json` に `enrichedAt` が存在しても `uncovered analysis category: enrichedAt` 警告が出ない。
- 関連テストが追加または更新され、修正内容を検証できる。

## Open Questions
- なし
