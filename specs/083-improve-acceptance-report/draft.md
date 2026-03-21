# Draft: Acceptance テストの結果レポート改善

## 背景

acceptance テストの結果は現在 pass/fail のみで、修正アクションに繋がる情報が不足している。
テストの目的はバグ検出だけでなく、テンプレートから生成されるドキュメントの品質改善にある。

## 要件（優先順位順）

### P1: 未埋めディレクティブの検出（ファイル名・行番号付き）

- `assertions.js` の検出関数を改修し、構造化データ（ファイル名・行番号・ディレクティブ種別）を返す
- 検出ロジックの正しさはユニットテストで検証する
- 検出結果をレポート JSON に含める

### P2: パイプライントレーサビリティ（各ステップの成否・所要時間）

- `pipeline.js` の各ステップ（scan, enrich, init, data, text, readme）の成否・所要時間を記録
- コンソールにも出力し、レポート JSON にも含める

### P3: AI 品質チェックの詳細出力（5軸評価）

- AI へのプロンプトを変更し、以下の5軸で評価を返させる:
  1. **Naturalness（自然さ）** — 機械的・定型的でなく、自然に読めるか
  2. **Cultural Fit（文化・慣習適合性）** — 対象言語圏の技術文書の慣習に沿っているか
  3. **Informativeness（情報の具体性）** — プロジェクト固有の具体的な情報を提供しているか
  4. **Coherence（文書としての一貫性）** — 用語の統一、章間の論理的なつながり
  5. **Actionability（実用性）** — 開発者が次のアクションに繋がる情報か
- 各軸に pass/fail + コメントを付ける
- 結果をコンソール出力およびレポート JSON に含める

## レポート出力

- **コンソール**: 既存の TAP 出力に加えて詳細を表示
- **ファイル**: `.sdd-forge/output/acceptance-report.json` に JSON で書き出し
- レポート JSON の構造:
  ```json
  {
    "preset": "node-cli",
    "timestamp": "...",
    "pipeline": {
      "steps": [
        { "name": "scan", "status": "ok", "durationMs": 123 },
        ...
      ]
    },
    "directives": {
      "unfilled": [
        { "file": "overview.md", "line": 15, "type": "text" },
        ...
      ]
    },
    "quality": {
      "naturalness": { "pass": true, "comment": "..." },
      "culturalFit": { "pass": true, "comment": "..." },
      "informativeness": { "pass": false, "comment": "..." },
      "coherence": { "pass": true, "comment": "..." },
      "actionability": { "pass": true, "comment": "..." }
    }
  }
  ```

## 対象ファイル

- `tests/acceptance/lib/assertions.js` — 構造化データ返却に改修
- `tests/acceptance/lib/pipeline.js` — ステップ計測追加
- `tests/acceptance/lib/ai-verify.js` — 5軸評価プロンプトに変更
- `tests/acceptance/lib/test-template.js` — レポート収集・出力統合

## 既存機能への影響

- テストの pass/fail 判定ロジックは変更しない（レポートは追加情報）
- 既存のテストファイル（`*.test.js`）は変更不要
- CLI インターフェースへの変更なし

## 決定事項

- [x] レポート形式: コンソール + JSON ファイル
- [x] JSON 出力先: `.sdd-forge/output/acceptance-report.json`
- [x] AI 評価軸: Naturalness, Cultural Fit, Informativeness, Coherence, Actionability
- [x] 未埋めディレクティブ検出ロジック改修 + ユニットテストもこの spec に含める
- [x] User approved this draft (2026-03-21)
