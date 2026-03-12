# Draft: Configurable Scan Directories

- [x] User approved this draft
- Approved: 2026-03-12

## Q&A

### Q1: config.json でのスキャン対象ディレクトリ上書き方式
- **選択肢**: (1) preset の dir を完全置換 (2) preset に追加・除外
- **回答**: 1 — 完全置換
- **決定**: config.json に scan 設定を書いたら preset 側の定義は無視する

### Q2: preset.json の scan 構造をどうするか
- **選択肢**: (1) 同じ形式 (2) ディレクトリリストだけ (3) setup 時コピー
- **回答**: preset.json 側をシンプルに変えるアプローチを検討
- **決定**: カテゴリ構造を廃止し、include/exclude glob パターン形式に統一する

### Q3: preset.json の既存 scan 構造の扱い
- **選択肢**: (1) preset も include/exclude に移行 (2) config.json のみ新形式で preset は既存維持
- **回答**: 1
- **決定**: 全プリセットを include/exclude 形式に書き換える。既存のカテゴリ構造は廃止

### Q4: lang フィールドの扱い
- **議論**: preset.json の scan カテゴリ内にある `lang` は `parseFile()` で言語パーサーを選択するために使われている
- **決定**: `lang` フィールドは廃止。拡張子から自動判定する（.php → PHP パーサー, .js → JS パーサー）。モノレポ対応も可能

### Q5: config.json での scan 上書き
- **決定**: config.json に `scan.include` / `scan.exclude` を書けば preset の scan 設定を完全に置き換える。config.json に `scan` がなければ preset のデフォルトを使用

### Q6: exclude のデフォルト
- **決定**: 自動除外リストは不要。include パターンで対象を絞るので node_modules 等にはマッチしない。exclude はオプショナル

### Q7: スコープ
- **決定**: フル実装。preset.json 形式変更 + scan.js + 全 DataSource 修正 + config.json 上書き

### Q8: タイプ2 DataSource（独自スキャンパスをハードコード）
- **決定**: 含める。全 DataSource を include/exclude 形式に統一する

### Q9: DataSource の scan() メソッドの扱い
- **議論**: カテゴリ別 DataSource が分かれている理由は、ファイル探索ではなくカテゴリ固有のデータ抽出ロジック（controller は actions/uses、model は relations/tableName 等）のため
- **決定**: ファイル探索だけ include/exclude で統一し scan.js が一括収集する。DataSource にはマッチしたファイルリストを渡し、DataSource は「自分に関係あるファイル」をフィルタして解析する

### Q10: routes DataSource
- **当初の決定**: ControllersSource に内包する
- **撤回**: include に routes.php を含めて dispatcher 経由で渡せば独立した DataSource のまま動く。内包は不要

### Q11: extras 系 DataSource（config, views, tests, email, libs）
- **決定**: dispatcher 経由に統一する。全 DataSource が同じインターフェース（dispatcher からファイルリストを受け取り、match() でフィルタ）で動く。独自のファイル探索ロジックは廃止

### Q12: primary/extras の区別
- **議論**: scan.js が DataSource の戻り値に summary があるかで analysis.json の格納先を分けている（primary → analysis[name]、extras → analysis.extras にフラット展開）。明確なメリットはない
- **決定**: 廃止する。全部トップレベルに DataSource 名でグルーピングして格納（例: `analysis.config = { constants, bootstrap, ... }`）。extras を参照している下流コードの修正が必要

### Q13: enrich の対象
- **決定**: 全カテゴリを enrich 対象にする。章分類が自動化され、text フェーズのドキュメント品質が上がる

### Q14: analyzeExtras() の扱い
- **決定**: PackageSource DataSource を作り、analyzeExtras() のロジックを移す。scan.js の特別処理を除去

### Q15: DataSource の scan() シグネチャ
- **決定**: `scan(files)` に変更。sourceRoot は不要。files は dispatcher がフィルタ済みのファイルリスト

### Q16: match() の実装場所
- **決定**: DataSource 自体に match(file) を持たせる。scan.js がロード済み DataSource 群をループして振り分ける

### Q17: dispatcher.js の要否
- **当初の決定**: preset ごとに dispatcher.js（基底クラス + preset 実装）を用意する
- **撤回**: DataSource に match() があれば scan.js のループで振り分けられるため、dispatcher は不要

### Q18: hash の生成タイミング
- **決定**: scan.js が glob でファイル収集する際に hash を計算する。preserveEnrichment と enrich で hash が必要なため、DataSource に渡す前に生成しておく

### Q19: 1つのファイルが複数 DataSource にマッチするケース
- **例**: AppController.php が ControllersSource と ConfigSource の両方にマッチ
- **決定**: 許容する。現状でも同じファイルを複数の DataSource が読んでおり、結果は別キーに格納されるので衝突しない

### Q20: config.json の scan バリデーション
- **決定**: types.js の validateConfig() に scan.include（string[]）と scan.exclude（string[]、オプショナル）のバリデーションを追加する

### Q21: glob の実装
- **決定**: Node.js 組み込みの fs.promises.glob() を使用。外部依存不要。sourceRoot を cwd として glob を解決する

### Q22: sourceRoot の扱い（Q15 補足）
- **決定**: scan.js は sourceRoot を glob のベースパスとして使う。DataSource.scan(files) には sourceRoot を渡さない。files の各エントリに absPath が含まれるため、DataSource はファイルを直接読める
