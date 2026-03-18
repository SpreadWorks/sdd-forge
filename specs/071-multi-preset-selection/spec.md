# Feature Specification: 071-multi-preset-selection

**Feature Branch**: `feature/071-multi-preset-selection`
**Created**: 2026-03-18
**Status**: Draft
**Input**: 複数 preset 選択の仕組みを実装する

## Goal

preset システムを拡張し、異なる軸（framework, platform, database 等）の preset を
1つのプロジェクトで組み合わせられるようにする。
例: `type: ["symfony", "postgres"]`

## Why This Approach

現在の単一 type モデルでは直交する関心事（言語 × アーキテクチャ × DB）を表現できない。
多重継承はダイアモンド問題を引き起こす。
組み合わせ preset（単一継承 parent チェーン）+ チェーン間加算マージにより、
シンプルに解決でき、同じ仕組みがモノレポにも自然に拡張できる。

## Scope

### 1. config.json: `type` を `string | string[]` に拡張
- `"type": "symfony"`（後方互換、単一文字列）
- `"type": ["symfony", "postgres"]`（複数 preset）
- 各要素は leaf preset 名（type パス形式 `"webapp/symfony"` は廃止）
- `src/lib/types.js` の `validateConfig()` を更新
- `resolveType()` と `TYPE_ALIASES` を廃止

### 2. preset 構造の変更
- `php` preset → `php-webapp` にリネーム（parent: webapp）
- cakephp2, laravel, symfony の parent を `php-webapp` に変更
- `node` preset を廃止（node-cli で完結）
- 全 preset.json から `lang`, `axis` フィールドを削除
- `postgres` preset を新設（parent: base、テスト用に最小構成）
- preset ディレクトリはフラット配置を維持

### 3. lang 層解決の廃止
- `src/lib/presets.js` から `resolveLangPreset()` を削除
- `src/docs/lib/resolver-factory.js`: lang 層 DataSource ロードを削除、parent チェーンのみで解決
- `src/docs/lib/template-merger.js`: lang 層テンプレート・章ハンドリングを削除、parent チェーンのみで解決
- `src/docs/commands/scan.js`: lang 層 DataSource ロードを削除

### 4. 複数チェーンの解決
- type 配列の各要素を `resolveChain()` で独立に parent チェーン解決
- 親子重複除去: type 配列に親と子が両方ある場合、子が優先
- チェーン内: 既存のボトムアップテンプレートマージ
- チェーン間の同名章: 段落（## 見出し）単位の加算マージ
  - 同名段落 → 後のチェーンの内容を追記
  - 片方のみの段落 → AI が適切な挿入位置を決定
- 合成結果を `.sdd-forge/templates/` に保存し、以降はそれを使用

### 5. ディレクティブ構文の変更
- 旧: `{{data: source.method("labels")}}`
- 新: `{{data: preset.source.method("labels")}}`
- preset 名は常に必須（省略不可）
- `src/docs/lib/directive-parser.js` のパーサーを更新
- 全既存テンプレートを新構文に書き換え
- `{{text}}` ディレクティブは変更なし（preset スコープ不要）

### 6. 章順序
- 各チェーンが独自の章順序リストを持つ
- チェーン間: type 配列の順序で優先度を決定
- 同名章は最初の出現位置に配置（重複しない）

### 7. テスト用 preset
- `src/presets/postgres/preset.json` を作成（parent: "base"）
- 最低1つの DataSource と1つのテンプレート章を提供
- `type: ["node-cli", "postgres"]` の組み合わせで E2E テスト

### 8. テンプレート合成のタイミング
- `init` コマンド実行時にテンプレート合成を実行
- `.sdd-forge/templates/` が存在する場合はそれを使用（再合成しない）
- 再合成は `init --force` で明示的に実行
- 単一 type の場合もテンプレートを `.sdd-forge/templates/` に出力（一貫性）

## Out of Scope
- 実用 preset の充実（vercel, redis, supabase 等）
- `config.lang` フィールドのリネーム
- モノレポの scan パス分離・ディレクティブスコーピング（別 spec、ただしこの基盤で対応可能）
- `php` / `node` 中間層の挿入（将来、php-cli / node-webapp が必要になったとき）

## Clarifications (Q&A)

- Q: `axis` フィールドをロード順の決定に使うべきか？
  - A: いいえ。`axis` は廃止。ロード順は type 配列の順序、チェーン内は parent チェーン順。

- Q: `requires` フィールドで依存を自動解決すべきか？
  - A: いいえ。依存は parent チェーンで表現する。ユーザーは使う技術を指定し、システムがチェーンを解決する。

- Q: 組み合わせ preset 間のコード重複（例: php-webapp と将来の php-cli で PHP ロジック重複）はどうするか？
  - A: 必要になったら層を追加する（`base → php → php-webapp → symfony`）。今は `php-webapp` で十分。

- Q: モノレポはどう対応するか？
  - A: type 配列のエントリが増えるだけ。解決の仕組みは同一。

- Q: 複数チェーンで同名段落がある場合は？
  - A: 後のチェーンの内容を同じ段落に追記する。

- Q: 片方のチェーンにしかない段落は？
  - A: AI が適切な挿入位置を決定する。

- Q: `{{text}}` ディレクティブも構文変更するか？
  - A: しない。`{{text}}` は AI へのプロンプト指示であり、特定 preset にスコープする必要がない。

- Q: 既存プロジェクトの移行は？
  - A: alpha 版ポリシーにより後方互換不要。`type: "webapp/cakephp2"` → `type: "cakephp2"` に書き換え。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-18
- Notes: ドラフトで全質問を解決済み。実装に進む。

## Requirements

1. config.json の `type` フィールドが `string | string[]` を受け付ける
2. type 配列の各要素が独立した parent チェーンとして解決される
3. `php` preset が `php-webapp`（parent: webapp）にリネームされる
4. `node` preset が廃止される（node-cli はそのまま）
5. 全 preset.json から `lang`, `axis` フィールドが削除される
6. `resolveLangPreset()`, `resolveType()`, `TYPE_ALIASES` が廃止される
7. resolver-factory, template-merger, scan が parent チェーンのみで動作する
8. チェーン間の同名章が段落単位で加算マージされる
9. 合成テンプレートが `.sdd-forge/templates/` に保存される
10. ディレクティブ構文が `preset.source.method` に変更される
11. `{{text}}` ディレクティブは変更なし
12. 全既存テンプレートが新ディレクティブ構文に書き換えられる
13. `postgres` preset がテスト用に作成される
14. `type: ["node-cli", "postgres"]` で E2E テストが実行できる

## Acceptance Criteria

- [ ] `type: "symfony"` が従来通り動作する（単一文字列の後方互換）
- [ ] `type: ["node-cli", "postgres"]` が両チェーンを解決しマージされた docs を生成する
- [ ] 親子重複除去が動作する: `type: ["webapp", "symfony"]` が `type: "symfony"` と同じ結果になる
- [ ] 全 preset.json に `lang`, `axis` フィールドが存在しない
- [ ] `resolveLangPreset()`, `resolveType()` がコードベースに存在しない
- [ ] ディレクティブパーサーが `preset.source.method` 3部構成を処理できる
- [ ] 全 preset テンプレートが新ディレクティブ構文を使用している
- [ ] 合成テンプレートが `.sdd-forge/templates/` に書き込まれる
- [ ] 既存テストが通る（リネームされた preset に合わせて更新）
- [ ] 複数 preset 組み合わせの E2E テストが通る

## Open Questions
- （なし — ドラフトフェーズで全て解決済み）
