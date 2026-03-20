# Draft: 081-pr-based-merge

## ユーザーリクエスト

Issue #5: flow-merge を PR 経由のマージに変更。squash merge を置き換えるのではなく、PR ルートを選択肢として追加する。

## 要件整理 (Q&A)

### Q1: merge.js の squash merge を gh pr create に置き換えるか？
- A: 置き換えではなく選択肢として追加。config で `commands.gh` が `"enable"` かつ `gh` コマンドが利用可能な場合に PR 選択肢を表示。利用不可の場合は警告を出す。

### Q2: config の設定場所
- A: トップレベルに `commands: { gh: "enable" | "disable" }` を追加。デフォルト `"disable"`。gh はフロー以外でも使う可能性があるため。

### Q3: Issue 番号の PR body 埋め込み
- A: flow.json に `issue` フィールドを追加し、`fixes #N` を PR body に埋め込む実装をする。今回は空欄のまま（将来 flow-issue で設定するルートを作る）。

### Q4: PR のマージ方法
- A: `gh pr create` のみ。マージは GitHub 上で手動。将来は自動対応。

### Q5: docs 生成タイミング
- A: flow-merge を2つに分割:
  - **flow-finalize** (旧 flow-merge): コードの確定・送出
  - **flow-sync** (新規): docs をコードに追従させる

### Q6: flow-sync のフロー管理
- A: specs/ 配下のアーカイブ済み flow.json を探索し、docs 未更新の spec をリストアップ → ユーザーが選択。選択した spec の flow.json にステータス記録。

### Q7: archive のタイミング
- A: flow-finalize の最後。

### Q8: push 先リモート
- A: デフォルト `origin`。config の `flow.push.remote` でオーバーライド可能。

## 矛盾・不足の洗い出し

### 解決済み: PR ルートのブランチ削除タイミング
- PR ルートではブランチが PR のソースとして必要なため finalize では削除できない
- → flow-sync に移す（PR マージ → ブランチ削除 → docs 生成）

### 解決済み: push ステップの欠落
- PR 作成には先に `git push -u origin <feature-branch>` が必要
- → finalize の PR ルートに push ステップを追加

## 設計まとめ

### flow-finalize（旧 flow-merge のリネーム）

責務: コードの確定・送出

**squash merge ルート:**
```
commit → squash merge → branch cleanup → archive
```

**PR ルート（commands.gh: enable かつ gh 利用可能時）:**
```
commit → push → gh pr create (fixes #N) → archive
```

- PR ルートではブランチ削除をスキップ（flow-sync に委譲）

### flow-sync（新規スキル）

責務: docs をコードに追従させる

```
1. specs/ 配下のアーカイブ済み flow.json を探索
2. docs 未更新の spec をリストアップ → ユーザーが選択
3. シナリオに応じた選択肢を提示:
   - PR 未マージ → PR マージ → ブランチ削除 → docs 生成 → commit
   - PR マージ済み → ブランチ削除 → docs 生成 → commit
   - squash merge 済み → docs 生成 → commit
4. 選択した spec の flow.json にステータス記録
```

### config スキーマ変更

```json
{
  "commands": {
    "gh": "enable" | "disable"    // default: "disable"
  },
  "flow": {
    "push": {
      "remote": "origin"           // default: "origin"
    }
  }
}
```

### flow.json スキーマ変更

- `issue` フィールド追加（Issue 番号。今回は空欄）
- `mergeStrategy` フィールド追加（`"squash"` or `"pr"`。finalize 時に記録。sync が参照）

### FLOW_STEPS 再構成

| フェーズ | ステップ |
|---|---|
| plan | approach, branch, spec, draft, fill-spec, approval, gate, test |
| impl | implement, review, finalize |
| finalize | commit, push, merge or pr-create, branch-cleanup, archive |
| sync | pr-merge, sync-branch-cleanup, docs-update, docs-review, docs-commit |

### 実装対象ファイル

| ファイル | 変更内容 |
|---|---|
| `src/lib/flow-state.js` | FLOW_STEPS / PHASE_MAP 更新、issue / mergeStrategy フィールド |
| `src/lib/config.js` | commands スキーマ追加 |
| `src/flow/commands/merge.js` | PR ルート追加（push + gh pr create） |
| `src/templates/skills/sdd-forge.flow-finalize/` | 新規（旧 flow-merge のリネーム + PR 選択肢追加） |
| `src/templates/skills/sdd-forge.flow-merge/` | 削除 |
| `src/templates/skills/sdd-forge.flow-sync/` | 新規スキル |

### 将来の拡張（今回のスコープ外）

- flow-issue: flow 開始時に Issue を紐付けるルート
- `gh pr merge --squash` による自動マージ
- commit hook による docs 自動同期（差分更新の実装後）

## 承認

- [x] User approved this draft
- Confirmed at: 2026-03-20
