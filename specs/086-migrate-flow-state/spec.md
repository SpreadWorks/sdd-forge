# Feature Specification: 086-migrate-flow-state

**Feature Branch**: `feature/086-migrate-flow-state`
**Created**: 2026-03-22
**Status**: Draft
**Input**: Issue #15

## Goal

flow.json の保存先を `.sdd-forge/flow.json` から `specs/NNN/flow.json` に移行し、`.sdd-forge/.active-flow` ポインタで管理する。これにより worktree 削除時の状態消失を防ぎ、複数フローの並行実行を可能にする。

## Scope

### 1. `.active-flow` ポインタ導入（`src/lib/flow-state.js`）
- main repo の `.sdd-forge/.active-flow` に JSON 配列を保存
- 各エントリ: `{ "spec": "<spec-id>", "mode": "worktree|branch|local" }`
- ポインタの CRUD 関数: `loadActiveFlows()`, `addActiveFlow()`, `removeActiveFlow()`
- stale 検出: モード別に判定し自動削除
  - worktree: `git worktree list` に該当 branch が存在するか
  - branch: `git branch --list feature/<spec-id>` が存在するか
  - local: main repo の `specs/<spec-id>/flow.json` が存在するか
- コンテキスト判別: 現在の worktree/branch から対象フローを自動特定

### 2. flow.json の保存先変更（`src/lib/flow-state.js`）
- `saveFlowState()`: `specs/NNN/flow.json`（作業ツリー内）に書き込む
- `loadFlowState()`: `.active-flow` 経由で `specs/NNN/flow.json` を読む
- `clearFlowState()`: `.active-flow` からエントリ削除（flow.json 自体は残す）
- `flowStatePath()`: `.active-flow` + コンテキストから実際のパスを解決

### 3. `spec init` の変更（`src/spec/commands/init.js`）
- flow.json を `specs/NNN/flow.json` に保存
- `.active-flow` にエントリ追加
- stale エントリの自動クリーンアップ（init 時）

### 4. `flow start` の変更（`src/flow/commands/start.js`）
- flow.json を `specs/NNN/flow.json` に保存
- `.active-flow` にエントリ追加

### 5. archive ロジック削除
- `cleanup.js`: auto-archive ロジック削除。`.active-flow` エントリ削除 + worktree/branch 削除のみ
- `status.js`: `--archive` オプション削除

### 6. cleanup の cwd エラー修正（`src/flow/commands/cleanup.js`）
- worktree 削除前に main repo に cd してから `git worktree remove` を実行

### 7. `flow status --all` 追加（`src/flow/commands/status.js`）
- 全モードスキャン（worktree + branch + local）
- `specs/*/flow.json` を main repo、全 worktree、全 feature branch から収集
- 各フローの spec ID、モード、フェーズ、進捗を一覧表示

### 8. resume の改善（`src/flow/commands/resume.js`）
- `.active-flow` からアクティブフローを取得
- `.active-flow` がない場合は全スキャンで検索
- 複数フローがある場合はユーザーに選択させる

### 9. finalize ガイダンスメッセージ改善
- merge/cleanup 完了後のメッセージを `.active-flow` ベースに更新

### 10. finalize 時の flow.json commit
- commit ステップで `specs/NNN/flow.json` をステージングに含める

### 11. スキルテンプレート更新
- 6 つの flow 関連スキルテンプレートから `.sdd-forge/flow.json` 参照と `--archive` 参照を更新
- 変更後に `sdd-forge upgrade` を実行

### 12. テスト更新
- `tests/unit/flow.test.js`: コア関数のテスト更新
- `tests/e2e/flow/commands/`: cleanup, merge, resume, status-check テスト更新

## Out of Scope
- `.active-flow` のロック機構（競合書き込み防止）
- flow.json のスキーマバージョニング
- 旧形式（`.sdd-forge/flow.json`）からの移行ツール（alpha 版ポリシーにより不要）

## CLI 破壊的変更

### 削除: `flow status --archive`
- **変更内容**: `--archive` オプションを削除。flow.json が `specs/NNN/` に最初から存在するためアーカイブ処理が不要
- **影響範囲**: `sdd-forge flow status --archive` を使用しているスキルテンプレート（flow-finalize）
- **移行手順**:
  1. スキルテンプレートから `--archive` 参照を削除（本 spec のスコープ内で対応）
  2. `sdd-forge upgrade` を実行してプロジェクトのスキルファイルに反映
  3. 既存の `.sdd-forge/flow.json` がある場合は手動削除（新方式では使用されない）

## Clarifications (Q&A)

- Q: `.active-flow` のフォーマットは？
  - A: JSON 配列。各エントリに `spec`（spec ID）と `mode`（worktree / branch / local）

- Q: `.active-flow` はどこに置くか？
  - A: main repo の `.sdd-forge/.active-flow` のみ。worktree からは `getMainRepoPath()` 経由でアクセス

- Q: worktree モードで flow.json はどこに書くか？
  - A: worktree 内の `specs/NNN/flow.json`。main repo は変更しない

- Q: stale 検出はモード不明でも確実か？
  - A: `.active-flow` にモード情報を持つため、モード別の確実な判定が可能

- Q: `spec init` 時に既存フローがあったら reject するか？
  - A: しない。複数フロー対応のため追加するだけ。stale は自動削除

- Q: archive は不要か？
  - A: 不要。flow.json が最初から `specs/NNN/` にあり、merge で main に入る

- Q: 完了済みフローの判定方法は？
  - A: flow.json 内のステップで判定。`derivePhase()` で判定可能

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-22
- Notes: ドラフト Q&A で全要件を確認済み

## Requirements

**Priority: High（コア機能）**

1. `.active-flow` は main repo の `.sdd-forge/.active-flow` に JSON 配列として保存され、各エントリが `spec` と `mode` を持つこと
2. `spec init` 実行時に flow.json が `specs/NNN/flow.json` に作成され、`.active-flow` にエントリが追加されること
3. `loadFlowState()` が `.active-flow` 経由でコンテキストに対応する flow.json を読み込むこと
4. `clearFlowState()` が `.active-flow` からエントリを削除し、`specs/NNN/flow.json` は削除しないこと
5. `.active-flow` の各エントリについて、`loadFlowState()` 実行時に以下の条件で stale を判定し自動削除すること: worktree モードの場合 `git worktree list` に該当 branch がない、branch モードの場合 `git branch --list` に該当 branch がない、local モードの場合 main repo に `specs/<spec-id>/flow.json` が存在しない
6. `cleanup.js` が archive なしで `.active-flow` エントリ削除 + worktree/branch 削除を行うこと
7. worktree 内から実行した場合、`getMainRepoPath()` 経由で main repo の `.active-flow` を正しく読み書きできること

**Priority: Medium（機能拡張）**
8. `flow status --all` が worktree・branch・local の全フローを一覧表示すること
9. 複数フローがアクティブな場合、`flow status`（引数なし）がコンテキストから対象を特定するか、選択を求めること
10. finalize の commit 時に `specs/NNN/flow.json` がステージングに含まれること

**Priority: Low（クリーンアップ）**

11. `--archive` オプションと archive 関連コードが削除されていること
12. 6 つの flow 関連スキルテンプレートが新方式に更新されていること

## Acceptance Criteria

- [ ] `.active-flow` の作成・読み取り・エントリ追加・エントリ削除が正常動作する
- [ ] worktree / branch / local 全モードで `spec init` → flow 実行 → cleanup が正常完了する
- [ ] stale エントリが自動検出・削除される
- [ ] 複数フローの並行実行が可能（2 つの worktree で別々のフローを同時進行）
- [ ] `flow status --all` が全モードのフローを表示する
- [ ] worktree 削除時に cwd エラーが発生しない
- [ ] archive 関連コード・オプションが完全に削除されている
- [ ] 既存テストが新方式に対応し、全パスする
- [ ] スキルテンプレート更新後、`sdd-forge upgrade` でプロジェクトに反映される

## Error Handling

- `.active-flow` の読み書きに失敗した場合（パーミッションエラー等）: エラーメッセージを stderr に出力し、exit code 1 で終了する
- stale 検出中に `git worktree list` / `git branch --list` が失敗した場合: stale 判定をスキップし、エントリを保持する（誤削除防止）
- worktree 削除失敗時: エラーメッセージを stderr に出力し、exit code 1 で終了する。`.active-flow` エントリは削除しない（リトライ可能にするため）

## Open Questions
- (なし)
