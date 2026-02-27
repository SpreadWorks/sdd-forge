# 10. 配布とバージョン管理

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。配布チャネル・バージョニング戦略・リリースフローを踏まえること。 -->

## 内容

### 配布チャネル

<!-- @text-fill: このツールの配布チャネル（npmjs.com / GitHub Packages / GitHub リリース等）とそれぞれのインストール方法を説明してください。 -->

### リリースフロー

<!-- @text-fill: 新バージョンをリリースするまでの手順を説明してください。development → main への squash merge・npm version・npm publish を含めること。 -->

```bash
# バージョン更新
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0

# npm レジストリに公開
npm publish
```

### npm publish 設定

<!-- @text-fill: package.json の files フィールドで制御している公開対象ファイルの方針と、.npmignore の有無を説明してください。 -->

### セマンティックバージョニング

<!-- @text-fill: major/minor/patch それぞれの判断基準を、このツール固有の例を交えて説明してください。 -->

### 後方互換性ポリシー

<!-- @text-fill: CLI インターフェース・設定ファイル形式・出力フォーマットそれぞれの後方互換性に関するポリシーを説明してください。 -->

### CHANGELOG 管理

<!-- @text-fill: CHANGELOG の管理方針（手動/自動生成・形式）を説明してください。 -->
