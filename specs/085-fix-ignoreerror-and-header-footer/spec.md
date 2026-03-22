# Feature Specification: 085-fix-ignoreerror-and-header-footer

**Feature Branch**: `feature/085-fix-ignoreerror-and-header-footer`
**Created**: 2026-03-22
**Status**: Draft
**Input**: GitHub Issue #9

## Goal
Fix the `ignoreError: true` behavior in data directives and implement `header`/`footer` parameters to handle empty sections cleanly in generated documentation.

## Scope
- `src/docs/lib/directive-parser.js` — `resolveDataDirectives()`, `removeDirective()`, `parseOptions()`
- All preset templates under `src/presets/*/templates/`

## Out of Scope
- Changes to `{{text}}` directive handling
- Changes to template inheritance (`{%block%}`, `{%extends%}`)
- New DataSource implementations

## Clarifications (Q&A)
- Q: ignoreError: true で null 時、ディレクティブ間のコンテンツは？
  - A: ディレクティブ行は残し、コンテンツはクリアする
- Q: header/footer + ignoreError で null 時の動作は？
  - A: ディレクティブを残し、コンテンツ（header/footer含む）をクリアする
- Q: header/footer の出力形式は？
  - A: header の値 → データ → footer の値をそのまま出力。余分な改行挿入はしない
- Q: header/footer で複数行を指定できるか？
  - A: quoted string 内の `\n` を改行文字として解釈する

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-22
- Notes: All requirements approved without changes

## Requirements

### P1: ignoreError: true の挙動修正
1. `resolveDataDirectives()` で DataSource が null を返し `ignoreError: true` の場合、ディレクティブの開始行・終了行は保持し、間のコンテンツのみクリアする
2. `onUnresolved` コールバックは呼ばない（UNRESOLVED ログを抑制する）

### P2: header / footer パラメータの実装
3. `parseOptions()` で `header`, `footer` キーをパースする（既存の quoted string パースで対応可能）
4. `parseOptions()` で quoted string 内の `\n` リテラルを改行文字 (`\n`) に変換する
5. `resolveDataDirectives()` でデータが存在する場合、`header + data + footer` を結合して出力する
6. `resolveDataDirectives()` でデータが null かつ `ignoreError: true` の場合、コンテンツをクリアする（header/footer も出力しない）
7. `resolveDataDirectives()` でデータが null かつ `ignoreError` なしの場合、従来通り `onUnresolved` を呼ぶ（header/footer は出力しない）

### P3: テンプレート修正
8. `{{data}}` ディレクティブの直前行に見出し（`#` / `##` / `###` 等）がある場合、その見出しをディレクティブの `header` パラメータに移動し、直前行を削除する。直後行にセパレータ（`---` 等）がある場合も同様に `footer` に移動する
9. `{{data}}` ディレクティブが参照する DataSource メソッドが空配列・null を返しうる場合、`ignoreError: true` を付与して空セクションを防止する

## Acceptance Criteria
- ignoreError: true で null 返却時、出力テキストにディレクティブの開始行・終了行が残っている
- ignoreError: true で null 返却時、ディレクティブ間のコンテンツが空である
- header/footer 指定時にデータが存在すれば、header + data + footer が出力される
- header/footer 指定時にデータが null なら、コンテンツが空である
- `\n` を含む header が改行として出力される
- 全プリセットのテンプレートが修正され、テストが通る

## Open Questions
- (none)
