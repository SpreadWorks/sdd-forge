# sdd-forge

ソースコード解析に基づくドキュメント自動生成と、Spec-Driven Development ワークフローを提供する CLI ツール。

<!-- {{data: agents.sdd("")}} -->
## SDD (Spec-Driven Development)

本プロジェクトは sdd-forge による Spec-Driven Development を採用している。

- **MUST: ユーザーから機能追加・修正のリクエストを受けた場合、SDD フロー (`/sdd-flow-start`) を使用するかユーザーに確認すること。確認なしにコードを変更してはならない。**
- **MUST: 実装完了後は `/sdd-flow-close` を実行すること。**
- スキルが利用できない環境では `sdd-forge flow --request "<要望>"` を使用すること

### docs/ について

`docs/` はプロジェクトの設計・構造・ビジネスロジックを体系的にまとめた知識ベースである。
実装・修正時は docs を読んでプロジェクトの全体像を理解した上で作業すること。

**docs とソースコードに矛盾がある場合はソースコードを正とする。**

作業開始前に docs/ とソースコードの更新日時を比較すること。
ソースが新しい場合は `sdd-forge build` の実行をユーザーに提案すること。

### docs/ 編集ルール

- docs/ は原則としてソースコード解析から自動生成される
- `{{data}}` / `{{text}}` ディレクティブの内部は自動生成で上書きされる
- ディレクティブの外に記述した内容は上書きされない
- 章の並び順は `preset.json` の `chapters` 配列で定義される

<!-- {{/data}} -->

## 設計思想

- **構成の安定性** — `{{text}}` ディレクティブが「どこに何を書くか」を定義する。AI は枠内で書き、段落構成を変えない。
- **docs は AI の行動制約** — docs/ を読んでプロジェクトの全体像を理解した上で作業すること。既存設計から逸脱しない。

## プロジェクトルール

### コーディング

- **外部依存なし**: Node.js 組み込みモジュールのみ使用。依存追加は禁止。
- **alpha 版ポリシー**: 後方互換コードは書かない。旧フォーマット・非推奨パスは保持せず削除する。
- 過剰な防御コードを書かない。内部インターフェースは信頼し、バリデーションはシステム境界でのみ行う。

### `src/` の禁止事項

- **MUST: `src/` 以下のファイルには、特定のプロジェクトや環境に固有の情報を含めてはならない。** `src/` は npm パッケージとして全ユーザーに配布されるコードである。
- `{{text}}` プロンプト: 汎用的な指示にすること。具体的なフィールド名を列挙しない。
- 固定テキスト: プロジェクト固有の値を直接書かない。`{{data}}` または `{{text}}` で動的に取得する。
- DataSource / ライブラリ: 特定プロジェクトの構造を前提としたロジックを書かない。

### テスト

- **MUST: テストを通すためにテストコードを修正してはならない。** テスト失敗時はまずシナリオの妥当性を確認し、妥当であればプロダクトコードを修正する。

### コミット

- **MUST: コミットメッセージは英語で書くこと。**
- sign-off 行や co-authored-by トレーラーを付けないこと。

### npm 公開
- **MUST: `npm publish` / `npm dist-tag` はユーザーがリリースの意図を明示した場合のみ実行する。** バージョン上げ・コミット・push の指示はリリース指示ではない。
- pre-release は `npm publish --tag alpha` → `npm dist-tag add sdd-forge@<version> latest` の 2 ステップ。
- 公開前に `npm pack --dry-run` で機密情報がないことを確認する。

<!-- {{data: agents.project("")}} -->
## Project Context

- **パッケージ:** `sdd-forge` v0.1.0-alpha.30
- **説明:** Spec-Driven Development tooling for automated documentation generation
- **モジュール形式:** ES Modules (`"type": "module"`)
- **ランタイム:** Node.js >=18.0.0
- **外部依存:** なし（Node.js 組み込みモジュールのみ）
- **エントリポイント (bin):** `./src/sdd-forge.js`

### ディレクトリ構造

```
sdd-forge/
├── package.json
└── src/
    ├── sdd-forge.js          ← CLI エントリポイント・トップレベルルーター
    ├── docs.js               ← docs ディスパッチャー
    ├── spec.js               ← spec ディスパッチャー
    ├── flow.js               ← flow ディスパッチャー
    ├── setup.js              ← setup（独立コマンド）
    ├── upgrade.js            ← upgrade（独立コマンド）
    ├── presets-cmd.js        ← presets（独立コマンド）
    ├── help.js               ← ヘルプ表示
    ├── docs/
    │   ├── commands/         ← docs サブコマンド実装
    │   │   └── scan, enrich, init, data, text, readme, forge,
    │   │       review, changelog, agents, translate, snapshot
    │   ├── data/             ← DataSource（agents.js, docs.js, lang.js, project.js）
    │   └── lib/              ← ドキュメント生成ライブラリ
    │       ├── scanner.js, directive-parser.js, template-merger.js
    │       ├── data-source.js, data-source-loader.js, resolver-factory.js
    │       ├── forge-prompts.js, text-prompts.js, review-parser.js
    │       ├── command-context.js, concurrency.js
    │       └── scan-source.js, php-array-parser.js, test-env-detection.js
    ├── flow/
    │   └── commands/         ← start.js, status.js, review.js
    ├── spec/
    │   └── commands/         ← init.js, gate.js, guardrail.js
    ├── lib/                  ← 全レイヤー共有ユーティリティ
    │   ├── agent.js          ← AI エージェント呼び出し
    │   ├── cli.js            ← repoRoot, sourceRoot, parseArgs, PKG_DIR
    │   ├── config.js         ← .sdd-forge/config.json ローダー
    │   ├── presets.js        ← preset.json 自動探索
    │   ├── flow-state.js     ← SDD フロー状態永続化
    │   ├── i18n.js           ← 3層 i18n（ドメイン名前空間付き）
    │   ├── types.js          ← 型エイリアス解決・バリデーション
    │   └── agents-md.js, entrypoint.js, process.js, progress.js
    ├── presets/              ← base/, cli/, node-cli/, cakephp2/, laravel/, symfony/, webapp/, library/
    ├── locale/               ← en/, ja/
    └── templates/            ← config.example.json, review-checklist.md, skills/
```

### コマンドルーティング

3層ディスパッチ: `sdd-forge.js` → `docs.js` / `spec.js` / `flow.js` → `commands/*.js`

| 呼び出し形式 | ルーター | 実装ファイル |
|---|---|---|
| `sdd-forge docs build` | `docs.js` | パイプライン: `scan→enrich→init→data→text→readme→agents→[translate]` |
| `sdd-forge docs <cmd>` | `docs.js` | `src/docs/commands/<cmd>.js` |
| `sdd-forge spec init` | `spec.js` | `src/spec/commands/init.js` |
| `sdd-forge spec gate` | `spec.js` | `src/spec/commands/gate.js` |
| `sdd-forge spec guardrail` | `spec.js` | `src/spec/commands/guardrail.js` |
| `sdd-forge flow start` | `flow.js` | `src/flow/commands/start.js` |
| `sdd-forge flow status` | `flow.js` | `src/flow/commands/status.js` |
| `sdd-forge flow review` | `flow.js` | `src/flow/commands/review.js` |
| `sdd-forge setup` | 独立 | `src/setup.js` |
| `sdd-forge upgrade` | 独立 | `src/upgrade.js` |
| `sdd-forge presets` | 独立 | `src/presets-cmd.js` |

### npm scripts

| コマンド | スクリプト |
|---|---|
| `npm test` | `find tests -name '*.test.js' \| xargs node --test` |

### 主要ファイルパス（コード探索の起点）

| 目的 | パス |
|---|---|
| CLI エントリ | `src/sdd-forge.js` |
| docs ディスパッチャー | `src/docs.js` |
| AI エージェント呼び出し | `src/lib/agent.js` |
| 設定ローダー | `src/lib/config.js` |
| コマンドコンテキスト | `src/docs/lib/command-context.js` |
| ディレクティブパーサー | `src/docs/lib/directive-parser.js` |
| テンプレート継承 | `src/docs/lib/template-merger.js` |
| DataSource ファクトリー | `src/docs/lib/resolver-factory.js` |
| プリセット探索 | `src/lib/presets.js` |
| i18n | `src/lib/i18n.js` |
| 型バリデーション | `src/lib/types.js` |
| フロー状態永続化 | `src/lib/flow-state.js` |
| テストスイート | `tests/` |
| analysis.json（解析出力） | `.sdd-forge/output/analysis.json` |
<!-- {{/data}} -->

