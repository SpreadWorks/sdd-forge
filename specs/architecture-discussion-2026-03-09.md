# アーキテクチャ議論メモ — 2026-03-09

## 発端

sdd-forge のアーキテクチャ全般に残っている構造的課題を洗い出した。

---

## 課題1: `docs.chapters()` の設計問題

### 現象
README の章テーブルの「概要」列に `<!-- {{/text}} -->` がそのまま表示される。

### 原因の構造
1. テンプレートの各章に `## 説明` + `{{text}}` ディレクティブで概要を定義
2. `{{data: docs.chapters()}}` が各章ファイルを読み、`{{text}}` の生成結果を概要として抽出
3. build パイプラインは `data → text → readme` の順なので、`text` 未実行時は `{{text}}` が未埋め
4. README は `readme` ステップで処理されるので通常は問題ないが、AI の空レスポンス等で `{{text}}` が未埋めのまま残ると終了タグが漏れる

### 本質的な問題
- `docs.chapters()` は `{{data}}` ディレクティブ（決定論的データ）なのに、`{{text}}` ディレクティブ（AI 生成）の結果に依存している
- データソース内でテンプレート的な振る舞い（マークダウンテーブル生成、ファイル読み込み、概要抽出）をしている
- **スクリプト内にテンプレートがある状態**

### バグ修正（実施済み）
`docs.js` L191 で `<!-- {{/data}} -->` のスキップはあったが `<!-- {{/text}} -->` のスキップが漏れていた。修正済み。

---

## 課題2: データソース全体の責務混在

### 調査結果
全32データソースファイル、約75メソッドが `toMarkdownTable()` でマークダウンテーブルを生成して返している。`toMarkdownTable()` が `data-source.js` の基底クラスにあること自体が、この設計思想を象徴している。

| 分類 | 件数 |
|---|---|
| データソースファイル数 | 32 |
| `toMarkdownTable()` でテーブル生成しているメソッド | 約75 |
| フォーマット済みテキストを生成しているメソッド | 約10 |
| 生成済みファイルを読み込んでいるメソッド | 1（`docs.chapters()`） |
| 純粋に生データだけ返しているメソッド | 約10 |

### 実害の度合い
- テーブル系（`controllers.list()` 等）は「データ → テーブル」の変換が単純なので実害は少ない
- `docs.chapters()` が特にまずいのは、他のディレクティブの生成結果を読みに行く依存がある点
- `docs.chapters()` だけが `{{data}}` から `{{text}}` の結果を読んでいる唯一の箇所

---

## 課題3: `review-parser.js` の CakePHP 依存

### 現象
`patchGeneratedForMisses()` がファイルパスをハードコードしている:
- `docs/08_controller_routes.md` ← controllers のパッチ先
- `docs/07_db_tables.md` ← tables のパッチ先
- `docs/04_development.md` ← headings/sections のパッチ先

`FALLBACK_PATCH_ORDER` も `["controllers", "tables", "headings", "sections"]` と CakePHP のカテゴリ名がハードコード。

### 影響
forge の `--mode local` や AI なしのフォールバックパッチが、CakePHP 以外のプリセットでは一切機能しない。

---

## 課題4: `genericScan` のカテゴリ粒度

### 現象
node-cli プリセットでは全ファイルが `modules` という単一カテゴリに入る。webapp 系は `controllers`, `models`, `shells`, `routes` と細かく分かれている。

### 影響
`modules` が粗すぎるため、個別モジュールがどの章に対応するかの判定が難しい。

---

## 解決の方向性

### 議論の流れ

1. **`docs.chapters()` の概要をどうするか？**
   - 案A: `docs.chapters()` 内で AI 生成 → `data` の責務逸脱
   - 案B: `{{for}}` ディレクティブを作る → 設計は正しいが実装コスト高
   - 案C: `init` 時に AI で概要を生成して埋め込む → `init` は既に AI を使っている
   - 案D: analysis のサマリーから決定論的に組み立てる → AI 不要

2. **analysis にエントリ単位で章インデックスを付ける案**
   ```json
   // analysis.json
   { "id": 1, "file": "src/docs.js", "className": "docs", "methods": [...] }

   // 章マッピング（別ファイル）
   { "02_cli_commands.md": [1], "04_internal_design.md": [1, 2] }
   ```
   - 1つのエントリが複数章に関連する場合も表現可能
   - `text` のプロンプトを各章の関連エントリだけに絞れる
   - 新規エントリのマッピング漏れを検出可能

3. **マッピングは既にテンプレートにある**
   - `<!-- {{data: controllers.list("名前|アクション")}} -->` = 「controllers はこの章で使う」
   - webapp 系はテンプレートのディレクティブをパースするだけで章→カテゴリの対応が取れる
   - **新たにマッピングを定義する必要はない**

4. **残る問題は `modules` の粒度**
   - node-cli では全ファイルが `modules` に入り、テンプレートに `{{data: modules.list()}}` があっても全モジュールが1章に対応するわけではない
   - scan 時に `modules` をもっと細かいカテゴリに分ければ、テンプレートのディレクティブだけで解決可能
   - これは課題4（`genericScan` のカテゴリ粒度）に帰着する

5. **`modules` 細分化の方針（追加議論 2026-03-10）**

   `genericScan` は既に削除済みで、現在は DataSource ベース。問題は「ハードコード」ではなく「粒度」。

   **webapp 系（CakePHP 等）**: カテゴリが `controllers`, `models`, `shells`, `routes`, `tables` と細かく分かれている。各カテゴリに対応する DataSource がある。preset.json の scan 設定がそのまま章との対応になる。**問題なし。**

   **node-cli 系**: scan 設定が `{ modules: { dir: "src", pattern: "*.js", subDirs: true } }` のみ。101ファイルが全部 `modules` に入る。5つの章（cli_commands, configuration, internal_design 等）のどれに対応するか分からない。

   **preset.json で分割を定義するのは無理** — フォルダ構成はプロジェクトごとに異なるため、汎用的な分割ルールを定義できない。

   **解決策: `init` 時に AI で振り分け**
   - `init` は既に AI を使って章選別をしている（`aiFilterChapters()`）
   - 同じタイミングで、各モジュールをどの章に振り分けるかも AI に判定させる
   - 結果をマッピングファイル（`.sdd-forge/output/chapter-mapping.json` 等）に保存
   - 後続ステップ（text, forge, review）がマッピングを参照
   - 再 scan 時は差分（新規追加モジュール）だけ AI に聞く

   **2層構造のマッピング**:
   - webapp 系: テンプレートのディレクティブから決定論的に解決（AI 不要）
   - cli/library 系: `modules` のような粗いカテゴリだけ AI で振り分け

### まとめ: 根本解決の道筋

```
[webapp 系]
テンプレートのディレクティブ = 章とカテゴリのマッピング（既存、AI 不要）

[cli/library 系]
init 時に AI がモジュール → 章のマッピングを生成
  ↓
マッピングをファイルに保存
  ↓
[共通]
各ステップ（text, forge, review）がマッピングを利用
  ↓
- text: 関連カテゴリ/モジュールだけをプロンプトに含める → プロンプト削減
- docs.chapters(): カテゴリのサマリーから概要を決定論的に生成 → {{text}} 依存解消
- review: マッピングとディレクティブの照合でカバレッジチェック
- review-parser: マッピングから動的にパッチ先を解決 → ハードコード解消
- forge: 変更影響のある章だけを対象にできる
```

---

## 本日実施した修正

### spec 032: analysis カバレッジ警告（マージ済み）
- `review.js` に analysis.json カテゴリの未参照警告を追加（`[WARN] uncovered analysis category:`）
- `review-parser.js` の `summarizeReview()` に `[WARN]` 行の抽出を追加
- テスト5件追加、全368テストパス

### バグ修正（未コミット）
- `docs.js` の `chapters()` で `<!-- {{/text}} -->` のスキップ漏れを修正

### バージョン 0.1.0-alpha.28 リリース済み
- spec 032 の変更を含む
- `docs.js` のバグ修正は含まれていない
