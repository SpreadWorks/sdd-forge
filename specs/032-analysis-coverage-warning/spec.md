# Feature Specification: 032-analysis-coverage-warning

**Feature Branch**: `feature/032-analysis-coverage-warning`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User request

## Goal
analysis.json に含まれるデータのうち、docs のディレクティブで参照されていないものを検出し、review で警告する。forge はその警告を活用して docs の更新を提案できるようにする。

## Scope
1. **review コマンドにカバレッジチェックを追加**
   - analysis.json のエントリ（モジュール、コントローラ、モデル等）と、docs 内の `{{data}}` ディレクティブが実際に参照しているデータを比較
   - 未参照のカテゴリ・エントリがある場合に警告（WARN、FAIL ではない）を出力
   - 出力形式: `[WARN] uncovered analysis: <category> (<count> entries)` 等

2. **forge の review フィードバックに反映**
   - review の警告出力を forge が解析し、AI へのプロンプトに含める
   - AI が適切な `{{text}}` ブロックや説明文の追加を提案できるようにする

## Out of Scope
- 新しいディレクティブの自動挿入（テンプレート編集は人手で行う）
- analysis.json のスキーマ変更
- review の FAIL 判定基準の変更（カバレッジ不足は WARN のみ）
- forge が自動でテンプレートにディレクティブを追加する機能

## Clarifications (Q&A)
- Q: カバレッジの判定基準は？
  - A: analysis.json のトップレベルカテゴリ（modules, controllers, models, shells, routes 等）ごとに、docs 内のいずれかの `{{data}}` ディレクティブがそのカテゴリのデータを参照しているかをチェック。個別エントリ単位ではなくカテゴリ単位で判定する。
- Q: review の警告をどう forge に渡すか？
  - A: 既存の `summarizeReview()` が `[WARN]` 行も含めて抽出するため、追加実装は最小限で済む。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-09
- Notes: カテゴリ単位のカバレッジ警告から開始

## Requirements

### R1: analysis カバレッジチェック（review.js）
- analysis.json のカテゴリ一覧を取得
- docs/ 内の全 `{{data}}` ディレクティブをパースし、参照しているデータソース・メソッドを列挙
- analysis のカテゴリのうち、いずれのディレクティブからも参照されていないものを警告
- 警告フォーマット: `[WARN] uncovered analysis category: <category> (<N> entries)`
- 警告は FAIL にはカウントしない（review の合否に影響しない）

### R2: forge プロンプトへの反映
- `summarizeReview()` が `[WARN]` 行を含むことを確認（既存動作）
- forge の AI プロンプトにカバレッジ警告が含まれることで、AI が未カバー領域を認識できる

### R3: カテゴリマッピング
- analysis.json のキー構造はプリセットによって異なるため、汎用的にトップレベルキーを検出する
- メタデータキー（`generatedAt`, `root`, `extras`, `files` 等）は除外する

## Acceptance Criteria
- [ ] AC1: 単一言語・未カバーカテゴリがある場合、review が `[WARN] uncovered analysis category:` を出力する
- [ ] AC2: 全カテゴリがカバーされている場合、警告は出力されない
- [ ] AC3: analysis.json が存在しない場合、カバレッジチェックをスキップする
- [ ] AC4: review の合否判定に影響しない（WARN のみ）
- [ ] AC5: forge 実行時に review の WARN 出力が AI プロンプトに含まれる

## Open Questions
- [x] カテゴリ単位でなく、エントリ単位（個別モジュール名等）までチェックすべきか？ → まずカテゴリ単位で実装し、必要に応じて拡張
