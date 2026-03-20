# Feature Specification: 081-unify-directive-syntax

**Feature Branch**: `feature/081-unify-directive-syntax`
**Created**: 2026-03-20
**Status**: Draft
**Input**: GitHub Issue #4

## Goal

sdd-forge のディレクティブ構文を2つの体系に統一する:
- **出力ディレクティブ `{{ }}`**: コンテンツ生成・挿入（関数呼び出しスタイル）
- **制御ディレクティブ `{% %}`**: テンプレート構造・メタデータ（宣言スタイル）

現在の不統一な構文（`{{data: ...}}`、`{{text[...]: ...}}`、`@block`、`@extends`、`{%meta: ...%}`）を整理し、学習しやすく拡張可能なテンプレートエンジンとして確立する。

## Scope

1. **directive-parser.js の書き換え** — 新構文パーサー（マルチライン対応含む）
2. **template-merger.js の更新** — `{%extends%}` / `{%block%}` / `{%/block%}` 対応
3. **guardrail.js の更新** — `{%guardrail%}` / `{%/guardrail%}` 対応
4. **TextDataSource 新設** — AI テキスト生成を DataSource メカニズムに統合
5. **全テンプレート移行** — `src/presets/` と `src/templates/` の全テンプレートを新構文に変換
6. **テスト更新** — 既存テストの構文更新 + 新機能テスト追加

## Out of Scope

- 制御フロー（ループ、条件分岐）— ビジネスロジックは DataSource に属する
- `meta` ディレクティブ（テンプレートレベルメタデータ）— 別 spec で検討
- text.js コマンドの内部ロジック変更（バッチ処理、インクリメンタル更新等）— TextDataSource はエントリポイントとして機能し、既存ロジックを呼び出す

## Clarifications (Q&A)

- Q: TextDataSource は text.js の処理をすべて吸収するのか？
  - A: TextDataSource は DataSource インターフェースとして data パイプラインから呼び出されるエントリポイント。内部では既存の text.js のロジック（LLM 呼び出し、バッチ処理等）を再利用する。

- Q: マルチラインディレクティブのパース方法は？
  - A: `<!--` から `-->` までを1ブロックとして扱う。現行の行ベースパーサーからブロックベースパーサーに書き換える。

- Q: header/footer はどうなるか？
  - A: 廃止。テンプレートでの使用がなく、必要なら `ignoreError` オプションで代替可能。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-20
- Notes: 一括実装で承認

## Requirements

### R1: 出力ディレクティブ — data

新構文: `<!-- {{data("preset.source.method", {labels: "Name|File", ignoreError: true})}} -->`

- 第1引数（必須）: DataSource パス（文字列、ドット区切り3パート `preset.source.method`）
- 第2引数（省略可）: オプションオブジェクト `{key: value, ...}`
  - `labels`: パイプ区切りのカラムヘッダー文字列
  - `ignoreError`: boolean — データ解決失敗時にディレクティブを静かに除去する（既存動作を維持）。失敗時は verbose ログに警告を出力する
  - その他の既存パラメータも key-value で指定可能
- 閉じタグ: `<!-- {{/data}} -->`（変更なし）
- マルチライン対応: `<!-- ... -->` ブロック内で改行可能

### R2: 出力ディレクティブ — text

新構文: `<!-- {{text({prompt: "Write overview.", mode: "deep", id: "overview", maxLines: 10})}} -->`

- `text(...)` は `data("base.text", ...)` のシンタックスシュガー
- オプションオブジェクト内のキー:
  - `prompt`（必須）: LLM に渡すプロンプト文字列
  - `mode`: `"light"` | `"deep"`（デフォルト: `"light"`）
  - `id`: テキストセクション識別子
  - `maxLines`: 最大行数
  - `maxChars`: 最大文字数
- 閉じタグ: `<!-- {{/text}} -->`（変更なし）
- マルチライン対応
- 振る舞い: パーサーが `{{data(...)}}` を検出 → DataSource パスとオプションを抽出 → `resolveDataDirectives()` が resolver 経由で DataSource メソッドを呼び出し → 結果の Markdown 文字列でディレクティブ間のコンテンツを置換。解決失敗時は `ignoreError` に応じてエラー表示または静かに除去

### R3: 制御ディレクティブ — extends / block

新構文:
- `<!-- {%extends "layout"%} -->`（引数なしも可: `<!-- {%extends%} -->`）
- `<!-- {%block "content"%} -->` ... `<!-- {%/block%} -->`

宣言スタイル: `name value`（関数呼び出しではない）

振る舞い: template-merger.js がファイル読み込み時に `{%extends%}` を検出 → 親テンプレートをロード → `{%block "name"%}` で囲まれた領域を子の同名ブロックで置換。既存のマージ戦略（additive merging、ネスト対応）は維持

### R4: 制御ディレクティブ — guardrail

新構文:
- `<!-- {%guardrail {phase: [draft, spec, impl], scope: ["*.css"]}%} -->` ... `<!-- {%/guardrail%} -->`

`{%meta: ...%}` を置換。インラインからブロック形式に変更（開始タグと閉じタグで記事本文を囲む）。

振る舞い: guardrail.js が `{%guardrail%}` 開始タグを検出 → オプション（phase, scope, lint）を抽出 → `{%/guardrail%}` 閉じタグまでの本文を記事として取得 → 現在のフェーズ・ファイルパスに基づいて該当記事を検証に適用

### R5: 閉じタグの統一

`/name` パターンで統一:
- `<!-- {{/data}} -->`
- `<!-- {{/text}} -->`
- `<!-- {%/block%} -->`
- `<!-- {%/guardrail%} -->`

閉じタグがない場合（EOF まで未閉じ）はパースエラーとする。このエラーは `ignoreError` とは独立であり、構文エラーは常にエラーを発生させる（`ignoreError` はデータ解決の失敗のみに適用される）。パースエラー・データ解決エラー（ignoreError 未指定時）は非ゼロ終了コード（exit code 1）でプロセスを終了する。

### R6: マルチラインディレクティブ

`<!-- ... -->` を1ブロックとして扱い、内部で改行を許可:

```html
<!--
{{data("webapp.controllers.list", {
  labels: "Name|Path|Methods|Middleware",
  ignoreError: true
})}}
-->
```

パーサーは `<!--` から `-->` までをブロックとして読み取る。

### R7: TextDataSource

`src/docs/data/text.js` に TextDataSource を新設:
- DataSource インターフェースを実装
- resolver-factory.js で `base.text` として登録
- トリガー: パーサーが `{{text(...)}}` を `{{data("base.text", ...)}}` に展開 → data.js の `resolveDataDirectives()` が resolver を通じて TextDataSource を呼び出す
- TextDataSource は `generate(analysis, options)` メソッドを実装。`options` は `{prompt, mode, id, maxLines, maxChars}`
- 内部では text.js の `processTemplate()` を呼び出し、LLM 応答を文字列で返す
- 失敗時: LLM 呼び出しエラーは例外を投げる（ignoreError 未指定時はエラー表示、指定時は verbose ログ + ディレクティブ除去。既存の data ディレクティブと同じ振る舞い）

### R8: header / footer の廃止

- `<!-- {{header}} -->` / `<!-- {{/header}} -->` のパース・処理を directive-parser.js から削除
- `<!-- {{footer}} -->` / `<!-- {{/footer}} -->` のパース・処理を directive-parser.js から削除
- 影響: プリセットテンプレートでの使用はゼロ（調査済み）。directive-parser.js 内の folding ロジックのみが影響を受ける
- 振る舞い: パーサーは `{{header}}` / `{{footer}}` を認識しなくなる。テンプレートにこれらのタグが残っていた場合、HTML コメントとしてそのまま出力される（パースエラーにはならない。新構文の `{{name(...)}}` パターンに合致しないため無視される）
- R5 の閉じタグ未検出エラーとの関係: `{{/header}}` / `{{/footer}}` も新パーサーでは認識されないため、エラーは発生しない（閉じタグエラーは認識済みの開始タグに対してのみ適用される）

### R9: 全テンプレート移行

`src/presets/` と `src/templates/` の全ファイルを新構文に変換:
- `{{data: p.s.m("labels")}}` → `{{data("p.s.m", {labels: "labels"})}}`
- `{{text[mode=deep]: prompt}}` → `{{text({prompt: "prompt", mode: "deep"})}}`
- `@extends` → `{%extends%}`
- `@block: name` → `{%block "name"%}`
- `@endblock` → `{%/block%}`
- `{%meta: {phase: ...}%}` → `{%guardrail {phase: ...}%}` ... `{%/guardrail%}`

### R10: 旧構文の削除

alpha ポリシーに従い、旧構文のパース・処理コードを完全に削除。後方互換は不要。

- 影響範囲: `src/` 内のパーサー・テンプレートのみ。sdd-forge はテンプレートエンジンであり、ユーザープロジェクトの `docs/` 内の生成済みファイルには旧構文のディレクティブが残る可能性があるが、`sdd-forge docs build` で再生成すれば新構文に置き換わる
- `.sdd-forge/templates/` にユーザーがカスタマイズしたテンプレートがある場合: `sdd-forge upgrade` がプリセット由来のテンプレートを新構文に更新する。ユーザーが独自に追加・編集した部分は手動で新構文に書き換える必要がある。移行テーブル（R9 の変換ルール一覧）を参照
- alpha 版のため移行ガイドの公開やバージョニング戦略は不要。CHANGELOG に breaking change として記載し、npm publish 時のリリースノートで告知する
- `sdd-forge upgrade` はプリセット由来テンプレートのみを差分更新する（既存の動作）。ユーザー独自テンプレートは上書きしない。したがって破壊的操作のリスクはない

## Priority

実装順序（依存関係に基づく）:
1. **P1**: R6 マルチラインパーサー基盤 → R1 data 新構文 → R2 text 新構文 → R5 閉じタグ統一
2. **P2**: R3 extends/block → R4 guardrail
3. **P3**: R7 TextDataSource
4. **P4**: R8 header/footer 廃止 → R10 旧構文削除
5. **P5**: R9 全テンプレート移行（P1-P4 完了後）

## Acceptance Criteria

- AC1: `<!-- {{data("base.project.summary")}} -->` が正しくパースされ、DataSource が解決される
- AC2: `<!-- {{text({prompt: "Write overview.", mode: "deep"})}} -->` が正しくパースされ、LLM テキスト生成が実行される
- AC3: マルチラインディレクティブ（`<!-- ... -->` 内改行）が正しくパースされる
- AC4: `<!-- {%extends "layout"%} -->` / `<!-- {%block "name"%} -->` によるテンプレート継承が動作する
- AC5: `<!-- {%guardrail {phase: [draft, spec]}%} -->` ... `<!-- {%/guardrail%} -->` によるガードレール判定が動作する
- AC6: 閉じタグがない場合にエラーが発生する
- AC7: 全プリセットテンプレートが新構文に変換されている
- AC8: 旧構文（`{{data: ...}}`、`@block`、`{%meta%}`）がパーサーに残っていない
- AC9: 既存テストが新構文で通過する
- AC10: `sdd-forge docs build` がエンドツーエンドで正常に動作する

## Open Questions

- [x] TextDataSource と text.js コマンドの責務分界点 — TextDataSource は DataSource インターフェースのアダプタとして機能し、data パイプラインから呼ばれた際に text.js の `processTemplate()` を内部で呼び出す。LLM 呼び出し・バッチ処理・インクリメンタル更新のロジックは text.js に残す。
