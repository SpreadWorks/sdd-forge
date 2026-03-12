# Feature Specification: 043-configurable-scan-directories

**Feature Branch**: `feature/043-configurable-scan-directories`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User request

## Goal

preset.json のカテゴリ別スキャン構造（dir/pattern/lang/subDirs）を廃止し、include/exclude glob パターン形式に統一する。scan.js がファイルを一括収集し、DataSource の match() メソッドで振り分ける方式に変更する。config.json での scan 設定上書きも可能にする。

## Scope

1. **preset.json の scan 形式変更**: カテゴリ構造を廃止し、`scan.include` / `scan.exclude` glob パターン配列に移行
2. **lang フィールドの廃止**: 拡張子から言語パーサーを自動判定する
3. **scan.js の改修**: glob でファイルを一括収集 → DataSource の match() で振り分け → scan() にファイルリストを渡す
4. **DataSource インターフェース変更**:
   - `match(file)` メソッドを追加（自分に関係あるファイルかを判定）
   - `scan(files)` に変更（sourceRoot は不要、files に absPath を含む）
5. **全 DataSource の統一**: ファイル探索ロジックを廃止し、scan.js から渡されたファイルリストのみを使用
   - primary 系: ModulesSource, ControllersSource, ModelsSource, RoutesSource
   - extras 系: ConfigSource, ViewsSource, TestsSource, EmailSource, LibsSource
   - tables 系: TablesSource（match() は空、resolve のみ）
6. **primary/extras 区別の廃止**: 全 DataSource をトップレベルに DataSource 名でグルーピング
7. **config.json での scan 上書き**: `scan.include` / `scan.exclude` を設定すれば preset の scan を完全置換
8. **config.json バリデーション**: types.js に scan.include（string[]）と scan.exclude（string[]、オプショナル）を追加
9. **PackageSource の新設**: analyzeExtras() のロジックを DataSource に移す
10. **enrich の全カテゴリ対応**: 旧 extras を含め全 DataSource の出力を enrich 対象にする
11. **hash 生成**: scan.js が glob 収集時に hash を計算し、DataSource に渡す前に生成
12. **preserveEnrichment の修正**: `result[cat][cat]` 固定パスではなく再帰的にファイル hash を検索する方式に変更
13. **下流コード修正**: `a.extras?.xxx` を参照している text-prompts.js 等を新構造に対応

## Out of Scope

- テンプレート（`{{text}}` / `{{data}}`）の構造変更
- enrich のロジック変更（対象カテゴリの拡大のみ）
- モノレポ対応（将来的に include/exclude で自然に対応可能）
- 新しい DataSource の追加（PackageSource を除く）

## Clarifications (Q&A)

### Q1: config.json でのスキャン対象ディレクトリ上書き方式
- **決定**: 完全置換。config.json に scan 設定を書いたら preset 側の定義は無視する

### Q2: preset.json の scan 構造
- **決定**: カテゴリ構造を廃止し、include/exclude glob パターン形式に統一

### Q3: preset.json の既存 scan 構造の扱い
- **決定**: 全プリセットを include/exclude 形式に書き換え。既存のカテゴリ構造は廃止

### Q4: lang フィールドの扱い
- **決定**: 廃止。拡張子から自動判定（.php → PHP パーサー, .js → JS パーサー）

### Q5: config.json での scan 上書き
- **決定**: config.json に `scan.include` / `scan.exclude` を書けば preset の scan を完全置換。なければ preset のデフォルトを使用

### Q6: exclude のデフォルト
- **決定**: 自動除外リストは不要。include パターンで対象を絞るので node_modules 等にはマッチしない。exclude はオプショナル

### Q7: スコープ
- **決定**: フル実装（preset.json 形式変更 + scan.js + 全 DataSource 修正 + config.json 上書き）

### Q8: タイプ2 DataSource（独自スキャンパスをハードコード）
- **決定**: 含める。全 DataSource を include/exclude 形式に統一

### Q9: DataSource の scan() メソッドの扱い
- **決定**: ファイル探索だけ include/exclude で統一し scan.js が一括収集。DataSource にはマッチしたファイルリストを渡し、DataSource は「自分に関係あるファイル」をフィルタして解析

### Q10: routes DataSource
- **決定**: 独立した DataSource のまま維持。include に routes.php を含めて scan.js 経由で渡す

### Q11: extras 系 DataSource
- **決定**: scan.js 経由に統一。全 DataSource が同じインターフェースで動く。独自のファイル探索ロジックは廃止

### Q12: primary/extras の区別
- **決定**: 廃止。全部トップレベルに DataSource 名でグルーピング（例: `analysis.config = { constants, bootstrap, ... }`）

### Q13: enrich の対象
- **決定**: 全カテゴリを enrich 対象にする

### Q14: analyzeExtras() の扱い
- **決定**: PackageSource DataSource を作り、analyzeExtras() のロジックを移す

### Q15: DataSource の scan() シグネチャ
- **決定**: `scan(files)` に変更。sourceRoot は不要。files は scan.js がフィルタ済みのファイルリスト

### Q16: match() の実装場所
- **決定**: DataSource 自体に match(file) を持たせる。scan.js がロード済み DataSource 群をループして振り分け

### Q17: dispatcher.js の要否
- **決定**: 不要。DataSource に match() があれば scan.js のループで振り分けられる

### Q18: hash の生成タイミング
- **決定**: scan.js が glob でファイル収集する際に hash を計算

### Q19: 1つのファイルが複数 DataSource にマッチするケース
- **決定**: 許容する。結果は別キーに格納されるので衝突しない

### Q20: config.json の scan バリデーション
- **決定**: types.js の validateConfig() に scan.include（string[]）と scan.exclude（string[]、オプショナル）を追加

### Q21: glob の実装
- **決定**: Node.js 組み込みの fs.promises.glob() を使用。sourceRoot を cwd として glob を解決

### Q22: sourceRoot の扱い
- **決定**: scan.js は sourceRoot を glob のベースパスとして使う。DataSource.scan(files) には sourceRoot を渡さない。files の各エントリに absPath を含む

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-12
- Notes: draft Q&A (Q1-Q22) で全設計決定を完了。ユーザー承認済み。

## Requirements

### R1: preset.json の scan 形式

```jsonc
// Before (カテゴリ構造)
{
  "scan": {
    "controllers": { "dir": "app/Controller", "pattern": "*Controller.php", "lang": "php" },
    "models": { "dir": "app/Model", "pattern": "*.php", "lang": "php" }
  }
}

// After (include/exclude)
{
  "scan": {
    "include": ["app/Controller/**/*Controller.php", "app/Model/**/*.php", "app/Config/**/*.php", "app/View/**/*.ctp", "composer.json"],
    "exclude": []
  }
}
```

### R2: config.json での上書き

```jsonc
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.js"],
    "exclude": ["src/legacy/**"]
  }
}
```

config.json に `scan` が存在すれば preset の scan を完全置換。存在しなければ preset のデフォルトを使用。

### R3: scan.js のファイル収集フロー

1. config.json の scan があればそれを使用、なければ preset.json の scan を使用
2. `fs.promises.glob()` で include パターンに一致するファイルを収集（sourceRoot を cwd に）
3. exclude パターンに一致するファイルを除外
4. 各ファイルの hash（md5）、absPath、相対パス、mtime 等を計算
5. ロード済み DataSource 群をループし、各 DataSource の `match(file)` で振り分け
6. 各 DataSource の `scan(matchedFiles)` を呼び出し
7. 全結果をトップレベルに DataSource 名でグルーピングして analysis.json に格納

### R4: DataSource インターフェース

```js
class SomeSource extends DataSource {
  // このDataSourceが処理するファイルかを判定
  match(file) {
    // file: { absPath, relPath, hash, mtime, lines }
    return /Controller\.php$/.test(file.relPath);
  }

  // マッチしたファイルリストを受け取り解析
  scan(files) {
    // files: match() が true を返したファイルの配列
    // 戻り値: 解析結果オブジェクト
  }
}
```

### R5: 言語パーサーの自動判定

scanner.js の parseFile() で拡張子から言語を判定:
- `.php` → PHP パーサー
- `.js`, `.mjs`, `.cjs` → JS パーサー
- `.json` → JSON パーサー
- その他 → テキストとして基本情報のみ取得

### R6: analysis.json の構造変更

```jsonc
// Before
{
  "controllers": { "controllers": [...] },
  "models": { "models": [...] },
  "extras": { "config": {...}, "views": {...} }
}

// After
{
  "controllers": { "controllers": [...] },
  "models": { "models": [...] },
  "config": { "constants": [...], "bootstrap": [...] },
  "views": { "templates": [...] },
  "package": { "dependencies": {...}, "scripts": {...} }
}
```

### R7: preserveEnrichment の変更

ファイル hash を再帰的に検索する方式に変更。`result[cat][cat]` 固定パスではなく、任意の深さにある `hash` フィールドを見つけて旧 enrichment データとマッチングする。

### R8: 下流コードの修正

- `text-prompts.js`: `a.extras?.xxx` → `a.xxx` に変更（22+ 箇所）
- `enrich.js`: `collectEntries()` の META_KEYS による extras スキップを除去
- `scan.js`: `analyzeExtras()` 呼び出しを除去（PackageSource に移行）
- その他 extras を参照しているコード

### R9: PackageSource

- `analyzeExtras()` の package.json / composer.json 解析ロジックを PackageSource DataSource に移す
- match(): `package.json` または `composer.json` にマッチ
- scan(): 依存関係、スクリプト等を解析して返す

### R10: バリデーション

types.js の validateConfig() に以下を追加:
- `scan.include`: string[]（必須、scan が存在する場合）
- `scan.exclude`: string[]（オプショナル）

## Acceptance Criteria

1. **全プリセット（node-cli, cakephp2, laravel, symfony）の preset.json が include/exclude 形式に変更されている**
2. **config.json に scan.include/exclude を設定すると preset の scan を完全置換する**
3. **scan.js が glob でファイルを一括収集し、DataSource.match() で振り分ける**
4. **全 DataSource が match()/scan(files) インターフェースに準拠**
5. **独自ファイル探索ロジックを持つ DataSource がない**
6. **lang フィールドが廃止され、拡張子から自動判定される**
7. **analysis.json に extras キーがなく、全 DataSource がトップレベルにグルーピング**
8. **enrich が全カテゴリを対象にする**
9. **PackageSource が存在し、analyzeExtras() が除去されている**
10. **preserveEnrichment が新構造で正しく動作する**
11. **text-prompts.js 等の下流コードが新構造に対応**
12. **config.json の scan バリデーションが動作する**
13. **既存テストが通る（または新構造に対応して更新されている）**
14. **`sdd-forge build` が正常に完了する**

## Open Questions
- (なし — draft フェーズで全て解決済み)
