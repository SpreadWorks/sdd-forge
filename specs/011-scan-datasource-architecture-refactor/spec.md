# Feature Specification: 011-scan-datasource-architecture-refactor

**Feature Branch**: `feature/011-scan-datasource-architecture-refactor`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User request

## Goal
scan パイプラインと DataSource アーキテクチャを統合し、親子 preset 継承を導入する。
scanner.js のハードコード CATEGORY_HANDLERS と extras.js を廃止し、
DataSource（resolve 専用）+ ScanSource（scan 専用）の 2 基底クラスで統一する。

## Scope

### 1. 基底クラスの整理
- `DataSource` (data-source.js): resolve 専用。`scan()` を削除。`toMarkdownTable()` にパイプエスケープ追加。
- `ScanSource` (scan-source.js 新規): scan 専用基底クラス。
- `Scannable` ミックスイン: 1 ファイルで scan + resolve を持たせるための合成関数。

### 2. export 方式の変更
- 全 DataSource ファイルの `export default new XxxSource()` を `export default class XxxSource` に変更。
- `resolver-factory.js` で `new Source()` してインスタンス化。
- scan パイプライン側も同様にクラスを import → new でインスタンス化。

### 3. 親 preset の導入
- `src/presets/webapp/data/` を新設。scanner.js の汎用ハンドラ (analyzeControllers, analyzeModels, analyzeShells, analyzeRoutes) をここに移動。
- `src/presets/cli/data/` を新設。scanner.js の analyzeGenericCategory をここに移動。
- 各親 DataSource は `Scannable(DataSource)` を extends し、scan + resolve の両方を持つ。

### 4. 子 preset の継承
- cakephp2/laravel/symfony の data/*.js を親 webapp クラスの extends に変更。
- node-cli の data/ を親 cli クラスの extends に変更（必要な場合）。
- 子 preset は scan() を override して FW 固有の解析を追加。

### 5. scan パイプラインの書き換え
- `scan.js`: DataSource クラスをロード → scan() を呼び出す方式に変更。
- `scanner.js`: CATEGORY_HANDLERS と analyzeControllers/Models/Shells/Routes を削除。汎用ユーティリティ (findFiles, parseFile 等) のみ残すか、webapp/data/ に移動。
- `extras.js` (全 preset): 各 DataSource.scan() に分散し、extras.js を削除。

### 6. scan/ ファイルの整理
- scan/ のロジックを data/*.js の scan() メソッドにインライン化。
- インライン化完了後、不要な scan/ ファイルを削除。
- scanner.js の汎用パーサ (parsePHPFile, parseJSFile, findFiles 等) は共有ライブラリとして残す。

## Out of Scope
- テンプレート階層の変更（既に base/webapp/cli で階層化済み）
- 新しい preset の追加
- scan 出力 (analysis.json) のスキーマ変更（既存互換を維持）
- EN ロケール対応

## Clarifications (Q&A)
- Q: scanner.js の汎用パーサ (parsePHPFile, parseJSFile, findFiles) はどこに置くか？
  - A: `src/docs/lib/scanner.js` に汎用ユーティリティとして残す。CATEGORY_HANDLERS と analyze* 関数のみ削除。
- Q: analysis.json の出力形式は変わるか？
  - A: 変わらない。DataSource.scan() が同じ形式を返す。
- Q: node-cli preset には scan/ がないが対応するか？
  - A: cli/data/modules.js を作成し、scanner.js の analyzeGenericCategory を移動。node-cli は必要に応じて extends。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-05
- Notes: tables.js は webapp/data/ に共通実装を置き、各 preset も必要に応じて override する方針

## Requirements
1. `DataSource` から `scan()` メソッドを削除し、resolve 専用にする
2. `ScanSource` 基底クラスを新設する
3. `Scannable(DataSource)` ミックスインで scan + resolve を 1 クラスに合成できる
4. 全 DataSource の export をクラス export に変更する
5. `resolver-factory.js` でクラスを `new` してインスタンス化する
6. `src/presets/webapp/data/` に共通 scan + resolve モジュールを作成する
7. `src/presets/cli/data/` に共通 scan + resolve モジュールを作成する
8. 子 preset (cakephp2, laravel, symfony) が親を extends する
9. `scanner.js` から CATEGORY_HANDLERS と analyze* 関数を削除する
10. `extras.js` を全 preset で廃止し、各 DataSource.scan() に分散する
11. scan/ ファイルを data/*.js にインライン化し、不要になった scan/ ファイルを削除する
12. `toMarkdownTable()` でセル内のパイプ文字をエスケープする
13. analysis.json の出力形式を維持する（既存互換）
14. 全テスト PASS

## Acceptance Criteria
- `DataSource` クラスに `scan()` メソッドがない
- `ScanSource` 基底クラスが存在する
- `Scannable` ミックスインで scan + resolve を合成できる
- 全 DataSource が `export default class` でクラスを export している
- `src/presets/webapp/data/` に controllers, models, shells, routes, tables の共通モジュールがある
- `src/presets/cli/data/` に modules の共通モジュールがある
- 子 preset が親を extends している
- `scanner.js` に CATEGORY_HANDLERS がない
- `extras.js` が全 preset から削除されている
- 不要な scan/ ファイルが削除されている
- `toMarkdownTable()` がパイプ文字をエスケープする
- `sdd-forge scan` が既存と同じ analysis.json を出力する
- `sdd-forge data` が既存と同じ Markdown を出力する
- 全テスト PASS

## Open Questions
- [x] webapp/data/ に tables.js を共通で置き、各 preset も必要に応じて override する
