# Feature Specification: 033-enrich-step

**Feature Branch**: `feature/033-enrich-step`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Architecture discussion (specs/architecture-discussion-2026-03-09.md)

## Goal

scan 後に AI が全体像からソースコードを読み、各エントリーに summary/detail/chapter/role を付与する `enrich` コマンドを新設し、build パイプラインに組み込む。

## Scope

1. `sdd-forge enrich` コマンドの新規実装 (`src/docs/commands/enrich.js`)
2. build パイプラインへの enrich ステップ組み込み (`scan → enrich → init → ...`)
3. docs ディスパッチャーへのルーティング追加 (`src/docs.js`)
4. help コマンドへの enrich 追加
5. テストの追加
6. `summary.json` の廃止（enrich が役割を吸収）

## Out of Scope

- text コマンドの light/deep モード対応（後続 spec）
- projectContext の廃止（後続 spec）
- 既存 DataSource / `{{data}}` ディレクティブの再設計（後続 spec）
- text/forge が enriched analysis を活用する変更（後続 spec）

## Clarifications (Q&A)

- Q: enriched analysis の出力先は？
  - A: `.sdd-forge/output/analysis.json` を上書き。enrich 前の raw analysis は保持しない（scan → enrich は常にセットで実行される想定）。

- Q: enrich 単体実行時に analysis.json が存在しない場合は？
  - A: エラーで終了。scan を先に実行するよう促す。

- Q: AI エージェントが未設定の場合は？
  - A: WARN を出して enrich をスキップ。analysis.json はそのまま（enriched フィールドなし）。build パイプラインは続行可能。

- Q: enriched 済みの analysis.json を再度 enrich した場合は？
  - A: 上書き。scan が構造情報を再取得するので、enrich も再実行して問題ない。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-10
- Notes: Scope limited to enrich command + build integration + summary.json removal

## Requirements

### R1: enrich コマンド (`src/docs/commands/enrich.js`)

- `main(ctx)` を export（build パイプラインから呼び出し可能）
- `runIfDirect()` で CLI 直接実行にも対応
- CLI オプション: `--agent <name>`, `--dry-run`, `--stdout`, `-h/--help`
- agent 未指定時は `config.defaultAgent` を使用

### R2: 処理フロー

1. `.sdd-forge/output/analysis.json` を読み込む
2. 全エントリー（カテゴリごとのアイテム）+ 対応するソースコードの中身を収集
3. AI に一括で渡し、各エントリーに以下のフィールドを付与させる:
   - `summary`: 1-2 文の概要
   - `detail`: ソースから読み取った詳細情報（間引かない）
   - `chapter`: 対応する章の識別子（テンプレートの章名）
   - `role`: エントリーの役割分類（`controller`, `model`, `lib`, `config`, `cli`, 等）
4. AI のレスポンスを analysis.json の各エントリーにマージ
5. `enrichedAt` タイムスタンプを追加
6. `.sdd-forge/output/analysis.json` に書き戻す

### R3: AI プロンプト設計

- プロンプトには以下を含める:
  - analysis.json の全カテゴリ・エントリー一覧（構造情報）
  - 各エントリーに対応するソースコードの中身（読み取れる範囲）
  - テンプレートの章一覧（preset.json の chapters から取得）
  - 出力フォーマットの指示（JSON）
- 大規模プロジェクトでコンテキストに収まらない場合: カテゴリごとに分割して複数回呼び出す
- レスポンスは JSON でパースし、各エントリーにマージ

### R4: build パイプライン組み込み

- `src/docs.js` の build セクションに enrich ステップを追加
- パイプライン順序: `scan → enrich → init → data → text → readme → agents → translate`
- enrich は agent 設定がある場合のみ実行（text と同じ条件）
- pipelineSteps に `{ label: "enrich", weight: 2 }` を追加

### R5: summary.json 廃止

- `scan.js` から `buildSummary()` 関数と `summary.json` 書き出しを削除
- `summary.json` を参照している箇所を `analysis.json` に切り替え:
  - `src/docs/lib/forge-prompts.js` の `summaryToText()`
  - `src/docs/lib/command-context.js` の `loadAnalysis()` （summary.json フォールバック）
  - その他参照箇所

### R6: ルーティング・ヘルプ

- `src/docs.js` の SCRIPTS に `enrich: "docs/commands/enrich.js"` を追加
- `src/help.js` に enrich コマンドを追加
- i18n メッセージファイルに enrich のヘルプテキストを追加

## Acceptance Criteria

- [ ] `sdd-forge enrich` が analysis.json を読み、AI で enriched フィールドを付与して書き戻す
- [ ] `sdd-forge enrich --dry-run` が結果を stdout に出力し、ファイルを変更しない
- [ ] `sdd-forge build` のパイプラインに enrich が含まれ、scan の直後に実行される
- [ ] agent 未設定時に WARN を出して enrich をスキップし、build が続行される
- [ ] `summary.json` の生成が削除され、参照箇所が analysis.json に切り替わっている
- [ ] テストが追加され、既存テストが全てパスする
- [ ] `sdd-forge help` に enrich コマンドが表示される

## Open Questions

- (なし)
