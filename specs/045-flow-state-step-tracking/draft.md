# Draft: flow-state step tracking

## 要件整理

### 背景
- SDD フローは会話が途切れると「今どのステップにいるか」「何を実装しているか」がわからなくなる
- 現在の `current-spec` はブランチ情報のみ保存

### 決定事項

1. **ファイル名変更**: `current-spec` → `flow.json`
   - `.sdd-forge/flow.json` に配置
   - close 時に `specs/NNN-xxx/flow.json` に移動（履歴として保存）

2. **ステップ管理**: sdd-flow-start の全10ステップをトラッキング
   - approach, branch, spec, draft, fill-spec, approval, gate, test, implement, finalize
   - 各ステップに status: `pending` / `in_progress` / `done` / `skipped`

3. **Requirements リスト**: spec.md の Requirements から項目を抽出
   - 各項目に status を持たせる（`pending` / `in_progress` / `done`）
   - step 6（user approval）完了後に AI がリストを生成して保存

4. **`flow.js` リファクタリング**: DIRECT_COMMAND → サブコマンドディスパッチャー
   - `sdd-forge flow start "<要望>"` — 旧 `flow --request` の後継
   - `sdd-forge flow status` — 進捗表示（引数なし）
   - `sdd-forge flow status --step <step> --status <status>` — ステップ更新
   - `sdd-forge flow status --summary '<JSON array>'` — requirements リスト保存
   - `sdd-forge flow status --req <index> --status <status>` — requirement 項目の status 更新

5. **ステータス更新の責務**: スキル（SKILL.md）に指示を追加
   - 各ステップ完了時に `sdd-forge flow status --step ... --status done` を呼ぶ
   - AI がスキルの手順に従って CLI を実行

6. **スキル更新**:
   - `sdd-flow-start/SKILL.md` — 各ステップに flow status 更新指示を追加
   - `sdd-flow-close/SKILL.md` — close 時に flow.json を spec フォルダに移動する指示を追加
   - `sdd-flow-status/SKILL.md` — ステップ進捗 + requirements 進捗の表示

### flow.json の構造

```json
{
  "spec": "specs/045-xxx/spec.md",
  "baseBranch": "main",
  "featureBranch": "feature/045-xxx",
  "worktree": false,
  "steps": [
    { "id": "approach", "status": "done" },
    { "id": "branch", "status": "done" },
    { "id": "spec", "status": "done" },
    { "id": "draft", "status": "in_progress" },
    { "id": "fill-spec", "status": "pending" },
    { "id": "approval", "status": "pending" },
    { "id": "gate", "status": "pending" },
    { "id": "test", "status": "pending" },
    { "id": "implement", "status": "pending" },
    { "id": "finalize", "status": "pending" }
  ],
  "requirements": [
    { "desc": "flow.js をサブコマンドディスパッチャーに変更", "status": "pending" },
    { "desc": "flow-state.js に steps 配列を追加", "status": "pending" }
  ]
}
```

- [x] User approved this draft (2026-03-13)
