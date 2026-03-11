# Feature Specification: 039-locale-override

**Feature Branch**: `feature/039-locale-override`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User request

## Goal
- locale ファイル（messages.json, prompts.json, ui.json）を 3 層でオーバーライドできるようにする
- 呼び出し側 API を `translate()` に統一し、namespace 付きキーで domain を明示する

## Scope
- `translate()` 関数を新設し、プロジェクトコンテキストの解決と多層マージを一手に引き受ける
- `createI18n()` を低レベルプリミティブとしてリファクタ（`localeDirs` 配列対応、deep merge）
- 全呼び出し元を `translate()` に移行
- プリセットに `locale/` ディレクトリを配置可能にする

## Out of Scope
- 新しい locale ファイルの中身（messages/prompts/ui の具体的なキー追加）
- locale ファイルの自動生成やバリデーション CLI
- `output.languages` / `output.default` の変更

## Design

### API

```js
const t = translate();

t("ui:help.title")             // src/locale/{lang}/ui.json → help.title
t("messages:gate.pass")        // src/locale/{lang}/messages.json → gate.pass
t("prompts:text.role")         // src/locale/{lang}/prompts.json → text.role
```

- `translate()` は引数なし。内部で `repoRoot()` → `loadConfig()` を呼び、lang・presetKey・workRoot を自動解決する
- キーは `"{domain}:{key}"` 形式を必須とする。コロンがなければエラー
- 戻り値は `t(key, params?)` 関数（現在の `createI18n` と同じインターフェース）
- `t.raw(key)` も同様にサポート
- `t.lang` で現在の言語コードを取得可能

### config が存在しないコンテキスト

`setup` コマンドの初期段階など、config.json がまだ存在しない場合は `createI18n()` を直接使う（従来通り）。これは少数の例外的なケースに限定される。

### locale ファイルのマージ優先順位

後が優先（deep merge）：

1. `src/locale/{lang}/{domain}.json` — ベース（sdd-forge パッケージ同梱）
2. `src/presets/{presetKey}/locale/{lang}/{domain}.json` — プリセット層
3. `{workRoot}/.sdd-forge/locale/{lang}/{domain}.json` — プロジェクト層

各層のファイルが存在しない場合はスキップ。

### fallback 言語

現在と同様、指定 lang で見つからないキーは `"en"` にフォールバック。fallback 言語のメッセージも同じ 3 層マージを適用。

### deep merge ルール

- オブジェクトは再帰的にマージ
- 配列・プリミティブ値はオーバーライド側で置き換え

### `createI18n` の変更

- `localeDir`（単一）を `localeDirs`（配列）に変更
- 配列の順序で deep merge を適用
- `translate()` 以外から直接呼ぶケース（setup 等）のために残す

### presetKey の解決

config.json の `type` フィールドからプリセットキーを取得：
- `"cli/node-cli"` → `"node-cli"`（`/` 以降を使用）
- `"webapp/cakephp2"` → `"cakephp2"`
- `"base"` → `"base"`（`/` がなければそのまま）

## Clarifications (Q&A)
- Q: マージはキー単位の shallow merge か deep merge か？
  - A: ネストされたキー構造のため deep merge
- Q: domain のデフォルトは？
  - A: デフォルトなし。`"{domain}:{key}"` 形式を必須とし、コロンがなければエラー
- Q: root はどう取得するか？
  - A: `translate()` 内部で `repoRoot()` を呼ぶ。呼び出し側は意識しない
- Q: presetKey はどう解決するか？
  - A: config.json の `type` フィールドから取得（`"cli/node-cli"` → `"node-cli"`）

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-11
- Notes: API design discussed and agreed upon

## Requirements

### R1: deep merge ユーティリティ
- `deepMerge(base, override)` を実装
- 配列はオーバーライド側で置き換え（マージしない）
- プリミティブ値はオーバーライド側が優先

### R2: `createI18n` リファクタ
- `localeDir`（単一）を `localeDirs`（配列）に変更
- 配列の順序で deep merge を適用
- fallback 言語も同じ multi-dir マージを適用

### R3: `translate()` 関数の新設
- 引数なし
- 内部で `repoRoot()` → `loadConfig()` → presetKey 解決 → localeDirs 構築 → `createI18n()` 呼び出し
- 全 domain（ui, messages, prompts）を一括ロード
- `"{domain}:{key}"` 形式のキーをパースし、対応する domain のメッセージを返す
- コロンなしのキーはエラー
- `t.raw(key)` サポート
- `t.lang` サポート

### R4: 全呼び出し元の移行
- `createI18n()` を直接呼んでいる約 40 箇所を `translate()` に移行
- キーを `"{domain}:{key}"` 形式に変更
- config が存在しないコンテキスト（setup 初期段階等）は `createI18n()` 直接呼び出しを維持

### R5: プリセット locale ディレクトリ対応
- `src/presets/{key}/locale/{lang}/` にファイルを配置可能にする
- 現時点ではファイルの配置は不要（機構のみ）

## Acceptance Criteria
- [ ] `t("ui:help.title")` でベースの ui.json からキーを取得できる
- [ ] `.sdd-forge/locale/ja/ui.json` に `{ "test": { "key": "override" } }` を置いた場合、`t("ui:test.key")` が `"override"` を返す
- [ ] プリセットの locale がベースを部分的に上書きできる
- [ ] `.sdd-forge/locale/` がプリセット locale よりも優先される
- [ ] オーバーライドファイルが存在しない場合、ベースのみで動作する
- [ ] コロンなしのキー `t("help.title")` がエラーになる
- [ ] config が存在しないコンテキストで `createI18n()` 直接呼び出しが従来通り動作する
- [ ] 既存テスト（修正後）が通る
- [ ] i18n.test.js に translate() と多層マージのテストを追加

## Open Questions
- (none)
