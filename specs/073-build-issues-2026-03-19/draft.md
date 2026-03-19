# Draft: Build Issues 2026-03-19

OOS_echub (hono+nextjs+drizzle+workers+r2+rest) の build 結果から抽出した不具合・改善を一括修正する。

## スコープ

### コード修正

| ID | 概要 | 修正対象 |
|---|---|---|
| B1 | stripBlockDirectives で見出しとコンテンツの順序逆転 | テンプレート（見出しを @block 内に移動） |
| B3 | README 章の表示順がアルファベット順 | `resolver-factory.js` — ctx に type を伝播 |
| B4 | README 章リストの概要文に ** 強調が含まれる | `docs/data/docs.js` — markdown strip 追加 |
| I1 | data ディレクティブの header/footer 非表示機能 | `directive-parser.js` — header/footer パース・折り畳み |

### テンプレート修正

| ID | 概要 |
|---|---|
| I5 | プリセット固有用語のタイトルを汎用表現に変更 |
| I6 | 親子プリセット間のタイトル体系を統一 |
| B2 | webapp.config.stack が空 → I1 で自動非表示 |
| B5 | controller_routes.md に UNRESOLVED → I1 で自動非表示 |
| I7 | 該当なしセクション → I1 で自動非表示 |

### スコープ外（別 spec）

- I2: モノレポでの対象アプリケーション表示
- I3: 章間ナビゲーションリンク
- I4: CI/CD プリセット新設
- I8: テンプレートの text 過多（DataSource 順次追加）

## 方針詳細

### B1: テンプレート見出しを @block 内に移動

**問題**: `@block` の外に見出しがあり、`@block` 内にコンテンツがある場合、`stripBlockDirectives` で `@block` 行を除去してもコンテンツ位置は変わらず、見出しとコンテンツの対応が崩れる。

**対処**: 全テンプレートで見出しを `@block` の中に含める。子テンプレートがブロックを上書きする際、見出しも一緒に差し替わるため、構造が崩れない。

### B3: ctx.type を DocsSource に伝播

**問題**: `createResolver()` が `ctx` に `type` を含めないため、`DocsSource.chapters()` が `getChapterFiles()` のアルファベット順フォールバックに常に落ちる。

**対処**: `resolver-factory.js` の ctx 構築で `type` と `configChapters` を渡す。呼び出し元（readme.js, data.js）から `type` を `opts` 経由で伝播。

### B4: README 概要文の markdown strip

**問題**: `DocsSource.chapters()` が章の `## Description` セクションから概要を取得する際、AI 生成テキストに含まれる `**bold**` 等の markdown 記法がそのまま残る。

**対処**: 概要テキスト抽出後に markdown 記法を strip する関数を追加。対象: `**bold**`, `__bold__`, `*italic*`, `_italic_`, `[link](url)`, `` `code` ``, `~~strike~~`。

### I1: data header/footer 非表示機能

**問題**: data ディレクティブが null を返した場合、見出しやテーブルヘッダーが空のまま残る。

**対処**: `<!-- {{header}} -->` / `<!-- {{/header}} -->` と `<!-- {{footer}} -->` / `<!-- {{/footer}} -->` タグを認識し、data が null の場合にコンテンツを HTML コメント内に折り畳む。

- header, footer ともに任意（なくても従来通り動作）
- data が値を持つ場合: header → data → footer の順に表示
- data が null の場合: header/footer の内容を `<!-- {{header}} ... {{/header}} -->` のようにコメント化

構文:
```markdown
<!-- {{data: source.method("labels")}} -->
<!-- {{header}} -->
### 見出し
| Col1 | Col2 |
|---|---|
<!-- {{/header}} -->
<!-- {{footer}} -->
脚注テキスト
<!-- {{/footer}} -->
<!-- {{/data}} -->
```

### I5/I6: テンプレートタイトル統一

実装フェーズで全プリセットのテンプレートを洗い出し、プリセット固有用語を汎用表現に変更。親子プリセット間でタイトル体系を統一する。

## ユーザー決定事項

- B1 はアルゴリズム修正ではなくテンプレート修正（方針 A）
- I1 の header/footer は両方とも任意
- I5/I6 は実装時に対象を洗い出して修正
- I2-I4, I8 は別 spec

## 承認

- [x] User approved this draft
- Confirmed at: 2026-03-19
