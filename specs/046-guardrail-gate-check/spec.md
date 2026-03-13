# Feature Specification: 046-guardrail-gate-check

**Feature Branch**: `feature/046-guardrail-gate-check`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User request

## Goal
guardrail のベーステンプレートに EARS ベースの spec 記述原則を定義し、gate コマンドで AI コンプライアンスチェックを実行できるようにする。

## Scope
- base プリセットの guardrail テンプレート（en/ja）の条項を改訂
- gate コマンドに AI コンプライアンスチェック機能を追加
- 評価用 spec（正常/違反）による手動検証

## Out of Scope
- スタック固有プリセット（webapp, library 等）の guardrail テンプレート
- post-implementation フェーズでの guardrail チェック
- guardrail チェック結果の自動テスト化

## Clarifications (Q&A)
- Q: テンプレート条項のレベルは？
  - A: spec の書き方ルール（設計・実装の原則ではない）
- Q: EARS 準拠の厳密さは？
  - A: 厳密なテンプレート構文の強制はせず「考え方」レベルに留める。可読性重視
- Q: 評価方法は？
  - A: 正常 spec と違反 spec を gate に通す手動評価。テストコードには組み込まない

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-13
- Notes: 実装へ進む

## Requirements

### R1: guardrail テンプレート改訂
既存の3条項を以下に置き換える（en/ja 両方）:

1. **Single Responsibility** — 1つの spec は1つの関心事を扱う。無関係な変更をまとめない
2. **Unambiguous Requirements** — 要件は曖昧な形容詞（「適切に」「高速に」等）を避け、検証可能な条件で記述する
3. **Complete Context** — トリガー条件（When/If）と期待される振る舞い（shall）が対になっていること

### R2: gate AI コンプライアンスチェック
- 実行条件: guardrail.md が存在する AND agent が設定されている
- 入力: spec 本文 + guardrail 条項一覧
- 出力: 条項ごとに pass/fail + 理由（1行）
- 判定: 1つでも fail → gate FAIL
- agent 未設定時: 警告を出してスキップ（既存の静的チェックのみ実行）
- `--skip-guardrail` オプションで AI チェックをスキップ可能

### R3: 評価用 spec 作成
- 正常 spec: 3条項すべてに準拠 → gate pass
- 違反 spec: 各条項に1つずつ意図的に違反（計3パターン）→ 該当条項で gate fail
- `specs/046-guardrail-gate-check/` 内に配置

## Acceptance Criteria
- [ ] base テンプレート（en/ja）が R1 の3条項に更新されている
- [ ] guardrail.md 存在 & agent 設定時、gate が AI コンプライアンスチェックを実行する
- [ ] agent 未設定時、警告を出して AI チェックをスキップする
- [ ] `--skip-guardrail` 指定時、AI チェックをスキップする
- [ ] 1つでも fail 条項があれば gate FAIL となる
- [ ] 正常 spec が gate pass する
- [ ] 各違反 spec が該当条項で gate fail する

## Open Questions
None.
