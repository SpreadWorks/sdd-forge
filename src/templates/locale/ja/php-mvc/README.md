# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
<!-- @data: config.stack -->

## クイックスタート

<!-- @text: このプロジェクトの環境構築と起動手順を説明してください。 -->

## ドキュメント

| 章 | 概要 |
|----|------|
{{CHAPTER_TABLE}}

## 開発ワークフロー（SDD）

本プロジェクトは Spec-Driven Development（SDD）を採用しています。

```
1. spec   — 仕様ファイル作成（feature ブランチ + spec.md）
2. gate   — 仕様ゲート（未解決事項がなければ PASS）
3. 実装
4. forge  — ドキュメント自動更新
5. review — ドキュメントレビュー（構造・網羅性チェック）
```

<!-- MANUAL:START -->
{{MANUAL_CONTENT}}<!-- MANUAL:END -->
