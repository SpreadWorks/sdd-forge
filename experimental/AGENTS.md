# experimental

このドキュメントは `experimental/` 配下のコードとテストのルールを定義する。

## 目的

- `experimental/` は試験的なワークフローや補助ツールを置く領域である
- `experimental/workflow.js` はボード操作や Issue 化などの運用補助 CLI（dispatcher アーキテクチャ）

## テスト

- **MUST: `experimental/` 配下のコードをテストするファイルは `experimental/tests/` に置くこと。**
- **MUST: `experimental/` 配下のテストを `tests/unit/` や `tests/e2e/` に置いてはならない。**
- `experimental/workflow.js` や `experimental/workflow/lib/*.js` のテストは `experimental/tests/*.test.js` に置く
- テスト内の import は `experimental/` 配下の相対パスを使う

## ボード運用コード

- `experimental/workflow.js` をボード操作の唯一の入口として扱う
- 詳細な運用ルールは skill `sdd-forge.exp.workflow` を参照（`config.experimental.workflow.enable` を true にして `sdd-forge upgrade` で配置）
- 出力は JSON envelope 形式（`{ ok, type, key, data, errors }`）
