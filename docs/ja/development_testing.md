# 05. 開発・テスト・配布

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover local development environment setup, testing strategy, and release flow.}} -->

本章では、sdd-forge 自体の開発に必要なすべてを網羅します — リポジトリのクローンとローカル開発環境の構築から、組み込みテストスイートの実行、そして npm レジストリへの新バージョン公開まで。

<!-- {{/text}} -->

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- {{text: Explain how to run the tool itself during development and how changes are reflected immediately.}} -->

sdd-forge はビルドステップのない純粋な Node.js CLI であるため、`src/` 配下のファイルへの変更は次回コマンド実行時に即座に反映されます — コンパイルや再起動は不要です。`npm link` を一度実行すれば `sdd-forge` バイナリがグローバルに登録されるため、エンドユーザーと同様に任意のディレクトリから直接コマンドをテストできます。バイナリのエントリポイントは `src/sdd-forge.js` で、`package.json` の `bin` フィールド経由でロードされます。環境が正しく構成されているかを確認するには、`sdd-forge help` を実行してコマンド一覧がエラーなく表示されることを確かめてください。

<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text: Explain branch management (roles of main/development, squash merge policy) and the commit message format.}} -->

`main` ブランチは常に最新の公開状態を反映します。機能追加やバグ修正は短命な feature ブランチで開発し、**スカッシュマージ**（`.sdd-forge/config.json` の `flow.merge: "squash"`）で `main` に統合します。スカッシュマージにより、`main` のコミット履歴は線形かつ読みやすい状態に保たれ、論理的な変更ごとに1コミットとなります。コミットメッセージは**英語**で記述します。`Signed-off-by` トレーラーや `Co-authored-by` 行は付けないでください。変更の機械的な詳細ではなく意図を表す、簡潔な命令形の件名行（例: `Add enrich command to build pipeline`）を心がけてください。

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

44 のテストファイルはすべて `tests/` ディレクトリ配下に存在し、`src/` の構造を反映しています:

| ディレクトリ | カバレッジ対象 |
| --- | --- |
| `tests/dispatchers.test.js` | トップレベルのコマンドルーティング |
| `tests/docs/commands/` | docs 個別サブコマンド（scan, init, data, text, forge, review, …） |
| `tests/docs/lib/` | 共有ライブラリモジュール（directive-parser, scanner, resolver-factory, …） |
| `tests/lib/` | コアユーティリティ（cli, config, agent, i18n, projects, types, …） |
| `tests/presets/` | フレームワーク固有アナライザー（Laravel, Symfony） |
| `tests/specs/commands/` | spec の `init` および `gate` コマンド |

**テストヘルパー**（`tests/helpers/`）は、インメモリのプロジェクトフィクスチャを構築する `mock-project.js` と、独立した一時ディレクトリを作成する `tmp-dir.js` を提供します。

**重要なポリシー:** テストはスクリプトが正しく動作することを検証するために存在します。テストが失敗した場合は、まずテストシナリオ自体が妥当かどうかを確認してください。妥当であれば、テストを通すためにテストコードを修正するのではなく、プロダクトコードを修正してください。

<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリへ公開
```

<!-- {{text: Explain the release procedure from squash merging development → main through to npm publish.}} -->

feature ブランチのレビューと承認が完了したら、`main` へスカッシュマージします。マージ後、`npm version patch|minor|major` で `package.json` のバージョンを更新します。このコマンドは Git タグも自動で作成します。

npm レジストリへの公開は、プレリリースバージョンの場合**2ステップのプロセス**です:

```bash
npm publish --tag alpha           # "alpha" dist-tag で公開
npm dist-tag add sdd-forge@<version> latest   # "latest" へ昇格
```

最初のコマンドは npmjs.com の `latest` タグを更新せずにパッケージを公開します。2番目のコマンドで `latest` を新しいバージョンに明示的に移動させることで、パッケージページと `npm install sdd-forge` がリリースを反映するようになります。**2番目のステップを省略しないでください** — 省略すると npmjs.com のページが古いバージョンを表示したままになります。

公開前には必ず `npm pack --dry-run` を実行して、機密ファイル（`.env`、認証情報など）がターボールに含まれていないことを確認してください。なお、npm は一度リリースされたバージョン番号の再公開を許可しません。

<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text: Explain the language used, runtime version requirements, and npm dependency policy (e.g., zero dependencies).}} -->

sdd-forge は `package.json` に `"type": "module"` を指定した **JavaScript（ES Modules）** で完全に記述されています。最低サポートランタイムは **Node.js 18.0.0** で、プロジェクトが依存するすべての組み込み API — `fs`、`path`、`child_process`、`os`、`crypto`、`node:test` — を提供します。

プロジェクトは**外部依存ゼロポリシー**を厳守しています: `package.json` の `dependencies` フィールドは空です。これにより、インストールが瞬時に完了し、サプライチェーンリスクを排除し、公開パッケージを自己完結させます。新しい機能が必要になった場合、まず Node.js 組み込みを選択します。サードパーティパッケージの追加は明確な正当性が必要であり、最終手段として検討されます。

<!-- {{/text}} -->
