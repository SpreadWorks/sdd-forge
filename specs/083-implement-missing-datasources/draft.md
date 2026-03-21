# Draft: テスト検出エラー対応 + src/AGENTS.md 整備

## 背景

プリセット整合性テストで25件のエラーが検出された。根本原因はプリセット作成時のルールが明文化されていないこと。個別の不整合修正とルール整備を同時に行う。

## ユーザー決定事項

1. **カテゴリA + B を1つの spec で対応する**
2. **方針**: scan DataSource と data DataSource は対であるべき。対になっていないものは修正する
   - scan で収集可能 → `{{data}}` で表示
   - scan で収集不可能（フレームワーク固有すぎる） → `{{text}}` に変更
   - フレームワーク固有パーサーを追加する方法は本質的でないため採用しない
3. **enrich は静的収集データの加工に留める** — 新規カテゴリ生成はしない
4. **src/README.md 廃止** → `src/AGENTS.md` に統合
5. **src/AGENTS.md** を新規作成、`src/CLAUDE.md` はシンボリックリンク
6. **ルート AGENTS.md** から `{{data: agents.project}}` セクションを外し、`src/AGENTS.md` への参照を記載

## 作業順序

1. `src/AGENTS.md` 作成 + `src/CLAUDE.md` シンボリックリンク（ルール整備）
2. ルート `AGENTS.md` 修正（project セクション外し + 参照追加）
3. `src/README.md` 削除
4. ルールに基づいて既存不整合を修正
   - テスト2: テンプレートの `{{data}}` を `{{text}}` に変更、または DataSource メソッド実装
   - テスト3: scan/data の対応を修正

## テスト2 修正方針（14件の未実装メソッド）

| メソッド | 方針 |
|---|---|
| `base.config.stack` | `{{text}}` に変更（scan で技術スタックは収集不可） |
| `base.libs.list` | `{{text}}` に変更（汎用的なライブラリ一覧は scan 不可） |
| `webapp.config.auth/acl/db` | `{{text}}` に変更（フレームワーク固有設定） |
| `webapp.models.logic/logicMethods/er` | `{{text}}` に変更（CakePHP 固有の分析） |
| `webapp.shells.deps/flow` | `{{text}}` に変更（CakePHP 固有の分析） |
| `webapp.views.components` | `{{text}}` に変更（フレームワーク固有ビュー） |
| `laravel.docker.list` | `{{text}}` に変更（docker-compose は汎用 scan 不可） |
| `symfony.docker.list` | `{{text}}` に変更（同上） |

## テスト3 修正方針（11件の未カバー analysis キー）

data DataSource が読む analysis キーに scan が書き込まない問題。

対応方法: data DataSource のメソッドを修正し、enrich 済みの汎用 analysis データ（`modules` 等）から必要な情報を取得するようにするか、テンプレートを `{{text}}` に変更する。

- [x] User approved this draft
