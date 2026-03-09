# Feature Specification: 027-block-text-directive

**Feature Branch**: `feature/027-block-text-directive`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User request

## Goal
`{{text}}` ディレクティブを `{{data}}` と同様のブロック構造（開始タグ + 内容 + 終了タグ）に変更し、AI 生成領域の範囲を明確にする。

## Scope
- `<!-- {{text: ...}} -->` 〜 `<!-- {{/text}} -->` のブロック構文を導入
- `directive-parser.js`: ブロック `{{text}}` の解析対応（`endLine` を持つ）
- `text.js`: ブロック `{{text}}` の書き込み・strip 処理を終了タグベースに変更
- `review.js`: 既存の未埋めチェックをブロック構造に対応させる
- テンプレートファイル（`src/presets/` 配下、`.sdd-forge/templates/`）を新構文に変換
- 後方互換: 終了タグのない旧形式も引き続き動作する（ヒューリスティック判定にフォールバック）

## Out of Scope
- `{{data}}` ディレクティブの変更
- `{{text}}` のインライン形式（1行内に開始・終了タグ）の導入
- AI プロンプト生成ロジックの変更

## Clarifications (Q&A)
- Q: 旧形式（終了タグなし）のテンプレートはサポートし続けるか？
  - A: alpha 版ポリシーに従い、旧形式のサポートは不要。全テンプレートを新形式に変換する。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-09
- Notes: Approved as-is

## Requirements
1. `directive-parser.js` に `ENDTEXT_RE` (`<!-- {{/text}} -->`) を追加する
2. `parseDirectives()` で `{{text}}` ディレクティブに `endLine` プロパティを追加する（`{{data}}` と同じ方式）
3. `text.js` の `stripFillContent()` を終了タグベースに変更する
4. `text.js` の `findGeneratedBlockEnd()` / `shouldStopGeneratedBlock()` を終了タグベースに変更する
5. `text.js` のバッチ結果書き込み処理を終了タグベースに変更する
6. `review.js` の未埋めチェックをブロック構造に対応させる
7. `src/presets/` 配下の全テンプレートを新構文に変換する
8. `.sdd-forge/templates/` 配下のプロジェクトローカルテンプレートを新構文に変換する
9. 既存テスト（`directive-parser.test.js` 等）を新構文に対応させる

## Acceptance Criteria
- [x] `<!-- {{text: ...}} -->` と `<!-- {{/text}} -->` の間のコンテンツが AI 生成領域として正しく認識される
- [x] `sdd-forge text` が新形式で正しくコンテンツを書き込む（終了タグの前に挿入）
- [x] `sdd-forge text` が既存コンテンツを正しく strip して再生成できる
- [x] `sdd-forge review` が新形式の未埋めチェックを正しく行う
- [x] 全テンプレートが新構文に変換されている
- [x] 344 件以上のテストがパスする（348件パス）

## Open Questions
（なし）
