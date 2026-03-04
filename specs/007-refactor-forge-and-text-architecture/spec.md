# Feature Specification: 007-refactor-forge-and-text-architecture

**Feature Branch**: `feature/007-refactor-forge-and-text-architecture`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User request

## Goal
forge.js / text.js / agent.js / review.js / template-merger.js の構造を整理し、保守性と信頼性を向上させる。

## Scope

### 1. forge.js の分割（1011行 → 3モジュール）+ プロンプトのテンプレート化
forge.js から以下の責務を独立モジュールに抽出する。

| 抽出先 | 責務 | 対象関数 |
|---|---|---|
| `src/docs/lib/forge-prompts.js` | プロンプト組み立て | `buildForgeSystemPrompt`, `buildForgeFilePrompt`, `buildForgePrompt`, `buildAnalysisSummary` |
| `src/docs/lib/review-parser.js` | レビュー結果解析・パッチ | `summarizeReview`, `parseReviewMisses`, `patchGeneratedForMisses`, `ensureSection`, `summarizeNeedsInput`, `extractNeedsInput` |

forge.js 本体には main() + runPerFile() + maybeUpdateContext() + ヘルパー (parseCliOptions, printHelp, getTargetFiles, readText, resolveAgent, loadAnalysisData) が残る。

#### プロンプトのテンプレート外出し
プロンプトの静的テキスト（ロール説明、ルール、出力規約）はコード内にハードコードせず `src/templates/locale/{lang}/prompts.json` に配置する。動的に組み立てる構造（変数埋め込み、条件分岐）はコード側に残す。

| テンプレート化する部分 | 現在の場所 | 移動先 |
|---|---|---|
| forge system prompt のロール・RULES | forge.js `buildForgeSystemPrompt` | `prompts.json` の `forge.system` キー |
| text system prompt の出力ルール | text.js `buildTextSystemPrompt` | `prompts.json` の `text.outputRules` キー |
| batch prompt の出力ルール | text.js `buildBatchPrompt` | `prompts.json` の `text.batchRules` キー |

en ロケール用の `prompts.json` も同時に作成する。

### 2. forge.js の runAgent を lib/agent.js に統合
- forge.js 固有の `buildArgs` + `runAgent` を廃止
- `lib/agent.js` の `callAgentAsync` に streaming 対応オプションを追加（`options.onStdout`, `options.onStderr`）
- forge.js は `callAgentAsync` を使う
- forge.js に欠落していた `env.CLAUDECODE` 削除も自動的に解消される

### 3. text.js の batch fallback 廃止
- batch モードで filled=0 になった場合の per-directive fallback を削除する
- batch が失敗したファイルはエラーとして報告し、ユーザーに `--per-directive` での再実行を案内する
- これにより text.js の 2つのエントリポイント（`textFillFromAnalysis`, `main`）から fallback 分岐が消える

### 4. template-merger.js の `@parent` デッドコード削除
- `@parent` ディレクティブの処理コードを削除する
- `@extends` + `@block` による「ブロック単位の完全上書き」は維持する
- directive-parser.js の `parseBlocks()` から `@parent` 関連のフィールド（`hasParent`, `parentLine`）を削除する

### 5. review.js の品質チェック強化
以下のチェックを追加する。

| チェック | 重要度 | 説明 |
|---|---|---|
| 未埋め @data ディレクティブ | FAIL | @data の直後に空行のみ → データ未解決 |
| analysis.json 存在チェック | WARN | analysis.json がない場合に警告 |
| analysis.json 鮮度チェック | WARN | analysis.json がソースコードより古い場合に警告 |
| MANUAL ブロック対応チェック | WARN | `<!-- MANUAL:START -->` に対応する `<!-- MANUAL:END -->` がない場合 |

## Out of Scope
- agent.js の API 直接呼び出し対応（インターフェースの拡張点は用意するが、実装は別 spec）
- scan.js の汎用スキャナ強化
- analysis.json のスキーマ定義
- 新しいプリセットの追加

## Clarifications (Q&A)
- Q: forge.js の runPerFile 内の concurrency 制御はどうなるか？
  - A: lib/agent.js の callAgentAsync を使う形に変わるが、concurrency 制御自体は forge.js の runPerFile に残す（ファイルレベルの並列制御は呼び出し元の責務）
- Q: streaming 対応を agent.js に入れると同期版 callAgent にも影響するか？
  - A: しない。streaming は非同期版 callAgentAsync のオプションのみ。同期版は変更なし
- Q: batch fallback を廃止して品質は下がらないか？
  - A: batch が 0 filled を返す原因は LLM の出力品質問題であり、per-directive で再試行しても根本解決にならない。エラー報告して再実行を促す方が適切
- Q: プロンプトのテンプレート化の範囲は？
  - A: 静的テキスト（ロール説明、ルール一覧、出力規約）を prompts.json に外出しする。変数埋め込み (`{{variable}}`) や条件分岐による動的組み立てはコード側に残す。user prompt の小さなテンプレート（forge file prompt, text user prompt）は動的部分が大半なのでコード内で可

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-03
- Notes: プロンプトの静的テキストは prompts.json に外出しする方針を追加承認済み

## Requirements
1. forge.js の行数を概ね 500 行以下に削減する
2. forge.js の独自 runAgent / buildArgs を完全に廃止する
3. lib/agent.js の callAgentAsync に streaming callback オプションを追加する
4. プロンプトの静的テキスト（ロール、ルール、出力規約）を `prompts.json` (ja/en) に外出しする
5. text.js の batch fallback パスを削除する
6. template-merger.js の @parent 関連コードを削除する
7. review.js に @data 未埋め・analysis.json 鮮度・MANUAL ブロック対応のチェックを追加する
8. 既存テスト 238 件が全て通ること

## Acceptance Criteria
- [x] forge.js から prompt 構築・レビュー解析が別モジュールに分離されている
- [x] forge.js が lib/agent.js の callAgentAsync を使用している
- [x] callAgentAsync に onStdout/onStderr コールバックオプションが追加されている
- [x] プロンプトの静的テキストが prompts.json に外出しされている（ja + en）
- [x] text.js に batch → per-directive の fallback コードがない
- [x] template-merger.js に @parent 処理コードがない
- [x] review.js が @data 未埋め・analysis.json 鮮度・MANUAL 対応をチェックする
- [x] 全テストが通る（259 tests）

## Open Questions
- (なし)
