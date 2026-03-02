# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## クイックスタート

```bash
npm install -g {{PACKAGE_NAME}}
{{PACKAGE_NAME}} help
```

## ドキュメント

| 章 | 概要 |
|----|------|
{{CHAPTER_TABLE}}

## 開発ワークフロー（SDD）

本プロジェクトは Spec-Driven Development（SDD）を採用しています。

```
1. sdd-forge spec --title "..."   — 仕様ファイル作成
2. sdd-forge gate --spec ...      — 仕様ゲート（未解決事項がなければ PASS）
3. 実装
4. sdd-forge forge --prompt "..."  — ドキュメント自動更新
5. sdd-forge review               — ドキュメントレビュー
```

<!-- MANUAL:START -->
{{MANUAL_CONTENT}}<!-- MANUAL:END -->
