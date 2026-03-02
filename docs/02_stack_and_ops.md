# 02. 技術スタックと運用

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。 -->

本プロジェクトは Node.js（>=18.0.0）上で動作する ES Modules ベースの CLI ツールです。外部依存パッケージを持たず、Node.js 組み込みモジュールのみで構成されています。

## 内容

### 技術スタック

<!-- @data: table(config.stack, labels=カテゴリ|技術|バージョン) -->
| カテゴリ | 技術 | バージョン |
| --- | --- | --- |
| — | — | — |

### 依存パッケージ

<!-- @text: プロジェクトの依存パッケージ管理方法を説明してください。 -->

本パッケージは外部依存パッケージを持ちません。`package.json` に `dependencies` や `devDependencies` は定義されておらず、Node.js の組み込みモジュール（`fs`、`path`、`child_process` など）のみを使用しています。インストールは `npm install -g sdd-forge` で行い、追加のパッケージインストールは不要です。

### デプロイフロー

<!-- @text: デプロイの手順とフローを説明してください。 -->

本ツールは npm パッケージとして配布します。リリース時は以下の手順で公開します。

1. `package.json` の `version` を更新します（例：`0.1.0-alpha.3` → `0.1.0`）
2. `npm publish` で npm レジストリに公開します
3. 利用者は `npm install -g sdd-forge` でインストールします

プロジェクトへの適用は `sdd-forge setup` を実行することで行います。`setup` コマンドがプロジェクト登録・設定ファイル生成・AGENTS.md 初期化を一括で処理します。

### 運用フロー

<!-- @text: 運用手順を説明してください。 -->

日常運用は以下の流れで行います。

- **ドキュメント更新**: ソースコードを変更した後に `sdd-forge build` を実行すると、scan → init → data → text → readme の各ステップが自動的に実行され、`docs/` 配下のドキュメントが最新の状態に更新されます。
- **機能追加・改修**: SDD フローに従い、`sdd-forge spec` → `sdd-forge gate` → 実装 → `sdd-forge forge` → `sdd-forge review` の順で進めます。
- **変更履歴管理**: `sdd-forge changelog` を実行すると `specs/` 内の spec ファイルをもとに `change_log.md` が生成されます。
- **AGENTS.md 更新**: `sdd-forge agents` を実行すると `analysis.json` の内容をもとに AGENTS.md の PROJECT セクションが更新されます。
```

---

各ディレクティブに対して挿入した内容は以下の通りです。

- **説明（概要）**: Node.js >=18 / ESM / 外部依存なし という技術的特徴を1〜2文でまとめました。
- **依存パッケージ**: `package.json` に依存定義がなく組み込みモジュールのみという事実を説明しました。
- **デプロイフロー**: npm publish による配布手順と `sdd-forge setup` によるプロジェクト適用手順を記載しました。
- **運用フロー**: `build`・SDD フロー・`changelog`・`agents` の4つの典型的な運用パターンを箇条書きで説明しました。
