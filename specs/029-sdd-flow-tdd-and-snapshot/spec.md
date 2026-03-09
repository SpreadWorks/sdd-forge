# Feature Specification: 029-sdd-flow-tdd-and-snapshot

**Feature Branch**: `feature/029-sdd-flow-tdd-and-snapshot`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User request
**Draft**: `specs/028-tdd-in-sdd-flow/draft.md`

## Goal

SDD フローの品質を向上させるため、3 つの改善を導入する:
1. draft（要件定義）フェーズ — 仕様書作成前に対話で要件を詰める
2. TDD フロー — テスト観点レビュー + テスト先行で実装する
3. スナップショットテスト — `sdd-forge snapshot` コマンドによるリグレッション検出

## 実装方針（なぜこのアプローチか）

- draft フェーズを導入する理由: 現状は要件定義をスキップしていきなり仕様書を書いており、AI の誤解がそのまま仕様に入る。対話で要件を詰めることで仕様精度が上がり、後続すべてに波及する。
- TDD フローを導入する理由: テストが「書いたコードの追認」にならないよう、実装前にテスト観点をユーザーがレビューする。テスト手法自体より、ユーザーレビューが最も効果が大きい。
- スナップショットテストを導入する理由: AI がテストも実装も書くと理解の誤りが両方に反映される。AI の判断に依存しない外部基準での検証手段が必要。
- 3 つを同時に実装する理由: 分割するとコンテキストが圧縮され、改善間の繋がりが失われる。

## Scope

### 1. draft フェーズ

- SDD フロー開始時に「要件を整理してから仕様書を作成する / 仕様書を作成する」の選択肢を追加
- draft フェーズでは AI が選択肢を提示し、ユーザーが短い返答で方針を詰める
- draft 承認後に spec に清書する（対話の Q&A は自動で spec に反映）
- draft.md は specs/ に残す
- draft の終了条件: ユーザー承認チェック（spec と同じ `- [x] User approved this draft` 方式）

### 2. TDD フロー

- gate 通過後にテスト環境の有無を自動判定する（analysis.json から）
- scan で `scripts.test` を取得するよう拡張する
- テスト環境がある場合: テスト種別確認（ユニット / E2E / 両方 / 任せる）→ テスト観点提示（中間粒度）→ ユーザー承認 → テストコード生成 → 実装
- テスト環境がない場合: AI による spec-実装照合チェック
- テスト環境の構築が必要な場合: 別 spec として扱う
- テスト観点の修正はユーザーが承認するまで反復する

### 3. スナップショットテスト

- `sdd-forge snapshot` コマンドを新規作成（save / check / update サブコマンド）
- 対象は deterministic な処理のみ（scan, init, data, review）
- `sdd-forge review` に snapshot check を統合する
- スナップショットの正しさは保証しない（リグレッション検出ツールとして位置づけ）
- スナップショット作成・更新時はユーザー承認を挟む

### 4. フロー定義の更新

- `.claude/skills/sdd-flow-start/` スキルを更新
- `CLAUDE.md`（AGENTS.md）の SDD フローセクションを更新
- SDD フロー中のすべてのステップで次の行動をユーザーに確認する原則を追加

### 5. scan 拡張

- `scripts.test` / `scripts` の test 関連エントリを analysis.json に含める

## Out of Scope

- text コマンド（AI 呼び出し）のスナップショット対象化
- テスト環境の構築（別 spec）
- プロパティベーステスト（外部依存が必要なため見送り）
- OSS ベンチマーク（将来的な話）

## Clarifications (Q&A)

- Q: draft フェーズはすべての spec で必須か？
  - A: 選択制。SDD フロー開始時にユーザーが「要件を整理してから」か「すぐに仕様書を作成」かを選ぶ。
- Q: テスト観点の粒度はどの程度か？
  - A: 中間レベル。「終了タグがある場合、生成領域として認識される」程度。コードや入出力の詳細は含めない。
- Q: テスト環境の判定方法は？
  - A: analysis.json の devDependencies（jest, mocha, vitest, phpunit 等）、scripts.test の有無、tests/ ディレクトリの有無から自動判定。ユーザーへの確認は不要。
- Q: 既存テストが壊れる場合の対応は？
  - A: AI が検出してユーザーに確認する。AI が勝手に修正・削除しない。大規模なテストリファクタリングは別途ユーザーが判断する。
- Q: スナップショットの保持場所は？
  - A: Open Question（実装時に決定）
- Q: 3 つの改善を分割せず同時に実装する理由は？
  - A: コンテキスト圧縮により改善間の繋がりが失われるため。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-09
- Notes: Approved as-is

## Requirements

### draft フェーズ
1. sdd-flow-start スキルに draft / spec 選択の分岐を追加する
2. draft の承認チェック機構を追加する（`- [x] User approved this draft`）
3. draft 承認後に spec へ Q&A を自動転記するフローを定義する
4. draft.md を specs/ に保持する方針をフローに明記する

### TDD フロー
5. scan で package.json の `scripts` を analysis.json に含めるよう拡張する
6. analysis.json からテスト環境の有無を判定するロジックを実装する
7. sdd-flow-start スキルに gate 後のテストフェーズを追加する（環境判定 → 種別確認 → 観点提示 → 承認 → テスト生成 → 実装）
8. テスト環境なしの場合の AI 照合チェック手順をフローに定義する

### スナップショットテスト
9. `sdd-forge snapshot save` コマンドを実装する（scan, init, data, review の出力を保存）
10. `sdd-forge snapshot check` コマンドを実装する（現在の出力とスナップショットを比較）
11. `sdd-forge snapshot update` コマンドを実装する（差分確認後にスナップショットを更新）
12. `sdd-forge review` に snapshot check を統合する

### フロー定義の更新
13. sdd-flow-start スキルを全体的に更新する
14. CLAUDE.md（AGENTS.md）の SDD フローセクションを更新する
15. 「SDD フロー中のすべてのステップで次の行動をユーザーに確認する」原則をフローに明記する

## Acceptance Criteria
- [x] SDD フロー開始時に「要件を整理してから / 仕様書を作成する」の選択肢が表示される
- [x] draft フェーズで対話的に要件を詰められる
- [x] draft 承認後に spec に Q&A が反映される
- [x] gate 通過後にテスト環境が自動判定される
- [x] テスト観点がユーザーに提示され、承認を得てからテストコードが生成される
- [x] `sdd-forge snapshot save/check/update` が動作する
- [x] `sdd-forge review` 実行時に snapshot check が統合されている
- [x] sdd-flow-start スキルと CLAUDE.md が更新されている
- [x] 既存テスト（356 件）がパスする

## Open Questions
- スナップショットの保持場所とフォーマット（`.sdd-forge/snapshots/`、`tests/snapshots/`、JSON 等）
- 小規模な修正（バグ修正等）でもテストフェーズを適用するか、閾値を設けるか
