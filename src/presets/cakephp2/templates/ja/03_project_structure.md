<!-- @extends -->

<!-- @block: directory-tree -->
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
<!-- @endblock -->

<!-- @block: directory-roles -->
### 各ディレクトリの責務

<!-- @text: 主要ディレクトリ（Config/Console/Controller/Model/View/Lib/Plugin/docs/specs/tools）の責務をファイル数とともに表形式で記述してください。 -->
<!-- @endblock -->

<!-- @block: libraries -->
### 共通ライブラリ (Lib/)

<!-- @data: libs.list("クラス|ファイル|責務") -->
<!-- @enddata -->

### View 層

#### ヘルパー

<!-- @data: views.helpers("ヘルパー|継承元|責務") -->
<!-- @enddata -->

#### レイアウト

<!-- @data: views.layouts("ファイル|用途") -->
<!-- @enddata -->

#### エレメント

<!-- @data: views.elements("ファイル|用途") -->
<!-- @enddata -->
<!-- @endblock -->
