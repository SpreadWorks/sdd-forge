# Feature Specification: 083-improve-acceptance-report

**Feature Branch**: `feature/083-improve-acceptance-report`
**Created**: 2026-03-21
**Status**: Draft
**Input**: Issue #7

## Goal

Acceptance テストの結果を、品質改善のアクションに繋がるレポートとして出力する。
現在は pass/fail のみで情報が不足しているため、ディレクティブ検出の詳細、パイプラインの計測、AI による文章品質評価を構造化して提供する。

## Scope

- `tests/acceptance/lib/` の 4 ファイルを改修
- 未埋めディレクティブ検出ロジックの改修 + ユニットテスト追加
- レポート JSON の出力（`.sdd-forge/output/acceptance-report.json`）
- コンソールへの詳細出力追加

## Out of Scope

- 既存テストファイル（`*.test.js`）の変更
- CLI コマンドの追加・変更
- `src/` 配下の変更（テストコードのみ対象）

## Impact on Existing Functionality

- `assertions.js`: `assertStructure()` / `assertTextDirectivesFilled()` / `assertNoExposedDirectives()` の戻り値に構造化データを追加するが、既存の assert による pass/fail 判定は維持する。既存テスト（`*.test.js`）は `test-template.js` 経由でこれらを呼ぶため、呼び出し側の変更は不要
- `pipeline.js`: `runPipeline()` の戻り値にステップ情報を追加する。既存の `{ ctx }` は維持し、`steps` を追加するため後方互換
- `ai-verify.js`: AI へのプロンプトを変更するが、pass/fail 判定ロジックは維持。5軸評価は追加情報として返す
- `test-template.js`: レポート収集・JSON 出力を追加するが、テストの pass/fail 判定は変更しない
- 既存の `*.test.js` ファイルは一切変更しない

## Clarifications (Q&A)

- Q: レポートの出力形式は？
  - A: コンソール出力 + JSON ファイル（`.sdd-forge/output/acceptance-report.json`）
- Q: AI 評価の観点は？
  - A: Naturalness, Cultural Fit, Informativeness, Coherence, Actionability の5軸。静的に検出できない文章品質を評価する
- Q: 未埋めディレクティブの検出ロジック改修はどこで検証する？
  - A: ユニットテストで検証。acceptance テストではレポートへの統合を検証
- Q: 実装の進め方は？
  - A: P1 → P2 → P3 の順に一つずつ実装・確認してから次に進む

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-21
- Notes: P1→P2→P3 の順に一つずつ実装・確認

## Requirements

優先順位: **P1 > P2 > P3**。P1 から順に実装・確認し、前のフェーズが完了してから次に進む。

### P1: 未埋めディレクティブの検出（ファイル名・行番号付き）

- R1: `assertions.js` の `assertTextDirectivesFilled()` が未埋めディレクティブを構造化データ（ファイル名・行番号・ディレクティブ種別）で返す
- R2: `assertNoExposedDirectives()` が露出ディレクティブを構造化データ（ファイル名・行番号）で返す
- R3: 検出ロジックのユニットテストが存在し、行番号の正確性を検証する
- R4: 検出結果がレポート JSON の `directives.unfilled` に含まれる

### P2: パイプライントレーサビリティ

- R5: `pipeline.js` の `runPipeline()` が各ステップ（scan, enrich, init, data, text, readme）の成否と所要時間（ms）を記録して返す
- R6: ステップ情報がコンソールに出力される
- R7: ステップ情報がレポート JSON の `pipeline.steps` に含まれる

### P3: AI 品質チェックの詳細出力

- R8: `ai-verify.js` が AI に5軸（Naturalness, Cultural Fit, Informativeness, Coherence, Actionability）で評価を求める
- R9: 各軸に pass/fail とコメントが含まれる
- R10: 評価結果がコンソールに出力される
- R11: 評価結果がレポート JSON の `quality` に含まれる

### レポート統合

- R12: `test-template.js` が P1〜P3 の結果を収集し、`.sdd-forge/output/acceptance-report.json` に書き出す
- R13: 既存の pass/fail 判定ロジックは変更しない（レポートは追加情報）

## Acceptance Criteria

- AC1: 未埋めディレクティブが存在するドキュメントに対し、ファイル名と行番号を含む検出結果が返される
- AC2: パイプライン完了後、各ステップの名前・成否・所要時間がレポート JSON に記録される
- AC3: AI 品質チェック後、5軸それぞれに pass/fail とコメントがレポート JSON に記録される
- AC4: レポート JSON が `.sdd-forge/output/acceptance-report.json` に出力される
- AC5: 既存の acceptance テストが変更なしで引き続き pass する

## Open Questions

（なし）
