# Feature Specification: 024-deduplicate-preset-utilities-and-shared-patterns

**Feature Branch**: `feature/024-deduplicate-preset-utilities-and-shared-patterns`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User request

## Goal
preset 層およびコマンド間で重複しているユーティリティ関数・パターンを共通化し、保守性を向上させる。

## Scope
- A1: laravel/symfony preset の `camelToSnake()`/`pluralize()` ローカル定義を除去し scanner.js から import
- A2: laravel/symfony の `parseComposer()`/`parseEnv*()` を共通モジュールに抽出
- A3: laravel/symfony の `walk()` を scanner.js の `findFiles()` で置換
- A4: ブロックディレクティブ置換パターン（data.js, readme.js, agents.js）を `replaceBlockDirective()` に共通化
- A6: `mapWithConcurrency()` を共通モジュールに抽出し forge.js でも利用

## Out of Scope
- setup.js / flow.js / init.js の main() 分割
- process.argv 書き換えの解消
- エラーハンドリングの統一
- preset の return signature 統一

## Clarifications (Q&A)
- Q: A1 で php-array-parser.js の高機能版 camelToSnake/pluralize はどうするか？
  - A: CakePHP2 固有のイレギュラー対応が含まれるため、そのまま残す。laravel/symfony は scanner.js 版を使う。
- Q: A3 で cakephp2/views.js の walk() も置換するか？
  - A: 独自ロジック（prefix 構築）があるため除外。

## User Confirmation
- [x] User approved this spec
- Confirmed at:
- Notes:

## Requirements
- 全ての変更は振る舞いを変えないリファクタリングであること
- 既存テストが全て PASS すること
- ES modules のインポートパスが正しく解決されること

## Acceptance Criteria
- [x] A1: laravel/symfony の camelToSnake/pluralize がローカル定義でなく scanner.js からの import になっている
- [x] A2: parseComposer/parseEnv* が presets/lib/composer-utils.js に抽出されている
- [x] A3: laravel/symfony の walk() が scanner.js の findFiles() に置換されている
- [x] A4: ブロックディレクティブ置換が replaceBlockDirective() に共通化されている
- [x] A6: mapWithConcurrency が共通モジュールにあり forge.js でも使われている
- [x] 全既存テストが PASS する

## Open Questions
- [x] A2 の共通モジュール配置先は？ → `src/presets/lib/composer-utils.js`
