# 02. 技術スタックと運用

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。 -->

本章では、sdd-forge が採用する技術スタックおよびリリース・運用の手順を説明します。Node.js（>=18.0.0）をランタイムとし、外部依存パッケージを持たないピュアな ES modules 製 CLI ツールとして構成されています。

## 内容

### 技術スタック

<!-- @data: table(config.stack, labels=カテゴリ|技術|バージョン) -->
| カテゴリ | 技術 | バージョン |
| --- | --- | --- |
| — | — | — |

### 依存パッケージ

<!-- @text: プロジェクトの依存パッケージ管理方法を説明してください。 -->

sdd-forge は外部依存パッケージを持たず、Node.js 組み込みモジュールのみで動作します。そのため `npm install` による依存解決は不要で、`package.json` はメタデータ・bin エントリ・`files` フィールドの管理に使用します。モジュールシステムは ES modules（`"type": "module"`）を採用しており、すべての `import`/`export` は ESM 構文で記述します。npm に公開されるファイルは `files` フィールドで `["src/"]` に限定されており、`src/` ディレクトリと `package.json`・`README.md`・`LICENSE` のみがパッケージに含まれます。

### デプロイフロー

<!-- @text: デプロイの手順とフローを説明してください。 -->

sdd-forge は npm パッケージとして公開されます。リリースはユーザーが明示的に指示した場合のみ実行し、以下の手順で行います。

1. `npm pack --dry-run` を実行し、公開対象ファイル（`src/`・`package.json`・`README.md`・`LICENSE`）に機密情報が含まれていないことを確認します。
2. `npm publish --tag alpha` でパッケージを公開します。このままでは `latest` タグは更新されません。
3. `npm dist-tag add sdd-forge@<version> latest` を実行して `latest` タグを更新し、npmjs.com のパッケージページに反映させます。

一度公開したバージョン番号の再利用はできないため、公開前にバージョンを慎重に確認してください。また、短時間に連続して publish するとnpm レジストリのレート制限に抵触する場合があります。

### 運用フロー

<!-- @text: 運用手順を説明してください。 -->

日常的な運用は sdd-forge の CLI コマンドを通じて行います。ドキュメントの一括更新は `sdd-forge build` で実行し、ソースコードとの鮮度差異が生じた場合も同コマンドで解消できます。テストは `npm run test`（内部的に `find tests -name '*.test.js' | xargs node --test` を実行）で行います。機能追加・修正時は SDD フローに従い、`sdd-forge spec` → `sdd-forge gate` → 実装 → `sdd-forge forge` → `sdd-forge review` の順で進めてください。実装変更後は必ず `sdd-forge forge` と `sdd-forge review` を実行し、docs とソースコードの整合性を維持することが重要です。
