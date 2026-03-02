# 03. プロジェクト構成

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。 -->

本章では sdd-forge のソースコード構成を説明します。`src/` 以下に 6 つの主要ディレクトリが存在し、コマンド実装・共通ライブラリ・テンプレート・フレームワーク別プリセットに役割が分担されています。

## 内容

### ディレクトリ構成

<!-- @text: プロジェクトのディレクトリ構成を tree 形式のコードブロックで記述してください。主要ディレクトリ・ファイルの役割コメントを含めること。 -->

```
sdd-forge/
├── package.json                    # パッケージ定義 / bin エントリポイント
└── src/
    ├── sdd-forge.js                # トップレベルディスパッチャ
    ├── docs.js                     # docs サブコマンド群のディスパッチャ
    ├── spec.js                     # spec サブコマンド群のディスパッチャ
    ├── flow.js                     # SDD フロー自動実行（直接コマンド）
    ├── help.js                     # コマンド一覧表示
    ├── docs/
    │   ├── commands/               # docs サブコマンド実装（11 ファイル）
    │   │   ├── scan.js             #   ソースコード解析 → analysis.json
    │   │   ├── init.js             #   テンプレートから docs/ を初期化
    │   │   ├── data.js             #   @data ディレクティブ解決
    │   │   ├── text.js             #   @text ディレクティブを AI で解決
    │   │   ├── forge.js            #   docs 反復改善
    │   │   ├── review.js           #   docs 品質チェック
    │   │   ├── readme.js           #   README.md 自動生成
    │   │   ├── setup.js            #   プロジェクト登録 + 設定生成
    │   │   ├── changelog.js        #   specs/ から change_log.md を生成
    │   │   ├── agents.js           #   AGENTS.md PROJECT セクション更新
    │   │   └── default-project.js  #   デフォルトプロジェクト切り替え
    │   ├── lib/                    # docs 処理共通ライブラリ（7 ファイル）
    │   │   ├── directive-parser.js #   ディレクティブ解析
    │   │   ├── template-merger.js  #   テンプレートマージエンジン
    │   │   ├── renderers.js        #   データ → Markdown 変換
    │   │   ├── resolver-base.js    #   リゾルバ基底クラス
    │   │   ├── resolver-factory.js #   リゾルバファクトリ
    │   │   ├── scanner.js          #   汎用スキャナ
    │   │   └── php-array-parser.js #   PHP 配列パーサ
    │   └── presets/webapp/         # フレームワーク別プリセット
    │       └── cakephp2/           # CakePHP 2 専用プリセット（7 ファイル）
    │           ├── scanner.js      #   FW 固有スキャン拡張
    │           ├── resolver.js     #   FW 固有リゾルバ
    │           └── analyze-*.js    #   コントローラ・モデル・ルート等の解析
    ├── specs/
    │   └── commands/               # spec サブコマンド実装（2 ファイル）
    │       ├── init.js             #   spec 初期化（feature ブランチ + spec.md）
    │       └── gate.js             #   spec ゲートチェック
    ├── lib/                        # 全コマンド共有ユーティリティ（7 ファイル）
    │   ├── agent.js                #   AI エージェント呼び出し
    │   ├── cli.js                  #   CLI ユーティリティ（repoRoot / parseArgs）
    │   ├── config.js               #   設定ファイル読み込み・管理
    │   ├── i18n.js                 #   多言語対応モジュール
    │   ├── process.js              #   spawnSync ラッパー
    │   ├── projects.js             #   projects.json CRUD
    │   └── types.js                #   JSDoc 型定義 + バリデーション
    ├── templates/                  # バンドル済みテンプレート群
    │   ├── config.example.json     #   設定ファイルサンプル
    │   ├── review-checklist.md     #   review チェックリスト
    │   └── locale/                 #   ロケール別テンプレート（ja / en）
    │       └── ja/
    │           ├── base/           #   共通ドキュメントテンプレート
    │           ├── cli/            #   CLI プロジェクト向けテンプレート
    │           ├── webapp/         #   Web アプリ向けテンプレート
    │           └── *.json          #   UI 文言 / プロンプト定義
    └── README.md                   # パッケージ同梱の内部構造ガイド
```

### 各ディレクトリの責務

<!-- @text: 主要ディレクトリの責務をファイル数とともに表形式で記述してください。 -->

| ディレクトリ | ファイル数 | 責務 |
| --- | --- | --- |
| `src/`（ルート） | 5 | トップレベルディスパッチャ群。`sdd-forge.js` がサブコマンドを `docs.js` / `spec.js` / `flow.js` へルーティングする |
| `src/docs/commands/` | 11 | `sdd-forge docs` 配下の全コマンド実装。scan / init / data / text / forge / review / readme / setup / changelog / agents / default-project を提供する |
| `src/docs/lib/` | 7 | ドキュメント生成処理の共通ライブラリ。ディレクティブ解析・テンプレートマージ・レンダリング・リゾルバ基盤を担う |
| `src/docs/presets/webapp/cakephp2/` | 7 | CakePHP 2 フレームワーク固有の解析処理とリゾルバ。コントローラ・モデル・ルート・シェルの解析ロジックを含む |
| `src/specs/commands/` | 2 | `sdd-forge spec` / `sdd-forge gate` コマンド実装。spec ファイル初期化とゲートチェックを担う |
| `src/lib/` | 7 | 全コマンドが共有するユーティリティ群。AI 呼び出し・設定管理・多言語対応・プロジェクト管理などの横断機能を提供する |
| `src/templates/` | 多数 | バンドル済みドキュメントテンプレート。ロケール（ja / en）・プロジェクト種別（base / cli / webapp）ごとに整理されている |

### 共通ライブラリ

<!-- @data: table(libs, labels=クラス|ファイル|責務) -->
| クラス | ファイル | 責務 |
| --- | --- | --- |
| — | — | — |
```

---

書き込み権限の付与をいただければ、直接ファイルへ反映します。`docs/03_project_structure.md` への書き込みを許可していただくか、上記の内容を手動でコピーしてください。
