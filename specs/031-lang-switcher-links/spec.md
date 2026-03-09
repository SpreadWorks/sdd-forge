# Feature Specification: 031-lang-switcher-links

**Feature Branch**: `feature/031-lang-switcher-links`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User request
**Draft**: `specs/030-lang-switcher-links/draft.md`

## Goal

README および docs の各章ドキュメント上部に、別言語ページへの切替リンクを `{{data}}` ディレクティブで追加する。複数言語出力が設定されていない場合は何も表示しない。

## 実装方針（なぜこのアプローチか）

- 既存の `lang.links` は現在の言語を非表示にする・絵文字プレフィクスがある・絶対URL未対応など要件と合わない
- `docs.langSwitcher()` として `DocsSource` に新規追加する。DocsSource は既に `_repoUrl` を解決しており、絶対 URL 生成に必要な情報を持っている
- 言語表示名は i18n 言語ファイル（`ui.json`）に追加し、ハードコードを避ける

## Scope

### 1. `docs.langSwitcher()` データソースメソッド

- `src/docs/data/docs.js` の `DocsSource` クラスに `langSwitcher(analysis, labels)` メソッドを追加
- `labels[0]` で `"relative"` / `"absolute"` を受け取る
- 現在のファイルパスは `labels[1]` で受け取る（`data.js` / `readme.js` が注入）
- `config.json` の `output.languages` が 2 未満の場合は `null` を返す（何も出力しない）
- 出力形式: `[English](path) | **日本語**`（現在の言語は太字、他は相対/絶対リンク）

### 2. パス解決

- **相対パス**（`"relative"`）:
  - `docs/01_overview.md`（デフォルト en）→ 日本語: `ja/01_overview.md`
  - `docs/ja/01_overview.md` → 英語: `../01_overview.md`
  - `README.md`（ルート）→ 日本語: `docs/ja/README.md`
  - `docs/ja/README.md` → 英語: `../../README.md`
- **絶対 URL**（`"absolute"`）:
  - `package.json` の `repository` フィールドから GitHub URL を生成
  - 例: `https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md`

### 3. 言語表示名

- `src/locale/ja/ui.json` と `src/locale/en/ui.json` に `languageNames` セクションを追加
- 例: `{ "languageNames": { "en": "English", "ja": "日本語" } }`
- `DocsSource` は i18n を介してではなく、直接 locale ファイルを読んで取得する（DataSource は init 時に i18n インスタンスを受け取らないため）

### 4. ファイルパスコンテキストの注入

- `data.js`: 既存の `lang.links` と同様に、`docs.langSwitcher` 呼び出し時に `labels` にファイルパスを注入
- `readme.js`: README のパスコンテキストを `labels` に注入

### 5. テンプレート更新

- docs 章テンプレート（`src/presets/base/templates/ja/`, `en/` 等）の先頭に `{{data: docs.langSwitcher("relative")}}` を追加
- README テンプレート（`.sdd-forge/templates/ja/docs/README.md` 等）の先頭（タイトル直後）に `{{data: docs.langSwitcher("absolute")}}` を追加
- プリセット README テンプレート（`src/presets/node-cli/templates/ja/README.md` 等）も同様

## Out of Scope

- 既存の `lang.links` の修正・廃止（並存する）
- 3言語以上のテスト（2言語で動作すれば十分）
- config.json スキーマの変更（`languageLabels` の追加は見送り、i18n ファイルで対応）

## Clarifications (Q&A)

- Q: `lang.links` との棲み分けは？
  - A: `lang.links` は既存コードが参照している可能性があるため残す。`docs.langSwitcher` を推奨として新規追加。
- Q: DataSource から i18n を使えるか？
  - A: `init(ctx)` に i18n インスタンスは渡されない。locale JSON ファイルを直接読み込む。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-09
- Notes: Approved as-is

## Requirements

1. `DocsSource` に `langSwitcher(analysis, labels)` メソッドを追加する
2. `labels[0]` = `"relative"` / `"absolute"`、`labels[1]` = ファイルの相対パス
3. `output.languages` が 2 未満なら `null` を返す
4. 現在の言語を太字、他言語をリンクで出力する（`[English](path) | **日本語**`）
5. 相対パス: docs 階層と README の位置を考慮して自動解決
6. 絶対 URL: `package.json` の `repository` から GitHub URL を生成
7. 言語表示名を `src/locale/{lang}/ui.json` の `languageNames` セクションに追加
8. `data.js` で `docs.langSwitcher` 呼び出し時にファイルパスを `labels` に注入
9. `readme.js` で `docs.langSwitcher` 呼び出し時にファイルパスを `labels` に注入
10. docs 章テンプレートの先頭に `{{data: docs.langSwitcher("relative")}}` を追加
11. README テンプレートに `{{data: docs.langSwitcher("absolute")}}` を追加

## Acceptance Criteria

- [x] 複数言語設定時、docs 章ファイルの先頭に言語切替リンクが表示される
- [x] 複数言語設定時、README の先頭に言語切替リンクが表示される（絶対 URL）
- [x] 単一言語設定時、リンクは表示されない
- [x] 現在の言語は太字、他言語はリンク
- [x] 相対パスが正しく解決される（デフォルト言語 ↔ 非デフォルト言語）
- [x] 絶対 URL が `package.json` の `repository` から正しく生成される
- [x] 既存テスト（363 件）がパスする

## Open Questions

- `lang.links` を将来的に `docs.langSwitcher` に統合・置き換えるか
