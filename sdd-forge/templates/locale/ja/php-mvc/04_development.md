# 04. 開発ガイド

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。Docker セットアップ、テスト構成、SDD ツール群を踏まえること。 -->

## 内容

### Docker セットアップ

```bash
# 初回セットアップ
npm run docker:init

# 通常起動
npm run docker:up

# コンテナ停止
npm run docker:stop
```

### npm scripts（Docker 操作）

<!-- @text-fill: package.json に定義されている Docker 操作コマンドを表形式で記述してください。 -->

### ローカル開発手順

<!-- @text-fill: Docker 環境でのローカル開発手順（起動→コーディング→テスト→確認）を記述してください。 -->

### SDD ツール

| コマンド | 説明 |
| --- | --- |
| `npm run sdd:spec -- --title "..."` | spec 初期化（feature ブランチ + spec.md 作成） |
| `npm run sdd:gate -- --spec ...` | spec ゲート（未解決事項チェック） |
| `npm run sdd:init` | docs 初期化（テンプレートから docs/ を生成） |
| `npm run sdd:review` | docs レビュー（構造・内容・網羅性チェック） |
| `npm run sdd:forge -- --prompt "..."` | docs 反復改善 |
| `npm run sdd:flow -- --request "..."` | SDD フロー自動実行 |

### ソースコード解析

| コマンド | 説明 |
| --- | --- |
| `npm run sdd:scan` | 全解析 |
| `npm run sdd:scan:ctrl` | コントローラ解析 |
| `npm run sdd:scan:model` | モデル解析 |
| `npm run sdd:scan:shell` | Shell 解析 |
| `npm run sdd:scan:route` | ルート解析 |

### AI エージェント選択

<!-- @text-fill: sdd:forge や sdd:flow で使用できる AI エージェント選択（--agent オプション）について記述してください。 -->

### テスト構成

<!-- @text-fill: テストフレームワークとテスト実行方法を説明してください。 -->

<!-- @data-fill: table(tests, labels=項目|件数|ディレクトリ) -->

### 設定定数リファレンス

#### スカラー定数

<!-- @data-fill: table(config.constants, labels=定数名|値|説明) -->

#### 選択肢定数

<!-- @data-fill: table(config.constants.select, labels=定数名|選択肢) -->
