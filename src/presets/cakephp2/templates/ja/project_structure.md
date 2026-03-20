<!-- {%extends%} -->

<!-- {%block "directory-tree"%} -->
### ディレクトリ構成

<!-- {{text({prompt: "プロジェクトのディレクトリ一覧をツリー形式で出力してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "directory-roles"%} -->
### 各ディレクトリの責務

<!-- {{text({prompt: "主要ディレクトリ（Config/Console/Controller/Model/View/Lib/Plugin）の責務をファイル数とともに表形式で記述してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "libraries"%} -->
### 共通ライブラリ (Lib/)

<!-- {{data("cakephp2.libs.list", {labels: "クラス|ファイル|責務"})}} -->
<!-- {{/data}} -->

### View 層

#### ヘルパー

<!-- {{data("cakephp2.views.helpers", {labels: "ヘルパー|継承元|責務"})}} -->
<!-- {{/data}} -->

#### レイアウト

<!-- {{data("cakephp2.views.layouts", {labels: "ファイル|用途"})}} -->
<!-- {{/data}} -->

#### エレメント

<!-- {{data("cakephp2.views.elements", {labels: "ファイル|用途"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
