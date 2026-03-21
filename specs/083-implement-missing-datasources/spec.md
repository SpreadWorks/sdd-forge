# Feature Specification: 083-implement-missing-datasources

**Feature Branch**: `feature/083-implement-missing-datasources`
**Created**: 2026-03-21
**Status**: Approved
**Input**: テストで検出されたプリセット整合性エラー25件の対応

## Goal

プリセット整合性テストで検出された全エラーを解消し、再発防止のために `src/AGENTS.md` にプリセット作成ルールを明文化する。

**Why this approach**: テスト検出エラーの根本原因は「プリセット作成時のルールが明文化されていない」こと。ルール整備（src/AGENTS.md）を先に行い、そのルールに従って既存不整合を修正することで、修正の一貫性と再発防止を同時に達成する。

## Scope

本仕様は「ルール整備」と「不整合修正」を1つにまとめている（ユーザーが明示的に選択: draft ステップ「[3] 両方を1つの spec にまとめる」）。理由: ルール整備の成果物（src/AGENTS.md）が修正作業のガイドラインとして即座に使われるため、分離するとルールと実装の乖離が生じるリスクがある。単一責任の例外として、Phase 分離と依存関係の明示で管理する。

### Phase 1: ルール整備（優先度: 高 — 後続全ての基盤）

#### 1a. `src/AGENTS.md` 新規作成

`src/AGENTS.md` を作成（日本語）。以下を含む:
- プロジェクト概要（ランタイム、モジュール形式、ディレクトリ構造）
- アーキテクチャ（コマンドルーティング、環境変数）
- プリセット作成ルール（scan/data 対応、テンプレート構文、block 継承）
- コーディングルール（src/README.md から引き継ぎ）
- テストの説明

#### 1b. ドキュメント整理

- `src/CLAUDE.md` → `src/AGENTS.md` へのシンボリックリンク作成
- `src/README.md` 削除（内容は全て src/AGENTS.md に統合済みのため）
- ルート `AGENTS.md` から `{{data: agents.project}}` セクション削除、`src/AGENTS.md` への参照追記

### Phase 2: テンプレート修正（優先度: 高 — Phase 1 に次ぐ。テスト2の基盤修正）

#### 2a. webapp テンプレート修正（10ディレクティブ）

`{{data("webapp.xxx")}}` を `{%block%}` + `{{text}}` に変更:

| テンプレート | ディレクティブ | block 名 |
|---|---|---|
| auth_and_session.md | `webapp.config.auth` | `auth_config` |
| auth_and_session.md | `webapp.config.acl` | `acl_config` |
| controller_routes.md | `webapp.config.auth` | `auth_config` |
| controller_routes.md | `webapp.views.components` | `view_components` |
| business_logic.md | `webapp.models.logic` | `logic_classes` |
| business_logic.md | `webapp.models.logicMethods` | `logic_methods` |
| database_architecture.md | `webapp.config.db` | `db_config` |
| database_architecture.md | `webapp.models.er` | `er_diagram` |
| batch_and_shell.md | `webapp.shells.deps` | `shell_deps` |
| batch_and_shell.md | `webapp.shells.flow` | `shell_flow` |

#### 2b. base テンプレート修正（2ディレクティブ）

| テンプレート | ディレクティブ | block 名 |
|---|---|---|
| stack_and_ops.md | `base.config.stack` | `stack`（既存 block を活用） |
| project_structure.md | `base.libs.list` | `libs` |

### Phase 3: 子プリセット override + DataSource 実装（優先度: 中 — Phase 2 の block 化を前提とした差し替え）

#### 3a. cakephp2 override テンプレート作成

cakephp2 に override テンプレートを作成し、block 内を `{{data("cakephp2.xxx")}}` に差し替え。既存の DataSource メソッドを活用（全て実装済み）。

#### 3b. laravel override テンプレート + DataSource 実装

laravel に override テンプレートを作成。不足する DataSource メソッドを実装:
- `laravel/data/config.js`: `auth()`, `acl()`, `db()`, `stack()` メソッド追加
- `laravel/data/models.js` に `logic()`, `logicMethods()`, `er()` 追加（または新規作成）
- `laravel/data/docker.js`: `list()` メソッド（docker-compose.yml パース）

#### 3c. symfony override テンプレート + DataSource 実装

symfony に override テンプレートを作成。不足する DataSource メソッドを実装:
- `symfony/data/config.js`: `auth()`, `acl()`, `db()`, `stack()` メソッド追加
- `symfony/data/models.js` に `logic()`, `logicMethods()`, `er()` 追加（または新規作成）
- `symfony/data/docker.js`: `list()` メソッド

### Phase 4: テスト3 不整合解消（優先度: 低 — Phase 2〜3 で大部分が解消された後の残件対応）

全て scan で収集不可のためテンプレートを `{{text}}` に変更する。data DataSource は削除しない（analysis にデータがあれば動作する）。

| analysis キー | 読む DataSource | テンプレート |
|---|---|---|
| `schemas` | database, drizzle | database.md, schema.md |
| `middleware` | hono | middleware.md |
| `components` | nextjs | components.md |
| `endpoints` | rest | endpoints.md |
| `bindings` | workers | bindings.md |
| `storage` | storage, r2 | storage.md |
| `edge` | edge | edge_runtime.md |
| `api` | api | api_overview.md, authentication.md |
| `graphql` | graphql | api_overview.md |
| `extras` | node-cli, php-webapp | development.md 等 |
| `requirements` | library | public_api.md 等 |

## Existing Feature Impact

- **docs 出力への影響**: webapp テンプレートの `{{data}}` → `{{text}}` 変更により、cakephp2 以外のプロジェクトでは AI 生成テキストに切り替わる。cakephp2 は block override で `{{data}}` を維持するため影響なし。
- **プリセット固有テンプレートの影響**: nextjs, hono, workers 等のテンプレートで `{{data}}` → `{{text}}` 変更。現状 data が null を返すため、実質的な品質劣化はない（むしろ AI が文章を生成するため改善）。
- **src/README.md 削除**: 内容は全て src/AGENTS.md に統合。README.md を参照するスクリプトやドキュメントはない（`npm pack --dry-run` で確認済み）。
- **ルート AGENTS.md 変更**: `{{data: agents.project}}` セクション削除。`sdd-forge agents` コマンドによる自動更新は project セクションに対しては行われなくなる。SDD セクションは維持。

## Out of Scope

- 新しいプリセットの追加
- enrich フェーズの設計変更（新規カテゴリ生成の拡張）
- nextjs/hono の webapp テンプレート override（AI フィルタで不要章が除外されるため）

## Clarifications (Q&A)

- Q: フレームワーク固有のパーサーを書くべきか？
  - A: 本質的でない。scan で収集不可能な情報は `{{text}}` に任せる。

- Q: webapp テンプレートの `{{data}}` を全て `{{text}}` にすると cakephp2 の精度が下がるか？
  - A: block override で cakephp2 は `{{data}}` を維持するので精度は変わらない。

- Q: ルート AGENTS.md の `{{data: agents.project}}` を外すと自動更新されなくなるが良いか？
  - A: src/AGENTS.md に手書きで集約する。自動生成は使わない。

- Q: テスト2の14件を全て `{{text}}` にするのか？
  - A: webapp/base テンプレートは `{{text}}` にするが、子プリセット（cakephp2, laravel, symfony）は block override で `{{data}}` を使う。

- Q: src/README.md 削除と AGENTS.md セクション削除は破壊的操作ではないか？
  - A: 両方とも `git rm` / `git commit` で実行するため git 履歴から復元可能。内容は全て src/AGENTS.md に統合される。README.md を参照する外部コードは存在しない。npm パッケージの files フィールドは `["src/"]` なので README.md はパッケージルートのもの（別ファイル）が使われる。ユーザーが draft フェーズで削除方針を明示的に承認済み。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-21
- Notes: ユーザー承認済み。src/AGENTS.md 作成から開始。

## Requirements

1. [Phase 1] `src/AGENTS.md` を作成し、プリセット作成ルール（scan/data 対応、テンプレート構文）を明文化する
2. [Phase 1] `src/CLAUDE.md` を `src/AGENTS.md` へのシンボリックリンクとして作成する
3. [Phase 1] 要件1完了後、`src/AGENTS.md` に src/README.md の5セクション（Directory Structure, Command Routing, Coding Rules, Agent Invocation, File Operations）の内容が統合されたことを `grep` で確認し、`git rm src/README.md` で削除する（ユーザー承認済み: draft にて確認・合意）
4. [Phase 1] 要件1完了後、ルート `AGENTS.md` の `<!-- {{data: agents.project}} -->` 〜 `<!-- {{/data}} -->` セクションを削除し、代わりに `src/AGENTS.md を参照` の1行を追記する
5. [Phase 2] Phase 1 完了後、webapp テンプレートの `{{data}}` 10件を `{%block%}` + `{{text}}` に変更する
6. [Phase 2] Phase 1 完了後、base テンプレートの `{{data}}` 2件を `{%block%}` + `{{text}}` に変更する
7. [Phase 3a] Phase 2 完了後、cakephp2 に override テンプレートを作成し、block 内を `{{data("cakephp2.xxx")}}` に差し替える（既存 DataSource 利用、新規実装なし）
8. [Phase 3b] Phase 2 完了後、laravel に override テンプレートと不足 DataSource メソッドを実装する（config.js, models.js, docker.js）
9. [Phase 3c] Phase 2 完了後、symfony に override テンプレートと不足 DataSource メソッドを実装する（config.js, models.js, docker.js）
10. [Phase 4] Phase 2〜3 完了後、テスト3 の 11 analysis キーの不整合を解消する（テンプレート `{{text}}` 化）
11. [Phase 4] 全要件完了後、`npm test` を実行してプリセット整合性テスト（テスト2, テスト3）の fail が 0 件であることを確認する

## Acceptance Criteria

- `npm test` でプリセット整合性テスト（preset-scan-integrity.test.js）の fail が 0 件になる
- `src/AGENTS.md` にプリセット作成ルールが明文化されている
- webapp テンプレートが `{{text}}` + block 構造を持ち、子プリセットが override で `{{data}}` を使える
- laravel/symfony の DataSource メソッドが実装され、override テンプレートが存在する

## Open Questions

- [x] テスト3 の 11 キー: 全て scan で収集不可のためテンプレートを `{{text}}` に変更する。テスト2の修正（block + text 化）で大部分が解消され、残りのプリセット固有テンプレート（nextjs, hono, workers 等）も `{{text}}` 化。data DataSource は analysis にデータがあれば動作するので削除はしない。
