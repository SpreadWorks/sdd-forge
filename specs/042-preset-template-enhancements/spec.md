# Feature Specification: 042-preset-template-enhancements

**Feature Branch**: `feature/042-preset-template-enhancements`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User request

## Goal
プリセットテンプレートの汎用的な改善をまとめて実施する。英語テンプレートの追加、`docs.chapters()` DataSource の修正、テンプレートへの `{{data}}` ディレクティブ導入。

## Scope

### A. cli / node-cli プリセットの英語テンプレート追加
- `src/presets/cli/templates/en/` を作成（現在 ja のみ）
- `src/presets/node-cli/templates/en/` を作成（現在 ja のみ）
- 日本語テンプレートを翻訳ベースに、base テンプレートの `@block` / `@extends` 継承パターンを使用

### B. `docs.chapters()` DataSource の修正
- `src/docs/data/docs.js` の `chapters()` メソッドで章タイトル抽出パターンが `# NN.` 形式を前提としており、番号なし形式でタイトルが取れない
- `# NN.` パターンに加え、最初の `# ` 行をフォールバックとして使うよう修正
- 説明文の抽出も改善（`{{text}}` ディレクティブ行をスキップしているが、生成済みの内容を取れていない場合がある）

### C. テンプレートへの `{{data}}` ディレクティブ導入
- `overview.md` テンプレートに `{{data: project.name}}`, `{{data: project.description}}` を追加
- `development.md` テンプレートに `{{data: project.scripts}}` を追加（テーブル形式）
- 必要な DataSource メソッドを `src/docs/data/project.js` に追加

## Out of Scope
- プロジェクトローカルテンプレート（`.sdd-forge/templates/en/`）の追加（固有対応）
- `configuration.md` への config スキーマ `{{data}}` 導入（DataSource が複雑になるため別 spec）
- `project.dependencies()` / `project.testEnv()` DataSource の追加（別 spec）

## Clarifications (Q&A)
- Q: 英語テンプレートは日本語テンプレートの翻訳か、base テンプレートの拡張か？
  - A: base テンプレートの `@extends` を使い、node-cli 固有のセクション/プロンプトを英語で追加する。日本語テンプレートと同じ構造。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-11
- Notes: 汎用改善（B, A, C, D）のみ対応。固有（E, F, G）は別対応。

## Requirements

### R1: cli / node-cli 英語テンプレート
1. `src/presets/cli/templates/en/` に `commands.md`, `config.md`, `README.md` を追加（ja と同等）
2. `src/presets/node-cli/templates/en/` に `overview.md`, `cli_commands.md`, `configuration.md`, `internal_design.md`, `development_testing.md` を追加
3. 各テンプレートは base テンプレートを `@extends` するか、独立ファイルとして作成
4. `{{text}}` プロンプトは英語で記述

### R2: `docs.chapters()` の修正
1. タイトル抽出: `# NN.` マッチに加え、最初の `# ` 行をフォールバック
2. 説明文抽出: `{{text}}` / `{{/text}}` ディレクティブ行だけでなく、`@block` / `@endblock` マーカーもスキップ

### R3: DataSource メソッド追加
1. `project.js` に `scripts(analysis, labels)` メソッド追加 — package.json の scripts テーブル
2. `project.js` に `description(analysis, labels)` メソッド追加 — package.json の description

### R4: テンプレートへの `{{data}}` ディレクティブ追加
1. base `overview.md` テンプレートに `{{data: project.description("")}}` を追加
2. base `development.md` テンプレートに `{{data: project.scripts("Script|Command")}}` を追加

## Acceptance Criteria
- [ ] `sdd-forge init --type node-cli` で英語の章ファイルが正しく生成される
- [ ] `sdd-forge readme` で README の章テーブルにタイトルと説明文が正しく表示される
- [ ] `{{data: project.scripts}}` が package.json の scripts をテーブルで出力する
- [ ] `{{data: project.description}}` が package.json の description を出力する
- [ ] 既存テストが壊れない

## Open Questions
(なし)
