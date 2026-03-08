<!-- {{data: agents.sdd("")}} -->
## SDD (Spec-Driven Development)

本プロジェクトは sdd-forge による Spec-Driven Development を採用している。

### docs/ について

`docs/` はプロジェクトの設計・構造・ビジネスロジックを体系的にまとめた知識ベースである。
実装・修正時は docs を読んでプロジェクトの全体像を理解した上で作業すること。

**docs とソースコードに矛盾がある場合はソースコードを正とする。**

docs の内容は以下の 2 種類で構成される:

| 種類 | 生成元 | 説明 |
|---|---|---|
| 解析データ | `{{data}}` ディレクティブ | ソースコードから自動抽出された構造情報 |
| AI 生成テキスト | `{{text}}` ディレクティブ | AI がソースと文脈から生成した説明文 |

#### 鮮度チェック

作業開始前に docs/ 内のファイルとソースコードの更新日時を比較すること。
ソースコードの方が新しい場合、docs の情報が古い可能性がある。
必要に応じて `sdd-forge build` の実行をユーザーに提案すること。

### SDD フロー

機能追加・修正の指示を受けた場合、`/sdd-flow-start` スキルを実行すること。
スキルが利用できない環境では、以下を必ずこの順で実行すること。

1. ブランチ戦略を決定する（**spec 作成前に必ずユーザーに確認すること**）
   - worktree 内の場合は自動で `--no-branch` を付与（確認不要）
   - それ以外では以下の番号付き選択肢を提示すること:
     1. **Branch**（デフォルト）: 現在のブランチから feature ブランチを作成
     2. **Worktree**: git worktree で隔離環境を作成
     3. **Spec only**: ブランチを作成せず spec のみ
2. `sdd-forge spec --title "<機能名>"` で spec を作成（既存 spec がある場合はそれを使用）
3. 仕様要約を提示し、以下の番号付き選択肢を提示する:
   1. **実装する**: 手順 4 へ進む
   2. **仕様書を修正する**: ユーザーからフィードバックを受け取り、spec.md を修正 → 再度手順 3 へ
   3. **その他**: ユーザーの自由入力を受け付け、内容に応じて対応する
4. 承認後、`spec.md` の `## User Confirmation` を更新（`- [x] User approved this spec`）
5. `sdd-forge gate --spec specs/NNN-xxx/spec.md` でゲートチェック
6. gate が FAIL の場合、未解決事項を一問一答で解消する（この時点では実装禁止）
7. 実装
8. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`
9. `sdd-forge review`

**失敗時ポリシー:**
- gate が PASS するまで実装・編集を開始しない
- review が PASS するまで完了扱いにしない
- ユーザー確認が未承認のまま実装してはならない

### 終了処理

実装完了後は `/sdd-flow-close` スキルを実行すること。
スキルが利用できない環境では、以下の手順でユーザーに選択肢を提示すること。

**以下の番号付き選択肢を提示すること:**
1. **docs のみ**: docs 更新のみ（コミット・マージしない）
2. **commit+merge**: コミット → base ブランチにマージ → `.sdd-forge/current-spec` 削除
3. **docs+commit+merge**: docs 更新 → コミット → base ブランチにマージ → `.sdd-forge/current-spec` 削除
4. **commit+merge+branch 削除**: コミット → base ブランチにマージ → feature ブランチ削除 → `.sdd-forge/current-spec` 削除

**docs を含む選択肢（1, 3）の場合:**
1. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`（docs 更新）
2. `sdd-forge review`（品質チェック — PASS するまで繰り返す）

**コミット・マージを含む選択肢（2, 3, 4）の共通手順:**
1. `sdd-forge gate --spec specs/NNN-xxx/spec.md --phase post`（全チェック項目の確認）
2. feature ブランチでコミット
3. base ブランチにマージ（`config.flow.merge` に従う: squash / ff-only / merge）
4. `.sdd-forge/current-spec` を削除
5. （4 の場合のみ）feature ブランチを削除

### sdd-forge コマンド

| コマンド | 説明 |
|---|---|
| `sdd-forge help` | コマンド一覧表示 |
| `sdd-forge setup` | プロジェクト登録 + 設定生成 |
| `sdd-forge build` | ドキュメント一括生成（scan → init → data → text → readme） |
| `sdd-forge scan` | ソースコード解析 → analysis.json |
| `sdd-forge init` | テンプレートから docs/ を初期化 |
| `sdd-forge data` | {{data}} ディレクティブを解析データで解決 |
| `sdd-forge text --agent <name>` | {{text}} ディレクティブを AI で解決 |
| `sdd-forge readme` | README.md 自動生成 |
| `sdd-forge forge --prompt "<内容>"` | docs 反復改善 |
| `sdd-forge review` | docs 品質チェック |
| `sdd-forge changelog` | specs/ から change_log.md を生成 |
| `sdd-forge agents` | AGENTS.md を更新 |
| `sdd-forge spec --title "<名前>"` | spec 初期化（feature ブランチ + spec.md） |
| `sdd-forge gate --spec <path>` | spec ゲートチェック（`--phase pre/post`） |
| `sdd-forge flow --request "<要望>"` | SDD フロー自動実行 |

### docs/ 編集ルール

- docs/ の内容は原則としてソースコード解析から自動生成される
- `{{data}}` / `{{text}}` ディレクティブの内部は自動生成で上書きされる
- ディレクティブの外に記述した内容は上書きされない
- docs/ のファイルは `NN_name.md` の連番で管理する
- 実装・修正後は SDD フローに従って forge → review を実行すること

<!-- {{/data}} -->

<!-- {{data: agents.project("")}} -->
## Project Context

- **generated_at:** 2026-03-08 05:55:02 UTC
- **package:** `sdd-forge` v0.1.0-alpha.22
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
| 解析済みモジュール数 | 99 ファイル / 271 メソッド |

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
│   ├── docs/
│   │   ├── commands/             ← scan, init, data, text, readme, forge, review,
│   │   │                            agents, changelog, setup, default-project,
│   │   │                            upgrade, translate
│   │   ├── data/                 ← project.js, docs.js, agents.js, lang.js
│   │   └── lib/                  ← scanner, directive-parser, template-merger,
│   │                                renderers, forge-prompts, text-prompts,
│   │                                data-source, data-source-loader, resolver-factory,
│   │                                review-parser, scan-source, concurrency,
│   │                                composer-utils, php-array-parser
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
│   └── templates/                ← config.example.json, review-checklist.md,
│                                    skills/sdd-flow-start/, skills/sdd-flow-close/
├── docs/                         ← sdd-forge 自身の設計ドキュメント（npm 公開対象）
├── tests/                        ← テストファイル（*.test.js）
└── specs/                        ← SDD spec ファイル（020 件以上蓄積）
```

### コマンドルーティングアーキテクチャ（3 層ディスパッチ）

```
sdd-forge.js（エントリポイント）
  ├─ docs.js      → docs/commands/{scan,init,data,text,readme,forge,review,
  │                               agents,changelog,setup,upgrade,translate,...}.js
  ├─ spec.js      → specs/commands/{init,gate}.js
  ├─ flow.js      （DIRECT_COMMAND — サブルーティングなし）
  └─ presets-cmd.js（DIRECT_COMMAND）
```

**コマンド → ディスパッチャーマッピング:**

| サブコマンド | ディスパッチャー |
|---|---|
| `build`, `scan`, `init`, `data`, `text`, `readme`, `forge`, `review`, `changelog`, `agents`, `upgrade`, `translate`, `setup`, `default` | `docs.js` |
| `spec`, `gate` | `spec.js` |
| `flow` | `flow.js`（DIRECT_COMMAND） |
| `presets` | `presets-cmd.js`（DIRECT_COMMAND） |
| `help`, `-h`, `--help` | `help.js` |
| `-v`, `--version`, `-V` | インライン処理（package.json から読み込み） |

**プロジェクトコンテキスト解決の仕組み:**

- `--project <name>` フラグ、または `.sdd-forge/projects.json` の `default` 設定でプロジェクトを特定
- `SDD_SOURCE_ROOT`（ソースルート）/ `SDD_WORK_ROOT`（作業ルート）環境変数を通じて各コマンドに伝達
- `setup`, `default`, `help`, `presets` はプロジェクトコンテキスト解決をスキップ（`PROJECT_MGMT` セット）

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
- `systemPromptFlag`: `"--system-prompt"` または `"--system-prompt-file"`（一時ファイル書き込み対応）
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

**主要ファイルとその役割:**

| ファイル | 役割 |
|---|---|
| `.sdd-forge/config.json` | プロジェクト設定（バリデーションあり） |
| `.sdd-forge/context.json` | プロジェクトコンテキスト文字列 |
| `.sdd-forge/output/analysis.json` | `sdd-forge scan` の解析結果（フル、インデントなし） |
| `.sdd-forge/output/summary.json` | AI 向け軽量版（優先使用、なければ analysis にフォールバック） |
| `.sdd-forge/current-spec` | SDD フロー進行状態（JSON） |
| `.sdd-forge/projects.json` | 複数プロジェクト登録情報 |

#### `src/lib/cli.js` — CLI 共通ユーティリティ

| 関数 / 定数 | 説明 |
|---|---|
| `PKG_DIR` | sdd-forge パッケージの `src/` ディレクトリの絶対パス |
| `repoRoot()` | `SDD_WORK_ROOT` → `git rev-parse` → `cwd` の優先順で作業ルートを解決 |
| `sourceRoot()` | `SDD_SOURCE_ROOT` → `repoRoot()` の優先順でソースルートを解決 |
| `parseArgs()` | フラグ・オプション・エイリアス・デフォルト値に対応した汎用 CLI パーサー |
| `isInsideWorktree()` | `.git` がファイルかどうかで worktree 内を判定 |
| `getMainRepoPath()` | worktree からメインリポジトリのパスを取得 |

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
| `loadFlowState(workRoot)` | フロー状態を読み込み |
| `clearFlowState(workRoot)` | フロー状態ファイルを削除 |

#### `src/lib/presets.js` — プリセット自動探索

`src/presets/` 配下を再帰探索し、`preset.json` を持つディレクトリを自動登録。`PRESETS` 定数として全コンシューマが参照する。

| 関数 | 説明 |
|---|---|
| `PRESETS` | 全プリセット定数 |
| `presetsForArch(arch)` | 指定 arch の非アーキ層プリセット一覧 |
| `presetByLeaf(leaf)` | キー名（`"cakephp2"` 等）でプリセットを検索 |
| `buildTypeAliases()` | エイリアス → 正規 type パスのマップ生成 |

#### `src/docs/lib/` — ドキュメント生成ライブラリ群

| ファイル | 役割 |
|---|---|
| `scanner.js` | ファイル探索・PHP/JS/YAML 解析ユーティリティ |
| `directive-parser.js` | `{{data}}` / `{{text}}` / `@block` / `@extends` ディレクティブ解析 |
| `template-merger.js` | テンプレート継承（`@extends` / `@block`）の解決 |
| `data-source.js` | DataSource 基底クラス |
| `data-source-loader.js` | プリセット別 DataSource の動的ロード |
| `resolver-factory.js` | `createResolver()` ファクトリ（data コマンドで利用） |
| `forge-prompts.js` | forge / agents コマンド向けプロンプト生成・`summaryToText()` |
| `text-prompts.js` | text コマンド向けプロンプト生成 |
| `review-parser.js` | review コマンドの結果パース |
| `renderers.js` | マークダウン出力レンダリング |
| `scan-source.js` | スキャン設定ローダー |
| `concurrency.js` | ファイル並列処理ユーティリティ |
| `composer-utils.js` | Composer（PHP）向け共有ユーティリティ |
| `php-array-parser.js` | PHP 配列構文パーサー |

### プリセットシステム

`src/presets/{key}/preset.json` を自動探索して登録。アーキテクチャ層（`isArch=true`）とフレームワーク固有層に分かれる。型エイリアスは `lib/types.js` の `TYPE_ALIASES` で管理（`buildTypeAliases()` で自動生成）。

| プリセットキー | 正規 type | arch | scan 対象 / 言語 |
|---|---|---|---|
| `base` | `base` | base | —（isArch） |
| `webapp` | `webapp` | webapp | —（isArch） |
| `cli` | `cli` | cli | —（isArch） |
| `library` | `library` | library | —（isArch） |
| `cakephp2` | `webapp/cakephp2` | webapp | controllers, models, shells, routes（PHP）/ alias: `php-mvc` |
| `laravel` | `webapp/laravel` | webapp | controllers, models, shells, routes（PHP） |
| `symfony` | `webapp/symfony` | webapp | controllers, models（Entity）, shells, routes（YAML） |
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
| `<!-- PROJECT:START/END -->` | `sdd-forge scan` 解析結果から生成 | `agents.js` データソース |
| それ以外 | 手動記述（自動上書きされない） | — |

### 利用可能なコマンド

| スクリプト | コマンド |
|---|---|
| `npm run test` | `find tests -name '*.test.js' \| xargs node --test` |

### テスト構造

```
tests/
├── dispatchers.test.js
├── flow.test.js
├── help.test.js
├── package.test.js
├── docs/
│   ├── commands/         ← agents, changelog, data, default-project, forge,
│   │                        init, readme, review, scan, setup,
│   │                        text-batch, text-helpers
│   └── lib/              ← forge-prompts, review-parser, scanner
├── lib/
│   ├── agent.test.js
│   ├── cli.test.js
│   ├── config.test.js
│   ├── i18n.test.js
│   ├── process.test.js
│   ├── projects.test.js
│   └── types.test.js
├── presets/
│   ├── laravel/          ← analyzers, integration, scan
│   └── symfony/          ← analyzers, integration, scan
├── specs/
│   └── commands/         ← gate, init
└── helpers/
    ├── mock-project.js
    └── tmp-dir.js
```

### 開発上の注意事項

- **外部依存なし**: Node.js 組み込みモジュールのみ使用。依存追加は原則禁止。
- **alpha 版ポリシー**: 後方互換コードは書かない。破壊的変更を許容し、旧フォーマット・非推奨パスは削除する。
- **scan 既知課題**: `src/docs/lib/scanner.js` の `genericScan` が controllers/models/shells/routes をハードコード。`node-cli` プリセットの `modules` カテゴリが無視される問題あり（要改修）。
- **`PKG_DIR` 解決**: `docs/commands/` 配下のファイルは `../..`（2 階層上）が `src/` を指す。
- **summary.json 優先**: AI に渡す解析データは `.sdd-forge/output/summary.json` を優先し、存在しなければ `analysis.json` にフォールバック。
- **Claude CLI ハング対策**: `callAgentAsync()` では `spawn` + `stdin: "ignore"` を使用。`CLAUDECODE` 環境変数も削除する。
- **SDD テンプレートパス**: `agents-md.js` は SDD セクションテンプレートを `src/presets/base/templates/{lang}/AGENTS.sdd.md` から読み込む（指定ロケールがなければ `"en"` にフォールバック）。
- **npm リリース手順**: `npm publish --tag alpha` → `npm dist-tag add sdd-forge@<version> latest` の 2 ステップ必須（`--tag alpha` のみでは npmjs.com の表示が更新されない）。リリースはユーザーの明示的な指示がある場合のみ実行すること。
- **npm 公開対象**: `src/` と `docs/` の両方が `files` フィールドに含まれる（package.json 参照）。
<!-- {{/data}} -->

## Project Guidelines

### Commits
- Write all commit messages in English.
- Do NOT append sign-off lines or co-authored-by trailers to commit messages.

### Code style
- Do NOT add excessive fallback or defensive code. Trust internal interfaces and only validate at system boundaries (user input, external APIs). If a function is always called with valid arguments, do not add redundant null checks or try-catch blocks "just in case."
- While the version is alpha, do NOT write legacy/backward-compatibility fallback code. Breaking changes are expected — old formats and deprecated paths should be removed, not preserved.

### npm Publishing
- **リリース（`npm publish` / `npm dist-tag`）はユーザーが明示的に指示した場合のみ実行すること。自己判断でリリースしてはならない。**
- Pre-release は `npm publish --tag alpha` で公開する
- `--tag alpha` で公開すると `latest` タグは更新されない。npmjs.com のパッケージページは `latest` タグのバージョンを表示するため、ページを更新したい場合は `npm dist-tag add sdd-forge@<version> latest` を実行する
- npm は一度公開したバージョン番号の再利用を許可しない
- npm レジストリには publish のレート制限がある。短時間に連続で publish するとブロックされるため、不必要な publish を避けること
- 公開前に `npm pack --dry-run` で含まれるファイルを確認し、機密情報・固有情報がないことをチェックする
