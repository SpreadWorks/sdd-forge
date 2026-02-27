# video-cms

CakePHP 2.x ベースの動画コンテンツ管理システム。

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| 言語 | PHP 5.5+（Docker: PHP 8.x） |
| フレームワーク | CakePHP 2.x |
| DB | MySQL 8.0（マルチDB構成） |
| コンテナ | Docker Compose |
| ビルド | Ant, Composer |
| テスト | PHPUnit 3.7.* |
| 開発ツール | Node.js（SDD ツール群） |

## クイックスタート

```bash
make build    # Docker イメージビルド
make up       # コンテナ起動
make shell    # コンテナ内シェル
```

## ドキュメント

| 章 | 概要 |
|----|------|
{{CHAPTER_TABLE}}

## 開発ワークフロー（SDD）

本プロジェクトは Spec-Driven Development（SDD）を採用しています。

```
1. spec:start   — 仕様ファイル作成（feature ブランチ + spec.md）
2. spec:gate    — 仕様ゲート（未解決事項がなければ PASS）
3. 実装
4. docs:forge   — ドキュメント自動更新
5. docs:review  — ドキュメントレビュー（構造・網羅性チェック）
```

詳細は [CLAUDE.md](CLAUDE.md) の「SDDフロー」セクションを参照してください。

<!-- MANUAL:START -->
{{MANUAL_CONTENT}}<!-- MANUAL:END -->
