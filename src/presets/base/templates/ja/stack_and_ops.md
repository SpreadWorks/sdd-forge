<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

<!-- {%block "description"%} -->
## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->
<!-- {{/text}} -->

## 内容
<!-- {%/block%} -->

<!-- {%block "stack"%} -->
### 技術スタック

<!-- {{data("base.config.stack", {labels: "カテゴリ|技術|バージョン"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "dependencies"%} -->
### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "deploy"%} -->
### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "operations"%} -->
### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
