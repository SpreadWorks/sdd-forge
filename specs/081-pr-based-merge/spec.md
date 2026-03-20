# Feature Specification: 081-pr-based-merge

**Feature Branch**: `feature/081-pr-based-merge`
**Created**: 2026-03-20
**Status**: Draft
**Input**: Issue #5

## Goal

flow-merge を flow-finalize にリネームし、既存の squash merge に加えて PR 経由のマージルートを選択肢として追加する。
また、docs 生成を独立した flow-sync スキルに分離し、マージ後の正確なプロジェクト状態で docs を生成できるようにする。

## Why This Approach

現在の flow-merge は squash merge + docs 生成を一体で行うが、以下の問題がある:
1. GitHub Projects の自動ステータス変更には PR が必要
2. worktree 内での docs 生成は他の worktree の変更が反映されず不正確
3. 名前 (merge) と実際の責務（docs 生成含む）が乖離

flow-finalize（コード確定）と flow-sync（docs 追従）に分離することで、責務が明確になり、docs の正確性も向上する。

## Scope

### 1. flow-merge → flow-finalize リネーム
- スキルテンプレート: `src/templates/skills/sdd-forge.flow-merge/` → `src/templates/skills/sdd-forge.flow-finalize/`
- SKILL.ja.md / SKILL.en.md の内容を新しいフローに合わせて書き換え
- 新テンプレート作成後、旧 `src/templates/skills/sdd-forge.flow-merge/` ディレクトリを削除する
- alpha 版ポリシーにより後方互換は不要（旧フォーマット・非推奨パスは保持せず削除する）
- 移行手順: ユーザーが `sdd-forge upgrade` を実行すると旧 flow-merge スキルが削除され flow-finalize スキルが配置される。upgrade コマンドは差分検出で変更ファイルのみ更新するため、手動操作は不要

### 2. flow-finalize スキルの PR ルート追加
- squash merge ルート（既存）: commit → squash merge → branch cleanup → archive
- PR ルート（新規）: commit → push → `gh pr create` → archive
  - PR body に `fixes #N` を含める（flow.json の `issue` フィールドから取得）
  - push 先リモート: デフォルト `origin`、`flow.push.remote` でオーバーライド
  - PR ルートではブランチ削除をスキップ（flow-sync に委譲）
- `commands.gh` が `"enable"` かつ `gh` コマンドが利用可能な場合のみ PR 選択肢を表示
- `gh` が enable だが利用不可の場合は警告を表示

### 3. flow-sync スキル新規作成
- スキルテンプレート: `src/templates/skills/sdd-forge.flow-sync/` (SKILL.ja.md / SKILL.en.md)
- 動作:
  1. `specs/` 配下のアーカイブ済み flow.json を探索
  2. docs 未更新の spec をリストアップ → ユーザーが選択
  3. シナリオに応じた選択肢を提示（すべてユーザーの選択で決定）:
     - PR 未マージ → PR マージ / ブランチ削除 / docs 生成 / commit
     - PR マージ済み → ブランチ削除 / docs 生成 / commit
     - squash merge 済み → docs 生成 / commit
  4. 選択した spec のアーカイブ済み flow.json にステータス記録
- **docs 未更新の判定**: アーカイブ済み flow.json の sync ステップ（`docs-update`）が `done` でない spec を「未同期」とみなす。初回アーカイブ時は sync ステップが `pending` なので自動的に未同期扱いになる。

### 4. config スキーマ変更
- `commands.gh`: `"enable"` | `"disable"`（デフォルト: `"disable"`）
- `flow.push.remote`: string（デフォルト: `"origin"`）
- `src/lib/types.js`: FlowConfig typedef 更新、validateConfig() に新フィールド追加

### 5. flow.json スキーマ変更
- `issue` フィールド追加（number | null。今回は空欄のまま）
- `mergeStrategy` フィールド追加（`"squash"` | `"pr"`。finalize 時に記録。sync が参照）
- `src/lib/flow-state.js`: FLOW_STEPS / PHASE_MAP 更新

### 6. merge.js の PR ルート対応
- `src/flow/commands/merge.js` に `--pr` フラグを追加
- PR ルート: `git push` → `gh pr create`
- config から `commands.gh` と `flow.push.remote` を読み込み

## Out of Scope

- flow-issue（flow 開始時に Issue を紐付けるルート）
- `gh pr merge` による自動マージ
- commit hook による docs 自動同期（差分更新の実装後）
- flow-plan / flow-impl の変更

## Clarifications (Q&A)

- Q: squash merge を置き換えるか？
  - A: いいえ。選択肢として PR ルートを追加する。
- Q: gh コマンドの存在を前提にしてよいか？
  - A: いいえ。config で enable/disable を制御。enable 時に gh がなければ警告。
- Q: Issue 番号はどこから取得するか？
  - A: flow.json の issue フィールド。今回は空欄。将来 flow-issue で設定。
- Q: PR 作成後のマージは？
  - A: gh pr create のみ。マージは GitHub 上で手動（将来自動対応）。
- Q: docs 生成はどうするか？
  - A: flow-sync に分離。base branch でマージ後に実行。
- Q: push 先リモートの設定場所は？
  - A: flow.push.remote（デフォルト "origin"）。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-20
- Notes: ドラフト Q&A 後に承認

## Requirements

優先度順（P1: 必須, P2: 重要, P3: あると良い）

### P1: コア変更
1. FLOW_STEPS / PHASE_MAP を finalize / sync フェーズに対応させる
2. flow.json に `issue` と `mergeStrategy` フィールドを追加する
3. config に `commands.gh` (enable/disable) と `flow.push.remote` を追加し、バリデーションする

### P2: flow-finalize
4. flow-merge スキルテンプレートを flow-finalize にリネームし旧テンプレートを削除する
5. flow-finalize スキルに squash merge / PR の選択肢を追加する
6. merge.js に PR ルート（push + gh pr create）を実装する
7. `gh` が enable だが利用不可の場合に警告を表示する

### P3: flow-sync
8. flow-sync スキルテンプレート（SKILL.ja.md / SKILL.en.md）を新規作成する
9. flow-sync が archived flow.json を探索し、未同期の spec をリストアップできる
10. flow-sync が PR マージ / ブランチ削除 / docs 生成 / commit をユーザー選択で実行する

## Acceptance Criteria

- `commands.gh: "disable"` の場合、finalize で PR 選択肢が表示されないこと
- `commands.gh: "enable"` かつ `gh` がインストール済みの場合、PR 選択肢が表示されること
- `commands.gh: "enable"` かつ `gh` が未インストールの場合、警告が表示されること
- PR 作成時に flow.json の issue フィールドから `fixes #N` が body に含まれること（issue が空の場合は含めない）
- push 先が `flow.push.remote` の値（未設定時は `origin`）であること
- finalize の PR ルートでブランチ削除がスキップされること
- flow-sync が specs/ 配下の archived flow.json を正しく探索できること
- 既存の squash merge ルートが引き続き動作すること
- `sdd-forge upgrade` 実行後に旧 flow-merge スキルが削除され、flow-finalize / flow-sync スキルが配置されること

## Open Questions

- [x] flow-sync の sync ステップ ID の最終的な命名 → `pr-merge`, `sync-cleanup`, `docs-update`, `docs-review`, `docs-commit` で確定
