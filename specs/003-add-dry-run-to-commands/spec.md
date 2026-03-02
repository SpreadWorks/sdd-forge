# Feature Specification: 003-add-dry-run-to-commands

**Feature Branch**: `feature/003-add-dry-run-to-commands`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User request

## Goal
ファイル書き込みを行う全コマンドに `--dry-run` オプションを追加し、実行結果のプレビューのみを行えるようにする。テスト時にファイルを書き換えず安全に検証できるようにする。

## Scope

### Priority 1: forge.js
- `--dry-run` フラグ追加
- dry-run 時はファイル書き込みをスキップ
- dry-run 時は review サブプロセスをスキップ
- dry-run 時はラウンド数を 1 回に制限
- 変更内容を stdout に出力

### Priority 2: flow.js
- `--dry-run` フラグ追加
- サブコマンド（scan, init, data, text, readme, forge, review）に `--dry-run` を伝搬

### Priority 3: その他のコマンド
- `scan.js` — `--stdout` は既存だが `--dry-run` エイリアス追加
- `docs/commands/init.js` — `--dry-run` でテンプレート書き込みスキップ
- `changelog.js` — `--dry-run` でファイル書き込みスキップ
- `setup.js` — `--dry-run` で設定ファイル書き込みスキップ
- `agents.js` — `--dry-run` で AGENTS.md 書き込みスキップ

### 既存対応済み（変更不要）
- `data.js` — `--dry-run` 対応済み
- `text.js` — `--dry-run` 対応済み
- `readme.js` — `--dry-run` 対応済み
- `specs/commands/init.js` — `--dry-run` 対応済み

## Out of Scope
- review.js（読み取り専用のため不要）
- gate.js（読み取り専用のため不要）
- help.js（読み取り専用のため不要）

## Clarifications (Q&A)
- Q: forge.js の dry-run ではエージェント呼び出しも行うか？
  - A: いいえ。dry-run 時はエージェント呼び出しをスキップし、@text の解決は行わない。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-02
- Notes: ユーザーが仕様要約を確認し承認

## Requirements
- 全ファイル書き込みコマンドで `--dry-run` 時にファイルシステムへの書き込みが発生しないこと
- dry-run 時は変更対象・変更内容の概要を stderr または stdout に出力すること
- 既存の `--dry-run` / `--stdout` オプションとの一貫性を保つこと
- forge.js の dry-run では review ループに入らないこと
- flow.js の dry-run では全サブコマンドに dry-run が伝搬されること

## Acceptance Criteria
- forge.js に `--dry-run` を渡すとファイル書き込みなし、review スキップ、1 ラウンドで終了
- flow.js に `--dry-run` を渡すと全サブコマンドが dry-run モードで実行
- scan.js の `--dry-run` が `--stdout` と同等に動作
- docs/commands/init.js に `--dry-run` を渡すとテンプレート書き込みなし
- changelog.js に `--dry-run` を渡すとファイル書き込みなし
- setup.js に `--dry-run` を渡すと設定ファイル書き込みなし
- agents.js に `--dry-run` を渡すと AGENTS.md 書き込みなし
- 既存テスト（179件）が全て通ること
- 新規テストで dry-run 動作を検証

## Open Questions
（なし）
