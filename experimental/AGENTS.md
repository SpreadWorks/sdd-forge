# experimental

このドキュメントは `experimental/` 配下のコードとテストのルールを定義する。

## 目的

- `experimental/` は試験的なワークフローや補助ツールを置く領域である
- `experimental/workflow/` にはボード操作や Issue 化などの運用補助コードを置く

## テスト

- **MUST: `experimental/` 配下のコードをテストするファイルは `experimental/tests/` に置くこと。**
- **MUST: `experimental/` 配下のテストを `tests/unit/` や `tests/e2e/` に置いてはならない。**
- `experimental/workflow/*.js` や `experimental/workflow/lib/*.js` のテストは `experimental/tests/*.test.js` に置く
- テスト内の import は `experimental/` 配下の相対パスを使う

## ボード運用コード

- `experimental/workflow/board.js` をボード操作の唯一の入口として扱う
- ボード Draft は日本語で扱い、Issue 化は `node experimental/workflow/board.js to-issue <hash> [--label ...]` を使う
