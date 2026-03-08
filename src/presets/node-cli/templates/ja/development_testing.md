# 05. 開発・テスト・配布

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。}} -->

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- {{text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。}} -->

### ブランチ戦略とコミット規約

<!-- {{text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。}} -->

### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- {{text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- {{text: development → main への squash merge からnpm publish までのリリース手順を説明してください。}} -->

### 技術スタックと依存関係

<!-- {{text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。}} -->
