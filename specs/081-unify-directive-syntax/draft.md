# Draft: Unify Directive Syntax

## Decisions

1. **スコープ**: 一括実装（パーサー改修 + テンプレート全移行 + guardrail 移行）
2. **TextDataSource**: Issue 設計通り、text を DataSource メカニズムに統合する
3. **header/footer**: 廃止する
4. **マルチライン**: この spec に含める
5. **DataSource パス**: 既存の `preset.source.method` 3パート構造を維持、引数形式のみ変更
6. **後方互換性**: 旧構文は即座に削除（alpha ポリシー）

## Requirements Summary

### Output Directives `{{ }}`
- `{{data("preset.source.method", {labels: "...", ignoreError: true})}}`
- `{{text({prompt: "...", mode: deep})}}` → `data("base.text", ...)` のシュガー
- マルチライン対応（`<!-- ... -->` 内で複数行可）
- `{{header}}` / `{{footer}}` は廃止

### Control Directives `{% %}`
- `{%extends "layout"%}` / `{%block "name"%}` / `{%/block%}`
- `{%guardrail {phase: [...]}%}` / `{%/guardrail%}`（`{%meta%}` を置換）

### Closing Tags
- `/name` パターンで統一: `{{/data}}`, `{{/text}}`, `{%/block%}`, `{%/guardrail%}`

### TextDataSource
- AI テキスト生成を DataSource メカニズムに統合

### Migration
- 全テンプレート一括移行、旧構文は即座に削除

## Affected Files
- `src/docs/lib/directive-parser.js`
- `src/docs/lib/template-merger.js`
- `src/spec/commands/guardrail.js`
- `src/docs/data/` — TextDataSource 新設
- `src/presets/` — 全プリセットテンプレート
- `src/templates/` — テンプレート
- テスト

- [x] User approved this draft (2026-03-20)
