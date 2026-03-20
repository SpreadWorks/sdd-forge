# Draft: 章間ナビゲーションリンク + layout テンプレート

## ユーザー要望
各章の末尾に `← 前の章 | 次の章 →` のようなナビゲーションリンクを追加する。

## 決定事項

### Q&A
1. **出力形式**: シンプルなテキストリンク `← 前の章 | 次の章 →`
2. **配置位置**: 章の末尾のみ
3. **目次リンク**: 不要（前後リンクのみ）
4. **実現方法**: `layout.md` テンプレートを導入し、全章共通の要素を一箇所で管理
5. **@extends 拡張**: `<!-- @extends: layout -->` で別名ファイルを継承可能にする
6. **layout の継承**: 通常のテンプレートと同じ preset チェーンで解決（base → arch → leaf）
7. **端の扱い**: 最初の章は「次の章 →」のみ、最後の章は「← 前の章」のみ
8. **langSwitcher 移行**: 既存テンプレートの langSwitcher を layout.md に移動

## スコープ

### 含む
1. **@extends: <name> 構文の追加**: directive-parser.js で別名ファイル指定をサポート
2. **template-merger.js の拡張**: @extends: <name> による別名ファイル解決
3. **layout.md の作成**: base preset に langSwitcher + nav を含むレイアウトテンプレート
4. **docs.nav DataSource**: chaptersOrder から前後リンクを生成
5. **data.js の wrappedResolveFn 拡張**: nav にファイルパスコンテキストを注入
6. **既存テンプレートの移行**: 各テンプレートの langSwitcher を削除し `@extends: layout` に差し替え

### 含まない
- layout.md 以外の共通要素の追加（将来の別 spec）
- README.md のナビゲーション（README は章ではない）
- 翻訳言語ディレクトリ内のナビゲーション（translate で自動生成されるため）

## 設計概要

### layout.md (base/templates/{lang}/layout.md)
```markdown
<!-- {{data: docs.langSwitcher("relative")}} -->
<!-- {{/data}} -->

<!-- @block: content -->
<!-- @endblock -->

---

<!-- {{data: docs.nav("")}} -->
<!-- {{/data}} -->
```

### @extends: layout の動作
1. `<!-- @extends: layout -->` をパース → ターゲットファイル名 `layout.md` を取得
2. template-merger が現在のファイルと同じレイヤーチェーンで `layout.md` を解決
3. 章の内容が `@block: content` に入る
4. 通常の @extends（引数なし）は既存動作を維持

### docs.nav DataSource
- `docs.nav("")` で呼び出し
- data.js の wrappedResolveFn がファイルパスを注入
- chaptersOrder から現在ファイルの前後を特定
- 出力例: `[← 01. Overview](01_overview.md) | [03. Development →](03_development.md)`

## 承認
- [x] User approved this draft
- Confirmed at: 2026-03-19
