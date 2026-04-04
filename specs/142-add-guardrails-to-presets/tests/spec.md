# Test Design

### Test Design

---

#### R0: VALID_PHASES に "review" を追加

- **TC-01: "review" が VALID_PHASES に含まれる**
  - Type: unit
  - Input: `import { VALID_PHASES } from "src/flow/lib/phases.js"`
  - Expected: `VALID_PHASES.includes("review")` が `true`

- **TC-02: 既存フェーズが全て保持されている**
  - Type: unit
  - Input: `VALID_PHASES` を取得
  - Expected: `["draft", "spec", "gate", "impl", "test", "lint", "review"]` の全要素が含まれ、長さが 7

- **TC-03: VALID_PHASES が freeze されている**
  - Type: unit
  - Input: `Object.isFrozen(VALID_PHASES)`
  - Expected: `true`（既存の freeze が維持されている）

- **TC-04: `flow get guardrail review` がバリデーションエラーにならない**
  - Type: integration
  - Input: フロー状態をセットアップし `flow run` で review フェーズの guardrail を取得
  - Expected: エラーなく review フェーズの guardrail 一覧が返る

---

#### R1: webapp guardrail.json に 6 件追加

- **TC-05: webapp/en guardrail.json に 6 件の新規 guardrail が存在する**
  - Type: unit
  - Input: `src/presets/webapp/templates/en/guardrail.json` を読み込み
  - Expected: `guardrails` 配列に `authorization-flow-in-spec`, `queue-design-for-heavy-processing`, `cache-invalidation-strategy`, `no-queries-in-view-templates`, `detect-n-plus-one-queries`, `detect-missing-index-on-foreign-keys` の 6 ID が含まれる

- **TC-06: webapp/ja guardrail.json に同一 6 件の guardrail が存在する（R6）**
  - Type: unit
  - Input: `src/presets/webapp/templates/ja/guardrail.json` を読み込み
  - Expected: en と同一の 6 ID が含まれ、title/body が日本語

- **TC-07: en/ja で guardrail ID の集合が一致する**
  - Type: unit
  - Input: en と ja の guardrail.json を読み込み、ID を Set 比較
  - Expected: 両者が完全一致

- **TC-08: 既存の webapp guardrail が保持されている**
  - Type: unit
  - Input: webapp/en guardrail.json の guardrails 配列
  - Expected: 変更前に存在した guardrail ID が全て残っている（既存 8 件 + 新規 6 件 = 14 件）

- **TC-09: 各 guardrail の phase が VALID_PHASES の範囲内**
  - Type: unit
  - Input: 新規 6 件の `meta.phase` 配列
  - Expected: 全要素が `VALID_PHASES` に含まれる

- **TC-10: phase 割り当てが仕様通り**
  - Type: unit
  - Input: 新規 6 件の `meta.phase`
  - Expected:
    - `authorization-flow-in-spec` → `["spec"]`
    - `queue-design-for-heavy-processing` → `["spec"]`
    - `cache-invalidation-strategy` → `["spec"]`
    - `no-queries-in-view-templates` → `["impl", "review"]`
    - `detect-n-plus-one-queries` → `["review"]`
    - `detect-missing-index-on-foreign-keys` → `["review"]`

- **TC-11: webapp guardrail に FW 固有用語が含まれない**
  - Type: unit
  - Input: 新規 6 件の title + body を結合した文字列
  - Expected: `Eloquent`, `Laravel`, `Symfony`, `CakePHP`, `ActiveRecord` 等の FW 固有語が含まれない

- **TC-12: filterByPhase("review") で webapp の review guardrail が返る**
  - Type: integration
  - Input: webapp の全 guardrail を `filterByPhase(guardrails, "review")` に渡す
  - Expected: `no-queries-in-view-templates`, `detect-n-plus-one-queries`, `detect-missing-index-on-foreign-keys` の 3 件が返る

- **TC-13: filterByPhase("spec") で webapp の spec guardrail が返る**
  - Type: integration
  - Input: webapp の全 guardrail を `filterByPhase(guardrails, "spec")` に渡す
  - Expected: 新規 3 件（`authorization-flow-in-spec`, `queue-design-for-heavy-processing`, `cache-invalidation-strategy`）+ 既存 spec フェーズ guardrail が返る

---

#### R2: php-webapp guardrail.json を新規作成

- **TC-14: php-webapp/en guardrail.json が存在し 1 件含む**
  - Type: unit
  - Input: `src/presets/php-webapp/templates/en/guardrail.json` を読み込み
  - Expected: `guardrails` 配列に `use-language-enum-for-fixed-values` が 1 件存在

- **TC-15: php-webapp/ja guardrail.json が存在し同一 ID を含む**
  - Type: unit
  - Input: `src/presets/php-webapp/templates/ja/guardrail.json` を読み込み
  - Expected: `use-language-enum-for-fixed-values` が 1 件存在し、title/body が日本語

- **TC-16: php-webapp guardrail の phase が `["impl"]`**
  - Type: unit
  - Input: `use-language-enum-for-fixed-values` の `meta.phase`
  - Expected: `["impl"]`

- **TC-17: readWithFallback がテンプレートのみの php-webapp ディレクトリで正しく動作する**
  - Type: integration
  - Input: `readWithFallback(phpWebappPresetDir, "en")` を呼び出し
  - Expected: guardrail.json が正しく読み込まれ null でない結果が返る

- **TC-18: readWithFallback の言語フォールバック（php-webapp で ja → en）**
  - Type: integration
  - Input: ja の guardrail.json が存在する状態で `readWithFallback(dir, "ja")` を呼び出し
  - Expected: ja 版が返る。ja を削除した場合は en にフォールバック

- **TC-19: php-webapp プリセットチェーン（php-webapp → webapp → base）で guardrail がマージされる**
  - Type: integration
  - Input: `loadPresetGuardrails("php-webapp", "en")` を呼び出し
  - Expected: php-webapp 固有 1 件 + webapp の guardrail + base の guardrail が全てマージされている

---

#### R3: laravel guardrail.json に 6 件追加

- **TC-20: laravel/en guardrail.json に 6 件の新規 guardrail が存在する**
  - Type: unit
  - Input: `src/presets/laravel/templates/en/guardrail.json` を読み込み
  - Expected: `eager-loading-strategy-required`, `enable-prevent-lazy-loading`, `use-query-scopes-for-reusable-conditions`, `use-enum-casting-in-eloquent`, `use-factory-for-test-data`, `invokeable-controller-for-single-action` の 6 ID

- **TC-21: laravel/ja guardrail.json に同一 6 件が日本語で存在する（R6）**
  - Type: unit
  - Input: laravel/ja の guardrail.json を読み込み
  - Expected: en と同一の 6 ID、title/body が日本語

- **TC-22: laravel の phase 割り当てが仕様通り**
  - Type: unit
  - Input: 新規 6 件の `meta.phase`
  - Expected:
    - `eager-loading-strategy-required` → `["spec"]`
    - `enable-prevent-lazy-loading` → `["impl"]`
    - `use-query-scopes-for-reusable-conditions` → `["impl"]`
    - `use-enum-casting-in-eloquent` → `["impl"]`
    - `use-factory-for-test-data` → `["impl"]`
    - `invokeable-controller-for-single-action` → `["impl"]`

- **TC-23: 既存の laravel guardrail が保持されている**
  - Type: unit
  - Input: laravel/en guardrail.json の guardrails 配列
  - Expected: 変更前に存在した guardrail ID が全て残っている

- **TC-24: laravel プリセットチェーンで guardrail が正しくマージされる**
  - Type: integration
  - Input: `loadPresetGuardrails("laravel", "en")` を呼び出し
  - Expected: laravel 固有 + php-webapp の `use-language-enum-for-fixed-values` + webapp の guardrail + base の guardrail が全てマージ

- **TC-25: laravel の body に Laravel 固有用語（Eloquent, with(), Model:: 等）が含まれる**
  - Type: unit
  - Input: laravel 固有 guardrail の body
  - Expected: Eloquent, `with()/load()`, `Model::preventLazyLoading()` 等の Laravel 固有用語が適切に含まれている（webapp と違い FW 固有で正しい）

---

#### R4: laravel 既存 guardrail の文言調整

- **TC-26: no-unguarded-mass-assignment の phase が `["impl", "review"]` に変更されている**
  - Type: unit
  - Input: laravel/en の `no-unguarded-mass-assignment` の `meta.phase`
  - Expected: `["impl", "review"]`

- **TC-27: no-unguarded-mass-assignment の body にマイグレーション関連の文言が追記されている**
  - Type: unit
  - Input: laravel/en の `no-unguarded-mass-assignment` の `body`
  - Expected: `"$fillable"` および `"$guarded"` と `"migration"` を含む文言が追記されている

- **TC-28: ja 版も同様に phase と body が更新されている（R6）**
  - Type: unit
  - Input: laravel/ja の `no-unguarded-mass-assignment`
  - Expected: phase が `["impl", "review"]`、body にマイグレーション関連の日本語文言が追記

- **TC-29: filterByPhase("review") で no-unguarded-mass-assignment が返る**
  - Type: integration
  - Input: laravel の全 guardrail を `filterByPhase(guardrails, "review")` に渡す
  - Expected: 結果に `no-unguarded-mass-assignment` が含まれる（+ 継承元 webapp の review guardrail も含まれる）

---

#### R5: NOTICE ファイルの作成

- **TC-30: webapp/NOTICE が存在し正しいフォーマット**
  - Type: unit
  - Input: `src/presets/webapp/NOTICE` を読み込み
  - Expected: ヘッダー行 `"This preset contains guardrail articles inspired by the following sources."` で始まり、`---` 区切りで 4 ブロック存在

- **TC-31: webapp/NOTICE のライセンスグループ順序**
  - Type: unit
  - Input: NOTICE 内のブロック順序
  - Expected: CC0-1.0 グループ（PatrickJS, sanjeed5 のアルファベット順）→ MIT グループ（iSerter, VoltAgent のアルファベット順）

- **TC-32: php-webapp/NOTICE が存在し正しいフォーマット**
  - Type: unit
  - Input: `src/presets/php-webapp/NOTICE` を読み込み
  - Expected: 2 ブロック（CC0-1.0: PatrickJS → MIT: pekral）

- **TC-33: laravel/NOTICE が存在し正しいフォーマット**
  - Type: unit
  - Input: `src/presets/laravel/NOTICE` を読み込み
  - Expected: 5 ブロック（CC0-1.0: PatrickJS, sanjeed5 → MIT: AratKruglik, laravel/boost, pekral のアルファベット順）

- **TC-34: 各 NOTICE の Affected articles が実在する guardrail ID を参照している**
  - Type: integration
  - Input: NOTICE から Affected articles の ID を抽出し、対応する guardrail.json の ID と照合
  - Expected: 全ての Affected articles ID が該当プリセット（または継承元）の guardrail.json に存在する

- **TC-35: NOTICE 内の各ブロックに必須フィールドが含まれている**
  - Type: unit
  - Input: 各 NOTICE ファイルの全ブロック
  - Expected: 各ブロックに `Affected articles:`, `Original source:`, `License:` が存在

- **TC-36: License フィールドに URL が含まれている**
  - Type: unit
  - Input: 各 NOTICE の License 行
  - Expected: `License: <name> (<url>)` の形式で URL が括弧内に含まれている

---

#### R6: en/ja 両言語整合性（横断）

- **TC-37: webapp en/ja の guardrail ID 集合が一致**
  - Type: unit
  - Input: webapp の en/ja guardrail.json の ID 一覧
  - Expected: 完全一致

- **TC-38: php-webapp en/ja の guardrail ID 集合が一致**
  - Type: unit
  - Input: php-webapp の en/ja guardrail.json の ID 一覧
  - Expected: 完全一致

- **TC-39: laravel en/ja の guardrail ID 集合が一致**
  - Type: unit
  - Input: laravel の en/ja guardrail.json の ID 一覧
  - Expected: 完全一致

- **TC-40: 全プリセットで en/ja の meta.phase が ID ごとに一致**
  - Type: unit
  - Input: webapp, php-webapp, laravel 各プリセットの en/ja guardrail を ID で突合
  - Expected: 同一 ID の `meta.phase` が en と ja で完全一致

- **TC-41: ja の title/body が日本語文字を含む**
  - Type: unit
  - Input: webapp, php-webapp, laravel の ja guardrail.json の全エントリ
  - Expected: 各エントリの title または body にひらがな・カタカナ・漢字（`/[\u3040-\u9FFF]/`）が含まれる

---

#### エッジケース・境界条件

- **TC-42: guardrail.json が空の guardrails 配列の場合**
  - Type: unit
  - Input: `{ "guardrails": [] }` を持つ guardrail.json を readWithFallback で読み込み
  - Expected: null ではなく空配列として正常に返る

- **TC-43: phase が複数指定されている guardrail の filterByPhase**
  - Type: unit
  - Input: `meta.phase: ["impl", "review"]` の guardrail を `filterByPhase(gs, "impl")` と `filterByPhase(gs, "review")` 両方で呼び出し
  - Expected: 両方のフィルタ結果に含まれる

- **TC-44: guardrail ID の重複がない**
  - Type: unit
  - Input: 各プリセット（webapp, php-webapp, laravel）の guardrail.json
  - Expected: 同一ファイル内に同一 ID が 2 回以上出現しない

- **TC-45: 子プリセットが親と同一 ID の guardrail を持つ場合のオーバーライド**
  - Type: integration
  - Input: laravel の `no-unguarded-mass-assignment`（R4 で変更）がチェーンマージされる
  - Expected: laravel 版が webapp/base 版をオーバーライドし、phase `["impl", "review"]` が適用される

- **TC-46: 存在しない phase で filterByPhase を呼んだ場合**
  - Type: unit
  - Input: `filterByPhase(guardrails, "nonexistent")`
  - Expected: 空配列が返る（エラーにならない）

---

#### エラーパス

- **TC-47: guardrail.json の JSON が不正な場合**
  - Type: unit
  - Input: 構文エラーのある JSON ファイルを readWithFallback で読み込み
  - Expected: パースエラーが throw される（静かに無視されない）

- **TC-48: templates ディレクトリのみ存在し guardrail.json がない場合**
  - Type: unit
  - Input: `templates/en/` ディレクトリが存在するが guardrail.json がないプリセット
  - Expected: readWithFallback が `null` を返す

---

#### 受け入れテスト

- **TC-49: laravel プリセットで flow get guardrail review を実行**
  - Type: acceptance
  - Input: laravel プリセットを設定した環境で `sdd-forge flow run gate` 相当の処理を実行し review フェーズ guardrail を取得
  - Expected: webapp 継承分（`no-queries-in-view-templates`, `detect-n-plus-one-queries`, `detect-missing-index-on-foreign-keys`）+ laravel 固有分（`no-unguarded-mass-assignment`）が review フェーズとして出力される

- **TC-50: php-webapp プリセットで全フェーズ guardrail が親チェーンから正しく集約される**
  - Type: acceptance
  - Input: php-webapp プリセットの全 guardrail を取得
  - Expected: base guardrail + webapp guardrail（14 件）+ php-webapp 固有（1 件）が全て含まれ、ID 重複なし

---

### Summary

| Type | Count |
|------|-------|
| Unit | 36 |
| Integration | 10 |
| Acceptance | 2 |
| **Total** | **48** |

**カバレッジの注目点:**
- **R0** は R1/R3/R4 の前提条件のため、TC-04 で integration レベルで動作確認
- **R2** は新規ディレクトリ作成を伴うため、`readWithFallback` のパス探索を重点的にテスト（TC-17〜19）
- **R4** はオーバーライドの挙動が重要なため、チェーンマージのテスト（TC-45）を含む
- **R5** はファイルフォーマットの検証が主体のため unit テスト中心。Affected articles の実在確認（TC-34）を integration で補完
- **R6** は各 R1〜R4 のテスト内に組み込みつつ、TC-37〜41 で横断的に検証
