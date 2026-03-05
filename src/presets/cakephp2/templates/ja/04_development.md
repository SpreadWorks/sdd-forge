<!-- @extends -->

<!-- @block: setup -->
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

<!-- {{text: package.json に定義されている Docker 操作コマンドを表形式で記述してください。}} -->
<!-- @endblock -->

<!-- @block: dev-workflow -->
### ローカル開発手順

<!-- {{text: Docker 環境でのローカル開発手順（起動→コーディング→テスト→確認）を記述してください。}} -->

### ソースコード解析

| コマンド | 説明 |
| --- | --- |
| `sdd-forge scan` | 全解析 |
| `sdd-forge scan:ctrl` | コントローラ解析 |
| `sdd-forge scan:model` | モデル解析 |
| `sdd-forge scan:shell` | Shell 解析 |
| `sdd-forge scan:route` | ルート解析 |

### AI エージェント選択

<!-- {{text: sdd-forge の AI エージェント選択（--agent オプション）について記述してください。}} -->
<!-- @endblock -->

<!-- @block: testing -->
### テスト構成

<!-- {{text: テストフレームワークとテスト実行方法を説明してください。}} -->

<!-- {{data: tests.list("項目|件数|ディレクトリ")}} -->
<!-- {{/data}} -->

### 設定定数リファレンス

#### スカラー定数

<!-- {{data: config.constants("定数名|値|説明")}} -->
<!-- {{/data}} -->

#### 選択肢定数

<!-- {{data: config.constantsSelect("定数名|選択肢")}} -->
<!-- {{/data}} -->
<!-- @endblock -->
