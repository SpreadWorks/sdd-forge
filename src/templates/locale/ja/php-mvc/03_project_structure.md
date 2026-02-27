# 03. プロジェクト構成

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。主要ディレクトリ（Controller, Model, View, Console 等）の数と役割を踏まえること。 -->

## 内容

### ディレクトリ構成

```text
project/
├── app/
│   ├── Config/         # 設定
│   ├── Console/        # CLI コマンド
│   ├── Controller/     # コントローラ
│   ├── Model/          # モデル
│   ├── View/           # ビュー
│   ├── Lib/            # ライブラリ
│   └── Plugin/         # プラグイン
├── docs/               # ドキュメント
├── specs/              # 機能仕様
└── sdd-forge/          # 開発ツール
```

### 各ディレクトリの責務

<!-- @text-fill: 主要ディレクトリ（Config/Console/Controller/Model/View/Lib/Plugin/docs/specs/tools）の責務をファイル数とともに表形式で記述してください。 -->

### 共通ライブラリ (Lib/)

<!-- @data-fill: table(libs, labels=クラス|ファイル|責務) -->

### View 層

#### ヘルパー

<!-- @data-fill: table(views.helpers, labels=ヘルパー|継承元|責務) -->

#### レイアウト

<!-- @data-fill: table(views.layouts, labels=ファイル|用途) -->

#### エレメント

<!-- @data-fill: table(views.elements, labels=ファイル|用途) -->
