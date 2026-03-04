# Feature Specification: 008-genericscan

**Feature Branch**: `feature/008-genericscan`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User request

## Goal
`genericScan` がハードコードしている4カテゴリ（controllers/models/shells/routes）を動的ディスパッチに変更し、`scanCfg` のキーを自動的にスキャンできるようにする。これにより `SCAN_DEFAULTS` の `node-cli`/`cli` に定義された `modules` カテゴリが実際に機能するようになる。

## Scope

### 1. genericScan の動的ディスパッチ化（scanner.js）
現在の `if (scanCfg.controllers) { ... }` × 4 のハードコードを、カテゴリハンドラのレジストリ + 動的ループに変更する。

```
const CATEGORY_HANDLERS = {
  controllers: analyzeControllers,
  models:      analyzeModels,
  shells:      analyzeShells,
  routes:      analyzeRoutes,
};
```

`genericScan` は `scanCfg` のキーをイテレートし:
- `CATEGORY_HANDLERS` にハンドラがあればそれを呼ぶ（既存のカテゴリ固有解析）
- ハンドラがなければ `analyzeGenericCategory` を呼ぶ（汎用解析）
- `extras` は常に最後に実行（現行通り）

### 2. 汎用カテゴリアナライザの追加（scanner.js）
`analyzeGenericCategory(sourceRoot, categoryKey, categoryCfg)` を新設する。

- `categoryCfg` は `{ dir, pattern, exclude?, subDirs?, lang? }` の形式（既存カテゴリと同じ構造）
- `findFiles` でファイル一覧を取得
- `parseFile` でファイル内容を解析
- 出力形式は汎用:

```json
{
  "<categoryKey>": [
    { "file": "src/foo.js", "className": "foo", "methods": [...] }
  ],
  "summary": { "total": N, "totalMethods": M }
}
```

### 3. buildSummary の動的化（scan.js）
`buildSummary` も同様にハードコードされた4カテゴリを動的に処理する。

- 既知カテゴリ（controllers/models/shells/routes）は既存のサマリー構築ロジックを維持
- 未知カテゴリは `summary` フィールドをそのまま採用 + `items` の先頭 N 件を含める
- `extras` / `files` は現行通り

### 4. genericScan のログ出力の汎用化
現在のカテゴリ固有のログメッセージ（`controllers: 5 files, 20 actions` 等）を、動的に出力する形に変更する。各カテゴリの `summary` オブジェクトから `total` を読み取ってログ出力する。

## Out of Scope
- resolver / data.js / init.js の `modules` カテゴリ対応（別 spec）
- preset スキャナの変更（既存の `SCAN_DEFAULTS` は変更しない）
- 新しいプリセットの追加
- analysis.json のスキーマ定義

## Clarifications (Q&A)
- Q: 既存の analyzeControllers 等の関数シグネチャは変わるか？
  - A: 変わらない。`(sourceRoot, scanCfg)` のまま。CATEGORY_HANDLERS から呼び出される形に変わるだけ
- Q: extras キーが scanCfg に入っていた場合はどうなるか？
  - A: `extras` はカテゴリとして扱わない。`genericScan` のループ対象から除外し、従来通り最後に `analyzeExtras` を呼ぶ
- Q: analyzeGenericCategory の出力が既存カテゴリの出力と互換でない場合は？
  - A: 汎用カテゴリの出力形式は独自（上記 Scope 2 参照）。resolver 側での対応は別 spec

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-04
- Notes:

## Requirements
1. `genericScan` が `scanCfg` のキーを動的にイテレートし、ハンドラが未登録のカテゴリも解析すること
2. `SCAN_DEFAULTS` の `node-cli`/`cli` の `modules` カテゴリが実際にスキャンされること
3. `buildSummary` が未知カテゴリのサマリーも生成すること
4. 既存の4カテゴリ（controllers/models/shells/routes）の出力が変わらないこと
5. 既存テストが全て通ること

## Acceptance Criteria
- [x] `genericScan` にカテゴリハンドラレジストリがあり、動的ディスパッチしている
- [x] `analyzeGenericCategory` が存在し、汎用カテゴリを解析できる
- [x] type=cli で scan を実行すると `modules` カテゴリが analysis.json に含まれる
- [x] `buildSummary` が `modules` 等の未知カテゴリも summary.json に含める
- [x] type=php-mvc (webapp/cakephp2) の出力が変わらない
- [x] 既存テスト + 新規テストが全て通る (290 tests)

## Open Questions
- (なし)
