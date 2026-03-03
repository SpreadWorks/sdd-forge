# Feature Specification: 006-forge-parallel-system-prompt

**Feature Branch**: `feature/006-forge-parallel-system-prompt`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User request

## Goal
forge の agent モードを1ファイルずつ非同期処理に変更し、system prompt 分離によるキャッシュ活用で効率化する。

## Scope
- forge の agent 呼び出しを全ファイル一括 → 1ファイルずつに変更
- 非同期実行（同時実行数制御付き）
- system prompt 分離: 共通部分を system prompt に、ファイル固有部分を user prompt に
- provider 設定に `systemPromptFlag` を追加（オプショナル）
- codex の `--system-prompt-file` 対応（一時ファイル経由）
- 処理済みファイルのスキップ（レジューム対応）
- NEEDS_INPUT ルールをプロンプトから削除

## Out of Scope
- review ループの変更（既存のまま）
- local / assist モードの変更
- provider 設定の大幅な再設計

## Clarifications (Q&A)
- Q: タイムアウトはファイル単位で何秒？
  - A: デフォルト 300 秒（5分）。config.json の limits.designTimeoutMs で上書き可能。
- Q: 非同期の同時実行数は？
  - A: デフォルト 3。config.json の limits.concurrency で設定可能。
- Q: systemPromptFlag がない provider はどうなる？
  - A: 従来通り PROMPT に全部まとめる（後方互換）。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-03
- Notes: ユーザーが「はい」で承認

## Requirements
- `buildForgePrompt` を system prompt + user prompt に分離する
- `runAgent` が system prompt を受け取れるようにする（systemPromptFlag ベース）
- codex の `--system-prompt-file` は一時ファイルに書き出して渡す
- ファイル単位の処理結果を即座に保存する
- 処理済みファイルをスキップするレジューム機構
- 非同期実行の同時実行数制御（Promise ベースのセマフォ）

## Acceptance Criteria
- forge --mode=agent で1ファイルずつ非同期に処理される
- systemPromptFlag 設定時、system prompt が分離して渡される
- systemPromptFlag 未設定時、従来通り動作する（後方互換）
- 途中で中断しても処理済みファイルは保存されている
- npm run test が全 pass

## Open Questions
- (none)
