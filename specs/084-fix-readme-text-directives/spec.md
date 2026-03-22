# Feature Specification: 084-fix-readme-text-directives

**Feature Branch**: `feature/084-fix-readme-text-directives`
**Created**: 2026-03-22
**Status**: Draft
**Input**: GitHub Issue #8

## Goal

README.md の `{{text}}` ディレクティブが `sdd-forge build` 後も空のまま残るバグを修正する。

## Scope

- `src/docs/commands/readme.js` の `{{text}}` 処理部分を修正

## Out of Scope

- docs/ 章ファイルの `{{text}}` 処理（正常動作中）
- `{{data}}` ディレクティブの処理（正常動作中）
- AGENTS.md の生成問題（別件）

## Clarifications (Q&A)

- Q: なぜ README.md の `{{text}}` だけ空になるのか？
  - A: `readme.js` が `processTemplateFileBatch()`（バッチモード）を使用している。バッチモードはファイル全体を AI に渡してファイル全体を返させる方式。README.md は `{{data}}` 解決済みの大きな章テーブル（20行超）を含むため、AI がファイル全体の `{{text}}` 構造を維持した応答を返せず、`countFilledInBatch()` が 0/3 と判定する。

- Q: なぜバッチモードではなく per-directive モードを使うのか？
  - A: per-directive モードは各ディレクティブを個別に処理する。ディレクティブの前後20行をコンテキストとして渡し、生成されたテキストをディレクティブの開始タグと終了タグの間に挿入する。`{{data}}` 部分には一切触れないので、README.md の構造を壊さない。`processTemplate()` として既に実装済み。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-22
- Notes: Approved as-is

## Requirements

1. `sdd-forge docs readme` または `sdd-forge docs build` の readme ステップで README.md に `{{text}}` ディレクティブが存在する場合、`processTemplateFileBatch()`（バッチモード）ではなく `processTemplate()`（per-directive モード）を使用して各ディレクティブを個別に処理する
2. `sdd-forge docs readme` 実行時、`processTemplate()` が `{{text}}` の開始タグと終了タグの間のみを置換し、`{{data}}` ディレクティブで生成された章テーブルやプロジェクト名を変更しないこと

## Acceptance Criteria

- `sdd-forge docs readme` 実行後、README.md の全 `{{text}}` ディレクティブに AI 生成テキストが挿入されている
- `{{data}}` ディレクティブの内容が変更されていない
- ログに `filled` が 3/3（または 0 より大きい）と表示される

## Open Questions

- なし
