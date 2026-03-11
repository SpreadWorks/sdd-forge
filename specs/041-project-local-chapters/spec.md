# Feature Specification: 041-project-local-chapters

**Feature Branch**: `feature/041-project-local-chapters`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User request

## Goal
`.sdd-forge/config.json` に `chapters` 配列を追加し、プロジェクト固有の章構成（追加・削除・順序変更）を実現する。プリセットの `chapters` を完全に上書きする。

## Scope
- `.sdd-forge/config.json` に `chapters` フィールドを追加
- `resolveChaptersOrder()` が config の `chapters` を最優先で使用
- `.sdd-forge/templates/{lang}/docs/` に配置したカスタム章ファイルが `init` で認識・生成される
- カスタム章でも `{{data}}` / `{{text}}` ディレクティブが使用可能
- AI 章フィルタリングとの統合ルール:
  - `config.json` の `chapters` が定義されている場合、それが唯一の真実（AI フィルタ結果は無視）
  - `config.json` の `chapters` が未定義の場合、従来通りプリセット + AI フィルタリング

## Out of Scope
- `.sdd-forge/data/` カスタムデータソース
- `.sdd-forge/scan/` カスタムスキャナー
- `preset.json` の `chapters` フォーマット変更

## Clarifications (Q&A)
- Q: 章の順序はどう指定する？
  - A: `.sdd-forge/config.json` の `chapters` 配列で定義する
- Q: プリセットの `chapters` との関係は？
  - A: 完全上書き。config に `chapters` があればプリセットの `chapters` は無視される
- Q: config の `chapters` にプリセット章を含めなかった場合は？
  - A: その章は生成されない（ユーザーが取捨選択可能）
- Q: `init` 以外のコマンド（data, text, forge, review 等）への影響は？
  - A: カスタム章もプリセット章と同等に扱う（ディレクティブ利用可能）
- Q: AI フィルタリングと config.chapters の優先関係は？
  - A: 以下のルール:
    - AI:あり + ユーザー明示:あり → ドキュメント生成する、章リスト表示する
    - AI:なし + ユーザー明示:あり → ドキュメント生成する、章リスト表示する
    - AI:あり + ユーザー明示:なし → ドキュメント生成しない、章リスト表示しない

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-11
- Notes: 要件整理完了、実装承認

## Requirements
1. `.sdd-forge/config.json` に `chapters` フィールド（`string[]`）を追加
   - 例: `["overview.md", "api_reference.md", "development.md"]`
2. `resolveChaptersOrder()` を修正: config の `chapters` が存在すれば、プリセットの `chapters` より優先
3. `init.js` の AI 章フィルタリングロジック修正:
   - config `chapters` 定義時: config の章リストをそのまま使用（AI フィルタ無視）
   - config `chapters` 未定義時: 従来通り
4. `.sdd-forge/templates/{lang}/docs/` のカスタム章ファイルがテンプレート解決で正しく認識される
5. カスタム章でも `{{data}}` / `{{text}}` ディレクティブが動作する
6. config `chapters` 指定時の AI フィルタリングルールをコード内にコメントとして記述

## Acceptance Criteria
- [ ] `config.json` に `chapters` を設定すると、その順序で `docs/` に章ファイルが生成される
- [ ] プリセットにない新しい章ファイルを `.sdd-forge/templates/` に追加し、`init` で `docs/` に反映される
- [ ] カスタム章の `{{data}}` / `{{text}}` ディレクティブが `data` / `text` コマンドで処理される
- [ ] `config.json` に `chapters` がない場合は従来通りの動作（後方互換）
- [ ] AI フィルタリングルールが正しく適用される（コメント付き）
- [ ] 既存テストが壊れない

## Open Questions
(なし)
