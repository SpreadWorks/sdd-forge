# 04. 内部設計

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。プロジェクト構成・モジュール依存の方向・主要な処理フローを踏まえること。}} -->

## 内容

### プロジェクト構成

<!-- {{text: このプロジェクトのディレクトリ構成を tree 形式のコードブロックで記述してください。主要ディレクトリ・ファイルの役割コメントを含めること。src/ 直下のディスパッチャー（sdd-forge.js, docs.js, spec.js, flow.js）、docs/commands/（サブコマンド実装）、docs/lib/（ドキュメント生成ライブラリ）、lib/（共通ユーティリティ）、presets/（プリセット定義）、templates/（バンドルテンプレート）を含めること。}} -->

### モジュール構成

<!-- {{text: 主要モジュールの一覧を表形式で記述してください。モジュール名・ファイルパス・責務を含めること。ディスパッチャー層（sdd-forge.js, docs.js, spec.js）、コマンド層（docs/commands/*.js, specs/commands/*.js）、ライブラリ層（lib/agent.js, lib/cli.js, lib/config.js, lib/flow-state.js, lib/presets.js, lib/i18n.js）、ドキュメント生成層（docs/lib/scanner.js, directive-parser.js, template-merger.js, forge-prompts.js, text-prompts.js, review-parser.js, data-source.js, resolver-factory.js）を含めること。}} -->

### モジュール依存関係

<!-- {{text: モジュール間の依存関係を mermaid graph で生成してください。3層ディスパッチ構造を反映し、ディスパッチャー → コマンド → ライブラリの依存方向を示すこと。出力は mermaid コードブロックのみ。}} -->

### 主要な処理フロー

<!-- {{text: 代表的なコマンド（build または forge）を実行した際のモジュール間のデータ・制御フローを番号付きステップで説明してください。エントリポイント → ディスパッチ → 設定読み込み → 解析データ準備 → AI 呼び出し → ファイル書き込みの流れを含めること。}} -->

### 拡張ポイント

<!-- {{text: 新しいコマンドや機能を追加する際に変更が必要な箇所と、拡張パターンを説明してください。(1) 新しい docs サブコマンドの追加、(2) 新しい spec サブコマンドの追加、(3) 新しいプリセットの追加、(4) 新しい DataSource（{{data}} リゾルバ）の追加、(5) 新しい AI プロンプトの追加、のそれぞれについて手順を記載すること。}} -->
