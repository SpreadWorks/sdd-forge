# Feature Specification: 073-build-issues-2026-03-19

**Feature Branch**: `feature/073-build-issues-2026-03-19`
**Created**: 2026-03-19
**Status**: Draft
**Input**: OOS_echub (hono+nextjs+drizzle+workers+r2+rest) での build 結果から抽出した不具合・改善を一括修正

## Goal

build パイプラインの出力品質を改善する。テンプレート構造の破壊（B1）、README 章順序の誤り（B3）、概要文の装飾残り（B4）を修正し、data が null の場合にセクションごと非表示にする header/footer 機能（I1）を追加する。加えてテンプレートタイトルの汎用化（I5/I6）を行う。

## Scope

### コード修正

1. **B1: テンプレート見出しを @block 内に移動**
   - 全プリセットのテンプレートで、`@block` の外にある見出しを `@block` 内に移動
   - 対象: `src/presets/*/templates/` 配下の `.md` ファイル

2. **B3: ctx.type を DocsSource に伝播**
   - `src/docs/lib/resolver-factory.js` の `createResolver()` で ctx に `type` を含める
   - `DocsSource.chapters()` が `resolveChaptersOrder()` の順序を使用するようになる

3. **B4: README 概要文の markdown strip**
   - `src/docs/data/docs.js` の `chapters()` メソッドで概要テキストから markdown 記法を除去
   - 対象: `**bold**`, `__bold__`, `*italic*`, `_italic_`, `[link](url)`, `` `code` ``, `~~strike~~`

4. **I1: data ディレクティブの header/footer 非表示機能**
   - `src/docs/lib/directive-parser.js` に `<!-- {{header}} -->` / `<!-- {{/header}} -->` / `<!-- {{footer}} -->` / `<!-- {{/footer}} -->` の解析を追加
   - `resolveDataDirectives()` で data が null の場合、header/footer 内容を HTML コメント化
   - data が値を持つ場合は header → data → footer の順に表示
   - header, footer ともに任意（なくても従来通りの動作）

### テンプレート修正

5. **I5: プリセット固有用語のタイトルを汎用表現に変更**
   - 「Drizzle スキーマ」→「データベーススキーマ」等
   - 実装時に全テンプレートを洗い出して修正

6. **I6: 親子プリセット間のタイトル体系統一**
   - 実装時に全テンプレートを洗い出して修正

7. **B2/B5/I7: data null 時の自動非表示**
   - I1 の header/footer 機能を使って、data が null のセクションを非表示にする
   - 該当テンプレートに `<!-- {{header}} -->` を追加

## Out of Scope

- I2: モノレポでの対象アプリケーション表示
- I3: 章間ナビゲーションリンク
- I4: CI/CD プリセット新設
- I8: テンプレートの text 過多（DataSource 順次追加）

## Clarifications (Q&A)

- Q: B1 はアルゴリズム修正（stripBlockDirectives を賢くする）とテンプレート修正どちらか？
  - A: テンプレート修正（方針 A）。テンプレートは全て我々が管理しており、見出しを @block 内に含める方がシンプルで正しい。

- Q: I1 の header/footer は両方必須か？
  - A: いずれも任意。必要なときだけ設定する。

- Q: I5/I6 の対象テンプレートはドラフト時に列挙するか？
  - A: 実装時に洗い出して修正する。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-19
- Notes: All requirements confirmed

## Requirements

1. `stripBlockDirectives` 後にテンプレートの見出しとコンテンツの位置関係が正しいこと（B1）
2. README の章テーブルが `resolveChaptersOrder()` の順序で表示されること（B3）
3. README の章テーブルの概要文に markdown 記法（`**`, `__`, `*`, `_`, `[]()`, `` ` ``, `~~`）が含まれないこと（B4）
4. `<!-- {{header}} -->` / `<!-- {{/header}} -->` タグが `{{data}}` ブロック内で認識されること（I1）
5. `<!-- {{footer}} -->` / `<!-- {{/footer}} -->` タグが `{{data}}` ブロック内で認識されること（I1）
6. data が null の場合、header/footer 内容が HTML コメント内に折り畳まれること（I1）
7. data が値を持つ場合、header → data → footer の順に表示されること（I1）
8. header/footer がない場合、従来通りの動作であること（I1 後方互換）
9. プリセット固有用語がテンプレートタイトルに含まれないこと（I5）
10. 親子プリセット間でタイトル体系が統一されていること（I6）

## Acceptance Criteria

- `npm test` が全件パスする
- `sdd-forge review` で B1 由来の residualBlock / exposedDirective が検出されない
- I1: header/footer 付き data ディレクティブで data=null → header/footer がコメント化
- I1: header/footer 付き data ディレクティブで data=value → header, data, footer が正しく表示
- I1: header/footer なしの data ディレクティブ → 従来通りの動作
- B3: README の章テーブルが preset chapters 順
- B4: README の章テーブル概要文に `**` 等が含まれない

## Open Questions

(なし)
