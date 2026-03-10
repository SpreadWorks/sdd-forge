# Feature Specification: 034-text-light-deep-mode

**Feature Branch**: `feature/034-text-light-deep-mode`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Architecture discussion (specs/architecture-discussion-2026-03-09.md Part 4)

## Goal

text コマンドに light/deep モードを追加し、enriched analysis を活用した効率的なドキュメント生成を実現する。

- **light**: enriched analysis の summary/detail フィールドをコンテキストとして AI に渡し、文章化する（ソースコード再読なし、安い・速い）
- **deep**: enriched analysis + 該当ソースコードの中身を AI に渡し、詳細なドキュメントを書く（高い・正確）

## Scope

1. `{{text}}` ディレクティブに `mode=light|deep` パラメータを追加（ディレクティブごとに指定）
2. light モード（デフォルト）: enriched analysis の summary/detail を `{{text}}` のコンテキストに含める
3. deep モード: enriched analysis + 該当カテゴリのソースコードの中身を `{{text}}` のコンテキストに含める
4. directive-parser.js で `mode` パラメータを解析
5. text-prompts.js のコンテキスト構築を enriched analysis 対応に更新
6. テストの追加

## Out of Scope

- projectContext の廃止（後続 spec）
- 既存 DataSource / `{{data}}` ディレクティブの再設計
- forge コマンドのモード対応（forge は別途対応）
- CATEGORY_TO_SECTIONS マッピングの刷新（既存マッピングは維持しつつ enriched データを追加）

## Clarifications (Q&A)

- Q: デフォルトモードは？
  - A: light。`mode` パラメータ省略時は light として動作する。

- Q: モードの指定方法は？
  - A: ディレクティブのパラメータとして指定する。`<!-- {{text[mode=deep]: prompt}} -->`。CLI の `--mode` フラグは設けない。

- Q: enriched analysis がない場合（enrich 未実行）の挙動は？
  - A: 従来通りの動作にフォールバック。analysis.json に `enrichedAt` がなければ enriched データなしとして扱う。

- Q: light と deep でプロンプトサイズはどう変わる？
  - A: light は summary/detail テキストのみ追加（数百〜数千文字）。deep はソースコードも追加（ファイルあたり最大 8000 文字、enrich.js と同じ制限）。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-10
- Notes: ディレクティブごとの mode 指定に変更（CLI --mode フラグ廃止）

## Requirements

### R1: `{{text}}` ディレクティブの `mode` パラメータ（directive-parser.js）

- `{{text[mode=light]: prompt}}` / `{{text[mode=deep]: prompt}}` 構文をサポート
- `mode` パラメータ省略時は `light` をデフォルトとする
- パース結果の directive オブジェクトに `mode` フィールドを追加
- 既存の `{{text: prompt}}` 構文との後方互換を維持

### R2: enriched コンテキストの構築（text-prompts.js）

- `getAnalysisContext()` を拡張し、enriched analysis の各エントリーから summary/detail を収集
- 各章ファイルに関連するエントリーを `chapter` フィールドでフィルタ
- deep モード時はソースコードの中身も収集して追加
- ディレクティブごとの `mode` を受け取ってコンテキスト構築を切り替える

### R3: deep モードのソースコード収集

- analysis.json の各エントリーの `file` フィールドからソースコードを読み込む
- ファイルごとに最大 8000 文字で truncate（enrich.js と同じ制限）
- 読み込んだソースコードをプロンプトのコンテキストセクションに追加

### R4: text コマンドのディレクティブ別モード処理（text.js）

- ファイル内の各 `{{text}}` ディレクティブを処理する際、パースされた `mode` フィールドを text-prompts に渡す
- 同一ファイル内に light と deep のディレクティブが混在してもそれぞれ正しく処理する
- CLI の `--mode` フラグは設けない

### R5: フォールバック

- `enrichedAt` フィールドがない analysis.json では enriched コンテキストを追加しない
- 既存の `getAnalysisContext()` の動作はそのまま維持（enriched データがあれば追加する形）

## Acceptance Criteria

- [ ] `<!-- {{text[mode=light]: prompt}} -->` で enriched analysis のコンテキスト付きで text 生成される
- [ ] `<!-- {{text[mode=deep]: prompt}} -->` で enriched analysis + ソースコード付きで text 生成される
- [ ] `<!-- {{text: prompt}} -->`（mode 省略）で light モードがデフォルト適用される
- [ ] 同一ファイル内に light と deep のディレクティブが混在しても正しく処理される
- [ ] enriched analysis がない場合に従来通りの動作にフォールバックする
- [ ] テストが追加され、既存テストが全てパスする

## Open Questions

- (なし)
