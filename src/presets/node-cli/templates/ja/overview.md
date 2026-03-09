# 01. ツール概要とアーキテクチャ

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。ツールの目的・解決する課題・主要なユースケースを踏まえること。}} -->
<!-- {{/text}} -->

## 内容

### ツールの目的

<!-- {{text: このCLIツールが解決する課題と、ターゲットユーザーを説明してください。主な機能は2つ: (1) ソースコード解析に基づく自動ドキュメント生成（{{data}}/{{text}} ディレクティブ）、(2) Spec-Driven Development ワークフロー（spec → gate → 実装 → forge → review）。}} -->
<!-- {{/text}} -->

### アーキテクチャ概要

<!-- {{text: ツール全体のアーキテクチャを mermaid flowchart で生成してください。3層ディスパッチ構造（sdd-forge.js → docs.js/spec.js → 各コマンド）と、flow.js（直接実行コマンド）を含めること。入力（ソースコード）→ 処理（scan/data/text）→ 出力（docs/, README.md）の流れと AI エージェント連携も示すこと。出力は mermaid コードブロックのみ。}} -->
<!-- {{/text}} -->

### 主要コンセプト

<!-- {{text: このツールを理解するうえで重要なコンセプト・用語を表形式で説明してください。必須項目: {{data}} ディレクティブ、{{text}} ディレクティブ、analysis.json / summary.json、プリセット、spec.md、ゲートチェック、SDD フロー、forge、review、フロー状態（.sdd-forge/current-spec）。}} -->
<!-- {{/text}} -->

### 典型的な利用フロー

<!-- {{text: ユーザーがインストールしてから最初の成果物を得るまでの典型的な手順をステップ形式で説明してください。手順: npm install → sdd-forge setup → sdd-forge build（これで scan/init/data/text/readme/agents/translate が一括実行される）→ sdd-forge review → SDD フロー開始。}} -->
<!-- {{/text}} -->
