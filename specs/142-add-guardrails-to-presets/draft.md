# Draft: Add Guardrails to Presets

**開発種別:** data-only (JSON / text file changes)

**目的:** Laravel プリセット継承チェーン（base → webapp → php-webapp → laravel）の guardrail を拡充し、AI によるコード生成・レビュー時の設計制約を強化する。

## Goal

Laravel プリセット継承チェーン（base → webapp → php-webapp → laravel）に guardrail を追加する。

## Scope

### 変更対象

| プリセット | 変更内容 |
|---|---|
| webapp/templates/en/guardrail.json | 新規6件追加 |
| webapp/templates/ja/guardrail.json | 同上（日本語版） |
| php-webapp/templates/en/guardrail.json | 新規作成（1件） |
| php-webapp/templates/ja/guardrail.json | 同上（日本語版） |
| laravel/templates/en/guardrail.json | 新規6件追加 + no-unguarded-mass-assignment 文言調整 |
| laravel/templates/ja/guardrail.json | 同上（日本語版） |
| webapp/NOTICE | 新規作成 |
| php-webapp/NOTICE | 新規作成 |
| laravel/NOTICE | 新規作成 |

### Out of Scope

- プロダクトコードの変更
- 既存テストの変更
- base プリセットの guardrail 変更

## Requirements

### 1. webapp に新規 guardrail 6件追加

1. **authorization-flow-in-spec** (phase: spec)
   アクセス制御を伴う変更は、認可フローの設計を spec に含めること。

2. **queue-design-for-heavy-processing** (phase: spec)
   レスポンスタイムに影響する重い処理は非同期処理を前提に設計すること。同期実行が必要な場合はその理由を spec に明記する。

3. **cache-invalidation-strategy** (phase: spec)
   キャッシュを導入する機能は、無効化のタイミングと方法を spec に記載すること。TTL のみに依存する設計はデータ不整合のリスクを明記する。

4. **no-queries-in-view-templates** (phase: impl, review)
   ビューテンプレート内で直接 DB クエリや遅延読み込みを行うことを禁止する。必要なデータはコントローラまたは同等の層で事前に取得すること。

5. **detect-n-plus-one-queries** (phase: review)
   ループ内でのリレーションアクセス等、N+1 クエリの兆候がないか確認する。事前読み込みの欠如を指摘する。

6. **detect-missing-index-on-foreign-keys** (phase: review)
   マイグレーションやスキーマ変更で追加された外部キーやクエリ頻出カラムにインデックスが設定されているか確認する。

### 2. php-webapp に新規 guardrail 1件追加

1. **use-language-enum-for-fixed-values** (phase: impl)
   ステータス・種別等の固定値集合は言語組み込みの Enum 型として定義すること。文字列・整数リテラルの直接比較を禁止する。

### 3. laravel に新規 guardrail 6件追加

1. **eager-loading-strategy-required** (phase: spec)
   リレーションを使用する機能は、Eloquent の with()/load() による Eager Loading の方針を spec に記載すること。

2. **enable-prevent-lazy-loading** (phase: impl)
   AppServiceProvider で Model::preventLazyLoading() を開発環境で有効にすること。本番環境では無効にし、代わりにログ記録する。

3. **use-query-scopes-for-reusable-conditions** (phase: impl)
   2箇所以上で使われるクエリ条件は Eloquent のローカルスコープとして定義すること。WHERE 句の重複記述を禁止する。

4. **use-enum-casting-in-eloquent** (phase: impl)
   Enum 型の属性は Eloquent のキャストで Enum を指定すること。app/Enums に配置し、モデルの $casts で型を明示する。

5. **use-factory-for-test-data** (phase: impl)
   テストコード内で Model::create() や DB::insert() で直接テストデータを作成することを禁止する。Factory を使用し、必要最小限の属性のみオーバーライドすること。

6. **invokeable-controller-for-single-action** (phase: impl)
   CRUD 以外の単一操作を行うエンドポイントは __invoke() メソッドを持つ Invokeable Controller として実装すること。

### 4. laravel 既存 guardrail の文言調整（1件）

- **no-unguarded-mass-assignment**
  - phase: impl → impl, review
  - body に追記: マイグレーションでカラムが追加・変更された場合、対応するモデルの $fillable/$guarded が更新されていることを確認する。

### 5. NOTICE ファイルの作成

- webapp/NOTICE: webapp に追加した guardrail の出典（MIT + CC0 すべて記載）
- php-webapp/NOTICE: php-webapp に追加した guardrail の出典
- laravel/NOTICE: laravel に追加した guardrail の出典
- 各プリセットが参照した出典のみをそのプリセットの NOTICE に記載する
- 形式は web-design/NOTICE と同じ

### 6. en/ja 両方の guardrail.json を更新

- guardrail の body は英語で記述（en）し、対応する日本語版（ja）も作成する
- FW 固有の用語は webapp / php-webapp には使わない

## Decisions

- server-side-authorization は変更せず、認可フロー設計は別 guardrail（authorization-flow-in-spec）として webapp に追加
- no-unguarded-mass-assignment は review フェーズ追加 + 文言追記で対応
- NOTICE には CC0 出典も透明性のため記載する
- テストは既存の `npm test`（プリセット整合性テスト）で検証する

## Test Strategy

- `npm test` でプリセット整合性テストが通ることを確認する
- 新規テストの追加は不要

## Q&A

1. **変更スコープ**: webapp/php-webapp/laravel の guardrail.json + NOTICE ファイルのみ。プロダクトコード変更なし → ユーザー承認済み
2. **server-side-authorization の扱い**: 既存 guardrail は変更せず、認可フロー設計は別 guardrail（authorization-flow-in-spec）として新規追加 → ユーザー指示
3. **no-unguarded-mass-assignment の扱い**: review フェーズ追加 + 文言追記で対応 → ユーザー承認済み
4. **NOTICE の方針**: CC0 出典も透明性のため記載。各プリセットが参照した出典のみ記載 → ユーザー承認済み
5. **テスト戦略**: 既存の `npm test` で整合性テスト通過を確認 → ユーザー承認済み

- [x] User approved this draft (2026-04-04)
