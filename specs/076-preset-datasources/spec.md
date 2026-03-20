# Feature Specification: 076-preset-datasources

**Feature Branch**: `feature/076-preset-datasources`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User request (I8: テンプレートの text 過多)

## Goal

新プリセット群のテンプレートで `{{text}}` のみになっている箇所のうち、ソースコード解析や enriched analysis から構造データとして抽出可能なものを `{{data}}` ディレクティブに置き換え、対応する DataSource を実装する。

## Why This Approach

- `{{text}}` は AI にトークンを消費させて毎回生成するが、一覧表・構造データは scan/enrich で機械的に抽出できる
- `{{data}}` にすることで生成結果が安定し、再現性が高まる
- 既存の webapp 系プリセット（cakephp2, laravel, symfony）は既に DataSource が充実しており、同等の品質を全プリセットに展開する

## Scope

全プリセットのテンプレートを対象に、以下の `{{text}}` ディレクティブを `{{data}}` に変換する。

### 変換対象の判断基準

- **→ data**: 一覧表、構造データ、設定値など、ソース解析または enrich から機械的に抽出可能なもの
- **→ text のまま**: 説明文、概要、Mermaid 図、設計判断の解説、フロー説明

### プリセット別の変換計画

#### base（親: なし）
- `overview.md`: コンポーネント一覧表、環境差分表
- `project_structure.md`: ディレクトリ構造ツリー、ディレクトリ責務表

#### cli（親: base）
- `commands.md`: コマンド一覧表、グローバルオプション表、終了コード表
- `config.md`: 設定ファイル一覧、設定フィールド表、環境変数一覧

#### node-cli（親: cli）
- `cli_commands.md`: コマンド一覧表、グローバルオプション表、終了コード表
- `configuration.md`: 設定ファイル一覧、設定フィールド表、カスタマイズ項目表、環境変数一覧
- `internal_design.md`: ディレクトリ構造、モジュール一覧表、依存グラフ
- `development_testing.md`: テスト設定、ランタイム要件表

#### library（親: base）
- `public_api.md`: 公開 API 一覧表（エクスポート、関数、クラス）
- `usage.md`: ランタイム要件表

#### webapp（親: base）— 既存 DataSource はそのまま、不足分のみ追加

#### nextjs（親: js-webapp → webapp）
- `pages_routing.md`: ルート構造表、動的ルートパターン表
- `route_handlers.md`: API ルートハンドラ一覧
- `components.md`: Server/Client コンポーネント一覧、共有 UI コンポーネント一覧
- `middleware.md`: ミドルウェアルール表

#### hono（親: js-webapp → webapp）
- `middleware.md`: ミドルウェア一覧表

#### graphql（親: api → base）
- `schema.md`: GraphQL 型一覧、クエリ一覧、ミューテーション一覧

#### rest（親: api → base）
- `endpoints.md`: REST エンドポイント一覧

#### drizzle（親: database → base）
- `database.md`: テーブル定義一覧、リレーション一覧
- `schema.md`: スキーマファイル一覧

#### postgres（親: database → base）— 既存の info() に加え、テーブル一覧

#### workers（親: edge → base）
- `edge_runtime.md`: エントリポイント一覧、ランタイム制約表
- `bindings.md`: バインディング一覧、環境変数/シークレット一覧

#### r2（親: storage → base）
- `storage.md`: バケット一覧、アクセスパターン表

#### edge（親: base）
- `edge_runtime.md`: エントリポイント一覧、ランタイム制約表

#### storage（親: base）
- `storage.md`: バケット/コンテナ一覧

#### api（親: base）
- `api_overview.md`: エラーコード表
- `authentication.md`: ロール/権限表

#### database（親: base）
- `database.md`: テーブル一覧、リレーション一覧

### 実装する DataSource

DataSource は scan ベース（ソース静的解析）または enrich ベース（enriched analysis 参照）をケースバイケースで選択する。

| DataSource 名 | プリセット | 種別 | メソッド |
|---|---|---|---|
| structure | base | enrich | tree(), directories() |
| components | base | enrich | list(), environments() |
| commands | cli | scan/enrich | list(), globalOptions(), exitCodes() |
| config | cli | scan/enrich | files(), schema(), env() |
| modules | node-cli | scan (既存拡張) | structure(), dependencies() |
| exports | library | scan | list() |
| requirements | library | enrich | runtime() |
| routes | nextjs | scan | app(), pages(), dynamic(), handlers() |
| nextjs-components | nextjs | scan/enrich | server(), client(), shared() |
| nextjs-middleware | nextjs | scan | rules() |
| hono-middleware | hono | scan/enrich | list() |
| graphql-schema | graphql | scan | types(), queries(), mutations() |
| endpoints | rest | scan/enrich | list() |
| drizzle-schema | drizzle | scan | tables(), relations(), files() |
| workers-bindings | workers | scan | list(), env() |
| workers-runtime | workers | scan/enrich | entryPoints(), constraints() |
| r2-storage | r2 | scan | buckets(), access() |
| edge-runtime | edge | scan/enrich | entryPoints(), constraints() |
| storage-buckets | storage | enrich | list() |
| api-errors | api | enrich | errors() |
| api-auth | api | enrich | roles() |
| db-schema | database | enrich | tables(), relationships() |

### テンプレート更新

各プリセットの en/ と ja/ の両方のテンプレートを更新する：
- `{{text: ...}}` → `{{data: source.method("Label1|Label2|...")}}` に置き換え
- ラベルは既存テンプレートの言語に合わせる（en テンプレートは英語、ja テンプレートは日本語）

## Out of Scope

- 既存 DataSource（cakephp2, laravel, symfony, webapp の controllers/models/routes/tables 等）の修正
- 新しいプリセットの追加
- scan コマンドの変更（DataSource の match/scan は既存の仕組みに乗る）
- enrich コマンドの変更
- `{{text}}` のまま残すディレクティブ（説明文、概要、Mermaid 図）の改善

## Clarifications (Q&A)

- Q: DataSource の実装方針は？
  - A: scan（静的解析）と enrich（AI 解析結果）を組み合わせる。ケースバイケースで選択
- Q: 判断基準は？
  - A: 一覧表・構造データ → data、説明文・図・フロー → text
- Q: スコープは？
  - A: 全プリセットを1つの spec で扱う

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-19
- Notes: 全プリセット対象、scan/enrich 併用方針で承認

## Requirements

1. 全プリセット（base, cli, node-cli, library, api, database, drizzle, edge, graphql, hono, nextjs, r2, rest, storage, workers, postgres）の DataSource を実装する
2. 各 DataSource は `DataSource` 基底クラスまたは `Scannable(DataSource)` を継承する
3. テンプレート（en/ja 両方）の該当 `{{text}}` ディレクティブを `{{data}}` に置き換える
4. DataSource のファイル名がソース名になる（例: `commands.js` → `{{data: commands.list()}}`）
5. 親プリセットの DataSource は子プリセットでオーバーライド可能な設計にする
6. DataSource メソッドはデータがない場合 `null` を返す（テンプレートの該当セクションがスキップされる）
7. 既存テストが引き続きパスすること

## Acceptance Criteria

1. 全対象プリセットに `data/` ディレクトリと DataSource ファイルが存在する
2. テンプレートの該当箇所が `{{data}}` ディレクティブに更新されている
3. `sdd-forge docs data` 実行時に新しい DataSource が正しくロードされ、解決される
4. DataSource メソッドが analysis データから適切なマークダウンテーブルを生成する
5. en/ja 両方のテンプレートが一貫して更新されている
6. 既存テストがすべてパスする
7. 新しい DataSource に対するテストが存在する

## Open Questions

- [x] base の structure DataSource: enriched analysis の各エントリーが持つ `relPath`, `summary`, `chapter`, `role` フィールドからツリーを生成する。`relPath` でディレクトリ構造を構築し、`summary` でコメントを付与する。
