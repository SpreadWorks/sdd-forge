<\!-- {{data: docs.langSwitcher("relative")}} -->
<\!-- {{/data}} -->
# 03. 設定とカスタマイズ

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。}} -->
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。主要ファイル: .sdd-forge/config.json（プロジェクト設定）、.sdd-forge/projects.json（複数プロジェクト管理）、.sdd-forge/current-spec（SDD フロー状態）、.sdd-forge/output/analysis.json（解析結果・enriched データ含む）。}} -->
<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text[mode=deep]: .sdd-forge/config.json の全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。主要フィールド: output.languages（出力言語リスト）, output.default（デフォルト言語）, output.mode（translate/generate）, lang（CLI動作言語）, type（プロジェクトタイプ）, documentStyle（purpose/tone/customInstruction）, textFill（preamblePatterns）, defaultAgent, providers（AIエージェント定義）, flow.merge（squash/ff-only/merge）, limits（concurrency/designTimeoutMs）。}} -->
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: ユーザーがカスタマイズできる項目を説明してください。(1) AI プロバイダー設定（providers フィールド、command/args/timeoutMs/systemPromptFlag）と設定例、(2) ドキュメントスタイル（purpose/tone/customInstruction）、(3) プリセット選択（type フィールド）、(4) マージ戦略（flow.merge）、(5) 並列処理数（limits.concurrency）。各項目に JSON 設定例を含めること。}} -->
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: ツールが参照する環境変数の一覧と用途を表形式で記述してください。SDD_SOURCE_ROOT（ソースコードルート）、SDD_WORK_ROOT（作業ルート、.sdd-forge/ の配置先）、CLAUDECODE（Claude CLI ハング防止のため削除される内部変数）。}} -->
<!-- {{/text}} -->
