# Draft: 086-migrate-flow-state

## User Request
Issue #15: flow.json をポインタ(.active-flow) + specs/NNN/flow.json ベースの状態管理に移行するリファクタリング

## Q&A Summary

### `.active-flow` の形式
- **Q**: ポインタファイルの中身はどのような形式か？
- **A**: JSON 配列。各エントリに `spec`（spec ID）と `mode`（worktree / branch / local）を持つ。

```json
[
  { "spec": "086-migrate-flow-state", "mode": "worktree" },
  { "spec": "087-xxx", "mode": "local" }
]
```

### `.active-flow` の配置
- **Q**: ポインタはどこに置くか？
- **A**: main repo の `.sdd-forge/.active-flow` のみ。`.sdd-forge/` は `.gitignore` に入っており worktree には引き継がれないため。worktree からは `getMainRepoPath()` 経由で main repo の `.active-flow` を読み書きする。

### flow.json の保存先
- **Q**: worktree モードでの flow.json の書き込み先は？
- **A**: worktree 内の `specs/NNN/flow.json`。main repo の specs/ は変更しない（worktree の隔離原則）。

### 複数フロー対応
- **Q**: `.active-flow` は複数フローをサポートするか？
- **A**: はい。JSON 配列で複数エントリを持つ。`spec init` は行を追加、finalize/cleanup は該当エントリを削除。

### stale 検出
- **Q**: stale の判定方法は？
- **A**: モード別に判定。確実に stale なら自動削除。
  - worktree: `git worktree list` に該当 branch があるか
  - branch: `git branch --list feature/<spec-id>` が存在するか
  - local: main repo の `specs/<spec-id>/flow.json` がディスク上に存在するか

### archive ロジック
- **Q**: auto-archive は必要か？
- **A**: 不要。flow.json が最初から `specs/NNN/` にあるため。cleanup は `.active-flow` からエントリ削除 + worktree/branch 削除のみ。`--archive` オプションも廃止。

### `spec init` の競合チェック
- **Q**: 有効な `.active-flow` がある場合 reject するか？
- **A**: しない。複数フロー対応のため、新しいエントリを追加するだけ。stale エントリは自動削除。

### `flow status --all`
- **Q**: 表示範囲は？
- **A**: 全モードスキャン（worktree + branch + local）。

### resume
- **Q**: 再開時の対象特定は？
- **A**: `.active-flow` があれば対象を提案。なければ全スキャンして選択。複数あれば選択させる。

### コンテキスト判別
- **Q**: 複数フロー時に `flow status` のコマンドはどのフローを対象にするか？
- **A**: 実行コンテキストから自動判別（worktree → 対応 spec、feature branch → branch 名から導出）。main 上 + 複数の場合は `--spec` で明示指定。

### finalize と commit
- **Q**: merge 前に flow.json の commit は必要か？
- **A**: はい。finalize の commit 時に `specs/NNN/flow.json` をステージングに含める。

### 完了判定
- **Q**: 完了済みと進行中の区別は？
- **A**: flow.json 内のステップで判定。全ステップが done/skipped なら完了済み。`derivePhase()` で判定可能。

## Decisions
1. `.active-flow` は JSON 配列形式（spec + mode）
2. main repo の `.sdd-forge/.active-flow` が唯一のポインタ
3. flow.json は作業ツリー内の `specs/NNN/flow.json` に保存
4. 複数フロー対応（並行実行可能）
5. stale 検出はモード別に確実な方法で判定、自動削除
6. archive ロジックと `--archive` オプションを廃止
7. `spec init` は reject せず追加
8. finalize 時に flow.json を commit に含める
9. `clearFlowState()` は `.active-flow` からエントリ削除（flow.json は残す）

## Additional Considerations
- `sdd-forge flow start` も `.active-flow` 追記が必要
- `flowStatePath()` の API 変更（`.active-flow` 経由の解決 + コンテキスト判別）
- `resolveWorktreePaths()` への影響確認
- 6 つのスキルテンプレートの更新 + `sdd-forge upgrade` 実行
- テスト更新（unit + e2e）

- [x] User approved this draft
- Confirmed at: 2026-03-22
