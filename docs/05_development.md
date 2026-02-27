# 05. 開発・テスト・配布

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

`npm link` を使ったビルド不要のローカル開発環境、外部依存ゼロの Node.js 実装、および `npm version` と `npm publish` による npm レジストリへのリリースフローを中心に構成された章である。テストフレームワークは現時点では導入されておらず、動作確認はコマンド直接実行による手動テストで行う。


## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text-fill: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` はシンボリックリンクを作成するため、`src/` 配下のソースファイルを直接参照する。パッケージは ES modules（`"type": "module"`）かつコンパイル不要の純粋な JavaScript で実装されているため、`src/` のファイルを編集すると次回コマンド実行時に即座に変更が反映される。ビルドステップや再インストールは不要である。

```bash
# npm link の確認
which sdd-forge                  # → /usr/local/bin/sdd-forge（グローバルリンク）
ls -la $(which sdd-forge)        # → .../sdd-forge/src/bin/sdd-forge.js へのシンボリックリンク
```

`npm link` を実行済みであれば、`src/` 配下のファイルを編集した後にコマンドを再実行するだけでよい。再リンクや再起動は不要である。


### ブランチ戦略とコミット規約

<!-- @text-fill: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

git status の情報（current branch: `development`, main branch: `main`）と、コミット履歴から確認できるコミットメッセージのパターン（`feat:`, `fix:`, `refactor:`, `docs:`, `chore:` 等の Conventional Commits 形式）を元に生成します。

`main` ブランチはリリース済みの安定版を管理し、`development` ブランチを日常の開発拠点とする。機能開発や修正は `development` 上で進め、リリース時に `main` へ squash merge する方針を採る。squash merge により `main` のコミット履歴を簡潔に保つ。

コミットメッセージは Conventional Commits 形式 `<type>: <subject>` で記述する。`type` には以下を用いる。

| type | 用途 |
| --- | --- |
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `refactor` | 動作を変えないコード整理 |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド・設定など雑務的変更 |
| `test` | テストの追加・修正 |

コミットメッセージは**英語**で記述すること。日本語は使用禁止。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text-fill: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

`package.json` に `scripts` フィールドも `devDependencies` も存在せず、テストフレームワークへの依存もない。テストディレクトリが存在しないことも確認できた。

現時点では自動テストの仕組みは未整備である旨を事実として記述します。

---

現時点では自動テストスイートは存在しない。`package.json` に `devDependencies` および `scripts.test` フィールドが定義されておらず、テストフレームワークも導入されていない。動作確認は手動で行う方針であり、`src/bin/sdd-forge.js` を直接 `node` で呼び出すことで各サブコマンドの挙動を検証する。フィクスチャやモックデータのディレクトリも現状は設けられていない。テスト戦略の整備は今後の課題であり、Node.js 組み込みの `node:test` モジュールまたは外部フレームワーク（例: Vitest）の導入が候補となる。


### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- @text-fill: development → main への squash merge からnpm publish までのリリース手順を説明してください。 -->

`development` ブランチでの開発が完了したら、GitHub 上でプルリクエストを作成し `main` ブランチへ squash merge する。merge 後は `main` ブランチをチェックアウトし、変更の規模に応じて `npm version patch`（バグ修正）または `npm version minor`（機能追加）を実行する。このコマンドは `package.json` の `version` フィールドを更新し、対応するバージョンタグ（例: `v0.1.1`）を自動的に作成する。その後 `git push origin main --tags` でタグを含めてリモートへ push する。最後に `npm publish` を実行すると、`package.json` の `"files": ["src/"]` で指定されたファイル群のみが npm レジストリへ公開される。公開前に `npm pack --dry-run` でパッケージ内容を確認しておくと安全である。


### 技術スタックと依存関係

<!-- @text-fill: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

実装言語は JavaScript（ES modules）で、Node.js 18.0.0 以上を要件とする。`"type": "module"` が指定されており、すべてのソースファイルは ESM 形式（`import`/`export`）で記述される。`package.json` に `dependencies` および `devDependencies` フィールドは存在せず、外部 npm パッケージへの依存はゼロである。ファイル入出力・パス操作・子プロセス起動などはすべて Node.js 組み込みモジュール（`fs`、`path`、`child_process`、`readline` 等）で実装している。依存ゼロ設計により、`npm install` 不要でインストール直後から使用可能であり、依存ライブラリに起因する脆弱性・バージョン競合が発生しない。
