# Draft: 030 - docs/README 言語切替リンク

**Status**: Approved
**Created**: 2026-03-09

## 要件

README および docs の各ドキュメント上部に、別言語ページへのリンクを追加する。

### 仕様

- `{{data: docs.langSwitcher("relative")}}` / `{{data: docs.langSwitcher("absolute")}}` を新規追加
- 複数言語設定時のみ出力（単一言語なら空文字）
- 現在の言語は太字、他言語はリンク
  - 例: `[English](../01_overview.md) | **日本語**`
- 相対パスは自動解決（docs 階層、README の位置を考慮）
- 絶対 URL は `package.json` の `repository` フィールドから生成
- 言語表示名は i18n 言語ファイルから取得
- テンプレート（docs 章ファイル + README テンプレート）の先頭に `{{data}}` ディレクティブを追加

### パス解決

- `docs/01_overview.md`（デフォルト言語 en）→ `[日本語](ja/01_overview.md)`
- `docs/ja/01_overview.md`（日本語）→ `[English](../01_overview.md)`
- `README.md`（デフォルト）→ `[日本語](docs/ja/README.md)`（相対）
- `docs/ja/README.md`（日本語）→ `[English](../../README.md)`（相対）
- README で absolute 指定時は `https://github.com/.../blob/main/...` 形式

### 実装場所

- データソース: `src/docs/data/docs.js` に `langSwitcher()` 関数を追加
- 言語表示名: i18n 言語ファイルにマッピングを追加

## Draft Confirmation
- [x] User approved this draft
- Confirmed at: 2026-03-09
