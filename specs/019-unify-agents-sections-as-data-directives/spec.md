# Feature Specification: 019-unify-agents-sections-as-data-directives

**Feature Branch**: `feature/019-unify-agents-sections-as-data-directives`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User request

## Goal

AGENTS.md の SDD / PROJECT セクション管理を `<!-- SDD:START -->` / `<!-- PROJECT:START -->` 独自マーカーから `{{data}}` ディレクティブに統一する。併せて MANUAL ブロック（`<!-- MANUAL:START/END -->`）を廃止する。

## Scope

1. `agents` データソースの新設（`src/docs/data/agents.js`）
   - `sdd(analysis, labels)` — SDD テンプレートを返す（言語対応）
   - `project(analysis, labels)` — PROJECT セクションを生成（テンプレート + AI 精査）

2. AGENTS.md テンプレートの書き換え
   - `<!-- SDD:START -->...<!-- SDD:END -->` → `<!-- {{data: agents.sdd("")}} -->...<!-- {{/data}} -->`
   - `<!-- PROJECT:START -->...<!-- PROJECT:END -->` → `<!-- {{data: agents.project("")}} -->...<!-- {{/data}} -->`
   - AGENTS.sdd.md テンプレート内の MANUAL ブロック説明を削除

3. `agents.js` コマンドの簡素化
   - `generateProjectSectionTemplate()` / `updateProjectSection()` / `updateSddSection()` のロジックをデータソースに移動
   - コマンドは `data` コマンドと同様にディレクティブ解決を呼ぶだけにする
   - `--sdd` / `--project` フラグは廃止（`{{data}}` ディレクティブで制御）
   - `--dry-run` は維持

4. MANUAL ブロックの廃止
   - `<!-- MANUAL:START -->` / `<!-- MANUAL:END -->` の処理を全コマンドから削除
   - テンプレート内の MANUAL ブロックを削除
   - review.js の MANUAL mismatch チェックを削除

5. `agents-md.js` の整理
   - `updateSddSection()` を削除（ディレクティブ解決で不要に）
   - `loadSddTemplate()` はデータソースから呼ばれるので維持（またはデータソースに移動）

6. 英語テンプレートの追加
   - `src/presets/base/templates/en/AGENTS.sdd.md` を作成（日本語版の翻訳）

## Out of Scope

- `{{text}}` ブロックディレクティブ対応（別 spec）
- readme.js のディレクティブ解決重複の解消（別 spec）
- PROJECT セクション生成時の AI 精査の改善
- 多言語出力の本格対応（spec 017 で対応）

## Clarifications (Q&A)

- Q: PROJECT セクション生成には AI を使うが、`{{data}}` ディレクティブで良いのか？
  - A: テンプレート生成は analysis.json からの機械的処理。AI 精査は agents コマンド固有の後処理として残す。データソースの `project()` はテンプレート生成のみ行い、AI 精査はコマンド側で行う。

- Q: MANUAL ブロック廃止後、ユーザーの手動記述はどうなるか？
  - A: `{{data}}` / `{{text}}` ディレクティブの外に書けば上書きされない。ディレクティブ解決はディレクティブ内部のみ更新するため。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-06
- Notes:

## Requirements

1. AGENTS.md が `{{data}}` ディレクティブで管理される
2. `sdd-forge agents` 実行で AGENTS.md の `{{data: agents.sdd}}` / `{{data: agents.project}}` が解決される
3. `sdd-forge data` でも agents ディレクティブが解決される（AGENTS.md が対象に含まれる場合）
4. MANUAL ブロックが全テンプレート・コマンドから除去される
5. 英語版 AGENTS.sdd.md テンプレートが存在する
6. 既存テスト（273件）が引き続きパスする

## Acceptance Criteria

- [ ] `agents` データソース（`src/docs/data/agents.js`）が存在し、`sdd()` / `project()` メソッドを持つ
- [ ] AGENTS.md テンプレートが `{{data}}` ディレクティブを使用している
- [ ] `sdd-forge agents` が正常動作する
- [ ] `<!-- SDD:START/END -->` / `<!-- PROJECT:START/END -->` マーカーがコードから除去されている
- [ ] `<!-- MANUAL:START/END -->` の処理がコードから除去されている
- [ ] `src/presets/base/templates/en/AGENTS.sdd.md` が存在する
- [ ] 全テストがパスする

## Open Questions

- [x] `agents` コマンドの `--sdd` / `--project` フラグは廃止で良いか → 廃止（ディレクティブで制御）
