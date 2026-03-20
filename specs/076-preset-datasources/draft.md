# Draft: Preset DataSources (#076)

## Request

I8: テンプレートの text 過多 — 新プリセットは全て `{{text}}` で、`{{data}}` にすべき箇所がある。各プリセットに DataSource を順次追加する。

## Analysis

全117個の `{{text}}` ディレクティブを分類:
- → data に変換: 62個 (53%) — 一覧表・構造データ・設定値
- → text のまま: 55個 (47%) — 説明文・概要・Mermaid図・フロー解説

### 判断基準

- **→ data**: ソースコード解析 (scan) または AI 解析 (enrich) で機械的に抽出できる構造データ
- **→ text**: 説明文、設計判断、フロー解説など人間/AI の記述が必要なもの

### プリセット別の変換量

| プリセット | → data | → text | 主な DataSource |
|---|---|---|---|
| nextjs | 8 | 4 | routes, components, middleware |
| node-cli | 12 | 10 | commands, config, modules, env |
| cli | 5 | 2 | commands, config, env |
| base | 5 | 8 | structure, components |
| drizzle | 3 | 2 | schema.tables, schema.relations |
| workers | 3 | 1 | entryPoints, bindings, env |
| graphql | 3 | 1 | types, queries, mutations |
| rest | 1 | 2 | endpoints |
| r2 | 2 | 0 | buckets, access |
| hono | 1 | 1 | middleware |
| library | 2 | 4 | exports, requirements |
| database | 2 | 1 | tables, relationships |
| edge | 2 | 1 | entryPoints, constraints |
| storage | 1 | 1 | buckets |
| api | 2 | 2 | errors, permissions |
| postgres | 1 | 0 | schema.tables |

## Decisions

1. 方針: scan + enrich を併用。ケースバイケースで選択
2. スコープ: 全プリセット (14+) を1つの spec で扱う
3. ベースブランチ: development

- [x] User approved this draft (2026-03-19)
