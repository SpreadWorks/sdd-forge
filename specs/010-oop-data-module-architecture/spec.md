# Feature Specification: 010-oop-data-module-architecture

**Feature Branch**: `feature/010-oop-data-module-architecture`
**Created**: 2026-03-04
**Status**: Approved
**Input**: User request

## Goal
- @data ディレクティブの解決を OOP ベースの DataSource アーキテクチャに移行する
- scan + resolve を自己完結した class ベースのモジュールに統合する
- ディレクティブ構文を関数呼び出し形式に変更し、任意のメソッドを呼べるようにする

## Scope
- DataSource 基底クラスの設計・実装
- ディレクティブ構文の変更: `@data: category.method("labels")`（メソッド名は常に必須）
- directive-parser.js の新構文対応
- cakephp2 preset の DataSource 移行（controllers を先行実装）
- resolver-factory.js の DataSource 対応
- data.js の呼び出し側変更
- 旧構文の廃止（後方互換不要）

## Out of Scope
- 全カテゴリの一括移行（段階的に実施）
- @text ディレクティブの変更
- renderer の変更

## Clarifications (Q&A)
- Q: 旧構文 `@data: renderer(category, labels=...)` との後方互換は必要か？
  - A: 不要。旧構文は廃止する。
- Q: メソッド名省略時のデフォルト（main）は必要か？
  - A: 不要。常にメソッド名を明示する。自己文書化と一貫性を優先。
- Q: クラス名は？
  - A: DataSource。scan（データ取得）+ resolve（データ整形）の両方を表現。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-04
- Notes: DataSource に決定。main 廃止、後方互換不要。

## Requirements

### 1. DataSource 基底クラス
```js
// src/docs/lib/data-source.js
class DataSource {
  // 必須: サブクラスで実装
  scan(sourceRoot) { throw new Error("scan() must be implemented"); }

  // 共通ユーティリティ（継承可能）
  toRows(items, mapper) { /* items を [col1, col2, ...] の配列に変換 */ }
  toMarkdownTable(rows, labels) { /* Markdown テーブル生成 */ }
}
```

### 2. ディレクティブ新構文
```
<!-- @data: controllers.list("コントローラ名|ファイル|主な責務") -->   → list() を呼ぶ
<!-- @data: controllers.deps("依存先|依存元") -->                     → deps() を呼ぶ
<!-- @data: controllers.csv("コントローラ名|アクション数") -->        → csv() を呼ぶ
<!-- @data: tables.fk("テーブル|カラム|参照先") -->                   → fk() を呼ぶ
```
- メソッド名は常に必須（省略不可）
- ラベルは `("...")` 内にパイプ区切りで指定

### 3. preset の DataSource 実装例
```js
// src/presets/cakephp2/data/controllers.js
import { DataSource } from "../../../docs/lib/data-source.js";

class ControllersSource extends DataSource {
  scan(sourceRoot) { /* 既存の analyzeControllers ロジック */ }
  list(analysis, labels) { /* コントローラ一覧テーブル */ }
  deps(analysis, labels) { /* 依存関係テーブル */ }
  csv(analysis, labels) { /* CSV形式出力 */ }
}

export default new ControllersSource();
```

### 4. resolver-factory.js の変更
- DataSource インスタンスを preset の data/ ディレクトリからロード
- `category.method` でメソッドを解決
- 旧 resolve.js は段階的に廃止

### 5. directive-parser.js の変更
- 新構文 `@data: category.method("labels")` をパース
- 旧構文は廃止

## Acceptance Criteria
- [ ] DataSource 基底クラスが存在し、scan() の未実装で throw する
- [ ] 新構文のディレクティブがパースされ、正しいメソッドが呼ばれる
- [ ] cakephp2 の controllers が DataSource として動作する
- [ ] super でユーティリティメソッドが呼べる
- [ ] 全既存テスト（289件）が通る（旧テンプレートのテスト更新含む）

## Open Questions
- (resolved)
