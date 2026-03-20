<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# CLI コマンドリファレンス

<!-- {%block "description"%} -->
## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。"})}} -->
<!-- {{/text}} -->

## 内容
<!-- {%/block%} -->

<!-- {%block "command-list"%} -->
### コマンド一覧

<!-- {{data("cli.commands.list", {labels: "コマンド|説明"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "global-options"%} -->
### グローバルオプション

<!-- {{data("cli.commands.globalOptions", {labels: "オプション|型|デフォルト|説明"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "command-details"%} -->
### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "exit-codes"%} -->
### 終了コードと出力

<!-- {{data("cli.commands.exitCodes", {labels: "コード|意味"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
