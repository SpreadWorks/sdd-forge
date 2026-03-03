# Feature Specification: 004-symfony-preset

**Feature Branch**: `feature/004-symfony-preset`
**Created**: 2026-03-02
**Status**: Draft
**Input**: Symfony 5+ 向けプリセットとテンプレートを追加

## Goal
sdd-forge に Symfony 5/6/7 向けのプリセット（解析器・リゾルバ・テンプレート）を追加し、Symfony プロジェクトのドキュメント自動生成を可能にする。

## Scope

### 解析器 (src/docs/presets/webapp/symfony/)
- `analyze-controllers.js` — `src/Controller/` からコントローラ、アクション、Route attribute、DI 依存を抽出
- `analyze-entities.js` — `src/Entity/` から Doctrine エンティティ、カラム、リレーション、リポジトリを抽出
- `analyze-routes.js` — `config/routes.yaml` + `config/routes/` からルート定義を抽出
- `analyze-migrations.js` — `migrations/` から Doctrine マイグレーション（テーブル・カラム操作）を抽出
- `analyze-config.js` — `composer.json`, `.env`, `config/packages/`, `src/Kernel.php` からスタック情報を抽出
- `scanner.js` — SCAN_DEFAULTS + analyzeExtras
- `resolver.js` — createSymfonyCategories

### テンプレート (src/templates/locale/ja/webapp/symfony/)
- `02_stack_and_ops.md` — 技術スタック・依存・ミドルウェア
- `03_project_structure.md` — ディレクトリ構造
- `05_auth_and_session.md` — 認証・セッション（Security Bundle）
- `07_db_tables.md` — DB テーブル・エンティティ
- `08_controller_routes.md` — ルーティング・コントローラ

### 登録
- `src/docs/commands/scan.js` — FW_MODULES に `symfony` 追加
- `src/docs/lib/resolver-factory.js` — FW_RESOLVER_MODULES に `symfony` 追加
- `src/lib/types.js` — TYPE_ALIASES に `"symfony": "webapp/symfony"` 追加

### テスト
- 各解析器のユニットテスト
- リゾルバのカテゴリ解決テスト
- 統合テスト（scanner → resolver パイプライン）

## Out of Scope
- Symfony 4 以前の対応
- Twig テンプレートの解析
- API Platform 固有の解析
- 英語テンプレート（ja のみ）

## Clarifications (Q&A)
- Q: Symfony 5/6/7 で1つのプリセットで対応可能か？
  - A: ディレクトリ構造は同一（src/Controller/, src/Entity/, config/, migrations/）。1プリセットで対応可能。
- Q: Laravel の analyze-models.js に相当するものは？
  - A: Symfony では Doctrine ORM のエンティティ（src/Entity/）。analyze-entities.js として実装。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-02
- Notes: spec サマリーを提示し、ユーザーが承認

## Requirements
- Laravel プリセットと同等のパターン・データ形状に従うこと
- Symfony の Route attribute（#[Route(...)]) と YAML ルート定義の両方を解析すること
- Doctrine ORM のエンティティ定義（ORM attribute）を解析すること
- 既存テストが全て通ること

## Acceptance Criteria
- `sdd-forge scan` が type=webapp/symfony で Symfony プロジェクトを解析できる
- `sdd-forge data` が Symfony 固有カテゴリ（controllers, entities, routes, migrations 等）を解決できる
- `sdd-forge init --type webapp/symfony` がテンプレートを docs/ に展開できる
- 新規テストで解析器・リゾルバの動作を検証
- 既存テスト全件 pass

## Open Questions
（なし）
