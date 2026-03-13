# Feature Specification: 047-guardrail-preset-templates

**Feature Branch**: `feature/047-guardrail-preset-templates`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User request

## Goal
各プリセットに guardrail テンプレートを追加し、gate の AI コンプライアンスチェックで spec 単位の条項免除（Guardrail Exemptions）をサポートする。

## Scope
- base テンプレートに条項追加（No Hardcoded Secrets, No Silent Error Swallowing）
- webapp テンプレート新規作成（5条項）
- cakephp2 / laravel / symfony テンプレート新規作成（各4条項）
- cli テンプレート新規作成（3条項）
- node-cli テンプレート新規作成（2条項）
- library テンプレート新規作成（2条項）
- gate の Guardrail Exemptions 機能
- en/ja 両言語

## Out of Scope
- guardrail update（AI 提案）の変更
- gate の静的チェックロジックの変更
- 性能テスト（評価用 spec による手動テストは前 spec で完了済み）

## Clarifications (Q&A)
- Q: 条項免除はどのレベルで制御するか？
  - A: spec 単位。spec.md に `## Guardrail Exemptions` セクションを設け、理由付きで条項名を列挙する。AI チェック時にプロンプトで免除を考慮させる。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-13
- Notes: 実装へ進む

## Requirements

### R1: base テンプレート条項追加
When `guardrail init` を実行した時、base テンプレートは以下の5条項を含むこと：
1. Single Responsibility（既存）
2. Unambiguous Requirements（既存）
3. Complete Context（既存）
4. No Hardcoded Secrets — ソースコードに API キー・パスワード・トークン等の機密情報を直接記述してはならない
5. No Silent Error Swallowing — 空の catch ブロックやエラーを握りつぶす実装を禁止する

### R2: webapp テンプレート新規作成
When type が webapp 系の場合、以下の5条項が追加されること：
1. Security Impact Disclosure — 認証・認可・入力バリデーションに影響する変更はセキュリティ影響を明記
2. Migration Required for Schema Changes — DB スキーマ変更にはマイグレーション手順を含める
3. Input Sanitization Required — ユーザー入力を扱う変更は SQLi / XSS / パストラバーサル等の対策方針を明記
4. No Reinventing Framework Features — FW が提供する機能がある場合、独自実装してはならない
5. No Sensitive Data in Logs — ログにパスワード・トークン・個人情報を出力してはならない

### R3: cakephp2 テンプレート新規作成
When type が cakephp2 の場合、以下の4条項が追加されること：
1. No Raw SQL Without Sanitization — `query()` 使用時はプレースホルダ必須
2. Fat Model, Skinny Controller — ビジネスロジックは Model に置く
3. Validate Before Save — バリデーションなしの `save()` を禁止
4. No Direct Session Manipulation — `$_SESSION` 直接操作を禁止、`CakeSession` を使用

### R4: laravel テンプレート新規作成
When type が laravel の場合、以下の4条項が追加されること：
1. Use Eloquent or Query Builder — `DB::raw()` 使用時はバインディング必須
2. No Business Logic in Controllers — Service / Action クラスに分離
3. Use Form Request Validation — FormRequest クラスを使用
4. No Unguarded Mass Assignment — `$guarded` または `$fillable` を定義

### R5: symfony テンプレート新規作成
When type が symfony の場合、以下の4条項が追加されること：
1. Use Parameterized Queries — DQL / QueryBuilder でパラメータバインディング必須
2. Service Layer Separation — ビジネスロジックは Service に置く
3. Use Voter for Authorization — 認可ロジックは Voter に集約
4. Use DTO for External Input — 外部入力は DTO + Validator で受ける

### R6: cli テンプレート新規作成
When type が cli 系の場合、以下の3条項が追加されること：
1. Backward-Compatible CLI Interface — 既存コマンド・オプションの削除や意味変更には移行手順を含める
2. Exit Code Contract — エラー時に exit 0 を返してはならない
3. Destructive Operations Require Confirmation — 破壊的操作は `--force` または確認を要求

### R7: node-cli テンプレート新規作成
When type が node-cli の場合、以下の2条項が追加されること：
1. No Synchronous I/O in Hot Paths — ループ内での同期 I/O を禁止
2. Validate User Input at Entry Point — CLI 引数・stdin はエントリポイントでバリデーション

### R8: library テンプレート新規作成
When type が library の場合、以下の2条項が追加されること：
1. Public API Stability — 公開 API の変更は破壊的変更の有無と影響範囲を明記
2. No Unnecessary Dependencies — 外部依存の追加はその必要性を正当化

### R9: Guardrail Exemptions 機能
When spec に `## Guardrail Exemptions` セクションがあり条項名と理由が記載されている場合、gate の AI チェックで該当条項を免除として扱うこと。

## Acceptance Criteria
- [ ] base テンプレートが en/ja で5条項を含む
- [ ] webapp テンプレートが en/ja で5条項を含む
- [ ] cakephp2 テンプレートが en/ja で4条項を含む
- [ ] laravel テンプレートが en/ja で4条項を含む
- [ ] symfony テンプレートが en/ja で4条項を含む
- [ ] cli テンプレートが en/ja で3条項を含む
- [ ] node-cli テンプレートが en/ja で2条項を含む
- [ ] library テンプレートが en/ja で2条項を含む
- [ ] テンプレートマージで base + arch + leaf の条項が正しく結合される
- [ ] Guardrail Exemptions に記載された条項が AI チェックで免除される
- [ ] 既存テストが全て PASS する

## Open Questions
None.
