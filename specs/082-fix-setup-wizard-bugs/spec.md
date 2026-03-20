# Feature Specification: 082-fix-setup-wizard-bugs

**Feature Branch**: `feature/082-fix-setup-wizard-bugs`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User request
**GitHub Issue**: #6

## Goal
setup wizard の2つのバグを修正する:
1. projectName が config.json に保存・復元されない
2. 既存 config から復元したプリセットデフォルトで、ツリーの祖先ノードが選択されない

## Scope
- `src/setup.js`: config.json への `name` フィールドの書き込みと `loadExistingDefaults()` での読み込み
- `src/lib/multi-select.js`: デフォルト適用時の `autoSelectAncestors` 対応
- `src/lib/types.js`: `SddConfig` 型定義に `name` フィールド追加（省略可）
- 既存テストの修正（必要な場合）

## Out of Scope
- `name` を docs 生成パイプラインで使用する機能追加（現在は `project.js` が `package.json` から取得）
- multi-select の UI/UX 改善
- setup wizard のその他の改善

## Clarifications (Q&A)
- Q: `name` は config スキーマの必須フィールドか？
  - A: 省略可（optional）。既存の config.json との互換性を維持するため。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-20
- Notes: 実装承認済み

## Requirements

Priority order: R1 > R3 > R2 > R4 (R1: config 書き込みが基盤、R3: 独立バグ修正、R2: R1 依存の読み込み、R4: 最終検証)

1. When setup wizard が config.json を書き込むとき、shall `config.name = settings.projectName` を設定する。`types.js` の `SddConfig` JSDoc にも `@property {string} [name]` を追加する（省略可、バリデーション不要）
2. When `loadExistingDefaults()` が既存 config.json を読み込むとき、shall `name` フィールドを読み取り wizard のデフォルト `projectName` として返す
3. When `select()` が multi モードでデフォルトを適用するとき、if `opts.autoSelectAncestors` が `true` なら、shall 各デフォルトキーに対して `selectAncestors()` を呼び祖先ノードも `selected` に追加する
4. When 全修正完了後、shall 既存テストがすべて通る

## Acceptance Criteria
1. `sdd-forge setup` で入力した projectName が `.sdd-forge/config.json` に `name` フィールドとして保存される
2. 再度 `sdd-forge setup` を実行したとき、保存した `name` がデフォルト値として入力欄にプリフィルされる
3. config.json に `type: "cakephp2"` がある状態で `sdd-forge setup` を実行すると、プリセットツリーで `cakephp2` とその祖先（`php`, `webapp` 等）にチェックが入っている
4. `name` フィールドが config.json に存在しなくてもバリデーションエラーにならない

## Open Questions
- (なし)
