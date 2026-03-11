# 05. 開発・テスト・配布

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover local development environment setup, testing strategy, and release flow.}} -->

本章では、sdd-forge 自体の開発に必要なすべての事項を解説します。リポジトリのクローンとローカル開発環境の構築から、組み込みテストスイートの実行、npm レジストリへの新バージョン公開まで網羅します。

<!-- {{/text}} -->

## 目次

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- {{text: Explain how to run the tool itself during development and how changes are reflected immediately.}} -->

sdd-forge はビルドステップのない純粋な Node.js CLI であるため、`src/` 配下のファイルへの変更は次回コマンド実行時に即座に反映されます。コンパイルや再起動は不要です。`npm link` を一度実行すると `sdd-forge` バイナリがグローバルに登録され、エンドユーザーと同様にどのディレクトリからでも直接コマンドをテストできます。バイナリのエントリポイントは `src/sdd-forge.js` で、`package.json` の `bin` フィールドを通じて読み込まれます。環境が正しく構築されているか確認するには、`sdd-forge help` を実行してコマンド一覧がエラーなく表示されることを確認してください。

<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text: Explain branch management (roles of main/development, squash merge policy) and the commit message format.}} -->

`main` ブランチは常に最新の公開済み状態を反映します。機能開発とバグ修正は短期間の feature ブランチで行い、**スカッシュマージ**（`.sdd-forge/config.json` の `flow.merge: "squash"`）によって `main` に統合します。スカッシュマージにより、`main` のコミット履歴は線形かつ読みやすく保たれ、論理的な変更ごとに 1 コミットとなります。コミットメッセージは**英語**で記述します。`Signed-off-by` トレーラーや `Co-authored-by` 行は追加しないでください。変更の意図を表す簡潔な命令形の件名（例: `Add enrich command to build pipeline`）を心がけ、機械的な実装の詳細ではなく変更の目的を記述します。

<!-- {{/text}} -->

### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec の初期化 |
| `sdd-forge gate --spec ...` | spec ゲートチェック |
| `sdd-forge forge --prompt "..."` | docs の反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- {{text[mode=deep]: Explain the testing strategy, frameworks used, and how to run tests. Include fixture structure as well.}} -->

sdd-forge は **Node.js 組み込みテストランナー**（`node:test`）を使用しており、サードパーティのテストフレームワークはインストールされていません。これはプロジェクトの外部依存ゼロポリシーと一致しています。

**テストスイートの実行:**

```bash
npm run test
# 展開後: find tests -name '*.test.js' | xargs node --test
```

44 個のテストファイルはすべて `tests/` ディレクトリ以下に配置され、`src/` の構造を反映しています。

| ディレクトリ | カバレッジ対象 |
| --- | --- |
| `tests/dispatchers.test.js` | トップレベルのコマンドルーティング |
| `tests/docs/commands/` | 個別の docs サブコマンド（scan, init, data, text, forge, review, …） |
| `tests/docs/lib/` | 共有ライブラリモジュール（directive-parser, scanner, resolver-factory, …） |
| `tests/lib/` | コアユーティリティ（cli, config, agent, i18n, projects, types, …） |
| `tests/presets/` | フレームワーク固有のアナライザー（Laravel, Symfony） |
| `tests/specs/commands/` | spec の `init` コマンドと `gate` コマンド |

**テストヘルパー**（`tests/helpers/`）は、インメモリのプロジェクトフィクスチャを構築する `mock-project.js` と、分離された一時ディレクトリを作成する `tmp-dir.js` を提供します。

**重要なポリシー:** テストはスクリプトが正しく動作することを検証するために存在します。テストが失敗した場合は、まずテストシナリオ自体が妥当かどうかを確認してください。妥当であれば、テストを通すためにテストコードを修正するのではなく、プロダクトコードを修正します。

<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリへ公開
```

<!-- {{text: Explain the release procedure from squash merging development → main through to npm publish.}} -->

feature ブランチのレビューと承認が完了したら、`main` にスカッシュマージします。マージ後、`npm version patch|minor|major` で `package.json` のバージョンを上げると、Git タグも自動的に作成されます。

プレリリースバージョンの npm レジストリへの公開は**2 ステップのプロセス**です。

```bash
npm publish --tag alpha           # "alpha" dist-tag で公開
npm dist-tag add sdd-forge@<version> latest   # "latest" に昇格
```

最初のコマンドは npmjs.com の `latest` タグを更新せずにパッケージを公開します。2 番目のコマンドで `latest` を新バージョンに明示的に移動し、パッケージページと `npm install sdd-forge` に最新リリースが反映されます。**2 番目のステップは絶対に省略しないでください** — 省略すると npmjs.com のページに古いバージョンが表示されたままになります。

公開前は必ず `npm pack --dry-run` を実行して、機密ファイル（`.env`、認証情報など）がtarball に含まれていないことを確認してください。npm は一度リリースされたバージョン番号の再公開を許可していません。

<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text: Explain the language used, runtime version requirements, and npm dependency policy (e.g., zero dependencies).}} -->

sdd-forge は `package.json` に `"type": "module"` を設定した **JavaScript（ES Modules）** で全体が記述されています。サポートする最小ランタイムは **Node.js 18.0.0** で、プロジェクトが依存するすべての組み込み API（`fs`、`path`、`child_process`、`os`、`crypto`、`node:test`）を提供しています。

プロジェクトは**外部依存ゼロポリシーを厳格に維持**しており、`package.json` の `dependencies` フィールドは空です。これにより、インストールが瞬時に完了し、サプライチェーンリスクを排除し、公開パッケージを自己完結させることができます。新機能が必要な場合は常に Node.js 組み込みを第一選択とし、サードパーティパッケージの追加は明確な理由が必要な最終手段と見なされます。

<!-- {{/text}} -->
