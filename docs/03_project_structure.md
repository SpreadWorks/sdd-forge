# 03. プロジェクト構成

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。 -->

本章では `src/` 以下に配置された 7 つの主要ディレクトリ（`docs/commands/`、`docs/lib/`、`specs/commands/`、`lib/`、`presets/`、`templates/`、エントリーポイント群）の構成と役割を解説します。
各ディレクトリは「コマンド実装」「内部ライブラリ」「プリセット」「テンプレート」の 4 層に分類されており、機能追加時はこの層構造に従って配置先を判断します。

## 内容

### ディレクトリ構成

<!-- @text: プロジェクトのディレクトリ構成を tree 形式のコードブロックで記述してください。主要ディレクトリ・ファイルの役割コメントを含めること。 -->

```
sdd-forge/
├── package.json                     # パッケージ定義・bin エントリー設定
├── README.md                        # パッケージ向けドキュメント
└── src/                             # ソースコード一式（npm publish 対象）
    ├── sdd-forge.js                 # CLI エントリーポイント・サブコマンドルーティング
    ├── docs.js                      # docs 系コマンドディスパッチャー
    ├── spec.js                      # spec 系コマンドディスパッチャー
    ├── flow.js                      # SDD フロー自動実行（ダイレクトコマンド）
    ├── help.js                      # コマンド一覧表示
    ├── docs/
    │   ├── commands/                # docs サブコマンド実装（12 ファイル）
    │   │   ├── scan.js              # ソースコード解析 → analysis.json / summary.json
    │   │   ├── init.js              # テンプレートから docs/ を初期化
    │   │   ├── data.js              # @data ディレクティブを解析データで解決
    │   │   ├── text.js              # @text ディレクティブを AI で解決
    │   │   ├── forge.js             # docs 反復改善（AI による書き換え）
    │   │   ├── review.js            # docs 品質チェック
    │   │   ├── readme.js            # README.md 自動生成
    │   │   ├── agents.js            # AGENTS.md の PROJECT セクション更新
    │   │   ├── changelog.js         # specs/ から change_log.md を生成
    │   │   ├── setup.js             # プロジェクト登録・設定生成
    │   │   ├── upgrade.js           # 設定・テンプレートのバージョンアップグレード
    │   │   └── default-project.js   # デフォルトプロジェクト変更
    │   └── lib/                     # docs サブコマンド内部ライブラリ（10 ファイル）
    │       ├── scanner.js           # 汎用ソースコードスキャナー
    │       ├── directive-parser.js  # @data / @text ディレクティブパーサー
    │       ├── template-merger.js   # テンプレートマージ処理
    │       ├── renderers.js         # 解析データ → Markdown レンダリング
    │       ├── resolver-factory.js  # プリセット別リゾルバー生成
    │       ├── forge-prompts.js     # forge / text 用プロンプト生成・summaryToText()
    │       ├── data-source.js       # データソース（analysis.json / summary.json）取得
    │       ├── scan-source.js       # スキャン対象ファイル抽出
    │       ├── review-parser.js     # レビュー結果パーサー
    │       └── php-array-parser.js  # PHP 配列構文パーサー
    ├── specs/
    │   └── commands/                # spec 系コマンド実装（2 ファイル）
    │       ├── init.js              # spec 初期化（feature ブランチ + spec.md 生成）
    │       └── gate.js              # spec ゲートチェック（実装可否判定）
    ├── lib/                         # 全コマンド共通ライブラリ（11 ファイル）
    │   ├── agent.js                 # AI エージェント呼び出し（同期 / 非同期）
    │   ├── cli.js                   # CLI 引数パーサー・repoRoot / sourceRoot 解決
    │   ├── config.js                # SDD 設定読み書き・context.json 管理
    │   ├── types.js                 # JSDoc 型定義・config / context バリデーション
    │   ├── projects.js              # マルチプロジェクト管理（projects.json CRUD）
    │   ├── presets.js               # プリセット自動検出・TYPE_ALIASES 生成
    │   ├── i18n.js                  # 国際化（ロケール別メッセージ翻訳）
    │   ├── flow-state.js            # SDD フロー状態（current-spec）読み書き
    │   ├── agents-md.js             # AGENTS.md SDD セクション操作
    │   ├── progress.js              # ビルドパイプライン進捗バー表示
    │   └── process.js               # spawnSync ラッパー（runSync）
    ├── presets/                     # フレームワーク別プリセット
    │   ├── cakephp2/                # CakePHP 2.x 対応（scan/ data/ templates/）
    │   ├── laravel/                 # Laravel 対応（scan/ data/ templates/）
    │   ├── symfony/                 # Symfony 対応（scan/ data/ templates/）
    │   ├── node-cli/                # Node.js CLI 対応（templates/）
    │   ├── cli/                     # 汎用 CLI 対応（data/）
    │   └── webapp/                  # 汎用 Web アプリ対応（data/）
    └── templates/                   # ドキュメントテンプレート・設定サンプル
        ├── locale/                  # ロケール別メッセージ・ベーステンプレート (ja / en)
        ├── config.example.json      # 設定ファイルサンプル
        ├── review-checklist.md      # docs レビューチェックリスト
        └── skills/                  # Claude スキル定義（sdd-flow-start / close）
```

### 各ディレクトリの責務

<!-- @text: 主要ディレクトリの責務をファイル数とともに表形式で記述してください。 -->

| ディレクトリ | ファイル数 | 責務 |
| --- | --- | --- |
| `src/`（ルート） | 5 | CLI エントリーポイントおよび docs / spec / flow への三段階ディスパッチ |
| `src/docs/commands/` | 12 | scan・init・data・text・forge・review など docs 系サブコマンドの実装 |
| `src/docs/lib/` | 10 | スキャナー・ディレクティブパーサー・レンダラーなど docs コマンド内部ライブラリ |
| `src/specs/commands/` | 2 | spec 初期化（ブランチ作成・spec.md 生成）とゲートチェックの実装 |
| `src/lib/` | 11 | AI 呼び出し・CLI パーサー・設定管理・i18n など全コマンド共通の共有ライブラリ |
| `src/presets/` | 6 dirs | フレームワーク別スキャン定義・データ変換ロジック・ドキュメントテンプレート |
| `src/templates/` | 複数 | ロケール別ベーステンプレート・メッセージ定義・設定サンプル・スキル定義 |

### 共通ライブラリ

<!-- @data: libs.list("クラス|ファイル|責務") -->
| クラス | ファイル | 責務 |
| --- | --- | --- |
| — | — | — |
