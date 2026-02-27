# 09. 開発ガイド

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・開発フロー・SDD ワークフローを踏まえること。 -->

## 内容

### ローカル開発環境のセットアップ

```bash
# リポジトリのクローン
git clone <repository>
cd <project>

# npm link でグローバルコマンドとして登録
npm link

# 動作確認
<command> help
```

### 開発時のコマンド実行

<!-- @text-fill: 開発中にツール自身を実行する方法（npm link / node src/bin/... 直接実行 等）を説明してください。 -->

### ブランチ戦略

<!-- @text-fill: ブランチ運用ルール（main/development の役割・feature ブランチの命名規則・マージ方針）を説明してください。 -->

### コミット規約

<!-- @text-fill: コミットメッセージの形式（Conventional Commits 等）と type の種類を説明してください。 -->

### SDD ツール

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化（feature ブランチ + spec.md 作成） |
| `sdd-forge gate --spec ...` | spec ゲート（未解決事項チェック） |
| `sdd-forge init` | docs 初期化（テンプレートから docs/ を生成） |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |
| `sdd-forge flow --request "..."` | SDD フロー自動実行 |

### プロジェクトワークスペース

<!-- @text-fill: sdd-forge add / sdd-forge default を使ったプロジェクトワークスペースの管理方法を説明してください。 -->

### 新機能の追加手順

<!-- @text-fill: 新しいコマンドや機能を追加する際の標準的な手順（ファイル追加・ディスパッチャ登録・ヘルプ更新等）をステップ形式で説明してください。 -->
