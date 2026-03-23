# sdd-forge

ソースコード解析に基づくドキュメント自動生成と、Spec-Driven Development ワークフローを提供する CLI ツール。

<!-- {{data: agents.sdd}} -->
## SDD (Spec-Driven Development)

本プロジェクトは sdd-forge による Spec-Driven Development を採用している。

- **MUST: ユーザーから機能追加・修正のリクエストを受けた場合、SDD フロー (`/sdd-forge.flow-plan`) を使用するかユーザーに確認すること。確認なしにコードを変更してはならない。**
- **MUST: 実装完了後は `/sdd-forge.flow-merge` を実行すること。**
- スキルが利用できない環境では `sdd-forge flow --request "<要望>"` を使用すること

### docs/ について

`docs/` はプロジェクトの設計・構造・ビジネスロジックを体系的にまとめた知識ベースである。
実装・修正時は docs を読んでプロジェクトの全体像を理解した上で作業すること。

**docs とソースコードに矛盾がある場合はソースコードを正とする。**

作業開始前に docs/ とソースコードの更新日時を比較すること。
ソースが新しい場合は `sdd-forge build` の実行をユーザーに提案すること。

### docs/ 編集ルール

- docs/ は原則としてソースコード解析から自動生成される
- `{{data}}` / `{{text}}` ディレクティブの内部は自動生成で上書きされる
- ディレクティブの外に記述した内容は上書きされない
- 章の並び順は `preset.json` の `chapters` 配列で定義される

<!-- {{/data}} -->

## タスク管理

ボード操作は `node experimental/workflow/board.js` を使うこと。

- 検索: `node experimental/workflow/board.js search "<テキスト>"`
- 追加: `node experimental/workflow/board.js add "<タイトル>" --status Todo`
- 一覧: `node experimental/workflow/board.js list [--status Todo|Ideas|Done]`
- 詳細: `node experimental/workflow/board.js show <hash>`
- 更新: `node experimental/workflow/board.js update <hash> [--status Done] [--body "..."] [--title "..."]`
- Issue 化: `node experimental/workflow/board.js to-issue <hash> [--label enhancement]`

### ルール

- ユーザーが「ボードに追加」「タスク化」「メモしておいて」等と言ったら `board.js add` で Draft を作成する
- **MUST: ボード上のアイテム（Draft issue）のタイトル・本文は常に日本語で書くこと。英語にしてはならない。**
- **MUST: `board.js add` / `board.js update` を実行する前に、登録・更新するタイトルと本文が日本語だけで構成されているか確認すること。英訳してから登録してはならない。**
- **MUST: `board.js add` / `board.js update` の直後に `board.js show <hash>` で表示内容を確認し、タイトル・本文が日本語の Draft のまま保存されていることを検証すること。**
- アイデア・リサーチメモ → `--status Ideas`
- 実装タスク・バグ → `--status Todo`
- アイテムの特定はハッシュID またはタイトルの一部で `board.js search` を使う
- **MUST: Issue を作成する場合は、必ず先にボードに Draft を日本語で作成し、ユーザーの「issue にして」指示を待つこと。Draft を経由せず直接 `gh issue create` してはならない。**
- 「○○を issue にして」と言われたら `board.js to-issue <hash>` で Issue 化する（英訳は claude CLI が自動実行）
  - リポジトリは public のため Issue は英語で書く
  - 適切なラベル（bug / enhancement / documentation 等）を `--label` で付ける
  - **MUST: Issue 作成後も、ボード上の Draft アイテムのタイトルは日本語のまま保持すること。英語に変更してはならない。**
  - **MUST: 英語化が許されるのは Issue 化で外部に作成される GitHub Issue のみであり、ボード上の Draft に対して英語タイトル・英語本文への更新を行ってはならない。**

## 設計思想

- **構成の安定性** — `{{text}}` ディレクティブが「どこに何を書くか」を定義する。AI は枠内で書き、段落構成を変えない。
- **docs は AI の行動制約** — docs/ を読んでプロジェクトの全体像を理解した上で作業すること。既存設計から逸脱しない。

## プロジェクトルール

### 開発ワークフロー

- `src/templates/` や `src/presets/` のテンプレートを変更した場合は `sdd-forge upgrade` を実行して、プロジェクトのスキル・設定に反映すること。
- `sdd-forge upgrade` はスキル（`.claude/skills/`, `.agents/skills/`）やテンプレートの差分を検出し、変更があったファイルのみ更新する。

### コーディング

- **外部依存なし**: Node.js 組み込みモジュールのみ使用。依存追加は禁止。
- **alpha 版ポリシー**: 後方互換コードは書かない。旧フォーマット・非推奨パスは保持せず削除する。
- 過剰な防御コードを書かない。内部インターフェースは信頼し、バリデーションはシステム境界でのみ行う。

### `src/` の禁止事項

- **MUST: `src/` 以下のファイルには、特定のプロジェクトや環境に固有の情報を含めてはならない。** `src/` は npm パッケージとして全ユーザーに配布されるコードである。
- `{{text}}` プロンプト: 汎用的な指示にすること。具体的なフィールド名を列挙しない。
- 固定テキスト: プロジェクト固有の値を直接書かない。`{{data}}` または `{{text}}` で動的に取得する。
- DataSource / ライブラリ: 特定プロジェクトの構造を前提としたロジックを書かない。

### テスト

- **MUST: テストを通すためにテストコードを修正してはならない。** テスト失敗時はまずシナリオの妥当性を確認し、妥当であればプロダクトコードを修正する。

### コミット

- **MUST: コミットメッセージは英語で書くこと。**
- sign-off 行や co-authored-by トレーラーを付けないこと。

### バージョニング（alpha 期間）

- alpha 期間中のバージョン番号は `0.1.0-alpha.N` 形式。N は `git rev-list --count HEAD` の値（総コミット数）とする。

### npm 公開
- **MUST: `npm publish` / `npm dist-tag` はユーザーがリリースの意図を明示した場合のみ実行する。** バージョン上げ・コミット・push の指示はリリース指示ではない。
- pre-release は `npm publish --tag alpha` → `npm dist-tag add sdd-forge@<version> latest` の 2 ステップ。
- 公開前に `npm pack --dry-run` で機密情報がないことを確認する。

## ソースコード（src/）

`src/` のアーキテクチャ・プリセット作成ルール・コーディングルールは `src/AGENTS.md` を参照すること。

