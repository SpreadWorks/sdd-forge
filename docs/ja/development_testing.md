# 05. 開発・テスト・配布

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include local development environment setup, testing strategy, and release flow.}} -->

この章では、sdd-forge のローカル開発環境のセットアップ、Node.js 組み込みテストランナーを使用したテスト戦略、および npm レジストリへの公開リリースフローについて説明します。

<!-- {{/text}} -->

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # インストール確認
```

<!-- {{text: Explain how to run the tool itself during development and how changes are immediately reflected.}} -->

sdd-forge は Node.js パッケージとして配布される CLI ツールであるため、プロジェクトルートで `npm link` を実行すると、`src/sdd-forge.js` へのシンボリックリンクが作成され、`sdd-forge` バイナリがグローバルに登録されます。Node.js は実行時にシンボリックリンクを解決するため、`src/` 以下のファイルへの編集は次回コマンド実行時に即座に反映されます。リビルドや再インストールは不要です。`sdd-forge help` を実行してコマンド一覧が表示されることを確認し、リンクされたバージョンが有効であることを検証してください。

<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text: Describe branch management and commit message format. Extract from merge settings and commit conventions in the source code.}} -->

フィーチャーブランチは通常 `sdd-forge spec --title "<機能名>"` で作成します。このコマンドは SDD ワークフローの一環として、spec ファイルとともに専用ブランチを自動的に用意します。ホットフィックスや単独の変更には、ベースブランチからの短命ブランチの使用を推奨します。

コミットメッセージは**英語**で記述すること。命令形を使用し、件名行は簡潔にまとめてください（例: `Add snapshot check subcommand`）。`Signed-off-by:` 行や `Co-authored-by:` トレーラーは含めないこと。公開済みのコミットへの amend は避け、レビューフィードバックへの対応は新しいコミットで行うこと。

<!-- {{/text}} -->

### テスト

<!-- {{text[mode=deep]: Describe the testing strategy, framework used, and how to run tests. Extract from the test directory structure and test runner configuration in the source code.}} -->

sdd-forge は **Node.js 組み込みテストランナー** (`node:test`) を使用しており、外部テストフレームワークへの依存は不要です。テストファイルは `*.test.js` の命名規則に従い、プロジェクトルートの `tests/` ディレクトリ以下に配置されています。

テストスイート全体を実行するには:

```bash
npm test
# 展開後: find tests -name '*.test.js' | xargs node --test
```

ユニットテストに加え、`sdd-forge snapshot` コマンドは決定論的なコマンド出力の**リグレッション検出**を提供します。`analysis.json`、すべての `docs/*.md` ファイル（サブディレクトリを含む）、および `README.md` を `.sdd-forge/snapshots/` にキャプチャし、後続の実行時に比較して意図しない変更を検出します。

```bash
sdd-forge snapshot save    # 現在の出力をベースラインとして保存
sdd-forge snapshot check   # 現在の出力とベースラインを比較（差分あり時は終了コード 1）
sdd-forge snapshot update  # 現在の出力でベースラインを更新
```

`test-env-detection.js` ユーティリティは、`analysis.json` から `devDependencies`（Jest、Mocha、Vitest、AVA、TAP、Jasmine、PHPUnit、Pest）と `scripts.test` フィールドを検査することで、テスト環境を自動的に識別します。この情報は SDD ゲートフローで利用され、実装開始前に関連するテスト観点を提示します。

テストが失敗した場合は、まずテストシナリオの妥当性を確認してください。テストコードを修正するのはシナリオ自体が誤っている場合のみです。シナリオが妥当であれば、プロダクションコードを修正してください。

<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリへ公開
```

<!-- {{text: Describe the release procedure. Derive from publish settings and npm scripts in the source code.}} -->

sdd-forge の公開は、現在パッケージが `alpha` dist-tag のプレリリースとして配布されているため、意図的な **2 ステップのプロセス**が必要です:

```bash
npm pack --dry-run                              # 機密ファイルが含まれていないことを確認
npm publish --tag alpha                         # alpha タグで公開（latest はまだ更新されない）
npm dist-tag add sdd-forge@<version> latest     # npmjs.com の latest に昇格
```

2 番目のステップをスキップすると `latest` タグが古いバージョンを指したままとなり、npmjs.com のパッケージページに新しいリリースが反映されません。公開されるアーティファクトには `src/`、`package.json`、`README.md`、`LICENSE` のみが含まれます（`package.json` の `files` フィールドで制御）。一度公開されたバージョンは、unpublish 後 24 時間は同じバージョン番号を再公開できないため、公開前に必ずバージョンバンプを確認してください。

<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text: Describe the programming language, runtime version requirements, and dependency policy. Extract from package.json.}} -->

sdd-forge は **ES Modules** 形式（`package.json` の `"type": "module"`）を使用した **JavaScript** で記述されており、**Node.js >=18.0.0** が必要です。最小バージョンは、組み込みテストランナー、`fs.readdirSync` の `withFileTypes` オプション、および安定した ESM サポートの可用性を確保するために選択されています。

本プロジェクトは**外部依存ゼロ**ポリシーを厳格に維持しており、`src/` 全体を通じて Node.js 組み込みモジュール（`fs`、`path`、`child_process` 等）のみを使用しています。サードパーティパッケージの追加は禁止されています。このポリシーによりインストールのフットプリントを最小限に抑え、サプライチェーンリスクを排除し、npm アクセスが制限される可能性のあるエアギャップ環境でもツールが動作することを保証します。

<!-- {{/text}} -->
