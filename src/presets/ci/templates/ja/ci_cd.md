<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# CI/CD

<!-- {%block "description"%} -->
## 概要

<!-- {{text({prompt: "このプロジェクトの CI/CD 構成について1〜2文で概要を記述してください。使用プラットフォームと主な目的（テスト、デプロイ等）を含めてください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "pipelines"%} -->
<!-- {{data("ci.pipelines.list", {header: "## パイプライン\n", labels: "名前|ファイル|トリガー|ジョブ数", ignoreError: true})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "jobs"%} -->
<!-- {{data("ci.pipelines.jobs", {header: "## ジョブ詳細\n", labels: "パイプライン|ジョブ|ランナー|ステップ数|依存", ignoreError: true})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "env"%} -->
<!-- {{data("ci.pipelines.env", {header: "## シークレットと環境変数\n", labels: "パイプライン|シークレット|環境変数", ignoreError: true})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%/block%} -->
