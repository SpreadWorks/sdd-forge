<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../stack_and_ops.md) | **日本語**
<!-- {{/data}} -->

# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->

sdd-forge は Node.js 18 以上で動作する ES Modules 形式の CLI ツールで、パッケージのバージョンは `0.1.0-alpha.361` です。Spec-Driven Development とソースコード解析によるドキュメント生成を目的とし、Git、GitHub CLI、pnpm `10.33.0`、GitHub Actions、Wrangler 設定解析などの周辺ツールを扱います。
<!-- {{/text}} -->

## 内容

### 技術スタック

<!-- {{text({prompt: "技術スタックをカテゴリ・技術名・バージョンの表形式で記述してください。"})}} -->

| カテゴリ | 技術名 | バージョン |
| --- | --- | --- |
| 実行環境 | Node.js | 18 以上 |
| パッケージ | sdd-forge | `0.1.0-alpha.361` |
| モジュール形式 | ECMAScript Modules | `type: module` |
| パッケージ管理 | pnpm | `10.33.0` |
| CLI エントリーポイント | `sdd-forge` | `./src/sdd-forge.js` |
| テスト実行 | Node.js ベースの test scripts | `test` / `test:unit` / `test:e2e` / `test:acceptance` |
| バージョン管理 | Git | バージョン記載なし |
| GitHub 連携 | GitHub CLI (`gh`) | バージョン記載なし |
| CI | GitHub Actions | バージョン記載なし |
| Edge 設定解析 | Wrangler 設定 (`wrangler.toml` / `wrangler.json` / `wrangler.jsonc`) | バージョン記載なし |
| CakePHP プリセット | CakePHP 2 向けデータソース | バージョン記載なし |
<!-- {{/text}} -->

### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->

依存パッケージの管理対象は `package.json` で定義されており、パッケージマネージャーは `pnpm 10.33.0` に固定されています。

公開対象は `src/` 配下に限定され、`src/presets/*/tests/` 配下の受け入れテスト用フォルダは npm 公開物から除外されます。実行条件は `engines` で Node.js 18 以上に制限されています。

テスト実行用のスクリプトは `test`、`test:unit`、`test:e2e`、`test:acceptance` が定義されています。`package.json` には外部ランタイム依存は宣言されておらず、組み込みモジュールのみを使う方針と一致しています。
<!-- {{/text}} -->

### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->

解析データには、アプリケーションを配布または本番環境へ配置するための専用デプロイ手順は定義されていません。

配布形態として確認できるのは npm パッケージとしての公開設定で、CLI 本体は `sdd-forge` コマンドとして `./src/sdd-forge.js` を実行します。npm 公開物には `src/` のみが含まれ、特定のテスト用フォルダは除外されます。

また、CI 用には GitHub Actions ワークフローを解析する仕組みがあり、Edge ランタイム用には Wrangler 設定ファイルを解析する仕組みがありますが、実際のデプロイ順序や実行手順そのものはこの解析データには含まれていません。
<!-- {{/text}} -->

### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->

運用面では、Git の状態確認を行うための補助機能が用意されています。ワークツリーの変更有無、現在のブランチ名、基準ブランチに対する先行コミット数、最新コミット、GitHub CLI の利用可否を取得できます。

外部コマンドの実行は `runSync` により同期実行され、終了ステータス、標準出力、標準エラー出力を文字列として一貫した形式で扱えます。

スキル配布については、テンプレート化された `SKILL.md` を `.agents/skills` と `.claude/skills` に展開する仕組みがあります。言語選択、インクルード解決、シンボリックリンク除去、差分がない場合の更新省略に対応しています。

ドキュメント生成側では `AGENTS.md` 用データソースが設定、パッケージ情報、解析サマリーを組み合わせてマークダウン断片を生成します。CI ワークフローや Edge ランタイム設定も個別のデータソースで解析され、運用情報の表形式出力に利用されます。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← ツール概要とアーキテクチャ](overview.md) | [プロジェクト構成 →](project_structure.md)
<!-- {{/data}} -->
