<!-- SDD:START — managed by sdd-forge. Do not edit manually. -->
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
| 手動記述 | `MANUAL` ブロック | 人間が記述した運用手順・業務背景・外部仕様 |

#### 鮮度チェック

作業開始前に docs/ 内のファイルとソースコードの更新日時を比較すること。
ソースコードの方が新しい場合、docs の情報が古い可能性がある。
必要に応じて `sdd-forge build` の実行をユーザーに提案すること。

### SDD フロー

機能追加・修正の指示を受けた場合、`/sdd-flow-start` スキルを実行すること。
スキルが利用できない環境では、以下を必ずこの順で実行すること。

1. ブランチ戦略を決定する（**spec 作成前に必ずユーザーに確認すること**）
   - worktree 内の場合は自動で `--no-branch` を付与（確認不要）
   - それ以外では以下の選択肢を提示すること:
     - **Branch**（デフォルト）: 現在のブランチから feature ブランチを作成 → `sdd-forge spec --title "..."`
     - **Worktree**: git worktree で隔離環境を作成 → `sdd-forge spec --title "..." --worktree <path>`
     - **Spec only**: ブランチを作成せず spec のみ → `sdd-forge spec --title "..." --no-branch`
2. `sdd-forge spec --title "<機能名>"` で spec を作成（既存 spec がある場合はそれを使用）
3. 仕様要約を提示し、ユーザーに「この仕様で実装して問題ないか」確認する
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
スキルが利用できない環境では、以下を手動で実行すること。

1. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`（docs 更新）
2. `sdd-forge review`（品質チェック — PASS するまで繰り返す）
3. feature ブランチでコミット
4. base ブランチにマージ
5. `.sdd-forge/current-spec` を削除

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
| `sdd-forge agents` | AGENTS.md の PROJECT セクションを更新 |
| `sdd-forge spec --title "<名前>"` | spec 初期化（feature ブランチ + spec.md） |
| `sdd-forge gate --spec <path>` | spec ゲートチェック |
| `sdd-forge flow --request "<要望>"` | SDD フロー自動実行 |

### docs/ 編集ルール

- docs/ の内容は原則としてソースコード解析から自動生成される
- 手動で情報を追加する場合は `<!-- MANUAL:START -->` 〜 `<!-- MANUAL:END -->` 内に記載すること
- MANUAL ブロック外は `sdd-forge init` / `sdd-forge forge` 実行時に上書きされる可能性がある
- docs/ のファイルは `NN_name.md` の連番で管理する
- 実装・修正後は SDD フローに従って forge → review を実行すること
<!-- SDD:END -->

<!-- PROJECT:START — managed by sdd-forge. Do not edit manually. -->
## Project Context

- **generated_at:** 2026-03-05 16:02:16 UTC
- **package:** `sdd-forge` v0.1.0-alpha.20（npmjs.com 公開済み）
- **概要:** ソースコード解析による自動ドキュメント生成と、Spec-Driven Development ワークフローを提供する Node.js CLI ツール。外部依存なし（Node.js 組み込みモジュールのみ使用）。

---

### 技術スタック

| 項目 | 内容 |
|---|---|
| ランタイム | Node.js >=18.0.0 |
| モジュール形式 | ES Modules (`"type": "module"`) |
| 外部依存 | なし（Node.js 標準ライブラリのみ） |
| CLI エントリ | `src/sdd-forge.js`（bin: `sdd-forge`） |
| テストフレームワーク | Node.js 組み込みテストランナー（`node --test`） |
| npm 公開ファイル | `src/`・`docs/`（`files` フィールドで指定） |
| ライセンス | MIT |

---

### プロジェクト構造

```
sdd-forge/
├── package.json
├── src/
│   ├── sdd-forge.js        ← CLI エントリポイント・トップレベルディスパッチャ
│   ├── docs.js             ← docs サブコマンド群のディスパッチャ
│   ├── spec.js             ← spec サブコマンド群のディスパッチャ
│   ├── flow.js             ← SDD フロー自動実行（直接コマンド）
│   ├── help.js             ← ヘルプ表示
│   ├── presets-cmd.js      ← presets サブコマンド
│   ├── docs/
│   │   ├── commands/       ← scan, init, data, text, readme, forge, review,
│   │   │                      changelog, agents, setup, default-project, upgrade
│   │   ├── lib/            ← scanner, directive-parser, template-merger,
│   │   │                      renderers, forge-prompts, data-source,
│   │   │                      resolver-factory, scan-source, review-parser 等
│   │   └── data/           ← docs/project データ定義
│   ├── specs/
│   │   └── commands/       ← init（spec 作成）, gate（ゲートチェック）
│   ├── lib/                ← 共有ライブラリ
│   │   ├── agent.js        ← AI エージェント呼び出し（sync/async）
│   │   ├── agents-md.js    ← AGENTS.md セクション管理
│   │   ├── cli.js          ← 引数パース・リポジトリルート解決
│   │   ├── config.js       ← .sdd-forge/config.json 読み書き
│   │   ├── flow-state.js   ← フロー状態管理
│   │   ├── i18n.js         ← 多言語対応ユーティリティ
│   │   ├── presets.js      ← プリセット自動検出（preset.json から）
│   │   ├── process.js      ← 子プロセス実行ラッパー
│   │   ├── progress.js     ← プログレス表示
│   │   ├── projects.js     ← projects.json CRUD（マルチプロジェクト管理）
│   │   └── types.js        ← JSDoc 型定義・config/context バリデーション
│   ├── presets/            ← FW 別プリセット（preset.json + scan/ + data/ + templates/）
│   │   ├── base/           ← 共通基盤（アーキテクチャ層）
│   │   ├── webapp/         ← Web アプリ共通（アーキテクチャ層）
│   │   ├── cakephp2/       ← CakePHP 2.x プリセット
│   │   ├── laravel/        ← Laravel プリセット
│   │   ├── symfony/        ← Symfony プリセット
│   │   ├── cli/            ← CLI 共通（アーキテクチャ層）
│   │   ├── node-cli/       ← Node.js CLI プリセット（本プロジェクト自身もこれを使用）
│   │   └── library/        ← ライブラリ共通（アーキテクチャ層）
│   └── templates/          ← バンドル済みテンプレート・スキル定義
├── docs/                   ← 本プロジェクト自身のドキュメント（sdd-forge で生成）
├── tests/                  ← テストスイート（Node.js test runner）
│   ├── dispatchers.test.js
│   ├── flow.test.js
│   ├── lib/
│   ├── docs/
│   ├── specs/
│   └── presets/
└── specs/                  ← SDD spec ファイル（NNN-xxx/spec.md 形式）
```

---

### ディスパッチアーキテクチャ

3 段階ルーティング構造：

```
sdd-forge <subCmd> [args]
    │
    ├─ docs.js ── build / scan / init / data / text / readme
    │              forge / review / changelog / agents / setup / upgrade
    │
    ├─ spec.js ── spec / gate
    │
    ├─ flow.js ── （直接コマンド: SDD フロー自動実行）
    │
    └─ presets-cmd.js ── presets
```

- `--project <name>` フラグでマルチプロジェクト対応（`projects.json` で管理）
- プロジェクトコンテキストは環境変数 `SDD_SOURCE_ROOT` / `SDD_WORK_ROOT` で伝播

---

### 主要コンポーネント

| コンポーネント | ファイル | 役割 |
|---|---|---|
| AI エージェント呼び出し | `src/lib/agent.js` | `callAgent`（sync・execFileSync）/ `callAgentAsync`（spawn・ストリーミング対応）で AI CLI を実行。`systemPromptFlag` に応じて引数構築・tempfile 管理を行う。デフォルトタイムアウト 120 秒 |
| プリセット管理 | `src/lib/presets.js` | `src/presets/*/preset.json` を自動検出・登録 |
| 設定管理 | `src/lib/config.js` | `.sdd-forge/config.json` と `context.json` の読み書き・バリデーション |
| プロジェクト管理 | `src/lib/projects.js` | `.sdd-forge/projects.json` によるマルチプロジェクト管理 |
| スキャナー | `src/docs/lib/scanner.js` | JS/PHP ファイル解析・クラス/メソッド抽出。解析結果: 91 モジュール・262 メソッド |
| ディレクティブパーサー | `src/docs/lib/directive-parser.js` | `{{data}}` / `{{text}}` ディレクティブ解析 |
| リゾルバーファクトリー | `src/docs/lib/resolver-factory.js` | `createResolver()` でプリセット固有のデータリゾルバーを生成 |
| テンプレートマージャー | `src/docs/lib/template-merger.js` | docs テンプレートとソース解析結果のマージ |
| フォージプロンプト | `src/docs/lib/forge-prompts.js` | `summaryToText()` など AI 向けプロンプト構築 |
| AGENTS.md 管理 | `src/lib/agents-md.js` | `SDD` / `PROJECT` セクション単位での注入・更新 |

---

### 設定ファイル（`.sdd-forge/`）

| ファイル | 説明 |
|---|---|
| `config.json` | プロジェクト設定（`type`, `lang`, `providers`, `documentStyle` 等） |
| `context.json` | プロジェクトコンテキスト文字列（`projectContext`） |
| `projects.json` | マルチプロジェクト登録情報 |
| `current-spec` | 現在作業中の spec パス（フロー終了時に削除） |
| `output/analysis.json` | `sdd-forge scan` の出力（コンパクト JSON） |
| `output/summary.json` | `analysis.json` の軽量版（AI 入力用に優先使用。なければ analysis にフォールバック） |

#### config.json の主要フィールド

| フィールド | 説明 |
|---|---|
| `type` | プロジェクト種別（例: `cli/node-cli`, `webapp/cakephp2`, `webapp/laravel`, `webapp/symfony`） |
| `lang` | ドキュメント出力言語（`ja` / `en`） |
| `uiLang` | UI メッセージ言語（`ja` / `en`） |
| `defaultAgent` | デフォルト AI エージェント名 |
| `providers` | AI エージェント定義（`command`, `args`, `systemPromptFlag`） |
| `documentStyle` | ドキュメントスタイル（`purpose`, `tone`, `customInstruction`） |
| `flow.merge` | マージ戦略（`squash` / `ff-only` / `merge`） |

---

### 対応プリセット（`type` 値）

| type 値 | 説明 |
|---|---|
| `cli/node-cli` | Node.js CLI ツール（本プロジェクト自身） |
| `webapp/cakephp2` | CakePHP 2.x Web アプリ |
| `webapp/laravel` | Laravel Web アプリ |
| `webapp/symfony` | Symfony Web アプリ |
| `cli` | CLI 共通（アーキテクチャ層） |
| `webapp` | Web アプリ共通（アーキテクチャ層） |
| `base` | 共通基盤（アーキテクチャ層） |
| `library` | ライブラリ共通（アーキテクチャ層） |

エイリアス（短縮形）も使用可能（例: `cakephp2` → `webapp/cakephp2`）。

---

### 利用可能なコマンド

| コマンド | スクリプト |
|---|---|
| `npm run test` | `find tests -name '*.test.js' \| xargs node --test` |

---

### npm 公開に関する注意

- Pre-release は `npm publish --tag alpha` で公開する
- `--tag alpha` のみでは `latest` タグが更新されないため、公開後に `npm dist-tag add sdd-forge@<version> latest` を実行する
- 公開前に `npm pack --dry-run` で含まれるファイルを確認すること
- npm はバージョン番号の再利用不可（unpublish 後 24 時間は再登録不可）

<!-- PROJECT:END -->


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
