# Feature Specification: 002-laravel-preset

**Feature Branch**: `feature/002-laravel-preset`
**Created**: 2026-03-02
**Status**: Draft
**Input**: Laravel 8 以降のプロジェクトを sdd-forge で解析・ドキュメント生成できるようプリセットとテンプレートを追加する

## Goal
- Laravel 8+ プロジェクトに対して `sdd-forge scan` → `init` → `data` → `text` のパイプラインを動作させる
- CakePHP2 プリセットと同等の解析精度・ドキュメント品質を実現する

## Scope

### 1. プリセット (`src/docs/presets/webapp/laravel/`)
- **scanner.js** — SCAN_DEFAULTS（Controllers, Models, routes, migrations, commands）+ analyzeExtras
- **analyze-controllers.js** — `app/Http/Controllers/` のパース（クラス名、メソッド、ミドルウェア、DI）
- **analyze-models.js** — `app/Models/` のパース（テーブル名、リレーション、キャスト、スコープ、アクセサ）
- **analyze-routes.js** — `routes/web.php`, `routes/api.php` のパース（URI、メソッド、コントローラ、ミドルウェア）
- **analyze-migrations.js** — `database/migrations/` のパース（テーブル名、カラム、インデックス、外部キー）
- **analyze-config.js** — `config/` + `composer.json` + `.env.example` のパース
- **resolver.js** — createLaravelCategories() で @data カテゴリを提供

### 2. テンプレート (`src/templates/locale/ja/webapp/laravel/`)
- webapp 親テンプレートを `@extends` で継承し、Laravel 固有のブロックをオーバーライド
- 対象チャプター: `02_stack_and_ops.md`, `03_project_structure.md`, `05_auth_and_session.md`, `07_db_tables.md`, `08_controller_routes.md`

### 3. 登録
- `src/docs/commands/scan.js` — FW_MODULES に `laravel` を追加
- `src/docs/lib/resolver-factory.js` — FW_RESOLVER_MODULES に `laravel` を追加
- `src/lib/types.js` — TYPE_ALIASES に `"laravel": "webapp/laravel"` を追加

### 4. テスト
- scanner.js の SCAN_DEFAULTS 構造テスト
- resolver.js のカテゴリ存在テスト
- analyze-*.js の基本パーステスト（モックファイル使用）

## Out of Scope
- Laravel バージョン別の分岐（8/9/10/11 を単一プリセットで対応）
- Livewire / Inertia.js 固有の解析
- 英語テンプレート（`locale/en/`）— 後続タスクとする
- Blade テンプレートの詳細解析（コンポーネント・ディレクティブ等）
- フロントエンド（Vite / Mix）の詳細解析

## Clarifications (Q&A)
- Q: Laravel のバージョン差異（8〜11）はどう扱うか？
  - A: 単一プリセットで対応。Models ディレクトリは `app/Models/`（8+）を前提とし、`app/` 直下のモデルも fallback で検出する。
- Q: routes ファイルは web.php と api.php の両方を対象とするか？
  - A: はい。両方を解析し、routeType (web/api) でタグ付けする。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-02
- Notes: 単一プリセットで Laravel 8〜11 対応、Blade/Livewire/Inertia 詳細解析は対象外

## Requirements

### SCAN_DEFAULTS
```
controllers: { dir: "app/Http/Controllers", pattern: "*.php", exclude: ["Controller.php"], lang: "php", subDirs: true }
models:      { dir: "app/Models", pattern: "*.php", lang: "php", subDirs: true }
commands:    { dir: "app/Console/Commands", pattern: "*.php", lang: "php" }
routes:      { files: ["routes/web.php", "routes/api.php"], lang: "php" }
migrations:  { dir: "database/migrations", pattern: "*.php", lang: "php" }
```

### Resolver カテゴリ（最低限）
| カテゴリ | ソース | 説明 |
|---|---|---|
| `controllers` | controllers | コントローラ一覧 |
| `controllers.actions` | controllers | アクション一覧 |
| `controllers.middleware` | controllers+routes | ミドルウェア一覧 |
| `tables` | migrations | テーブル一覧（マイグレーションから） |
| `tables.columns` | migrations | カラム定義 |
| `tables.fk` | migrations | 外部キー |
| `models.relations` | models | Eloquent リレーション |
| `models.scopes` | models | スコープメソッド |
| `commands` | commands | Artisan コマンド一覧 |
| `config.composer` | extras | Composer 依存 |
| `config.env` | extras | .env 設定キー |
| `config.providers` | extras | サービスプロバイダ |
| `routes` | routes | ルート一覧 |
| `routes.api` | routes | API ルートのみ |

### テンプレート @data ディレクティブ
- `table(controllers)` — コントローラ一覧テーブル
- `table(routes)` — ルート一覧
- `table(tables)` — テーブル一覧
- `table(tables.columns)` — カラム定義
- `table(models.relations)` — リレーション一覧
- `table(config.composer)` — 依存パッケージ
- `table(commands)` — Artisan コマンド一覧

## Acceptance Criteria
- `sdd-forge scan` が Laravel プロジェクトの analysis.json を正常に生成する
- `sdd-forge init` が Laravel テンプレートで docs/ を初期化する
- `sdd-forge data` が @data ディレクティブを resolver で正常に解決する
- 既存の CakePHP2 プリセット・テストに regression がない
- `npm test` で新規テストが全て PASS する

## Open Questions
- (なし)
