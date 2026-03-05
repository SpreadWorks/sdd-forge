# Feature Specification: 014-project-local-templates

**Feature Branch**: `feature/014-project-local-templates`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User request

## Goal
- sdd-forge 自身のプロジェクトローカルテンプレート（`.sdd-forge/templates/`, `data/`）を作成する
- README を、ユーザーがツールの機能・できることを直感的に理解できるレベルに改善する
- 有名 CLI ツールの README パターンを参考に、クイックスタート・機能紹介・ワークフロー説明を充実させる
- 作成後、汎用的な部分を node-cli テンプレートに移植する（別 spec）

## Scope

### 1. `.sdd-forge/templates/ja/docs/README.md` の作成
- sdd-forge 固有の README テンプレート（project-local 層で cli テンプレートを `@extends` オーバーライド）
- 含めるセクション:
  - プロジェクト名 + 1行説明 + バッジ（npm version 等）
  - Features（主要機能の箇条書き）
  - Quick Start（インストール → setup → build の3ステップ）
  - ワークフロー図（SDD フローの mermaid or ASCII）
  - コマンド一覧（簡潔な表）
  - Claude Code 連携（スキル使用法）
  - Configuration（設定ファイルの概要）
  - ドキュメント章リンク
  - Contributing / License

### 2. docs 章テンプレートの調整（必要に応じて）
- 重複章の整理（02 が2つ、03 が2つ、04 が2つ、05 が2つある）
- sdd-forge 固有の章テンプレートオーバーライドが必要な場合

### 3. README 生成・確認
- `sdd-forge readme` で生成し、出力品質を確認

## Out of Scope
- node-cli テンプレートへの汎用化移植（別 spec）
- docs 章の内容自体の書き直し（`@text` で生成済みの内容）
- data/ カスタムモジュールの作成（sdd-forge 自身は node-cli preset で十分）

## Clarifications (Q&A)
- Q: README にバッジを入れるか？
  - A: npm version バッジは入れる。CI バッジは CI 未設定なので不要
- Q: 重複章はどう整理するか？
  - A: README テンプレートで表示する章リストで解決（章ファイル自体は変更しない）

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-05
- Notes: ja locale only

## Requirements
- `.sdd-forge/templates/ja/docs/README.md` が `@extends` で cli テンプレートを継承する
- `sdd-forge readme` で生成した README が有名 CLI ツール並みの情報密度を持つ
- インストール方法が npm/yarn/pnpm の3種示される
- 主要コマンドの一覧が簡潔に示される
- SDD ワークフローが図または手順で説明される
- Claude Code との連携方法が示される

## Acceptance Criteria
- `sdd-forge readme` で README.md が正常に生成される
- README に Features, Quick Start, Commands, Workflow, Configuration のセクションがある
- テストが全て pass する

## Open Questions
- [x] バッジの種類 → npm version のみ
