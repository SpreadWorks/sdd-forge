# 05. 開発・テスト・配布

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover local development environment setup, testing strategy, and release flow.}} -->

この章では、sdd-forge 自体の開発に必要なすべての内容を解説します。リポジトリのクローンとローカル開発環境の構築から、組み込みテストスイートの実行、npm レジストリへの新バージョン公開までを網羅します。

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

sdd-forge はビルドステップのない純粋な Node.js CLI であるため、`src/` 配下のファイルへの変更は次回コマンド実行時に即座に反映されます。コンパイルや再起動は不要です。`npm link` を一度実行することで `sdd-forge` バイナリがグローバルに登録され、エンドユーザーと同様にどのディレクトリからでも直接コマンドをテストできます。バイナリのエントリポイントは `src/sdd-forge.js` であり、`package.json` の `bin` フィールドを通じて読み込まれます。環境が正しく構築されているか確認するには、`sdd-forge help` を実行してコマンド一覧がエラーなく表示されることを確認してください。

<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text: Explain branch management (roles of main/development, squash merge policy) and the commit message format.}} -->

`main` ブランチは常に最新の公開済み状態を反映します。機能追加やバグ修正は短命な feature ブランチで開発し、**squash merge**（`.sdd-forge/config.json` の `flow.merge: "squash"`）によって `main` に統合します。squash merge により `main` のコミット履歴が線形で読みやすく保たれ、論理的な変更ごとに 1 つのコミットが記録されます。コミットメッセージは**英語**で記述します。`Signed-off-by` トレーラーや `Co-authored-by` 行は付けないでください。変更の機械的な詳細ではなく意図を表す、簡潔な命令形の件名行（例: `Add enrich command to build pipeline`）を心がけてください。

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

sdd-forge は **Node.js 組み込みテストランナー**（`node:test`）を使用しており、サードパーティのテストフレームワークは一切インストールされていません。これはプロジェクトの外部依存ゼロ方針と一致しています。

**テストスイートの実行:**

```bash
npm run test
# 展開後: find tests -name '*.test.js' | xargs node --test
```

44 個のテストファイルはすべて `tests/` ディレクトリ以下に配置されており、`src/` の構造を反映しています。

| ディレクトリ | カバー範囲 |
| --- | --- |
| `tests/dispatchers.test.js` | トップレベルのコマンドルーティング |
| `tests/docs/commands/` | docs サブコマンド個別（scan, init, data, text, forge, review, …） |
| `tests/docs/lib/` | 共有ライブラリモジュール（directive-parser, scanner, resolver-factory, …） |
| `tests/lib/` | コアユーティリティ（cli, config, agent, i18n, projects, types, …） |
| `tests/presets/` | フレームワーク固有のアナライザー（Laravel, Symfony） |
| `tests/specs/commands/` | spec の `init` コマンドと `gate` コマンド |

**テストヘルパー**（`tests/helpers/`）には、インメモリのプロジェクトフィクスチャをセットアップするための `mock-project.js` と、独立した一時ディレクトリを作成するための `tmp-dir.js` が用意されています。

**重要なポリシー:** テストはスクリプトが正しく動作するかを検証するために存在します。テストが失敗した場合、まずテストシナリオ自体が妥当かどうかを確認し、妥当であればプロダクトコードを修正してください。テストを通過させるためだけにテストを修正することは禁止です。

<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- {{text: Explain the release procedure from squash merging development → main through to npm publish.}} -->

feature ブランチのレビューと承認が完了したら、`main` に squash merge します。マージ後、`npm version patch|minor|major` を使用して `package.json` のバージョンを更新します。このコマンドは Git タグも自動的に作成します。

プレリリースバージョンの npm レジストリへの公開は**2 ステップ**で行います。

```bash
npm publish --tag alpha           # "alpha" dist-tag として公開
npm dist-tag add sdd-forge@<version> latest   # "latest" に昇格
```

最初のコマンドは npmjs.com の `latest` タグを更新せずにパッケージを公開します。2 番目のコマンドで `latest` を新バージョンに明示的に移動することで、パッケージページと `npm install sdd-forge` にリリースが反映されます。**2 番目のステップを省略しないでください** — 省略すると npmjs.com ページに古いバージョンが表示されたままになります。

公開前には必ず `npm pack --dry-run` を実行し、機密ファイル（`.env`、認証情報など）がターボールに含まれていないことを確認してください。npm は一度リリースされたバージョン番号の再公開を許可しないことに注意してください。

<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text: Explain the language used, runtime version requirements, and npm dependency policy (e.g., zero dependencies).}} -->

sdd-forge は `package.json` に `"type": "module"` を指定した **JavaScript（ES Modules）** で全体が記述されています。サポートする最小ランタイムバージョンは **Node.js 18.0.0** であり、プロジェクトが依存するすべての組み込み API（`fs`、`path`、`child_process`、`os`、`crypto`、`node:test`）が利用可能です。

プロジェクトは**外部依存ゼロの方針**を厳守しており、`package.json` の `dependencies` フィールドは空です。これにより、インストールが即座に完了し、サプライチェーンリスクが排除され、公開パッケージが自己完結した状態を保てます。新しい機能が必要な場合、最初の選択肢は常に Node.js 組み込みモジュールです。サードパーティパッケージの追加は明確な正当性が求められ、最終手段とみなされます。

<!-- {{/text}} -->
