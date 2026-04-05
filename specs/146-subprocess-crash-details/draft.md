# Draft: subprocess-crash-details

**Goal:** サブプロセスがシグナルで kill された場合（OOM、タイムアウト等）に、原因を特定できるよう `runCmd` / `runCmdAsync` の返り値に `signal` / `killed` を追加し、エラーメッセージに統一的に反映する。

**Development type:** Enhancement（既存機能の改善）

## Background

Issue #83 で spec review サブプロセスが OOM で kill されたが、エラーメッセージには stderr のみが含まれ、クラッシュの根本原因（シグナル名、killed フラグ）が失われていた。

## Q&A

### Q1: 変更対象の範囲は？
**A**: `runCmd` と `runCmdAsync`（`src/lib/process.js`）の返り値に `signal` / `killed` フィールドを追加する。`callAgent`（同期版）は対象外。

### Q2: エラーメッセージへの反映方法は？
**A**: `process.js` にヘルパー関数 `formatError(res)` を追加し、呼び出し元で統一的に使用する。

### Q3: formatError の出力スタイルは？
**A**: パイプ区切り（`callAgentAsync` と同じスタイル）。例:
- `signal=SIGKILL (killed) | exit=137 | stderr の内容`
- `signal=SIGTERM | exit=null | stderr の内容`
- `exit=1 | stderr の内容`

### Q4: formatError を適用する箇所の範囲は？
**A**: `runCmd` で `ok === false` のエラーメッセージを出す箇所を全て変更する。

### Q5: issue-log への対応は？
**A**: スコープ外。`formatError` で改善されたエラーメッセージが自然に `--reason` テキストに含まれる。

## Scope

### In Scope
- `runCmd` の返り値に `signal` / `killed` フィールドを追加
- `runCmdAsync` の返り値に `signal` / `killed` フィールドを追加
- `formatError(res)` ヘルパー関数の追加（`process.js`）
- `runCmd` / `runCmdAsync` の `ok === false` 時にエラーメッセージを出す全箇所で `formatError` を使用

### Out of Scope
- `callAgent`（同期版）のエラーハンドリング改善
- issue-log のスキーマ変更
- `callAgentAsync` の変更（既に signal 情報を含めている）

## Impact on Existing

- `runCmd` / `runCmdAsync` の返り値にフィールドが追加されるだけで、既存フィールド（`ok`, `status`, `stdout`, `stderr`）は変わらない
- エラーメッセージの内容が変わる（情報が増える）ため、エラーメッセージの文字列に依存するテストがあれば影響を受ける

## Constraints

- 外部依存なし（Node.js 組み込みのみ）
- alpha 版ポリシー: 後方互換は不要

## User Confirmation

- [x] User approved this draft
- Date: 2026-04-04
