# Feature Specification: 040-remove-chapter-prefix

**Feature Branch**: `feature/040-remove-chapter-prefix`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User request

## Goal
- docs 章ファイルの `NN_` 番号プレフィックスを廃止し、`preset.json` の `chapters` 配列で順序を管理する

## Scope
- `init.js` のプレフィックス付与ロジックを削除（`overview.md` として出力）
- `getChapterFiles()` を `chapters` 配列ベースの探索に変更
- `review.js` の章ファイル探索を更新
- `review-parser.js` のプレフィックス除去ロジックを簡素化
- `forge.js` の章名抽出ロジックを更新
- sdd-forge 自身の `docs/` ファイルをリネーム（`01_overview.md` → `overview.md` 等）

## Out of Scope
- `preset.json` の `chapters` 定義変更
- テンプレートファイル名の変更（既にプレフィックスなし）
- `.sdd-forge/templates` からの章追加機能（将来の機能）

## Clarifications (Q&A)
- Q: chapters を持たないプリセット（cakephp2, laravel, symfony）はどうするか？
  - A: 親アーキ層（webapp）の chapters を継承するので問題ない。getChapterFiles は preset の chapters を参照する
- Q: chapters 配列に存在しない .md ファイルが docs/ にある場合は？
  - A: 無視する（chapters に定義されたファイルのみを対象とする）
- Q: getChapterFiles が preset 情報を必要とするが、review 等では config なしで動く場合がある
  - A: config がない場合は docs/ 内の全 .md ファイルをアルファベット順でフォールバック

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-11
- Notes:

## Requirements

### R1: `init.js` — プレフィックス付与の削除
- `numberedChapters` のプレフィックス付与ロジックを削除
- テンプレートの `fileName` をそのまま `outputName` として使用

### R2: `getChapterFiles()` — chapters 配列ベースの探索
- config から `type` を取得し、対応する preset の `chapters` 配列を参照
- `chapters` に定義されたファイルのうち、実際に存在するものを順序通りに返す
- config が取得できない場合は docs/ 内の `*.md` をアルファベット順で返す（フォールバック）
- `README.md` と `AGENTS.sdd.md` は除外

### R3: `review.js` — コメント・ログの更新
- `NN_*.md` への言及を更新

### R4: `forge.js` — 章名抽出の簡素化
- `"docs/01_overview.md" → "overview"` のプレフィックス除去ロジックを削除
- `"docs/overview.md" → "overview"` にシンプル化

### R5: `review-parser.js` — プレフィックス除去の簡素化
- `replace(/^\d+_/, "")` のフォールバックは残す（古い形式の docs との互換）

### R6: sdd-forge 自身の docs リネーム
- `docs/ja/01_overview.md` → `docs/ja/overview.md` 等

## Acceptance Criteria
- [ ] `sdd-forge init` がプレフィックスなしのファイルを生成する
- [ ] `getChapterFiles()` が preset の chapters 順でファイルを返す
- [ ] `sdd-forge review` がプレフィックスなしの章ファイルで動作する
- [ ] `sdd-forge data` / `text` / `forge` がプレフィックスなしで動作する
- [ ] 既存テストが通る（テスト内の `NN_` パターンも更新）
- [ ] sdd-forge 自身の docs がリネーム済み

## Open Questions
- (none)
