# sdd-forge

ソースコード解析に基づくドキュメント自動生成と、Spec-Driven Development ワークフローを提供する CLI ツール。

<!-- {{data: agents.sdd("")}} -->
## SDD (Spec-Driven Development)

本プロジェクトは sdd-forge による Spec-Driven Development を採用している。

- **MUST: ユーザーから機能追加・修正のリクエストを受けた場合、SDD フロー (`/sdd-forge.flow-plan`) を使用するかユーザーに確認すること。確認なしにコードを変更してはならない。**
- **MUST: 実装完了後は `/sdd-forge.flow-merge` を実行すること。**
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
All information verified against source code. Here is the PROJECT section:

## Project Context

- **パッケージ:** `sdd-forge` v0.1.0-alpha.32
- **説明:** ソースコード解析に基づくドキュメント自動生成と SDD ワークフローを提供する CLI ツール
- **モジュール形式:** ES Modules (`"type": "module"`)
- **ランタイム:** Node.js >=18.0.0
- **外部依存:** なし（Node.js 組み込みモジュールのみ）
- **エントリポイント:** `./src/sdd-forge.js`

### ディレクトリ構造

```
sdd-forge/
├── package.json
├── tests/                        テストスイート
└── src/
    ├── sdd-forge.js              CLI エントリポイント・トップレベルルーター
    ├── docs.js                   docs ディスパッチャー
    ├── spec.js                   spec ディスパッチャー
    ├── flow.js                   flow ディスパッチャー
    ├── setup.js / upgrade.js / presets-cmd.js / help.js  独立コマンド
    ├── lib/                      全レイヤー共有ユーティリティ
    │   ├── cli.js                repoRoot, sourceRoot, parseArgs, PKG_DIR
    │   ├── config.js             .sdd-forge/config.json ローダー
    │   ├── agent.js              AI エージェント呼び出し
    │   ├── presets.js            プリセット自動探索・親チェーン解決
    │   ├── flow-state.js         SDD フロー状態永続化
    │   ├── i18n.js               3層 i18n（ドメイン名前空間付き）
    │   └── types.js              型エイリアス解決・バリデーション
    ├── docs/
    │   ├── commands/             scan, enrich, init, data, text, readme,
    │   │                         forge, review, changelog, agents, translate
    │   ├── data/                 共通 DataSource（project, docs, lang, agents）
    │   └── lib/                  ドキュメント生成エンジン
    ├── flow/commands/            start, status, review, merge, resume, cleanup
    ├── spec/commands/            init, gate, guardrail
    ├── presets/                  base, cli, node-cli, node, php, webapp,
    │                             cakephp2, laravel, symfony, library
    ├── locale/                   en/, ja/
    └── templates/                スキャフォールドテンプレート
```

### コマンドルーティング

3層ディスパッチ: `sdd-forge.js` → `docs.js`/`spec.js`/`flow.js` → `commands/*.js`

| 呼び出し形式 | ルーター | 実装 |
|---|---|---|
| `sdd-forge docs build` | `docs.js` | パイプライン: `scan→enrich→init→data→text→readme→agents→[translate]` |
| `sdd-forge docs <cmd>` | `docs.js` | `src/docs/commands/<cmd>.js` |
| `sdd-forge spec <cmd>` | `spec.js` | `src/spec/commands/<cmd>.js` |
| `sdd-forge flow <cmd>` | `flow.js` | `src/flow/commands/<cmd>.js` |
| `sdd-forge setup\|upgrade\|presets\|help` | 直接 | `src/<cmd>.js` |

### npm scripts

| コマンド | スクリプト |
|---|---|
| `npm test` | `find tests -name '*.test.js' \| xargs node --test` |

### 主要ファイルパス（コード探索の起点）

| 目的 | パス |
|---|---|
| CLI エントリ・ルーティング | `src/sdd-forge.js` |
| docs パイプライン制御 | `src/docs.js` |
| コマンド共有コンテキスト | `src/docs/lib/command-context.js` |
| AI エージェント呼び出し | `src/lib/agent.js` |
| 設定ローダー・バリデーション | `src/lib/config.js`, `src/lib/types.js` |
| ディレクティブパーサー | `src/docs/lib/directive-parser.js` |
| テンプレート継承・マージ | `src/docs/lib/template-merger.js` |
| DataSource 基底クラス | `src/docs/lib/data-source.js` |
| DataSource ファクトリー | `src/docs/lib/resolver-factory.js` |
| プリセット探索 | `src/lib/presets.js` |
| フロー状態永続化 | `src/lib/flow-state.js` |
| analysis.json（解析出力） | `.sdd-forge/output/analysis.json` |
<!-- {{/data}} -->

