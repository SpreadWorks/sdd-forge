# sdd-forge — 内部アーキテクチャとルール

このドキュメントは `src/` 配下のコード（npm パッケージとして配布される）の開発ルールを定義する。

## プロジェクト概要

- **パッケージ:** `sdd-forge`
- **説明:** ソースコード解析に基づくドキュメント自動生成と SDD ワークフローを提供する CLI ツール
- **モジュール形式:** ES Modules (`"type": "module"`)
- **ランタイム:** Node.js >= 18.0.0
- **外部依存:** なし（Node.js 組み込みモジュールのみ）
- **エントリポイント:** `./src/sdd-forge.js`

## ディレクトリ構造

```
src/
├── sdd-forge.js              CLI エントリポイント（トップレベルディスパッチャ）
├── docs.js                   docs ディスパッチャ
├── spec.js                   spec ディスパッチャ
├── flow.js                   flow ディスパッチャ
├── setup.js / upgrade.js / presets-cmd.js / help.js  独立コマンド
├── lib/                      全レイヤー共有ユーティリティ
│   ├── cli.js                repoRoot, sourceRoot, parseArgs, PKG_DIR
│   ├── config.js             .sdd-forge/config.json ローダー
│   ├── agent.js              AI エージェント呼び出し
│   ├── presets.js            プリセット自動探索・親チェーン解決
│   ├── flow-state.js         SDD フロー状態永続化
│   ├── flow-envelope.js      flow get/set/run の JSON envelope
│   ├── git-state.js          git/gh 状態取得ヘルパー
│   ├── include.js            include ディレクティブ展開
│   ├── i18n.js               3層 i18n（ドメイン名前空間付き）
│   └── types.js              型エイリアス解決・バリデーション
├── docs/
│   ├── commands/             scan, enrich, init, data, text, readme,
│   │                         forge, review, changelog, agents, translate
│   ├── data/                 共通 DataSource（project, docs, lang, agents）
│   └── lib/                  ドキュメント生成エンジン
├── flow/
│   ├── flow.js              flow ディスパッチャ（get/set/run）
│   ├── registry.js          コマンドメタデータの単一ソース
│   ├── get.js               get サブディスパッチャ
│   ├── set.js               set サブディスパッチャ
│   ├── run.js               run サブディスパッチャ
│   ├── get/                 status, resolve-context, check, prompt, qa-count, guardrail, issue
│   ├── set/                 step, request, issue, note, summary, req, metric, redo
│   ├── run/                 prepare-spec, gate, review, impl-confirm, finalize, sync
│   └── commands/            内部ヘルパー（merge, cleanup, review の実体）
├── spec/commands/            init, gate, guardrail
├── presets/                  プリセット群（後述）
├── locale/                   en/, ja/
└── templates/
    ├── skills/              skill テンプレート（SKILL.md）
    └── partials/            共有パーツ（include 用）
```

## コマンドルーティング

ディスパッチ: `sdd-forge.js` → `docs.js`/`spec.js`/`flow.js` → 各ハンドラ

```
sdd-forge <cmd> [args]
    │
    ├─ sdd-forge.js          # 1. プロジェクトコンテキスト解決 + ディスパッチ
    │   ├─ docs.js           # 2. docs サブコマンドのルーティング
    │   │   └─ docs/commands/*.js   # 3. 実際のコマンド実装
    │   ├─ spec.js           # 2. spec サブコマンドのルーティング
    │   │   └─ spec/commands/*.js
    │   ├─ flow.js           # 2. flow サブディスパッチャ（registry.js 参照）
    │   │   ├─ flow/get.js → flow/get/*.js
    │   │   ├─ flow/set.js → flow/set/*.js
    │   │   └─ flow/run.js → flow/run/*.js
    │   └─ help.js           # 直接実行
```

### プロジェクトコンテキスト

`sdd-forge.js` は実行時に以下の環境変数を設定する:

| 環境変数 | 意味 | 設定元 |
|---|---|---|
| `SDD_SOURCE_ROOT` | 対象プロジェクトのソースコードルート | `cli.js` で解決 |
| `SDD_WORK_ROOT` | 作業ディレクトリ（`.sdd-forge/`, `docs/` の親） | `cli.js` で解決 |

### ドキュメント生成パイプライン

`sdd-forge docs build` は以下のパイプラインを順に実行する:

```
scan → enrich → init → data → text → readme → agents → [translate]
```

| ステップ | 役割 |
|---|---|
| **scan** | ソースコードをスキャンし analysis.json を生成 |
| **enrich** | AI で analysis エントリーに summary/chapter/role を付与 |
| **init** | テンプレートを継承チェーンでマージし docs/ に出力 |
| **data** | `{{data}}` ディレクティブを analysis データで置換 |
| **text** | `{{text}}` ディレクティブを AI 生成テキストで埋める |
| **readme** | README.md を生成 |
| **agents** | AGENTS.md を生成 |

---

## プリセットシステム

### 概要

プリセットはフレームワーク固有のスキャン設定・DataSource・テンプレートをパッケージ化する。
`parent` フィールドによる単一継承チェーンで構成される。

```
base → webapp → js-webapp → hono
base → webapp → js-webapp → nextjs
base → webapp → php-webapp → cakephp2
base → webapp → php-webapp → laravel
base → webapp → php-webapp → symfony
base → cli → node-cli
base → library
base → database → drizzle
base → edge → workers
base → storage → r2
base → api → rest
base → api → graphql
```

### preset.json の構造

```json
{
  "parent": "webapp",
  "label": "CakePHP 2.x",
  "aliases": [],
  "chapters": ["overview.md", "stack_and_ops.md", ...],
  "scan": {
    "include": ["app/**/*.php"],
    "exclude": ["vendor/**"]
  }
}
```

| フィールド | 説明 |
|---|---|
| `parent` | 親プリセットの key（継承チェーン） |
| `label` | 表示名 |
| `chapters` | このプリセットの章順序（子は親の chapters を上書き） |
| `scan.include` | スキャン対象の glob パターン |
| `scan.exclude` | 除外パターン |

### プリセットディレクトリ構成

```
presets/<key>/
├── preset.json              プリセット定義
├── data/                    DataSource クラス群
│   ├── config.js            設定解析
│   ├── controllers.js       コントローラ解析
│   └── ...
├── scan/                    scan パーサー群
│   ├── routes.js            ルート解析
│   ├── config.js            設定解析
│   └── ...
├── tests/                   プリセット固有テスト
│   ├── unit/                ユニットテスト（scan パーサー I/O テスト等）
│   ├── e2e/                 E2E テスト（統合スキャンテスト等）
│   └── acceptance/          acceptance テスト（preset ローカル fixture + test.js）
└── templates/               章テンプレート
    ├── ja/
    │   ├── overview.md
    │   ├── stack_and_ops.md
    │   └── ...
    └── en/
        └── ...
```

---

## プリセット作成ルール

### MUST: プリセット作成手順（トップダウン設計）

プリセットの構成要素は以下の順序で作成すること:

1. **テンプレート** (`templates/`) — どんなドキュメントを出力するか定義する
2. **DataSource** (`data/`) — テンプレートが必要とするデータを定義する
3. **scan パーサー** (`scan/`) — DataSource にデータを供給するパーサーを実装する

消費者（テンプレート）→ 仲介者（DataSource）→ 生産者（scan）の順に作ることで、不要なパーサーを書かず、必要なデータの漏れがなくなる。

### MUST: プリセットテストの作成

プリセットは `tests/` ディレクトリを含むこと。

- `tests/unit/` — scan パーサーの I/O テスト。最小限のフィクスチャを `createTmpDir()` で作成し、パーサー関数の入出力を検証する
- `tests/e2e/` — preset.json の scan 設定検証、フルスキャンパイプラインテスト
- `tests/acceptance/test.js` — preset ローカル fixture を使う acceptance テスト。共有処理は `tests/acceptance/lib/` を使う
- テンプレートを作成・変更した場合は acceptance テストも実装し、実行すること
- `npm test -- --preset <name>` でプリセット毎のテストを実行できること
- `node tests/acceptance/run.js <name>` で acceptance テストを個別実行できること
- テストファイルは npm パッケージには含まれない（package.json の `files` で除外済み）

### MUST: scan DataSource と data DataSource の対応

**data DataSource が `analysis.X` を読むなら、チェーン内に `X` を書く scan DataSource が必要。**

- scan DataSource は `match(file)` + `scan(files)` メソッドを持ち、ファイルを解析して `analysis[name]` に書き込む
- data DataSource は `analysis[key]` を読んでマークダウンテーブルを生成する
- この2つは対であるべき
- scan DataSource を実装できるなら実装する（フレームワーク固有の scan は子プリセットで実装する）
- scan DataSource を実装できない場合は、data DataSource も作ってはならない。テンプレートは `{{text}}` にする
- **data DataSource だけが存在し、対応する scan DataSource がない状態はルール違反**

```
✅ 正しい例:
  scan DataSource "modules" → analysis.modules に書き込む
  data DataSource modules.list() → analysis.modules を読む

❌ 間違い:
  data DataSource schema.tables() → analysis.schemas を読む
  → analysis.schemas を書く scan DataSource がどこにもない
```

### MUST: `{{data}}` と `{{text}}` の使い分け

| 条件 | ディレクティブ |
|---|---|
| scan で構造的に収集できるデータ | `{{data("preset.source.method")}}` |
| scan で収集不可（フレームワーク固有すぎる） | `{{text({prompt: "..."})}}` |

**判断基準**: そのデータを正規表現やパーサーで機械的に抽出できるか？
- YES → `{{data}}`（テーブル形式で正確なデータを提供）
- NO → `{{text}}`（AI がソースコードと analysis コンテキストから文章を生成）

### MUST: 親テンプレートは `{{text}}`、子が `{{data}}` で override

フレームワーク固有のデータを表示する箇所は、親（webapp 等）テンプレートでは `{{text}}` + `{%block%}` で定義し、子プリセットが block override で `{{data}}` に差し替える。

```markdown
<!-- webapp/templates/ja/auth_and_session.md -->
<!-- {%block "auth_config"%} -->
<!-- {{text({prompt: "認証設定を説明してください。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
```

```markdown
<!-- cakephp2/templates/ja/auth_and_session.md -->
<!-- {%extends%} -->
<!-- {%block "auth_config"%} -->
<!-- {{data("cakephp2.config.auth", {labels: "項目|内容"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
```

これにより:
- webapp 単体: AI が文章を生成（scan データがなくても動く）
- cakephp2: scan データから正確なテーブルを出力
- 将来のプリセット: override テンプレートを追加するだけ

### MUST: enrich は静的収集データの加工に留める

enrich フェーズは scan が収集したエントリーへのメタデータ付与（summary, chapter, role）のみを行う。
新しい analysis カテゴリの生成や、scan が見つけていないデータの創出は行わない。

### DataSource の2種類

**1. Scannable DataSource（scan + data 兼用）**

```javascript
import { Scannable } from "../../../docs/lib/scan-source.js";
import { DataSource } from "../../../docs/lib/data-source.js";

export default class ModulesSource extends Scannable(DataSource) {
  match(file) { return file.ext === ".js"; }
  scan(files) { return { modules: [...], summary: { total: files.length } }; }
  list(analysis, labels) { /* analysis.modules を読んでテーブル生成 */ }
}
```

- `match(file)`: このソースが処理すべきファイルか判定
- `scan(files)`: マッチしたファイルを解析し、analysis に書き込むデータを返す
- その他メソッド: data コマンドで呼ばれ、analysis を読んでマークダウンを返す

**2. Data-only DataSource（data 専用）**

```javascript
import { DataSource } from "../../../docs/lib/data-source.js";

export default class SchemaSource extends DataSource {
  tables(analysis, labels) { /* analysis.schemas.tables を読んでテーブル生成 */ }
}
```

- `scan()` / `match()` を持たない
- analysis にデータがあれば動作する（なければ null を返す）
- **MUST**: このパターンを使う場合、読む analysis キーを書く scan DataSource がチェーン内に存在する必要がある。対応する scan がないなら data DataSource を作ってはならない

---

## テンプレート構文

### ディレクティブ

**出力ディレクティブ** (`{{ }}`):

```html
<!-- {{data("preset.source.method", {labels: "ヘッダ1|ヘッダ2"})}} -->
<!-- {{/data}} -->

<!-- {{text({prompt: "説明を書いてください。", mode: "deep"})}} -->
<!-- {{/text}} -->
```

**制御ディレクティブ** (`{% %}`):

```html
<!-- {%extends "layout"%} -->

<!-- {%block "content"%} -->
...
<!-- {%/block%} -->
```

### テンプレート継承

`{%extends%}` で親テンプレートのブロックを継承・上書きする。

```
layout.md（レイアウト）
  └─ overview.md（{%extends "layout"%} で継承）
       └─ cakephp2/overview.md（{%extends%} で override）
```

**layout.md のナビゲーション**: layout を extends するテンプレートは自動的にナビゲーション（前後章リンク）が付与される。extends しないテンプレートにはナビが付かない。

### block のネスト

block は入れ子にできる。親ブロック内にネストされたブロックは、子テンプレートで個別に override 可能。

```markdown
<!-- {%block "content"%} -->
## 見出し
<!-- {%block "section_a"%} -->
セクション A の内容
<!-- {%/block%} -->
<!-- {%block "section_b"%} -->
セクション B の内容
<!-- {%/block%} -->
<!-- {%/block%} -->
```

---

## コーディングルール

### プロジェクト固有情報の埋め込み禁止

`src/` 配下のコードおよびテンプレートに、特定プロジェクトの情報を直接書いてはならない。

- **禁止**: プロジェクト名、ホスト名、ポート番号、コンテナ名、固有 DB 名
- **許可**: `presets/` 配下のフレームワーク固有ロジック（汎用的な解析パターン）
- **設定**: プロジェクト固有の値は `.sdd-forge/config.json` で外部化する

### 外部依存の禁止

Node.js 組み込み API (`fs`, `path`, `child_process`, `url` 等) のみを使用する。
npm パッケージへの依存を追加しないこと。

### フォールバック値の抑制

必須の設定値・環境変数が不足している場合は、黙ってデフォルト値で動作させず、エラーメッセージを出力して停止すること。

### コマンドファイルの構造

`commands/` 配下のファイルは以下のパターンに従う:

```javascript
import { runIfDirect } from "../../lib/entrypoint.js";
import { parseArgs } from "../../lib/cli.js";
import { resolveCommandContext } from "../lib/command-context.js";

async function main(ctx) {
  if (!ctx) {
    const cli = parseArgs(process.argv.slice(2), { ... });
    if (cli.help) { printHelp(); return; }
    ctx = resolveCommandContext(cli);
  }
  // 実装
}

export { main };
runIfDirect(import.meta.url, main);
```

### AI エージェント呼び出し (`lib/agent.js`)

**非同期呼び出しで `execFile` を使ってはならない。**

`child_process.spawn` を使い、`stdio: ["ignore", "pipe", "pipe"]` を明示する。
`execFile` は stdin を pipe モードで開くが、Claude CLI は stdin が pipe だと EOF を待ち続けてハングする。

```javascript
// NG: execFile — stdin が pipe のままでハングする
execFile("claude", args, opts, callback);

// OK: spawn — stdin を ignore で閉じる
const child = spawn("claude", args, {
  stdio: ["ignore", "pipe", "pipe"],
  ...opts,
});
```

---

## テスト

### プリセット整合性テスト

`tests/unit/presets/preset-scan-integrity.test.js` が以下を自動検証する:

1. **scan パターンと scan DataSource の整合性** — preset.json に scan.include を定義しているプリセットは、チェーン内に scan DataSource を持つ
2. **テンプレートの data ディレクティブと DataSource メソッドの整合性** — `{{data("preset.source.method")}}` が参照するメソッドが DataSource に存在する
3. **analysis キーのカバレッジ** — data DataSource が `analysis.X` を読むなら、`X` を書く scan DataSource がプリセットエコシステム内に存在する

**新しいプリセットを追加・変更したら `npm test` を実行し、整合性テストがパスすることを確認すること。**

### プリセット固有テスト

プリセット固有テストの配置ルールとテスト内容は「プリセット作成ルール > MUST: プリセットテストの作成」を参照。

**プリセット毎のテスト実行:**

```bash
npm test -- --preset laravel    # tests/unit + tests/e2e + src/presets/laravel/tests/
npm test -- --preset symfony    # tests/unit + tests/e2e + src/presets/symfony/tests/
```

### テストルール

- テストを通すためにテストコードを修正してはならない
- テスト失敗時はまずシナリオの妥当性を確認し、妥当であればプロダクトコードを修正する
