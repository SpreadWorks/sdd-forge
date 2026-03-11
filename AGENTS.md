<!-- {{data: agents.sdd("")}} -->
## SDD (Spec-Driven Development)

本プロジェクトは sdd-forge による Spec-Driven Development を採用している。

### docs/ について

`docs/` はプロジェクトの設計・構造・ビジネスロジックを体系的にまとめた知識ベースである。
実装・修正時は docs を読んでプロジェクトの全体像を理解した上で作業すること。

**docs とソースコードに矛盾がある場合はソースコードを正とする。**

docs の内容は以下の 3 種類で構成される:

| 種類 | 生成元 | 説明 |
|---|---|---|
| 解析データ | `{{data}}` ディレクティブ | ソースコードから自動抽出された構造情報 |
| AI 生成テキスト | `{{text}}` ディレクティブ | AI がソースと文脈から生成した説明文 |
| ユーザー独自情報 | ユーザーからの情報 | ソースコードからで取得出来ない運用情報などをディレクティブ外に記述 |

#### 鮮度チェック

作業開始前に docs/ とソースコードの更新日時を比較すること。
ソースが新しい場合は `sdd-forge build` の実行をユーザーに提案すること。

### SDD フロー

機能追加・修正の指示を受けた場合、`/sdd-flow-start` スキルを実行すること。
スキルが利用できない環境では、以下を必ずこの順で実行すること。

**原則: 各ステップで次の行動を必ずユーザーに確認する。AI が勝手に次のステップに進まない。**

1. 進め方をユーザーに確認
2. ブランチ戦略をユーザーに確認
3. `sdd-forge spec --title "<機能名>"` で spec 作成（既存があればそれを使用）
4. （要件整理を選択した場合）draft フェーズ（→ AI 動作ルール参照）
5. 仕様要約を提示しユーザーに確認
6. 承認後、`spec.md` の `## User Confirmation` を更新
7. `sdd-forge gate --spec specs/NNN-xxx/spec.md`
8. gate FAIL 時は未解決事項を一問一答で解消
9. テストフェーズ（→ AI 動作ルール参照）
10. 実装
11. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`
12. `sdd-forge review`

**ユーザーに提示する選択肢:**

ステップ 1 — 進め方:
1. **要件整理**
2. **仕様書作成**

ステップ 2 — ブランチ戦略:
1. **Branch**
2. **Worktree**
3. **Spec only**

ステップ 5 — 仕様レビュー:
1. **実装する**
2. **仕様書を修正する**
3. **その他**

**AI 動作ルール:**

| ステップ | ルール |
|---|---|
| 2 | worktree 内は自動で `--no-branch`（ユーザー確認不要） |
| 4 | `specs/NNN-xxx/draft.md` に記録。1 問ずつ聞く（まとめない、自答しない）。脱線は 1 往復で解決、未解決は Open Questions へ。承認後に spec へ清書、draft.md は残す |
| 5 (修正) | フィードバック → spec.md 修正 → ステップ 5 に戻る |
| 8 | 一問一答で解消（実装禁止） |
| 9 | analysis.json からテスト環境を自動判定。あり: テスト観点提示 → ユーザー承認 → テストコード生成。なし: AI が spec と実装の照合チェック。構築が必要: 別 spec |

**失敗時ポリシー:**
- gate PASS まで実装禁止
- review PASS まで完了扱い禁止
- ユーザー未承認のまま実装禁止
- テスト観点のユーザーレビュー省略禁止（テスト環境ありの場合）

### 終了処理

実装完了後は `/sdd-flow-close` スキルを実行すること。
スキルが利用できない場合は以下の番号付き選択肢をユーザーに提示:

1. **ドキュメント更新+コミット+マージ+ブランチ削除**
2. **ドキュメント更新**
3. **コミット**
4. **コミット+マージ**
5. **コミット+マージ+ブランチ削除**

選択に応じて以下を実行する:

| 処理 | 対象の選択肢 | 手順 |
|---|---|---|
| docs 更新 | 1, 2 | `sdd-forge forge` → `sdd-forge review`（PASS まで繰り返す） |
| コミット | 1, 3, 4, 5 | `sdd-forge gate --phase post` → feature ブランチでコミット |
| マージ | 1, 4, 5 | base ブランチにマージ（`config.flow.merge`）→ `.sdd-forge/current-spec` 削除 |
| ブランチ削除 | 1, 5 | feature ブランチを削除 |

### sdd-forge コマンド

| コマンド | 説明 |
|---|---|
| `sdd-forge help` | コマンド一覧表示 |
| `sdd-forge setup` | プロジェクト登録 + 設定生成 |
| `sdd-forge build` | ドキュメント一括生成（scan → init → data → text → readme） |
| `sdd-forge scan` | ソースコード解析 → analysis.json |
| `sdd-forge init` | テンプレートから docs/ を初期化 |
| `sdd-forge data` | `{{data}}` ディレクティブを解析データで解決 |
| `sdd-forge text --agent <name>` | `{{text}}` ディレクティブを AI で解決 |
| `sdd-forge readme` | README.md 自動生成 |
| `sdd-forge forge --prompt "<内容>"` | docs 反復改善 |
| `sdd-forge review` | docs 品質チェック |
| `sdd-forge changelog` | specs/ から change_log.md を生成 |
| `sdd-forge agents` | AGENTS.md を更新 |
| `sdd-forge spec --title "<名前>"` | spec 初期化（feature ブランチ + spec.md） |
| `sdd-forge gate --spec <path>` | spec ゲートチェック（`--phase pre/post`） |
| `sdd-forge flow --request "<要望>"` | SDD フロー自動実行 |
| `sdd-forge snapshot <save\|check\|update>` | スナップショットテスト（リグレッション検出） |

### docs/ 編集ルール

- docs/ は原則としてソースコード解析から自動生成される
- `{{data}}` / `{{text}}` ディレクティブの内部は自動生成で上書きされる
- ディレクティブの外に記述した内容は上書きされない
- 章の並び順は `preset.json` の `chapters` 配列で定義される
- 実装・修正後は SDD フローに従い forge → review を実行すること

<!-- {{/data}} -->

<!-- {{data: agents.project("")}} -->
## Project Context

- **generated_at:** 2026-03-11 06:40:54 UTC
- **package:** `sdd-forge` v0.1.0-alpha.28
- **description:** Spec-Driven Development tooling for automated documentation generation
- **repository:** https://github.com/SpreadWorks/sdd-forge.git
- **license:** MIT

### 技術スタック

| 項目 | 内容 |
|---|---|
| 実行環境 | Node.js >= 18.0.0 |
| モジュール形式 | ES Modules（`"type": "module"`） |
| 外部依存 | **なし**（Node.js 組み込みモジュールのみ: `fs`, `path`, `child_process`, `os` 等） |
| プロジェクト種別 | CLI ツール（type: `cli/node-cli`） |
| テストフレームワーク | Node.js 組み込み `node --test` |
| npm 公開対象 | `src/` + `docs/` + package.json / README.md / LICENSE |
| バイナリエントリ | `sdd-forge` → `./src/sdd-forge.js` |
| 解析済みモジュール数 | 101 ファイル / 276 メソッド |

### プロジェクト構造

```
sdd-forge/
├── package.json
├── src/
│   ├── sdd-forge.js              ← CLI エントリポイント（サブコマンドルーティング）
│   ├── docs.js                   ← docs 系サブコマンドディスパッチャー
│   ├── spec.js                   ← spec 系サブコマンドディスパッチャー
│   ├── flow.js                   ← SDD フロー自動実行（DIRECT_COMMAND）
│   ├── presets-cmd.js            ← presets コマンド（DIRECT_COMMAND）
│   ├── help.js                   ← ヘルプ表示
│   ├── README.md                 ← 内部アーキテクチャ・コーディングルール（npm 同梱）
│   ├── docs/
│   │   ├── commands/             ← scan, init, data, text, readme, forge, review,
│   │   │                            agents, changelog, setup, default-project,
│   │   │                            snapshot, upgrade, translate, enrich
│   │   ├── data/                 ← project.js, docs.js, agents.js, lang.js
│   │   └── lib/                  ← scanner, directive-parser, template-merger,
│   │                                forge-prompts, text-prompts, data-source,
│   │                                data-source-loader, resolver-factory,
│   │                                review-parser, scan-source, concurrency,
│   │                                command-context, php-array-parser,
│   │                                test-env-detection
│   ├── specs/
│   │   └── commands/             ← init（spec 作成）, gate（ゲートチェック）
│   ├── lib/                      ← agent, agents-md, cli, config, entrypoint,
│   │                                flow-state, i18n, presets, process, progress,
│   │                                projects, types
│   ├── presets/
│   │   ├── base/
│   │   │   ├── preset.json
│   │   │   └── templates/        ← docs テンプレート（ja/en）
│   │   │       ├── ja/           ← overview.md, stack_and_ops.md,
│   │   │       │                    project_structure.md, development.md,
│   │   │       │                    AGENTS.sdd.md
│   │   │       └── en/           ← （同上）
│   │   ├── webapp/, cli/, library/  ← アーキ層プリセット
│   │   ├── cakephp2/, laravel/, symfony/  ← フレームワーク固有プリセット
│   │   ├── node-cli/             ← CLI プリセット
│   │   └── lib/                  ← composer-utils.js（共有ユーティリティ）
│   ├── locale/
│   │   ├── ja/                   ← messages.json, prompts.json, ui.json
│   │   └── en/                   ← （同上）
│   └── templates/                ← config.example.json, review-checklist.md,
│                                    skills/sdd-flow-start/, skills/sdd-flow-close/,
│                                    skills/sdd-flow-status/
├── docs/                         ← sdd-forge 自身の設計ドキュメント（npm 公開対象）
│   ├── 01_overview.md
│   ├── 02_cli_commands.md
│   ├── 03_configuration.md
│   ├── 04_internal_design.md
│   └── ja/                       ← 日本語版
├── tests/                        ← テストファイル（*.test.js、45 ファイル）
└── specs/                        ← SDD spec ファイル（041 件蓄積）
```

### コマンドルーティングアーキテクチャ（3 層ディスパッチ）

```
sdd-forge.js（エントリポイント）
  ├─ docs.js      → docs/commands/{scan,init,data,text,readme,forge,review,
  │                               agents,changelog,setup,snapshot,upgrade,translate,
  │                               enrich,default-project,...}.js
  ├─ spec.js      → specs/commands/{init,gate}.js
  ├─ flow.js      （DIRECT_COMMAND — サブルーティングなし）
  └─ presets-cmd.js（DIRECT_COMMAND）
```

**コマンド → ディスパッチャーマッピング:**

| サブコマンド | ディスパッチャー |
|---|---|
| `build`, `scan`, `enrich`, `init`, `data`, `text`, `readme`, `forge`, `review`, `changelog`, `agents`, `snapshot`, `upgrade`, `translate`, `setup`, `default` | `docs.js` |
| `spec`, `gate` | `spec.js` |
| `flow` | `flow.js`（DIRECT_COMMAND） |
| `presets` | `presets-cmd.js`（DIRECT_COMMAND） |
| `help`, `-h`, `--help` | `help.js` |
| `-v`, `--version`, `-V` | インライン処理（package.json から読み込み） |

**プロジェクトコンテキスト解決の仕組み:**

- `--project <name>` フラグ、または `.sdd-forge/projects.json` の `default` 設定でプロジェクトを特定
- `SDD_SOURCE_ROOT`（ソースルート）/ `SDD_WORK_ROOT`（作業ルート）環境変数を通じて各コマンドに伝達
- `setup`, `default`, `help`, `presets` はプロジェクトコンテキスト解決をスキップ（`PROJECT_MGMT` セット）

**build パイプライン:**

```
scan → enrich（★）→ init → data → text → readme → agents → [translate（多言語時のみ）]
```

> ★ `enrich` は AI が analysis.json の各エントリに `summary` / `detail` / `chapter` / `role` フィールドを一括付与する新ステップ。バッチ処理 + 再開可能。

### 主要コンポーネント

#### `src/lib/agent.js` — AI エージェント呼び出し

| 関数 | 説明 |
|---|---|
| `callAgent()` | 同期実行（`execFileSync`） |
| `callAgentAsync()` | 非同期実行（`spawn` + `stdin: "ignore"`）、ストリーミングコールバック対応 |
| `loadAgentConfig()` | SddConfig からエージェント設定を取得（未設定時はエラー） |
| `resolveAgent()` | SddConfig からエージェント設定を取得（未設定時は `null`） |
| `ensureAgentWorkDir()` | `-C <dir>` 引数のパス検証・自動作成 |

- `{{PROMPT}}` プレースホルダーで引数リストにプロンプトを注入（未使用の場合は末尾に追加）
- `systemPromptFlag`: `"--system-prompt"`（`--system-prompt-file` は**存在しない** — 削除済み）
- `CLAUDECODE` 環境変数を削除して Claude CLI のハングを防止（`stdin: "ignore"` で EOF 問題を回避）
- タイムアウト定数: `DEFAULT_AGENT_TIMEOUT_MS`=120s / `MID_AGENT_TIMEOUT_MS`=180s / `LONG_AGENT_TIMEOUT_MS`=300s

#### `src/lib/config.js` — 設定・パスユーティリティ

`.sdd-forge/` 配下のファイル管理。

| 関数 | 役割 |
|---|---|
| `sddDir(root)` | `.sdd-forge/` ディレクトリパスを返す |
| `sddConfigPath(root)` | `.sdd-forge/config.json` パスを返す |
| `sddOutputDir(root)` | `.sdd-forge/output/` パスを返す |
| `sddDataDir(root)` | `.sdd-forge/data/` パスを返す |
| `loadLang(root)` | config から `lang` を読む（失敗時は `"en"` にフォールバック） |
| `loadConfig(root)` | `config.json` を読み込みバリデーション（`validateConfig` 経由） |
| `loadContext(root)` | `context.json` を読み込む（なければ空オブジェクト） |
| `saveContext(root, data)` | `context.json` に書き込む |
| `resolveProjectContext(root)` | プロジェクトコンテキスト文字列を解決（優先順: `context.json` → `config.json` の `textFill.projectContext` → 空文字列） |
| `loadJsonFile(filePath)` | 汎用 JSON ローダー |
| `loadPackageField(root, field)` | package.json フィールドを安全に取得 |

**主要ファイルとその役割:**

| ファイル | 役割 |
|---|---|
| `.sdd-forge/config.json` | プロジェクト設定（バリデーションあり） |
| `.sdd-forge/context.json` | プロジェクトコンテキスト文字列 |
| `.sdd-forge/output/analysis.json` | `sdd-forge scan` の解析結果（フル）。enrich 後は各エントリに `summary` / `detail` / `chapter` / `role` が付与される |
| `.sdd-forge/output/summary.json` | AI 向け軽量版（廃止予定。enrich の `summary`/`detail` フィールドが役割を吸収） |
| `.sdd-forge/current-spec` | SDD フロー進行状態（JSON） |
| `.sdd-forge/projects.json` | 複数プロジェクト登録情報 |
| `.sdd-forge/snapshots/` | スナップショットテスト保存ディレクトリ |

#### `src/lib/cli.js` — CLI 共通ユーティリティ

| 関数 / 定数 | 説明 |
|---|---|
| `PKG_DIR` | sdd-forge パッケージの `src/` ディレクトリの絶対パス |
| `repoRoot()` | `SDD_WORK_ROOT` → `git rev-parse` → `cwd` の優先順で作業ルートを解決 |
| `sourceRoot()` | `SDD_SOURCE_ROOT` → `repoRoot()` の優先順でソースルートを解決 |
| `parseArgs()` | フラグ・オプション・エイリアス・デフォルト値に対応した汎用 CLI パーサー |
| `isInsideWorktree()` | `.git` がファイルかどうかで worktree 内を判定 |
| `getMainRepoPath()` | worktree からメインリポジトリのパスを取得 |
| `getPackageVersion()` | package.json から sdd-forge バージョンを返す |
| `formatUTCTimestamp()` | UTC タイムスタンプ文字列生成（`"YYYY-MM-DD HH:MM:SS UTC"` 形式） |

> `docs/commands/` 配下のファイルから `PKG_DIR` を参照する場合は `../..`（2 階層上）が `src/` を指す。

#### `src/lib/flow-state.js` — SDD フロー状態管理

`.sdd-forge/current-spec` を JSON で管理。

| フィールド | 型 | 説明 |
|---|---|---|
| `spec` | `string` | spec.md の相対パス（例: `"specs/003-xxx/spec.md"`） |
| `baseBranch` | `string` | 分岐元ブランチ名 |
| `featureBranch` | `string` | feature ブランチ名 |
| `worktree` | `boolean?` | worktree 内で作業中かどうか |
| `worktreePath` | `string?` | worktree の絶対パス |
| `mainRepoPath` | `string?` | メインリポジトリの絶対パス |

| 関数 | 説明 |
|---|---|
| `saveFlowState(workRoot, state)` | フロー状態を保存 |
| `loadFlowState(workRoot)` | フロー状態を読み込み（ファイルなければ `null`） |
| `clearFlowState(workRoot)` | フロー状態ファイルを削除 |

#### `src/lib/presets.js` — プリセット自動探索

`src/presets/` 配下を再帰探索し、`preset.json` を持つディレクトリを自動登録。`PRESETS` 定数として全コンシューマが参照する。

| 関数 | 説明 |
|---|---|
| `PRESETS` | 全プリセット定数 |
| `presetsForArch(arch)` | 指定 arch の非アーキ層プリセット一覧 |
| `presetByLeaf(leaf)` | キー名（`"cakephp2"` 等）でプリセットを検索 |
| `buildTypeAliases()` | エイリアス → 正規 type パスのマップ生成 |

#### `src/docs/commands/enrich.js` — AI エンリッチメント（新規）

analysis.json の各エントリに AI が役割情報を一括付与するコマンド。

| 項目 | 内容 |
|---|---|
| 付与フィールド | `summary`（概要）/ `detail`（詳細説明）/ `chapter`（対応章）/ `role`（役割分類） |
| 処理方式 | バッチ処理（デフォルト: 20 エントリ / 3000 行単位）+ 中断再開可能 |
| スキップ条件 | 既に enrich 済みのエントリは再実行時にスキップ |
| パイプライン位置 | `scan` の直後（`scan → enrich → init → ...`） |

#### `src/docs/lib/` — ドキュメント生成ライブラリ群

| ファイル | 役割 |
|---|---|
| `scanner.js` | ファイル探索・PHP/JS/YAML 解析ユーティリティ |
| `directive-parser.js` | `{{data}}` / `{{text}}` / `@block` / `@extends` ディレクティブ解析 |
| `template-merger.js` | テンプレート継承（`@extends` / `@block`）の解決 |
| `data-source.js` | DataSource 基底クラス（`toMarkdownTable`, `toRows`, `desc` 等） |
| `data-source-loader.js` | プリセット別 DataSource の動的ロード |
| `resolver-factory.js` | `createResolver()` ファクトリ（data コマンドで利用） |
| `forge-prompts.js` | forge / agents コマンド向けプロンプト生成・`summaryToText()` |
| `text-prompts.js` | text コマンド向けプロンプト生成 |
| `review-parser.js` | review コマンドの結果パース |
| `scan-source.js` | スキャン設定ローダー |
| `concurrency.js` | ファイル並列処理ユーティリティ |
| `command-context.js` | コマンド実行コンテキスト解決（`resolveCommandContext()`, `loadAnalysis()` など） |
| `php-array-parser.js` | PHP 配列構文パーサー |
| `test-env-detection.js` | テスト環境自動判定（analysis.json から判定）。対応フレームワーク: jest / mocha / vitest / ava / tap / jasmine / node:test / phpunit / pest |

#### `src/docs/commands/snapshot.js` — スナップショットテスト

リグレッション検出用のスナップショット保存・比較コマンド。

| サブコマンド | 説明 |
|---|---|
| `sdd-forge snapshot save` | 現在の出力をスナップショットとして保存 |
| `sdd-forge snapshot check` | 現在の出力とスナップショットを比較 |
| `sdd-forge snapshot update` | スナップショットを現在の出力で更新 |

キャプチャ対象: `.sdd-forge/output/analysis.json`、`docs/*.md`、`docs/{lang}/*.md`、`README.md`
保存先: `.sdd-forge/snapshots/`（manifest.json を含む）

### プリセットシステム

`src/presets/{key}/preset.json` を自動探索して登録。アーキテクチャ層（`isArch=true`）とフレームワーク固有層に分かれる。型エイリアスは `lib/types.js` の `TYPE_ALIASES` で管理（`buildTypeAliases()` で自動生成）。

| プリセットキー | 正規 type | arch | scan 対象 / 言語 |
|---|---|---|---|
| `base` | `base` | base | —（isArch） |
| `webapp` | `webapp` | webapp | —（isArch） |
| `cli` | `cli` | cli | —（isArch） |
| `library` | `library` | library | —（isArch） |
| `cakephp2` | `webapp/cakephp2` | webapp | controllers, models, shells, routes（PHP）/ alias: `php-mvc` |
| `laravel` | `webapp/laravel` | webapp | controllers, models, shells, routes, migrations（PHP） |
| `symfony` | `webapp/symfony` | webapp | controllers, entities, routes, migrations, config（PHP, YAML） |
| `node-cli` | `cli/node-cli` | cli | modules（`src/**/*.js`） |

**node-cli プリセット章構成（preset.json より）:**
`overview.md`, `cli_commands.md`, `configuration.md`, `internal_design.md`, `development_testing.md`

### `.sdd-forge/config.json` スキーマ

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `output.languages` | ✅ | `string[]` | 出力言語リスト（例: `["ja"]`, `["en", "ja"]`） |
| `output.default` | ✅ | `string` | デフォルト出力言語 |
| `output.mode` | — | `"translate"` \| `"generate"` | 非デフォルト言語の生成方法（デフォルト: `translate`） |
| `lang` | ✅ | `string` | CLI / AGENTS.md / スキル / spec の動作言語 |
| `type` | ✅ | `string` | プロジェクトタイプ（例: `"webapp/cakephp2"`, `"cli/node-cli"`） |
| `uiLang` | — | `"en"` \| `"ja"` | UI 言語 |
| `documentStyle.purpose` | — | `string` | ドキュメント目的 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | 文体 |
| `documentStyle.customInstruction` | — | `string` | AI への追加指示 |
| `textFill.projectContext` | — | `string` | プロジェクト概要（AI 生成の補助情報） |
| `textFill.preamblePatterns` | — | `object[]` | LLM 出力から除去するプレフィックスパターン |
| `defaultAgent` | — | `string` | デフォルト AI エージェント名 |
| `providers` | — | `object` | AI エージェント定義マップ（`command`, `args`, `timeoutMs`, `systemPromptFlag`） |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | マージ戦略（デフォルト: `squash`） |
| `limits.concurrency` | — | `number` | ファイル並列処理数（デフォルト: 5） |
| `limits.designTimeoutMs` | — | `number` | タイムアウト（ms） |

### `.sdd-forge/projects.json` スキーマ

複数プロジェクトを sdd-forge ツール本体から管理する場合に使用。`setup` コマンドで生成される。

```json
{
  "default": "myproject",
  "projects": {
    "myproject": {
      "path": "/absolute/path/to/source",
      "workRoot": "/absolute/path/to/work"
    }
  }
}
```

> `workRoot` を省略した場合は `path` と同じ値が使われる。

### AGENTS.md 構造

AGENTS.md は 3 セクション構成で管理される。`CLAUDE.md` は `AGENTS.md` へのシンボリックリンク。

| セクション | 管理方法 | テンプレート |
|---|---|---|
| `<!-- SDD:START/END -->` | `sdd-forge agents` で自動差し替え | `src/presets/base/templates/{lang}/AGENTS.sdd.md` |
| `<!-- PROJECT:START/END -->` | `sdd-forge agents` で生成・AI 精査 | `agents.js` データソース（analysis.json から生成） |
| それ以外 | 手動記述（自動上書きされない） | — |

**`sdd-forge agents` コマンドオプション:**

| オプション | 説明 |
|---|---|
| `--sdd` | SDD セクションのみ更新 |
| `--project` | PROJECT セクションのみ更新 |
| `--dry-run` | ファイル書き込みをせず内容を確認 |

### 利用可能なコマンド

| スクリプト | コマンド |
|---|---|
| `npm run test` | `find tests -name '*.test.js' \| xargs node --test` |

### テスト構造

```
tests/                            ← 45 ファイル
├── dispatchers.test.js
├── flow.test.js
├── help.test.js
├── package.test.js
├── docs/
│   ├── commands/                 ← agents, changelog, data, default-project, enrich,
│   │                                forge, forge-selective, init, readme, review,
│   │                                scan, setup, snapshot, text-batch
│   ├── data/                     ← docs-lang-switcher
│   └── lib/                      ← command-context, directive-parser, forge-prompts,
│                                    resolver-factory, review-parser, scanner,
│                                    template-merger, test-env-detection, text-prompts
├── lib/
│   ├── agent.test.js
│   ├── cli.test.js
│   ├── config.test.js
│   ├── i18n.test.js
│   ├── process.test.js
│   ├── projects.test.js
│   └── types.test.js
├── presets/
│   ├── laravel/                  ← analyzers, integration, scan
│   └── symfony/                  ← analyzers, integration, scan
├── specs/
│   └── commands/                 ← gate, init
└── helpers/
    ├── mock-project.js
    └── tmp-dir.js
```

### 開発上の注意事項

- **外部依存なし**: Node.js 組み込みモジュールのみ使用。依存追加は原則禁止。
- **alpha 版ポリシー**: 後方互換コードは書かない。破壊的変更を許容し、旧フォーマット・非推奨パスは削除する。
- **`PKG_DIR` 解決**: `docs/commands/` 配下のファイルは `../..`（2 階層上）が `src/` を指す。
- **summary.json 廃止予定**: enrich 導入後は `analysis.json` の各エントリ内 `summary`/`detail` フィールドが役割を吸収。`summaryToText()`（`src/docs/lib/forge-prompts.js`）は enrich 導入後に見直し。
- **`--system-prompt-file` は存在しない**: Claude CLI にこのオプションはない（過去に誤追加→削除済み）。長い system prompt を `--system-prompt` 引数で渡すと OS の ARG_MAX 制限でエラーになる問題は未解決。
- **Claude CLI ハング対策**: `callAgentAsync()` では `spawn` + `stdin: "ignore"` を使用。`CLAUDECODE` 環境変数も削除する。
- **SDD テンプレートパス**: `agents-md.js` は SDD セクションテンプレートを `src/presets/base/templates/{lang}/AGENTS.sdd.md` から読み込む（指定ロケールがなければ `"en"` にフォールバック）。
- **npm リリース手順**: `npm publish --tag alpha` → `npm dist-tag add sdd-forge@<version> latest` の 2 ステップ必須（`--tag alpha` のみでは npmjs.com の表示が更新されない）。リリースはユーザーの明示的な指示がある場合のみ実行すること。
- **npm 公開対象**: `src/` と `docs/` の両方が `files` フィールドに含まれる（package.json 参照）。
- **テスト環境検出**: `src/docs/lib/test-env-detection.js` が analysis.json を解析してテストフレームワークを自動判定。対応フレームワーク: jest / mocha / vitest / ava / tap / jasmine / node:test（JS）、phpunit / pest（PHP）。
- **enrich バッチ再開**: `enrich.js` は途中で中断しても再実行時に既処理エントリをスキップして継続できる。
<!-- {{/data}} -->

## 設計思想

sdd-forge は**コードとドキュメントの同期エンジン**である。

1. **構成の安定性** — `{{text}}` ディレクティブが「どこに何を書くか」を定義し、AI はその枠内で書く。AI に段落構成を任せない。
2. **差分更新** — コード変更時に影響する章だけを再生成する。全体再生成ではなく部分的な再実行。
3. **ソースコードの中身を AI に渡す** — メタデータだけでなくソースコード本体を参照して意味のあるドキュメントを生成する。
4. **docs は AI の行動制約** — AGENTS.md に反映された docs は、AI が既存設計から逸脱しないガードレールとして機能する。
5. **テンプレートは知識体系の定義** — プリセットが「何を知る必要があるか」を定義する。

## プロジェクトルール

### コミット
- コミットメッセージは英語で書く
- sign-off 行や co-authored-by トレーラーを付けない

### テスト
- **MUST: テストはスクリプトが正しく動作するかを検証するために存在する。テストを通すためにテストコードを修正してはならない。** テストが失敗した場合、まずテストのシナリオが妥当かを確認し、妥当であればプロダクトコードを修正する。セットアップの変更は実際の利用条件の変化に基づく場合のみ許可する。

### コードスタイル
- 過剰な防御コードを書かない。内部インターフェースは信頼し、バリデーションはシステム境界（ユーザー入力、外部 API）でのみ行う。
- alpha 版では後方互換コードを書かない。旧フォーマット・非推奨パスは保持せず削除する。

### npm 公開
- **MUST: `npm publish` / `npm dist-tag` はユーザーがリリースの意図を明示した場合のみ実行する。バージョン上げ・コミット・push の指示はリリース指示ではない。**
- pre-release は `npm publish --tag alpha` で公開する
- `latest` タグ更新が必要な場合は `npm dist-tag add sdd-forge@<version> latest` を実行する
- npm は公開済みバージョン番号の再利用を許可しない
- 公開前に `npm pack --dry-run` で機密情報がないことを確認する
