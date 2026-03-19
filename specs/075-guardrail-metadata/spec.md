# Feature Specification: 075-guardrail-metadata

**Feature Branch**: `feature/075-guardrail-metadata`
**Created**: 2026-03-19
**Status**: Draft
**Input**: guardrail-expansion.md の I3: guardrail 記事にメタデータ（phase, scope, lint）を追加し、フェーズ別フィルタリング・scope 選別・機械的 lint チェックを実装する

## Goal

guardrail 記事に構造化メタデータを導入し、適用フェーズの制御（spec / impl / lint）、対象ファイルの scope フィルタリング、正規表現による機械的 lint チェックを実現する。

## Scope

1. **メタデータ構文の定義と parser 実装**
   - `<!-- {%meta: {phase: [...], scope: [...], lint: /pattern/flags}%} -->` 構文
   - `parseGuardrailArticles()` の拡張

2. **phase フィルタリング**
   - `checkGuardrail()` で `phase: [spec]` の記事のみ AI に渡す
   - impl 用記事の抽出関数（消費は I1 scope）

3. **scope フィルタリング**
   - glob パターンで対象ファイルを絞る
   - 既存の glob 実装を流用

4. **lint コマンド新設**
   - `sdd-forge spec lint --base <branch>` コマンド
   - git diff でベースブランチとの変更ファイル一覧を取得
   - 変更ファイルの全内容に `lint` パターンを適用
   - scope による対象ファイルのフィルタリング

5. **プリセットテンプレート更新**
   - 既存 guardrail テンプレートの記事にメタデータを付与

6. **テスト**

## Out of Scope

- impl フェーズの消費先実装（AI system prompt への注入は I1）
- severity 分類（不要と判断。PASS/FAIL の2値のみ）
- バッチ分割（I4）
- デザイン系 guardrail 記事の追加（別 spec）

## Requirements

### R1: メタデータ構文

guardrail 記事の `###` 見出し直後に `<!-- {%meta: {key: value, ...}%} -->` 形式でメタデータを記述できる。

```markdown
### No Inline Styles
<!-- {%meta: {phase: [impl, lint], scope: [*.css, *.tsx], lint: /style\s*=/}%} -->
Do not use inline style attributes.
```

フィールド定義:
- `phase`: 配列。値は `spec`, `impl`, `lint`。デフォルト: `[spec]`
- `scope`: 配列。glob パターン。デフォルト: なし（全対象）
- `lint`: JS 正規表現（`/pattern/flags` 構文）。デフォルト: なし

メタデータ行がない記事はデフォルト値（`phase: [spec]`, scope なし, lint なし）を適用する。

### R2: parseGuardrailArticles 拡張

`parseGuardrailArticles()` の返却値に `meta` フィールドを追加する。

```js
{
  title: "No Inline Styles",
  body: "Do not use inline style attributes.",
  meta: {
    phase: ["impl", "lint"],
    scope: ["*.css", "*.tsx"],
    lint: /style\s*=/
  }
}
```

メタデータ行は body から除外する。

### R3: phase フィルタリング（spec gate）

`checkGuardrail()` を変更し、`phase` に `spec` を含む記事のみ AI チェックに渡す。メタデータなしの既存記事はデフォルト `phase: [spec]` によりこれまで通りチェックされる。

### R4: impl 記事抽出

`phase: [impl]` の記事を抽出する関数 `filterByPhase(articles, phase)` をエクスポートする。消費先（system prompt 注入）は I1 で実装する。

### R5: scope フィルタリング

ファイルパスのリストと記事の `scope` glob パターンをマッチングする関数を実装する。scope が未指定の記事は全ファイルに適用される。glob マッチングは既存コードベースの実装を流用する。

### R6: sdd-forge spec lint コマンド

新コマンド `sdd-forge spec lint` を実装する。

```
sdd-forge spec lint --base <branch>
```

動作:
1. `.sdd-forge/guardrail.md` をロードし記事をパース
2. `phase: [lint]` かつ `lint` パターンがある記事を抽出
3. `git diff --name-only <base>...HEAD` で変更ファイル一覧を取得
4. 各記事の `scope` で対象ファイルをフィルタ（scope なしなら全ファイル）
5. 対象ファイルの全内容に `lint` パターンを適用
6. マッチした場合 FAIL を報告（記事タイトル、ファイル名、マッチ行）
7. 全 FAIL がなければ PASS

`lint` パターンがあるのに `phase` に `lint` が含まれない記事がある場合、警告を出力する。

exit code: FAIL があれば非ゼロ。

### R7: spec.js ルーティング追加

`sdd-forge spec lint` → `src/spec/commands/lint.js` へのルーティングを `spec.js` に追加する。

### R8: プリセットテンプレート更新

既存の guardrail テンプレート（base, webapp, cli, library, cakephp2, laravel, symfony, node-cli の en/ja）の記事にメタデータを付与する。現在の全記事は spec フェーズ用のためメタデータ行なし（デフォルト動作）とする。

## Clarifications (Q&A)

- Q: severity は必要か？
  - A: 不要。チェックは PASS/FAIL の2値。WARN のみの動作はフロー中に対処する導線がない。対象外にしたければ phase から外すか Exemption を使う。

- Q: lint は差分行だけか、ファイル全体か？
  - A: 変更ファイルの全内容。差分行だけだと既存コードの違反を見逃す。

- Q: lint パターンがあるが phase に lint がない場合？
  - A: lint コマンドではスキップするが、警告を出す。

- Q: scope は spec フェーズで意味があるか？
  - A: spec フェーズでは scope は無視される（spec テキストにはファイルパスがない）。impl/lint でのみ有効。

- Q: ディレクティブ構文をなぜ `{%...%}` にしたか？
  - A: Twig/Jinja2 の慣例に倣い、`{{ }}` = 処理・出力、`{% %}` = 宣言・設定という区分を導入。

- Q: impl の消費先は？
  - A: guardrail の impl 記事を抽出して AI の system prompt に渡す。実装は I1 scope。今回はパース + 抽出関数のみ。

## Open Questions

なし

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-19
- Notes: severity 削除、phase+scope+lint の3フィールド、{%meta%} 構文

## Acceptance Criteria

- [ ] `parseGuardrailArticles()` がメタデータ行をパースし `meta` フィールドを返す
- [ ] メタデータなしの記事にデフォルト値 `{phase: ["spec"]}` が設定される
- [ ] `checkGuardrail()` が `phase: [spec]` の記事のみ AI に渡す
- [ ] `filterByPhase(articles, "impl")` が impl 記事を抽出する
- [ ] scope glob マッチングが正しくファイルを絞り込む
- [ ] `sdd-forge spec lint --base <branch>` が動作する
- [ ] lint パターンにマッチするファイルがあれば FAIL を報告する
- [ ] scope フィルタが lint 対象ファイルを正しく絞る
- [ ] lint パターンあり + phase に lint なしの記事で警告が出る
- [ ] `sdd-forge spec lint` のルーティングが動作する
- [ ] 既存テストが壊れない（メタデータなし記事のデフォルト動作）
- [ ] 新規テストがすべて pass する
