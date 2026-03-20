<!-- {%extends%} -->

<!-- {%block "auth-method"%} -->
### 認証方式

<!-- {{text({prompt: "Symfony の認証方式を説明してください。Security Bundle の設定（config/packages/security.yaml）、ファイアウォール、プロバイダ、認証器（authenticator）を含めること。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "acl"%} -->
### 認可（Authorization）

<!-- {{text({prompt: "Voter、Security attribute（#[IsGranted]）、ロール階層によるアクセス制御の概要を説明してください。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "session"%} -->
### セッション管理

<!-- {{text({prompt: "セッション管理方式を config/packages/framework.yaml のセッション設定から説明してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "login-flow"%} -->
### ログインフロー

<!-- {{text({prompt: "ログイン処理のフローを mermaid sequenceDiagram で生成してください。出力は mermaid コードブロックのみ。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
