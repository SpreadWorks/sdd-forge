# Feature Specification: 013-project-local-template-customization

**Feature Branch**: `feature/013-project-local-template-customization`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User request

## Goal
- プロジェクトローカルのテンプレート・スキャン・データソースカスタマイズ機構を導入する
- プリセットでは対応しきれないプロジェクト固有の要件に対応可能にする
- 既存の `.sdd-forge/custom/` を新構造に吸収・廃止する

## Scope

### 1. ディレクトリ構造

```
.sdd-forge/
├── config.json
├── templates/
│   └── {lang}/          ← config.json の lang に従う
│       ├── docs/        ← 章テンプレート + README.md（@extends/@block 対応）
│       ├── specs/       ← spec.md / qa.md テンプレート（プレースホルダー対応）
│       └── review/      ← checklist.md
├── scan/                ← カスタムスキャンモジュール（.js）
└── data/                ← カスタムデータソースモジュール（.js）
```

### 2. テンプレート継承チェーン拡張（docs）

`resolveChain()` に第4層としてプロジェクトローカルを追加:

```
base → arch → preset → project-local
```

- `init.js` の `.sdd-forge/custom/` 手書きマージを廃止し、`resolveChain` 経由に統一
- `readme.js` にも自動適用される
- プロジェクトローカル層はフラット（階層化しない）
- `@extends` / `@block` / 完全置換すべて対応

### 3. spec テンプレートカスタマイズ

- `createSpecTemplate()` がハードコードから `.sdd-forge/templates/{lang}/specs/spec.md` を優先読み込みに変更
- `createQaTemplate()` も同様に `.sdd-forge/templates/{lang}/specs/qa.md` を優先
- プレースホルダー: `{{BRANCH_NAME}}`, `{{SPEC_DIR}}`, `{{DATE}}`, `{{STATUS}}`
- テンプレートが存在しない場合は現行のハードコードにフォールバック

### 4. review チェックリストカスタマイズ

- `.sdd-forge/templates/{lang}/review/checklist.md` が存在すれば `templates/review-checklist.md` より優先
- フォールバック: 組み込みチェックリスト

### 5. カスタムスキャンモジュール

- `.sdd-forge/scan/*.js` に配置された JS モジュールを scan 時に読み込む
- プリセットの `scan/*.js` と同じインターフェース
- プリセットと同名ファイルがあればプロジェクトローカルが優先

### 6. カスタムデータソース

- `.sdd-forge/data/*.js` に配置された JS モジュールを data 解決時に読み込む
- プリセットの `data/*.js` と同じインターフェース
- プリセットと同名ファイルがあればプロジェクトローカルが優先

### 7. .sdd-forge/custom/ の廃止

- 既存の `init.js` 内の custom マージロジックを削除
- マイグレーション: custom/ のファイルを templates/{lang}/docs/ に移動するガイドを出力

## Out of Scope
- skills テンプレートのカスタマイズ（頻度低、将来対応）
- AGENTS.md テンプレートのカスタマイズ（同上）
- gate チェックのカスタマイズ（ロジック変更が必要、別 spec）
- テンプレート層内の階層化（フラットで十分）
- setup コマンドでのテンプレートスキャフォールド（将来対応）

## Clarifications (Q&A)
- Q: scan/data のカスタムモジュールのインターフェースは？
  - A: 既存プリセットの scan/*.js / data/*.js と同じ export 規約に従う
- Q: locale が config と異なるテンプレートが置かれた場合は？
  - A: config.json の lang に一致するディレクトリのみ読み込む。不一致は無視

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-05
- Notes:

## Requirements
- `resolveChain()` がプロジェクトローカル層を第4層として追加する
- プロジェクトローカル層は存在する場合のみチェーンに追加（オプショナル）
- spec テンプレートはプレースホルダー置換をサポートする
- カスタム scan/data モジュールは dynamic import で読み込む
- `.sdd-forge/custom/` が残っている場合、マイグレーション案内を出力する

## Acceptance Criteria
- `.sdd-forge/templates/{lang}/docs/` に置いた章テンプレートが init/readme に反映される
- `.sdd-forge/templates/{lang}/specs/spec.md` に置いたテンプレートで spec が生成される
- `.sdd-forge/templates/{lang}/review/checklist.md` で review チェックリストが上書きされる
- `.sdd-forge/scan/` のカスタムスキャナが scan 実行時に呼ばれる
- `.sdd-forge/data/` のカスタムデータソースが data 解決時に呼ばれる
- `.sdd-forge/custom/` の手書きマージが削除されている
- テンプレート/モジュールが存在しない場合は既存動作にフォールバックする
- 既存テストが全て pass する

## Open Questions
- [x] setup コマンドでテンプレートディレクトリのスキャフォールドを行うか → 将来 spec で対応
