# 03. プロジェクト構成

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。 -->

`src/` 配下は `docs/`・`specs/`・`lib/`・`presets/`・`templates/` の 5 つの主要ディレクトリで構成されており、ドキュメント生成・仕様管理・共通ユーティリティ・フレームワーク固有ロジック・バンドルテンプレートをそれぞれ担います。エントリポイントの `sdd-forge.js` から `docs.js` / `spec.js` / `flow.js` への三段階ディスパッチ構造によって全 CLI コマンドが統合されています。

## 内容

### ディレクトリ構成

<!-- @text: プロジェクトのディレクトリ構成を tree 形式のコードブロックで記述してください。主要ディレクトリ・ファイルの役割コメントを含めること。 -->

```
sdd-forge/
├── package.json                    ← パッケージ定義・bin エントリポイント（./src/sdd-forge.js）
├── README.md                       ← パッケージドキュメント
└── src/
    ├── sdd-forge.js                ← トップレベルディスパッチャー（コマンドルーティング）
    ├── docs.js                     ← docs サブコマンドディスパッチャー
    ├── spec.js                     ← spec サブコマンドディスパッチャー
    ├── flow.js                     ← SDD フロー自動実行（直接コマンド）
    ├── help.js                     ← コマンド一覧表示
    ├── docs/
    │   ├── commands/               ← docs サブコマンド実装（12 ファイル）
    │   │   ├── scan.js             ← ソースコード解析 → analysis.json / summary.json
    │   │   ├── init.js             ← テンプレートから docs/ を初期化
    │   │   ├── data.js             ← @data ディレクティブ解決
    │   │   ├── text.js             ← @text ディレクティブを AI で解決
    │   │   ├── forge.js            ← docs 反復改善
    │   │   ├── review.js           ← docs 品質チェック
    │   │   ├── readme.js           ← README.md 自動生成
    │   │   ├── agents.js           ← AGENTS.md の PROJECT セクション更新
    │   │   ├── changelog.js        ← specs/ から change_log.md 生成
    │   │   ├── setup.js            ← プロジェクト登録・設定生成
    │   │   ├── upgrade.js          ← バージョンアップ処理
    │   │   └── default-project.js  ← デフォルトプロジェクト設定
    │   └── lib/                    ← docs コマンド共通ライブラリ（10 ファイル）
    │       ├── scanner.js          ← ソースコード汎用スキャナー
    │       ├── directive-parser.js ← @data/@text ディレクティブパーサー
    │       ├── template-merger.js  ← テンプレートとドキュメントのマージ
    │       ├── renderers.js        ← 解析データのマークダウン変換
    │       ├── resolver-factory.js ← @data リゾルバー生成
    │       ├── forge-prompts.js    ← forge/text 向けプロンプト生成・summary 変換
    │       ├── data-source.js      ← データソース抽象化
    │       ├── scan-source.js      ← スキャンソース抽象化
    │       ├── review-parser.js    ← review 結果のパース
    │       └── php-array-parser.js ← PHP 配列構文パーサー
    ├── specs/
    │   └── commands/               ← spec サブコマンド実装（2 ファイル）
    │       ├── init.js             ← spec 初期化（feature ブランチ + spec.md 生成）
    │       └── gate.js             ← spec ゲートチェック
    ├── lib/                        ← 全コマンド共通ライブラリ（11 ファイル）
    │   ├── agent.js                ← AI エージェント呼び出しインターフェース
    │   ├── cli.js                  ← CLI ユーティリティ（repoRoot / parseArgs / worktree 判定）
    │   ├── config.js               ← JSON 読み込み・SDD 設定管理
    │   ├── types.js                ← 型定義・バリデーション
    │   ├── i18n.js                 ← 国際化（ロケール別メッセージファイル読み込み）
    │   ├── projects.js             ← projects.json CRUD
    │   ├── presets.js              ← プリセット管理
    │   ├── process.js              ← プロセス実行ユーティリティ
    │   ├── progress.js             ← 進捗表示
    │   ├── flow-state.js           ← SDD フロー状態管理
    │   └── agents-md.js            ← AGENTS.md セクション管理
    ├── presets/                    ← FW 固有スキャン・データ解析（計 48 ファイル）
    │   ├── cakephp2/               ← CakePHP 2.x 対応（scan/10 + data/10）
    │   ├── laravel/                ← Laravel 対応（scan/5 + data/6）
    │   ├── symfony/                ← Symfony 対応（scan/5 + data/6）
    │   ├── webapp/                 ← 汎用 Web アプリ対応（data/5）
    │   └── cli/                    ← CLI プロジェクト対応（data/1）
    └── templates/                  ← バンドルテンプレート（計 30 ファイル）
        ├── locale/ja/              ← 日本語テンプレート（base / cli / webapp / library）
        ├── locale/en/              ← 英語メッセージ定義
        ├── skills/                 ← スキル定義（sdd-flow-start / sdd-flow-close）
        └── config.example.json     ← 設定ファイルサンプル
```

### 各ディレクトリの責務

<!-- @text: 主要ディレクトリの責務をファイル数とともに表形式で記述してください。 -->

| ディレクトリ | ファイル数 | 責務 |
| --- | --- | --- |
| `src/docs/commands/` | 12 | ドキュメント生成の各サブコマンド実装（scan / init / data / text / forge / review / readme / agents / changelog / setup 等） |
| `src/docs/lib/` | 10 | docs コマンド群が共通利用するライブラリ（スキャナー・ディレクティブパーサー・テンプレートマージャー・レンダラー等） |
| `src/specs/commands/` | 2 | SDD spec の初期化（init）とゲートチェック（gate）の実装 |
| `src/lib/` | 11 | 全コマンドで共通利用するユーティリティ（CLI パーサー・AI エージェント呼び出し・設定管理・国際化・フロー状態管理等） |
| `src/presets/` | 48 | フレームワーク固有のスキャン・データ解析ロジック（CakePHP2 / Laravel / Symfony / webapp / cli） |
| `src/templates/` | 30 | docs 初期化用バンドルテンプレートおよびロケール別メッセージ・プロンプト定義 |

### 共通ライブラリ

<!-- @data: libs.list("クラス|ファイル|責務") -->
| クラス | ファイル | 責務 |
| --- | --- | --- |
| — | — | — |
