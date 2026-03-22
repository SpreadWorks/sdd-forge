# Draft: fix README.md text directives

## 問題

`sdd-forge build` 実行後、README.md の `{{text}}` ディレクティブが空のまま残る。

### ログ

```
[text] Batch README.md: 3 directive(s) → 1 call
[text] Batch DONE README.md: 0/3 filled
[readme] README.md を更新しました。
```

### 原因分析

1. `readme.js` は `processTemplateFileBatch()` を呼んで `{{text}}` を処理している
2. AI は呼ばれて応答を返しているが、`countFilledInBatch()` が 0/3 と判定
3. README.md は `{{data}}` ディレクティブ解決済みの章テーブル（20行超）が含まれる
4. `buildBatchPrompt()` はファイル全体をプロンプトに含めるため、大きな `{{data}}` 解決済みコンテンツの中で AI が `{{text}}` 構造を維持できない
5. バッチモード（ファイル全体を1回の呼び出しで処理）が README.md のような構造（少数の `{{text}}` が大量の固定テキストの間に分散）に適していない

### 解決方針

README.md の `{{text}}` 処理を per-directive モード（1ディレクティブ1呼び出し）で実行する。

理由:
- README.md は `{{text}}` が3箇所だけで、間に大きな `{{data}}` 解決済みコンテンツがある
- バッチモードではファイル全体を返す必要があり、AI が構造を壊しやすい
- per-directive モードなら各ディレクティブを個別に処理でき、`{{data}}` 部分は触らない
- `processTemplate()`（per-directive 版）は既に実装済み

### 実装箇所

- `src/docs/commands/readme.js` の 138-161行目
  - `processTemplateFileBatch()` → `processTemplate()` に変更
  - または README.md のような短いファイルではバッチモードを使わないフラグを追加

## 決定事項

- [x] User approved this draft (2026-03-22)
