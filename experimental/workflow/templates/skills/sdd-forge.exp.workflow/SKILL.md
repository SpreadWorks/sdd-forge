---
name: sdd-forge.exp.workflow
description: |
  Manage GitHub Projects board drafts and publish them as issues via experimental/workflow.js.
  TRIGGER when the user says any of: "ボードに追加", "タスク化", "メモしておいて", "issue にして",
  "issueにして", "ドラフトを作って", "board に追加", "アイデアをメモ".
  Also TRIGGER when the user explicitly invokes /sdd-forge.exp.workflow.
---

# SDD Experimental: Workflow

GitHub Projects board の Draft 管理と Issue 化を担う実験的ワークフロー。
`experimental/workflow.js` の薄いラッパーとして、AI が運用ルールを守って CLI を呼び出すための skill。

## CLI Reference

```bash
node experimental/workflow.js <subcommand> [args]
```

| Subcommand | 用途 |
|---|---|
| `add <title> [--status Ideas\|Todo] [--category RESEARCH\|BUG\|ENHANCE\|OTHER] [--body <text>]` | 新規 Draft 作成 |
| `update <hash> [--status <s>] [--body <text>] [--title <text>]` | Draft 更新 |
| `show <hash>` | アイテム詳細表示 |
| `search <query>` | 全文検索 |
| `list [--status <status>]` | 一覧表示 |
| `publish <hash> [--label <l>]` | Draft を Issue 化（必要なら翻訳） |

## MUST Rules

### Draft 言語ルール
- **MUST: ボード上の Draft は `config.experimental.workflow.languages.source` 言語で書くこと。** デフォルトは `config.lang`。
- **MUST: `add` / `update` に渡すタイトル・本文は source 言語で作成すること。** 別の言語で下書きしてから翻訳してはならない。
- **MUST: `add` / `update` 実行前に、登録・更新するタイトルと本文が source 言語のみで構成されているか確認すること。**
- **MUST: `add` / `update` の直後に `show <hash>` で表示内容を確認し、source 言語の Draft のまま保存されていることを検証すること。**

### 状態管理
- 新規追加はデフォルトで `Ideas` ステータス（リサーチメモ・アイデア用）。
- 実装タスク・バグは `--status Todo` を明示する。
- 分類タグが必要な場合は `--category` を付ける。

### Issue 化（publish）
- **MUST: Issue を作成する場合は、必ず先にボードに Draft を作成し、ユーザーの「issue にして」指示を待つこと。** Draft を経由せず直接 `gh issue create` してはならない。
- **MUST: 「○○を issue にして」と言われたら、必ず `node experimental/workflow.js publish <hash> [--label ...]` を実行すること。**
- 適切なラベル（bug / enhancement / documentation 等）を `--label` で付ける。
- `publish` 成功時、ボードアイテムの Status は自動で `Todo` に移動する。

## Procedure

1. ユーザーから「ボードに追加」「タスク化」「メモしておいて」等の指示を受けたら、追加するタイトル・本文を source 言語で組み立てる。
2. `node experimental/workflow.js add "<title>" [--status ...] [--category ...]` を実行し、JSON envelope の `data.title` を確認する。
3. ユーザーが「issue にして」と言ったら、対応するハッシュを `search` または `show` で確認する。
4. `node experimental/workflow.js publish <hash> --label <label>` を実行する。
5. 出力された `data.issueUrl` をユーザーに伝える。

## Output Format

すべてのコマンドは JSON envelope `{ ok, type, key, data, errors }` を返す。
失敗時は非ゼロ終了コードで終了する。
