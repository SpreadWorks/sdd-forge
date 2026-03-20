<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# CI/CD

<!-- {%block "description"%} -->
## 概要

<!-- {{text({prompt: "このプロジェクトの CI/CD 構成について1〜2文で概要を記述してください。使用プラットフォームと主な目的（テスト、デプロイ等）を含めてください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "pipelines"%} -->
## パイプライン

<!-- {{data("ci.pipelines.list", {labels: "名前|ファイル|トリガー|ジョブ数"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "jobs"%} -->
## ジョブ詳細

<!-- {{data("ci.pipelines.jobs", {labels: "パイプライン|ジョブ|ランナー|ステップ数|依存"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "env"%} -->
## シークレットと環境変数

<!-- {{data("ci.pipelines.env", {labels: "パイプライン|シークレット|環境変数"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%/block%} -->
