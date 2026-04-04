# Test Design

### Test Design

---

#### R0: VALID_PHASES に "review" を追加

- **TC-01: "review" が VALID_PHASES に含まれる**
  - Type: unit
  - Input: `VALID_PHASES` 配列を参照
  - Expected: `VALID_PHASES.includes("review")` が `true`

- **TC-02: VALID_PHASES の要素数が 7 である**
  - Type: unit
  - Input: `VALID_PHASES.length`
  - Expected: `7`（draft, spec, gate, impl, test, lint, review）

- **TC-03: VALID_PHASES の順序が正しい**
  - Type: unit
  - Input: `VALID_PHASES` 配列
  - Expected: `["draft", "spec", "gate", "impl", "test", "lint", "review"]` と厳密一致

- **TC-04: VALID_PHASES が freeze されている**
  - Type: unit
  - Input: `Object.isFrozen(VALID_PHASES)`
  - Expected: `true`

- **TC-05: `flow get guardrail review` がバリデーションを通過する**
  - Type: integration
  - Input: `sdd-forge flow get guardrail review` を実行（guardrail が存在するプロジェクトで）
  - Expected: エラーなく結果を返す（review フェーズの guardrail が 0 件以上）

- **TC-06: 無効なフェーズ名はバリデーションエラーになる**
  - Type: unit
  - Input: `GetGuardrailCommand.execute({ phase: "invalid" })`
  - Expected: `unknown phase 'invalid'. valid: draft, spec, gate, impl, test, lint, review` エラー

---

#### R1: webapp guardrail.json に 6 件追加

- **TC-07: webapp/en guardrail.json に新規 6 件の ID が存在する**
  - Type: unit
  - Input: `src/presets/webapp/templates/en/guardrail.json` をパース
  - Expected: `authorization-flow-in-spec`, `queue-design-for-heavy-processing`, `cache-invalidation-strategy`, `no-queries-in-view-templates`, `detect-n-plus-one-queries`, `detect-missing-index-on-foreign-keys` の 6 ID がすべて存在

- **TC-08: 各 guardrail の phase が仕様通りである（en）**
  - Type: unit
  - Input: webapp/en の各 guardrail の `meta.phase`
  - Expected:
    - `authorization-flow-in-spec` → `["spec"]`
    - `queue-design-for-heavy-processing` → `["spec"]`
    - `cache-invalidation-strategy` → `["spec"]`
    - `no-queries-in-view-templates` → `["impl", "review"]`
    - `detect-n-plus-one-queries` → `["review"]`
    - `detect-missing-index-on-foreign-keys` → `["review"]`

- **TC-09: webapp/en guardrail.json の合計件数が正しい**
  - Type: unit
  - Input: webapp/en の guardrails 配列長
  - Expected: 既存 8 件 + 新規 6 件 = 14 件

- **TC-10: webapp の guardrail に FW 固有用語が含まれていない**
  - Type: unit
  - Input: 新規 6 件の `title` と `body` テキスト
  - Expected: "Laravel", "Rails", "Django", "Express" 等の FW 名が含まれない

- **TC-11: webapp 内で guardrail ID が重複していない**
  - Type: unit
  - Input: webapp/en の guardrails 配列から全 ID を抽出
  - Expected: ID のユニーク数 === 配列長

- **TC-12: filterByPhase で review フェーズに webapp の guardrail がフィルタされる**
  - Type: unit
  - Input: `filterByPhase(webappGuardrails, "review")`
  - Expected: `no-queries-in-view-templates`, `detect-n-plus-one-queries`, `detect-missing-index-on-foreign-keys` の 3 件が返る

- **TC-13: filterByPhase で spec フェーズに webapp の新規 guardrail がフィルタされる**
  - Type: unit
  - Input: `filterByPhase(webappGuardrails, "spec")`
  - Expected: 新規 3 件（authorization-flow-in-spec, queue-design-for-heavy-processing, cache-invalidation-strategy）を含む

- **TC-14: no-queries-in-view-templates が impl と review 両方のフェーズでヒットする**
  - Type: unit
  - Input: `filterByPhase(guardrails, "impl")` と `filterByPhase(guardrails, "review")`
  - Expected: 両方の結果に `no-queries-in-view-templates` が含まれる

---

#### R2: php-webapp guardrail.json 新規作成

- **TC-15: php-webapp/templates/en/guardrail.json が存在する**
  - Type: unit
  - Input: `fs.existsSync("src/presets/php-webapp/templates/en/guardrail.json")`
  - Expected: `true`

- **TC-16: php-webapp/templates/ja/guardrail.json が存在する**
  - Type: unit
  - Input: `fs.existsSync("src/presets/php-webapp/templates/ja/guardrail.json")`
  - Expected: `true`

- **TC-17: php-webapp/en に use-language-enum-for-fixed-values が存在し phase が impl**
  - Type: unit
  - Input: php-webapp/en/guardrail.json をパース
  - Expected: `id: "use-language-enum-for-fixed-values"`, `meta.phase: ["impl"]` のエントリが 1 件

- **TC-18: php-webapp guardrail.json の件数が 1 件**
  - Type: unit
  - Input: php-webapp/en の guardrails 配列長
  - Expected: `1`

- **TC-19: readWithFallback がテンプレートのみ（マークダウン章なし）の php-webapp ディレクトリで動作する**
  - Type: integration
  - Input: `readWithFallback(phpWebappPresetDir, "en")`
  - Expected: guardrail 1 件を含むオブジェクトを返す（null ではない）

- **TC-20: readWithFallback で php-webapp の ja を要求し、ja が存在する場合は ja を返す**
  - Type: unit
  - Input: `readWithFallback(phpWebappDir, "ja")`
  - Expected: 日本語版の guardrail を返す（en へのフォールバックではない）

- **TC-21: php-webapp guardrail.json が正しい JSON スキーマに準拠する**
  - Type: unit
  - Input: php-webapp/en/guardrail.json のパース結果
  - Expected: `{ "guardrails": [{ "id": string, "title": string, "body": string, "meta": { "phase": string[] } }] }` 構造

---

#### R3: laravel guardrail.json に 6 件追加

- **TC-22: laravel/en guardrail.json に新規 6 件の ID が存在する**
  - Type: unit
  - Input: laravel/en/guardrail.json をパース
  - Expected: `eager-loading-strategy-required`, `enable-prevent-lazy-loading`, `use-query-scopes-for-reusable-conditions`, `use-enum-casting-in-eloquent`, `use-factory-for-test-data`, `invokeable-controller-for-single-action` の 6 ID が存在

- **TC-23: 各 laravel guardrail の phase が仕様通り**
  - Type: unit
  - Input: laravel/en の各新規 guardrail の `meta.phase`
  - Expected:
    - `eager-loading-strategy-required` → `["spec"]`
    - `enable-prevent-lazy-loading` → `["impl"]`
    - `use-query-scopes-for-reusable-conditions` → `["impl"]`
    - `use-enum-casting-in-eloquent` → `["impl"]`
    - `use-factory-for-test-data` → `["impl"]`
    - `invokeable-controller-for-single-action` → `["impl"]`

- **TC-24: laravel/en guardrail.json の合計件数**
  - Type: unit
  - Input: laravel/en の guardrails 配列長
  - Expected: 既存 4 件 + 新規 6 件 = 10 件

- **TC-25: laravel 内で guardrail ID が重複していない**
  - Type: unit
  - Input: laravel/en の全 ID
  - Expected: ユニーク

---

#### R4: laravel 既存 guardrail の文言調整

- **TC-26: no-unguarded-mass-assignment の phase が `["impl", "review"]` に変更されている**
  - Type: unit
  - Input: laravel/en の `no-unguarded-mass-assignment` エントリの `meta.phase`
  - Expected: `["impl", "review"]`

- **TC-27: no-unguarded-mass-assignment の body にマイグレーション関連の追記がある**
  - Type: unit
  - Input: laravel/en の `no-unguarded-mass-assignment` の `body`
  - Expected: `"When columns are added or modified in migrations, verify that the corresponding model's $fillable or $guarded is updated accordingly."` を含む

- **TC-28: no-unguarded-mass-assignment が review フェーズでフィルタされる**
  - Type: unit
  - Input: `filterByPhase(laravelGuardrails, "review")`
  - Expected: 結果に `no-unguarded-mass-assignment` を含む

- **TC-29: no-unguarded-mass-assignment が impl フェーズでも引き続きフィルタされる**
  - Type: unit
  - Input: `filterByPhase(laravelGuardrails, "impl")`
  - Expected: 結果に `no-unguarded-mass-assignment` を含む

- **TC-30: ja 版の no-unguarded-mass-assignment も同様に phase が更新されている**
  - Type: unit
  - Input: laravel/ja の `no-unguarded-mass-assignment` の `meta.phase`
  - Expected: `["impl", "review"]`

---

#### R5: NOTICE ファイルの作成

- **TC-31: webapp/NOTICE が存在する**
  - Type: unit
  - Input: `fs.existsSync("src/presets/webapp/NOTICE")`
  - Expected: `true`

- **TC-32: php-webapp/NOTICE が存在する**
  - Type: unit
  - Input: `fs.existsSync("src/presets/php-webapp/NOTICE")`
  - Expected: `true`

- **TC-33: laravel/NOTICE が存在する**
  - Type: unit
  - Input: `fs.existsSync("src/presets/laravel/NOTICE")`
  - Expected: `true`

- **TC-34: NOTICE ファイルが所定のプリアンブルで始まる**
  - Type: unit
  - Input: 各 NOTICE ファイルの先頭行
  - Expected: `"This preset contains guardrail articles inspired by the following sources."` で始まる

- **TC-35: webapp/NOTICE に指定された 4 出典が全て記載されている**
  - Type: unit
  - Input: webapp/NOTICE のテキスト
  - Expected: `sanjeed5/awesome-cursor-rules-mdc`, `PatrickJS/awesome-cursorrules`, `iSerter/laravel-claude-agents`, `VoltAgent/awesome-claude-code-subagents` の 4 リポジトリが `Original source:` 行に存在

- **TC-36: php-webapp/NOTICE に指定された 2 出典が全て記載されている**
  - Type: unit
  - Input: php-webapp/NOTICE のテキスト
  - Expected: `pekral/cursor-rules`, `PatrickJS/awesome-cursorrules` の 2 リポジトリ

- **TC-37: laravel/NOTICE に指定された 5 出典が全て記載されている**
  - Type: unit
  - Input: laravel/NOTICE のテキスト
  - Expected: `laravel/boost`, `sanjeed5/awesome-cursor-rules-mdc`, `pekral/cursor-rules`, `PatrickJS/awesome-cursorrules`, `AratKruglik/claude-laravel` の 5 リポジトリ

- **TC-38: NOTICE の各ブロックに Affected articles が存在する**
  - Type: unit
  - Input: 各 NOTICE を `---` で分割した各ブロック（プリアンブル除く）
  - Expected: 各ブロックに `Affected articles:` セクションがあり、1 件以上の `- <guardrail-id>` がある

- **TC-39: NOTICE の Affected articles に記載された guardrail ID がそのプリセットの guardrail.json に実在する**
  - Type: integration
  - Input: 各 NOTICE から ID を抽出し、対応する guardrail.json の ID セットと照合
  - Expected: NOTICE 内の全 ID が guardrail.json に存在する（孤立した参照がない）

- **TC-40: NOTICE の各ブロックに License 行と URL が含まれる**
  - Type: unit
  - Input: 各ブロックの `License:` 行
  - Expected: `License: <name> (<url>)` 形式。URL は `http` で始まる

- **TC-41: webapp/NOTICE のライセンスグループ内でリポジトリ名がアルファベット順**
  - Type: unit
  - Input: webapp/NOTICE のブロック順序
  - Expected: CC0-1.0 グループ内で `PatrickJS/awesome-cursorrules` < `sanjeed5/awesome-cursor-rules-mdc`、MIT グループ内で `iSerter/laravel-claude-agents` < `VoltAgent/awesome-claude-code-subagents` のアルファベット順

- **TC-42: NOTICE のブロックがライセンス種別でグループ化されている**
  - Type: unit
  - Input: 各 NOTICE のブロック順
  - Expected: 同一ライセンスのブロックが連続している（ライセンス種別が交互に出現しない）

---

#### R6: en/ja 両言語の対称性

- **TC-43: webapp の en と ja で guardrail ID セットが一致する**
  - Type: unit
  - Input: webapp/en と webapp/ja の guardrails 配列から ID を抽出
  - Expected: 同一の ID セット（順序不問）

- **TC-44: php-webapp の en と ja で guardrail ID セットが一致する**
  - Type: unit
  - Input: php-webapp/en と php-webapp/ja の ID セット
  - Expected: 同一

- **TC-45: laravel の en と ja で guardrail ID セットが一致する**
  - Type: unit
  - Input: laravel/en と laravel/ja の ID セット
  - Expected: 同一

- **TC-46: en と ja で各 guardrail の phase が一致する**
  - Type: unit
  - Input: 全プリセット（webapp, php-webapp, laravel）で各 ID ごとに en/ja の `meta.phase` を比較
  - Expected: 全 ID で `meta.phase` が完全一致

- **TC-47: ja の guardrail body が日本語で記述されている**
  - Type: unit
  - Input: 新規追加された ja guardrail の `body`
  - Expected: 日本語文字（ひらがな・カタカナ・漢字）を含む

- **TC-48: en の guardrail body が英語で記述されている**
  - Type: unit
  - Input: 新規追加された en guardrail の `body`
  - Expected: 日本語文字を含まない

---

#### プリセット継承チェーンの統合テスト

- **TC-49: laravel の loadMergedGuardrails が base → webapp → php-webapp → laravel の全 guardrail をマージする**
  - Type: integration
  - Input: type=laravel のプロジェクトで `loadMergedGuardrails(root)` を実行
  - Expected: webapp の guardrail（14 件）+ php-webapp（1 件）+ laravel（10 件）+ base 分がすべてマージされ、ID 重複なく返る

- **TC-50: php-webapp の loadMergedGuardrails が webapp の guardrail を継承する**
  - Type: integration
  - Input: type=php-webapp のプロジェクトで `loadMergedGuardrails(root)` を実行
  - Expected: webapp の 14 件 + php-webapp の 1 件が含まれる

- **TC-51: laravel で review フェーズの guardrail を取得すると継承チェーン全体から集まる**
  - Type: integration
  - Input: type=laravel で `flow get guardrail review`
  - Expected: webapp 由来の 3 件（no-queries-in-view-templates, detect-n-plus-one-queries, detect-missing-index-on-foreign-keys）+ laravel 由来の 1 件（no-unguarded-mass-assignment）= 4 件

- **TC-52: 子プリセットが親の guardrail を同一 ID で上書きできる**
  - Type: integration
  - Input: 親と子で同一 ID の guardrail を定義した場合の `mergeById` 結果
  - Expected: 子の定義が優先される

---

#### エラーパス・境界条件

- **TC-53: guardrail.json が不正な JSON の場合エラーになる**
  - Type: unit
  - Input: `loadGuardrailFile()` に不正 JSON のパスを渡す
  - Expected: JSON パースエラー

- **TC-54: guardrails 配列が空の guardrail.json でも正常に処理される**
  - Type: unit
  - Input: `{ "guardrails": [] }` の guardrail.json
  - Expected: 空配列が返り、エラーにならない

- **TC-55: meta.phase が未指定の guardrail にデフォルト phase が適用される**
  - Type: unit
  - Input: `meta.phase` を省略した guardrail エントリ
  - Expected: hydrate 後に `DEFAULT_PHASE`（`["spec"]`）が適用される

- **TC-56: 存在しないプリセットで readWithFallback が null を返す**
  - Type: unit
  - Input: `readWithFallback("/nonexistent/path", "en")`
  - Expected: `null`

- **TC-57: NOTICE の Affected articles に guardrail.json に存在しない ID がない（逆方向チェック）**
  - Type: integration
  - Input: guardrail.json の全 ID のうち、NOTICE のどのブロックにも記載されていない ID
  - Expected: NOTICE は出典のある guardrail のみを記載するため、全 ID が NOTICE に載る必要はない（エラーではない）が、NOTICE 内の ID は必ず guardrail.json に実在すること（TC-39 の再確認）

---

#### テストタイプバランスまとめ

| Type | Count | Coverage |
|------|-------|----------|
| **Unit** | 42 | 静的ファイル検証、JSON スキーマ、phase マッピング、ID 一意性、言語対称性、NOTICE フォーマット |
| **Integration** | 14 | readWithFallback、プリセット継承チェーン、filterByPhase × loadMergedGuardrails、`flow get guardrail` CLI |
| **Acceptance** | 1 (TC-05) | エンドツーエンドでの `flow get guardrail review` 実行 |
