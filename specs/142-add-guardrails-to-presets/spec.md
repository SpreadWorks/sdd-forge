# Feature Specification: 142-add-guardrails-to-presets

**Feature Branch**: `feature/142-add-guardrails-to-presets`
**Created**: 2026-04-04
**Status**: Draft
**Input**: GitHub Issue #93

## Goal

Laravel プリセット継承チェーン（base → webapp → php-webapp → laravel）の guardrail を拡充し、AI によるコード生成・レビュー時の設計制約を強化する。

## Scope

- webapp の guardrail.json に新規6件追加（en/ja）
- php-webapp の guardrail.json を新規作成し1件追加（en/ja）
- laravel の guardrail.json に新規6件追加 + 既存1件の文言調整（en/ja）
- webapp / php-webapp / laravel に NOTICE ファイルを新規作成
- `src/flow/lib/phases.js` の `VALID_PHASES` に "review" を追加（R1・R3・R4 で "review" フェーズを使用するため必須）

## Out of Scope

- プロダクトコード（src/ の .js ファイル）の変更 — ただし `src/flow/lib/phases.js` への "review" 追加は Scope に含める
- 既存テストの変更
- base プリセットの guardrail 変更

## Clarifications (Q&A)

- Q: server-side-authorization に認可フロー設計の観点を追記するか？
  - A: 既存 guardrail は変更せず、authorization-flow-in-spec として別の guardrail を webapp に追加する。
- Q: no-unguarded-mass-assignment の review フェーズ追加は別 guardrail か？
  - A: 既存 guardrail の phase に review を追加し、body に追記する。
- Q: NOTICE に CC0 出典も含めるか？
  - A: 透明性のため、ライセンスに関わらず全出典を記載する。
- Q: NOTICE の分離方針は？
  - A: 各プリセットが参照した出典のみをそのプリセットの NOTICE に記載する。
- Q: "review" フェーズは VALID_PHASES に存在しないが？
  - A: `src/flow/lib/phases.js` の `VALID_PHASES` 配列に "review" を追加する。これにより `flow get guardrail review` が正しく動作する。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-04-04
- Notes: spec review による R0 追加・NOTICE フォーマット詳細化を含めて承認

## Requirements

### R0: VALID_PHASES に "review" を追加

`src/flow/lib/phases.js` の `VALID_PHASES` 配列に `"review"` を追加する。

現状: `["draft", "spec", "gate", "impl", "test", "lint"]`
変更後: `["draft", "spec", "gate", "impl", "test", "lint", "review"]`

R1・R3・R4 で "review" フェーズを持つ guardrail を追加するため、この変更がないと `flow get guardrail review` がバリデーションエラーになり、"review" フェーズの guardrail がどのフローステップからも参照されないデッドルールになる。

### R1: webapp guardrail.json に6件追加

webapp/templates/{en,ja}/guardrail.json に以下の guardrail を追加する。FW 固有の用語を使わず汎用的に記述する。

1. **authorization-flow-in-spec** (phase: spec)
   Changes involving access control shall include the authorization flow design in the spec.

2. **queue-design-for-heavy-processing** (phase: spec)
   Operations that affect response time, such as external API calls, email delivery, and file processing, shall be designed with asynchronous processing in mind. If synchronous execution is required, document the reason in the spec.

3. **cache-invalidation-strategy** (phase: spec)
   Features that introduce caching shall document the timing and method of invalidation in the spec. Designs that rely solely on TTL shall explicitly note the risk of data inconsistency.

4. **no-queries-in-view-templates** (phase: impl, review)
   Direct DB queries and lazy loading inside view templates are prohibited. Required data shall be fetched in the controller or equivalent layer beforehand.

5. **detect-n-plus-one-queries** (phase: review)
   Check for signs of N+1 queries such as relation access inside loops and dynamic relation expansion in templates. Flag missing eager loading.

6. **detect-missing-index-on-foreign-keys** (phase: review)
   Verify that indexes are defined on foreign keys and frequently queried columns added or changed in migrations or schema updates.

### R2: php-webapp guardrail.json を新規作成し1件追加

php-webapp/templates/{en,ja}/guardrail.json を新規作成し、以下を追加する。php-webapp には現在 `templates/` ディレクトリが存在しないため、`templates/en/` および `templates/ja/` ディレクトリも新規作成する。

guardrail.json のみが存在する templates ディレクトリ（マークダウン章テンプレートなし）でも `readWithFallback()` のファイル探索パスが正しく動作することを確認する。

1. **use-language-enum-for-fixed-values** (phase: impl)
   When a fixed set of values (e.g. statuses, types, categories) is used in the codebase, it shall be defined as the language's built-in Enum type. Direct comparison with string or integer literals is prohibited.

### R3: laravel guardrail.json に6件追加

laravel/templates/{en,ja}/guardrail.json に以下の guardrail を追加する。

1. **eager-loading-strategy-required** (phase: spec)
   Features that use relations shall document the eager loading policy using Eloquent's with()/load() in the spec.

2. **enable-prevent-lazy-loading** (phase: impl)
   Enable Model::preventLazyLoading() in AppServiceProvider for the development environment. Disable it in production and use logging instead.

3. **use-query-scopes-for-reusable-conditions** (phase: impl)
   Query conditions used in two or more places shall be defined as Eloquent local scopes. Duplicating WHERE clauses is prohibited.

4. **use-enum-casting-in-eloquent** (phase: impl)
   Enum-typed attributes shall use Eloquent casts to specify the Enum. Place Enums under app/Enums and declare the type explicitly in the model's $casts.

5. **use-factory-for-test-data** (phase: impl)
   Creating test data directly with Model::create() or DB::insert() in test code is prohibited. Use Factories and override only the minimum necessary attributes.

6. **invokeable-controller-for-single-action** (phase: impl)
   Endpoints that perform a single operation outside of CRUD shall be implemented as an Invokable Controller with an __invoke() method.

### R4: laravel 既存 guardrail の文言調整

no-unguarded-mass-assignment を以下の通り変更する:
- phase: `["impl"]` → `["impl", "review"]`
- body に追記: "When columns are added or modified in migrations, verify that the corresponding model's $fillable or $guarded is updated accordingly."

### R5: NOTICE ファイルの作成

各プリセットの NOTICE ファイルを src/presets/{preset}/NOTICE に作成する。

**NOTICE フォーマット:**

以下の独自フォーマットに従う。出典ごとにブロックを分け、各ブロックに Affected articles でどの guardrail がその出典に由来するかを明示する。ブロックの記載順序はライセンス種別でグループ化し、同一ライセンス内ではリポジトリ名のアルファベット順とする。

```
This preset contains guardrail articles inspired by the following sources.

---

Affected articles:
- <guardrail-id-1>
- <guardrail-id-2>

Original source: <repository-or-project-name>
License: <license-name> (<license-url>)

---

Affected articles:
- <guardrail-id-3>

Original source: <repository-or-project-name>
License: <license-name> (<license-url>)
```

各ブロックは `---` で区切り、どの guardrail がどの出典に由来するかを Affected articles で明示する。1つの guardrail が複数出典に由来する場合は、該当する全てのブロックの Affected articles に記載する。

**webapp/NOTICE の出典:**
- sanjeed5/awesome-cursor-rules-mdc (CC0-1.0)
- PatrickJS/awesome-cursorrules (CC0-1.0)
- iSerter/laravel-claude-agents (MIT)
- VoltAgent/awesome-claude-code-subagents (MIT)

**php-webapp/NOTICE の出典:**
- pekral/cursor-rules (MIT)
- PatrickJS/awesome-cursorrules (CC0-1.0)

**laravel/NOTICE の出典:**
- laravel/boost (MIT)
- sanjeed5/awesome-cursor-rules-mdc (CC0-1.0)
- pekral/cursor-rules (MIT)
- PatrickJS/awesome-cursorrules (CC0-1.0)
- AratKruglik/claude-laravel (MIT)

### R6: en/ja 両言語の guardrail.json を更新

R1〜R4 で guardrail を追加・変更する際は、en（英語）と ja（日本語）の両方の guardrail.json を更新すること。片方の言語のみの更新は禁止する。

### Requirements Priority

1. R0 (VALID_PHASES に "review" 追加) — R1・R3・R4 の前提条件
2. R1 (webapp 新規6件) — 他プリセットが継承するため最優先
3. R2 (php-webapp 新規1件) — laravel が継承するため R3 より先
4. R3 (laravel 新規6件)
5. R4 (laravel 文言調整)
6. R5 (NOTICE 作成) — guardrail 追加完了後に作成
7. R6 (en/ja 両言語) — 各 R1〜R4 実施時に同時対応

## Acceptance Criteria

1. webapp/templates/en/guardrail.json に6件の新規 guardrail が追加されている
2. webapp/templates/ja/guardrail.json に対応する日本語版が追加されている
3. php-webapp/templates/en/guardrail.json が新規作成され1件の guardrail が含まれている
4. php-webapp/templates/ja/guardrail.json が新規作成され対応する日本語版が含まれている
5. laravel/templates/en/guardrail.json に6件の新規 guardrail が追加され、no-unguarded-mass-assignment が更新されている
6. laravel/templates/ja/guardrail.json に対応する日本語版が追加・更新されている
7. webapp/NOTICE, php-webapp/NOTICE, laravel/NOTICE が作成されている
8. 全ての guardrail.json が有効な JSON である
9. `npm test` が通る（プリセット整合性テストを含む）
10. `src/flow/lib/phases.js` の `VALID_PHASES` に "review" が含まれている
11. 継承チェーン（base → webapp → php-webapp → laravel）内で guardrail ID に意図しない重複がないこと（同一 ID は子プリセットによる意図的なオーバーライドのみ許容）
12. guardrail.json のみの templates ディレクトリ（php-webapp）で `readWithFallback()` のファイル探索が正しく動作すること
13. 全ての guardrail.json 内の `meta.phase` 配列の各値が `VALID_PHASES` のサブセットであること

## Test Strategy

- `npm test` でプリセット整合性テストが通ることを確認する
- guardrail.json の JSON 構文が正しいことは `npm test` 内で自動検証される
- review フェーズの `filterByPhase` 動作確認テストを追加する（`guardrail-metadata.test.js` に review フェーズのテストケースを追加）
- プリセット整合性テスト（`preset-scan-integrity.test.js`）に、guardrail.json 内の全 phase 値が `VALID_PHASES` に含まれることを検証するテストを追加する

## Open Questions

(none)
