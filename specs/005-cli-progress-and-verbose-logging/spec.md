# Feature Specification: 005-cli-progress-and-verbose-logging

**Feature Branch**: `feature/005-cli-progress-and-verbose-logging`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User request

## Goal
- CLI 実行時のログ出力を改善する
  - デフォルト: プログレスバー（固定ヘッダー）＋ 簡潔なログ表示
  - `--verbose`: 従来どおりの詳細ログ出力
- ログのプレフィックス（`[populate]`, `[tfill]` 等）をコマンド名（`[data]`, `[text]` 等）に統一する

## Scope
- `src/lib/progress.js` — 新規。プログレスバーとロガーの共通モジュール
- `src/docs/commands/scan.js` — ログプレフィックスを `[scan]` に統一、progress 連携
- `src/docs/commands/init.js` — ログプレフィックスを `[init]` に統一、progress 連携
- `src/docs/commands/data.js` — `[populate]` → `[data]` に変更、progress 連携
- `src/docs/commands/text.js` — `[tfill]` → `[text]` に変更、progress 連携
- `src/docs/commands/readme.js` — progress 連携
- `src/docs/commands/forge.js` — progress 連携
- `src/docs.js` — `build` パイプラインで progress 制御（ステップ進行の管理）
- 各コマンドの `parseArgs` に `--verbose` フラグを追加

## Out of Scope
- `setup`, `gate`, `flow` など build パイプライン外のコマンド
- CI/パイプ出力時の自動検出（将来対応）

## Additional Fix
- `src/specs/commands/init.js` — base branch のデフォルトが `master` 固定で `main` リポジトリで失敗する。`main` → `master` の順でフォールバックするよう修正

## Clarifications (Q&A)
- Q: プログレスバーのデザインは？
  - A: `[n/N] ████░░░░░░ nn%  step-name` を1行目に固定表示。その下にログが流れる。
- Q: TTY でない場合（パイプやリダイレクト時）はどうする？
  - A: `process.stderr.isTTY` が false の場合はプログレスバーを無効にし、`--verbose` 相当のプレーンログにフォールバックする。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-03
- Notes: Also fix spec init base branch auto-detection (master→main fallback)

## Requirements
1. **progress.js モジュール**
   - `createProgress(steps, { verbose })` ファクトリ関数を提供
   - `steps`: `{ label, weight }[]` 形式のステップ定義
   - `progress.start(stepLabel)` — ヘッダーを更新し新ステップを開始
   - `progress.log(message)` — ヘッダー下にログ行を出力（verbose 時のみ、または常に簡潔版）
   - `progress.verbose(message)` — `--verbose` 時のみ出力
   - `progress.done()` — 100% 表示で完了
   - non-TTY 時はエスケープシーケンスを使わずプレーンテキストで出力

2. **ログプレフィックス統一**
   - `[populate]` → `[data]`
   - `[tfill]` → `[text]`
   - `[analyze]` → `[scan]`
   - その他のコマンドも `[コマンド名]` に統一

3. **--verbose フラグ**
   - `build` コマンド経由: `sdd-forge build --verbose`
   - 各サブコマンド直接実行時: `sdd-forge data --verbose` 等
   - `build` 時は子コマンドに `--verbose` を伝播

4. **build パイプライン連携**
   - `docs.js` の `build` で `createProgress()` を生成
   - 各ステップ（scan → init → data → text → readme）の開始・終了を通知
   - 単独コマンド実行時はプログレスバーなし（`--verbose` 相当の動作）

## Acceptance Criteria
- `sdd-forge build` 実行時にプログレスバーが1行目に固定表示され、下にログが流れる
- `sdd-forge build --verbose` 実行時に従来相当の詳細ログが出力される
- `sdd-forge build 2>/dev/null` でプログレスバーもログも表示されない（stderr のみ使用）
- ログプレフィックスが全コマンドで `[コマンド名]` に統一されている
- 既存テスト（224件）がすべて通過する
- パイプ出力時（non-TTY）にエスケープシーケンスが出力されない

## Open Questions
- (none)
