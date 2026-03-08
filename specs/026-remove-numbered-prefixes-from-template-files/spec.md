# Feature Specification: 026-remove-numbered-prefixes-from-template-files

**Feature Branch**: `feature/026-remove-numbered-prefixes-from-template-files`
**Created**: 2026-03-08
**Status**: Draft
**Input**: User request

## Goal
テンプレートファイルから番号プレフィックス（`01_`, `02_` 等）を除去し、トピック名ベースのファイル名にする。章の順序は各プリセットの `preset.json` の `chapters` フィールドで定義し、`init` が docs/ に書き出す際に番号を付与する。これにより AI 章選別の精度向上、プリセット間の番号衝突解消、章の並べ替え容易化を実現する。

## Scope
- 全プリセットのテンプレートファイルをリネーム（`01_overview.md` → `overview.md` 等）
- 各プリセットの `preset.json` に `chapters` フィールドを追加し、章の順序を定義（例: `"chapters": ["overview.md", "stack_and_ops.md", ...]`）
- `chapters.json` ファイルは作成しない（不要）
- `collectChapters()` を番号なしファイル名 + `preset.json` の `chapters` 順序ベースに変更
- `mergeFile()` は番号なしファイル名で完全一致マージ（変更なし）
- `init` コマンドが docs/ 出力時に `preset.json` の `chapters` 順序に基づき `01_`, `02_` を付与
- AI 章選別プロンプトから番号ベースのルール（`Always include 01_*, 02_*...`）を除去し、トピック名ベースに変更
- `filterChapters()` と旧 `chapters.json`（`requires` フィルタ用）を削除（AI 章選別が代替するため不要）
- `data` コマンドの docs/ スキャンパターン（`/^\d{2}_.*\.md$/`）は変更不要（出力ファイルには番号が付くため）
- AGENTS.sdd.md テンプレートはリネーム不要（`NN_*.md` パターンではない）
- README.md テンプレートはリネーム不要

## Out of Scope
- docs/ 配下の生成済みファイルのリネーム（`build --force` で再生成すれば自動的に反映）
- テンプレートの内容変更（ファイル名のみ変更）

## Clarifications (Q&A)
- Q: 章の順序定義のフォーマットは？
  - A: `preset.json` に `"chapters": ["overview.md", "cli_commands.md", ...]` として文字列配列で定義。`chapters.json` は作らない。
- Q: `chapters` フィールドがないプリセットはどうなる？
  - A: ファイル名のアルファベット順でフォールバック。既存の `sort()` と同等の動作。
- Q: `requires` フィルタはどうなる？
  - A: 削除する。AI 章選別が同じ役割を果たすため不要。`filterChapters()` も削除。
- Q: プリセット間で同名ファイルがある場合のマージは？
  - A: 現在と同じ。`mergeFile()` はファイル名完全一致でチェーン順にマージ（`@extends` / `@block` 対応）。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-08
- Notes: User confirmed docs/ output will have numbered prefixes

## Requirements
1. テンプレートファイルから番号プレフィックスを除去する
2. 各プリセットの `preset.json` に `chapters` フィールドを追加し、章の順序を定義する
3. `collectChapters()` が `preset.json` の `chapters` から順序を読み取り、番号なしファイル名でファイルを収集する
4. `init` が docs/ 出力時に `preset.json` の `chapters` 順序に基づき `01_`, `02_` 番号を付与する
5. `filterChapters()` と旧 `chapters.json` の `requires` ロジックを削除する
6. AI 章選別プロンプトをトピック名ベースに変更する
7. 既存テストを更新し、全テストが通ることを確認する

## Acceptance Criteria
- 全プリセットのテンプレートファイルが番号なしファイル名になっている
- 各プリセットの `preset.json` に `chapters` フィールドが定義されている
- `chapters.json` ファイルが存在しない
- `filterChapters()` が削除されている
- `sdd-forge init` で docs/ に出力されるファイルが `01_overview.md` のように番号付きである
- `sdd-forge build` が正常に完了する
- AI 章選別が番号ではなくトピック名で動作する
- 全テスト通過

## Open Questions
- (none)
