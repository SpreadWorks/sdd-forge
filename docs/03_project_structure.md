# 03. プロジェクト構成

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。 -->

`src/` 配下は `lib/`・`docs/`・`specs/`・`templates/` の4つの主要ディレクトリで構成されており、それぞれ共通ユーティリティ・ドキュメント生成エンジン・スペック管理・テンプレート資産を担います。
エントリーポイントからコマンド実装まで3階層のディスパッチ構造を持ち、フレームワーク固有の解析ロジックはプリセットとして分離されています。

## 内容

### ディレクトリ構成

<!-- @text: プロジェクトのディレクトリ構成を tree 形式のコードブロックで記述してください。主要ディレクトリ・ファイルの役割コメントを含めること。 -->

```
src/
├── sdd-forge.js              # CLIエントリーポイント・最上位ディスパッチャー
├── docs.js                   # docs系サブコマンドのディスパッチャー
├── spec.js                   # spec系サブコマンドのディスパッチャー
├── flow.js                   # SDDフロー自動実行（直接コマンド）
├── help.js                   # コマンド一覧表示
├── lib/                      # 全コマンド共通のユーティリティ群（11ファイル）
│   ├── agent.js              # AIエージェント呼び出し共通インターフェース
│   ├── agents-md.js          # AGENTS.md の生成・注入処理
│   ├── cli.js                # CLI引数パース・環境変数解決
│   ├── config.js             # SDD設定ファイルのI/O・バリデーション
│   ├── flow-state.js         # SDDフロー状態の永続化管理
│   ├── i18n.js               # ロケール別メッセージのロード
│   ├── presets.js            # フレームワークプリセットのレジストリ
│   ├── process.js            # 子プロセス実行ラッパー
│   ├── progress.js           # ログ・進捗出力ユーティリティ
│   ├── projects.js           # projects.json のCRUD操作
│   └── types.js              # JSDoc型定義・設定バリデーション
├── docs/                     # ドキュメント生成エンジン
│   ├── commands/             # docsサブコマンド実装（12ファイル）
│   │   ├── scan.js           # ソースコード解析 → analysis.json 出力
│   │   ├── init.js           # テンプレート継承解決・docs/初期化
│   │   ├── data.js           # @dataディレクティブ解決
│   │   ├── text.js           # @textディレクティブをAIで解決
│   │   ├── forge.js          # docs反復改善ループ
│   │   ├── review.js         # docs品質チェック
│   │   ├── readme.js         # README.md自動生成
│   │   ├── agents.js         # AGENTS.md更新
│   │   ├── setup.js          # プロジェクト登録・設定生成
│   │   ├── changelog.js      # specs/からchangelog.md生成
│   │   ├── upgrade.js        # 設定バージョンアップグレード
│   │   └── default-project.js# デフォルトプロジェクト設定
│   ├── lib/                  # ドキュメントエンジン内部ライブラリ（9ファイル）
│   │   ├── scanner.js        # 汎用ソースコードアナライザー
│   │   ├── directive-parser.js   # @data/@textディレクティブ抽出・パース
│   │   ├── template-merger.js    # テンプレート継承チェーン解決
│   │   ├── renderers.js      # @dataディレクティブレンダラー群
│   │   ├── resolver-base.js  # フレームワーク別リゾルバー基底クラス
│   │   ├── resolver-factory.js   # リゾルバーのファクトリー関数
│   │   ├── forge-prompts.js  # forge/text/init向けAIプロンプトユーティリティ
│   │   ├── review-parser.js  # レビュー出力のパーサー
│   │   └── php-array-parser.js   # PHP配列構文パーサー
│   └── presets/webapp/       # フレームワーク固有アナライザー
│       ├── cakephp2/         # CakePHP 2.x プリセット（16ファイル）
│       ├── laravel/          # Laravel プリセット（7ファイル）
│       └── symfony/          # Symfony プリセット（7ファイル）
├── specs/
│   └── commands/             # specサブコマンド実装（2ファイル）
│       ├── init.js           # featureブランチ作成・spec.md初期化
│       └── gate.js           # 実装前ゲートチェック
└── templates/                # バンドルされたドキュメントテンプレート群
    ├── locale/ja/            # 日本語テンプレート（45ファイル）
    │   ├── base/             # 全プロジェクト共通テンプレート
    │   ├── cli/              # CLI/node-cli向けテンプレート
    │   ├── webapp/           # Webアプリ向けテンプレート
    │   └── skills/           # スキル定義（sdd-flow-start/close）
    └── locale/en/            # 英語テンプレート（3ファイル）
```

### 各ディレクトリの責務

<!-- @text: 主要ディレクトリの責務をファイル数とともに表形式で記述してください。 -->

| ディレクトリ | ファイル数 | 責務 |
| --- | --- | --- |
| `src/` (トップレベル) | 5 | CLIエントリーポイントと3階層ディスパッチャー群 |
| `src/lib/` | 11 | 全コマンドが共通利用するユーティリティ（CLI・設定・AI・i18n等） |
| `src/docs/commands/` | 12 | `sdd-forge build` 系サブコマンドの実装本体 |
| `src/docs/lib/` | 9 | ドキュメント生成エンジンのコアライブラリ（スキャン・ディレクティブ処理・テンプレート合成） |
| `src/docs/presets/webapp/cakephp2/` | 16 | CakePHP 2.x 固有の解析ロジックとデータリゾルバー |
| `src/docs/presets/webapp/laravel/` | 7 | Laravel 固有の解析ロジックとデータリゾルバー |
| `src/docs/presets/webapp/symfony/` | 7 | Symfony 固有の解析ロジックとデータリゾルバー |
| `src/specs/commands/` | 2 | スペック管理（spec作成・ゲートチェック） |
| `src/templates/locale/ja/` | 45 | 日本語ドキュメントテンプレート（基本・CLI・Webアプリ・スキル） |
| `src/templates/locale/en/` | 3 | 英語メッセージ・プロンプト・UIテキスト |

### 共通ライブラリ

<!-- @data: table(libs, labels=クラス|ファイル|責務) -->
| クラス | ファイル | 責務 |
| --- | --- | --- |
| — | — | — |
