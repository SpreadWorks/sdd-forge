# Draft: Guardrail (Project Principles)

## Summary

プロジェクトの不変原則を `.sdd-forge/guardrail.md` に定義し、gate コマンドで AI が spec との整合性を検証する仕組みを導入する。

## Decisions

### コマンド名
- `sdd-forge guardrail init` — テンプレートから guardrail.md を生成
- `sdd-forge guardrail update` — AI が analysis.json を読み、プロジェクト固有の原則を提案・追記

### ファイル配置
- `.sdd-forge/guardrail.md`

### 条項フォーマット
- `###` 見出し + 説明段落（ID なし）
- 例:
  ```markdown
  ### 外部依存なし
  Node.js 組み込みモジュールのみ使用。依存追加は禁止。

  ### REST-First
  API は REST 規約に従う。
  ```

### テンプレート
- base プリセットに汎用テンプレート（全プロジェクト共通の原則）
- 各プリセットに stack 固有テンプレート（node-cli, laravel 等）
- `guardrail init` 時にマージして `.sdd-forge/guardrail.md` を生成

### AI による原則追加 (update)
- `guardrail update` で AI が analysis.json を読み、プロジェクト固有の原則を提案・追記

### gate 統合
- gate 実行時に guardrail.md が存在すれば、AI が spec 全文を各条項と照合
- 条項ごとに pass/fail を判定
- guardrail.md が存在しない場合は WARN を出力:
  - `WARN: .sdd-forge/guardrail.md not found.`
  - `Run 'sdd-forge guardrail init' to define project principles and improve gate accuracy.`

### コマンドルーティング
- `spec.js` 経由 → `specs/commands/guardrail.js`

### 検証方式
- spec 全文を AI に渡し、guardrail の各条項ごとに違反有無を自律判断（構造チェック + AI 整合性チェック）

## Approval
- [x] User approved this draft
- Confirmed at: 2026-03-13
