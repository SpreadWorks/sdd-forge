<!-- {%extends%} -->

<!-- {%block "dependencies"%} -->
### PHP 依存パッケージ (composer.json)

<!-- {{data("cakephp2.config.composer", {labels: "パッケージ|バージョン|用途"})}} -->
<!-- {{/data}} -->

### docker-compose.yml 構成

<!-- {{data("cakephp2.docker.list", {labels: "サービス|コンテナ名|ポート|イメージ"})}} -->
<!-- {{/data}} -->

### フロントエンドライブラリ

<!-- {{data("cakephp2.config.assets", {labels: "ライブラリ|バージョン|用途"})}} -->
<!-- {{/data}} -->

### エラーハンドリング

<!-- {{data("cakephp2.libs.errors", {labels: "クラス|ファイル|責務"})}} -->
<!-- {{/data}} -->

### アプリケーション初期化 (bootstrap.php)

<!-- {{data("cakephp2.config.bootstrap", {labels: "設定項目|値"})}} -->
<!-- {{/data}} -->

### メール通知仕様

<!-- {{text({prompt: "メール送信設定のデフォルト値（送信元、トランスポート）を説明してください。", mode: "deep"})}} -->
<!-- {{/text}} -->

<!-- {{data("cakephp2.email.list", {labels: "送信元ファイル|件名パターン|CC"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "deploy"%} -->
### デプロイフロー

※ デプロイ手順は本番運用チームに確認が必要。ソースコード内にデプロイスクリプトは含まれない。
<!-- {%/block%} -->

<!-- {%block "operations"%} -->
### 運用フロー

※ 運用手順は本番運用チームに確認が必要。
<!-- {%/block%} -->
