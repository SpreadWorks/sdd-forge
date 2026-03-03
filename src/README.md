# sdd-forge — Internal Architecture

## Overview

sdd-forge は Spec-Driven Development (SDD) のための CLI ツール。
対象プロジェクトのソースコードを解析し、テンプレートベースのドキュメントを自動生成する。

- **Runtime**: Node.js >= 18
- **Module system**: ES Modules (`"type": "module"`)
- **External dependencies**: なし（Node.js 組み込み API のみ）

## Directory Structure

```text
src/
├── sdd-forge.js              # CLI エントリポイント（トップレベルディスパッチャ）
├── docs.js                   # docs ディスパッチャ
├── spec.js                   # spec ディスパッチャ
├── flow.js                   # SDD フロー自動実行（直接実行コマンド）
├── help.js                   # コマンド一覧表示
│
├── docs/                     # ドキュメント生成ドメイン
│   ├── commands/             #   CLI コマンド（各サブコマンドの実装）
│   ├── lib/                  #   共通ロジック（パーサー、レンダラー、リゾルバー等）
│   └── presets/              #   フレームワーク固有の解析・テンプレート拡張
│       └── webapp/cakephp2/  #     CakePHP 2.x 用プリセット
│
├── specs/                    # 仕様管理ドメイン
│   └── commands/             #   CLI コマンド（spec 初期化、gate チェック）
│
├── lib/                      # パッケージ全体の共通ユーティリティ
│   ├── cli.js                #   repoRoot(), sourceRoot(), parseArgs()
│   ├── config.js             #   loadJsonFile(), 設定読み込み
│   ├── agent.js              #   AI エージェント抽象化
│   ├── process.js            #   プロセス実行ヘルパー
│   ├── projects.js           #   プロジェクト管理（登録、解決、デフォルト）
│   ├── i18n.js               #   国際化（メッセージ・UI テキスト）
│   └── types.js              #   型定義・定数
│
└── templates/                # 静的データ（npm publish に含まれる）
    ├── config.example.json   #   .sdd-forge/config.json のサンプル
    ├── review-checklist.md   #   レビュー観点チェックリスト
    └── locale/               #   言語別テンプレート・メッセージ
        ├── en/               #     English
        └── ja/               #     日本語
            ├── base/         #       共通章テンプレート（全プロジェクトタイプ共通）
            ├── webapp/       #       Web アプリ用章テンプレート
            │   └── cakephp2/ #         CakePHP 2.x オーバーライド
            ├── cli/          #       CLI ツール用章テンプレート
            │   └── node-cli/ #         Node.js CLI オーバーライド
            ├── library/      #       ライブラリ用章テンプレート
            ├── messages.json #       CLI メッセージ
            ├── prompts.json  #       AI プロンプトテンプレート
            ├── sections.json #       セクション定義
            └── ui.json       #       UI テキスト
```

## Command Routing

3 段階のディスパッチで CLI コマンドをルーティングする。

```
sdd-forge <cmd> [args]
    │
    ├─ sdd-forge.js          # 1. プロジェクトコンテキスト解決 + ディスパッチ
    │   ├─ docs.js           # 2. docs サブコマンドのルーティング
    │   │   └─ docs/commands/*.js   # 3. 実際のコマンド実装
    │   ├─ spec.js           # 2. spec サブコマンドのルーティング
    │   │   └─ specs/commands/*.js  # 3. 実際のコマンド実装
    │   ├─ flow.js           # 2+3. 直接実行（ディスパッチャなし）
    │   └─ help.js           # 2+3. 直接実行
```

- **ディスパッチャ** (`docs.js`, `spec.js`): サブコマンド名を受け取り、`commands/` 配下のスクリプトに `import()` で委譲する
- **直接実行コマンド** (`flow.js`, `help.js`): サブコマンドを持たず、引数をそのまま処理する

### プロジェクトコンテキスト

`sdd-forge.js` は実行時に以下の環境変数を設定する:

| 環境変数 | 意味 | 設定元 |
|---|---|---|
| `SDD_SOURCE_ROOT` | 対象プロジェクトのソースコードルート | `projects.js` で解決 |
| `SDD_WORK_ROOT` | 作業ディレクトリ（`.sdd-forge/`, `docs/` の親） | `projects.js` で解決 |

各コマンドは `lib/cli.js` の `sourceRoot()` / `repoRoot()` 経由でこれらを参照する。

## Coding Rules

### プロジェクト固有情報の埋め込み禁止

`src/` 配下のコードおよび `src/templates/` 配下のテンプレートに、特定プロジェクトの情報を直接書いてはならない。

- **禁止**: プロジェクト名、ホスト名、ポート番号、コンテナ名、固有 DB 名
- **許可**: `presets/` 配下のフレームワーク固有ロジック（汎用的な解析パターン）
- **設定**: プロジェクト固有の値は `.sdd-forge/config.json` で外部化する

### 外部依存の禁止

Node.js 組み込み API (`fs`, `path`, `child_process`, `url` 等) のみを使用する。
npm パッケージへの依存を追加しないこと。

### フォールバック値の抑制

必須の設定値・環境変数が不足している場合は、黙ってデフォルト値で動作させず、エラーメッセージを出力して停止すること。

```js
// NG
const agent = config.agent ?? "claude";

// OK
if (!config.agent) {
  console.error("Error: 'agent' is not configured in config.json");
  process.exit(1);
}
```

### コマンドファイルの構造

`commands/` 配下のファイルは以下のパターンに従う:

```js
import { repoRoot, parseArgs } from "../../lib/cli.js";

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args, { flags: [...], options: [...] });

  if (opts.help) {
    console.log("Usage: ...");
    process.exit(0);
  }

  // 実装
}

main();
```

- `parseArgs()` で `--help` を処理する
- 直接実行ガード (`isDirectRun`) が必要なスクリプトは、`docs.js` の `build` パイプラインで `import()` される場合のみ

### presets の追加

新しいフレームワークプリセットを追加する場合:

1. `docs/presets/<type>/<framework>/` ディレクトリを作成
2. `scanner.js` — フレームワーク固有のスキャン拡張
3. `resolver.js` — `@data` ディレクティブのデータ解決ロジック
4. `analyze-*.js` — 個別カテゴリの解析スクリプト（必要に応じて）
5. `templates/locale/<lang>/<type>/<framework>/` に章テンプレートのオーバーライドを配置

### テンプレート継承

テンプレートは `base → type → framework` の順で継承される。

```
locale/ja/base/01_overview.md          ← 全タイプ共通
locale/ja/webapp/05_auth_and_session.md  ← webapp タイプ共通
locale/ja/webapp/cakephp2/05_auth_and_session.md  ← CakePHP 2.x 固有オーバーライド
```

より具体的なパスにファイルが存在すれば、そちらが優先される。

## Agent Invocation (`lib/agent.js`)

### 非同期呼び出しで `execFile` を使ってはならない

`callAgentAsync()` は CLI エージェント（`claude`, `codex` 等）を子プロセスとして起動する。
Node.js の `execFile`（非同期版）はデフォルトで stdin を `pipe` モードで開くが、
Claude CLI は stdin が pipe だと EOF を待ち続けてハングする。
`execFileSync`（同期版）は内部で stdin を即座に閉じるため問題が起きないが、
非同期版では閉じられない。

**これは Node.js の既知の制限であり、`execFile` では stdin を `ignore` に設定できない。**

- [nodejs/node#60077](https://github.com/nodejs/node/issues/60077) — `execFile` で stdin を ignore に設定できない
- [anthropics/claude-code#771](https://github.com/anthropics/claude-code/issues/771) — Claude CLI が Node.js の `execFile` でハングする

**対策**: `child_process.spawn` を使い、`stdio: ["ignore", "pipe", "pipe"]` を明示する。

```js
// NG: execFile — stdin が pipe のままでハングする
execFile("claude", args, opts, callback);

// OK: spawn — stdin を ignore で閉じる
const child = spawn("claude", args, {
  stdio: ["ignore", "pipe", "pipe"],
  ...opts,
});
```

`forge.js` の `streamOutput` パスは既にこのパターンを使用している。

## File Operations

- ファイルの削除・リネーム・移動は `git mv` / `git rm` を使用し、履歴を保持する
- コミットメッセージは英語。形式: `<type>: <subject>`
  - type: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`
