# Feature Specification: 036-forge-selective-text-processing

**Feature Branch**: `feature/036-forge-selective-text-processing`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User request + architecture discussion

## Goal

forge コマンドの `{{text}}` 処理を選択的にし、不要な AI 呼び出しを削減する。
変更に関連するディレクティブだけを処理し、review で PASS 済みのファイル/ディレクティブは再処理しない。

## Scope

### 1. text コマンド: 空ディレクティブのスキップ

- `textFillFromAnalysis()` で既に内容がある `{{text}}` ディレクティブをスキップする
- 「内容がある」= directive 行と `{{/text}}` 行の間に非空行が存在する
- `--force` フラグで全ディレクティブを強制再生成可能にする

### 2. forge コマンド: ファイル単位のスキップ（review ベース）

- review 結果をパースして、PASS したファイルを次ラウンドの対象から除外する
- `runPerFile()` に渡す `targetFiles` を review 結果でフィルタリングする

### 3. forge コマンド: spec/prompt ベースの対象ファイル選定

- `--spec` が指定された場合、spec の Scope セクションから関連章を推定する
- 推定に失敗した場合や `--spec` なしの場合は全ファイルを対象とする（現行動作）
- 対象章の推定は AI ではなく、キーワードマッチングによる決定論的な方法で行う

### 4. review-parser の改善: ファイル単位の結果取得

- review 出力から、ファイル単位の PASS/FAIL 情報を抽出する
- 既存の `parseReviewMisses()` に加え、ファイル単位の結果を返す関数を追加する

## Out of Scope

- review-parser の CakePHP ハードコード問題の修正（別 spec）
- ディレクティブ単位の review 結果マッピング（将来の拡張）
- `{{data}}` ディレクティブの選択的処理
- text コマンドのスタンドアロン実行時の変更（forge 経由の `textFillFromAnalysis` のみ）

## Clarifications (Q&A)

- Q: text の「更新時に使えない」問題の対応は？
  - A: text コマンドは空ディレクティブのみ埋める（初回生成用途）。更新は forge の AI が docs ファイルを直接編集する形で対応する。text の `--force` フラグで再生成も可能。

- Q: forge の対象選定はどの粒度で行うか？
  - A: ファイル（章）単位。ディレクティブ単位の選定は将来の拡張とする。forge は AI が章ファイル全体を編集するため、ファイル単位が自然な粒度。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-10
- Notes: ユーザー承認済み

## Requirements

### R1: textFillFromAnalysis の空チェック
- `processTemplateFileBatch()` で、既に内容が埋まっている `{{text}}` ディレクティブをスキップする
- スキップ判定: directive 行と `{{/text}}` 行の間に非空行（空白のみの行を除く）が存在するか
- `textFillFromAnalysis()` に `force` オプションを追加し、`true` の場合は全ディレクティブを処理する

### R2: review 出力のファイル単位パース
- review 出力からファイルごとの PASS/FAIL 情報を抽出する `parseFileResults(reviewOutput)` を追加
- 戻り値: `{ passedFiles: string[], failedFiles: string[] }`
- パースできない場合は空配列を返す（フォールバックで全ファイル対象）

### R3: forge ラウンド間のファイルフィルタリング
- review FAIL 後の次ラウンドで、PASS 済みファイルを `targetFiles` から除外する
- `textFillFromAnalysis()` の呼び出しも初回のみに限定する（2 ラウンド目以降はスキップ）

### R4: spec ベースの対象ファイル推定
- `--spec` 指定時、spec の Scope/Requirements から関連する章ファイルを推定する
- 推定ロジック: 章ファイル名のキーワード（例: `overview`, `cli_commands`）と spec テキストのマッチング
- 推定結果が空の場合は全ファイルを対象とする

## Acceptance Criteria

- AC1: 全 `{{text}}` が埋まっている docs に対して `textFillFromAnalysis()` を実行すると、AI 呼び出しが 0 回になる
- AC2: forge の 1 ラウンド目で review PASS したファイルは 2 ラウンド目の AI 呼び出し対象に含まれない
- AC3: `--spec` で spec を指定した場合、無関係な章ファイルへの AI 呼び出しが発生しない
- AC4: 既存テストが全て PASS する
- AC5: `--force` フラグで textFillFromAnalysis が全ディレクティブを再処理する

## Open Questions
- [x] review 出力のフォーマットが十分にパース可能か → review.js はファイル単位でチェックし、FAIL 時にファイル名をログに含める。i18n テンプレート経由だが、ファイル名を抽出可能。
