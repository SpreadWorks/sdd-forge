<!-- @extends -->

<!-- @block: quickstart -->
## クイックスタート

### インストール

<pre>
# npm
npm install -g <!-- {{data: project.name("")}} --><!-- {{/data}} -->

# yarn
yarn global add <!-- {{data: project.name("")}} --><!-- {{/data}} -->

# pnpm
pnpm add -g <!-- {{data: project.name("")}} --><!-- {{/data}} -->
</pre>

### 基本コマンド

<pre>
# ヘルプ表示
<!-- {{data: project.name("")}} --><!-- {{/data}} --> help

# プロジェクトセットアップ
<!-- {{data: project.name("")}} --><!-- {{/data}} --> setup

# ドキュメント一括生成
<!-- {{data: project.name("")}} --><!-- {{/data}} --> build
</pre>
<!-- @endblock -->
