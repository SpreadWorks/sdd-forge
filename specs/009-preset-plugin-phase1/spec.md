# Feature Specification: 009-preset-plugin-phase1

**Feature Branch**: `feature/009-preset-plugin-phase1`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User request

## Goal
preset をフラットなプラグイン構造に移行する。各 preset が `preset.json` マニフェスト・スキャンロジック・リゾルバ・テンプレートを1フォルダに自己完結させ、フォルダの追加だけで新しい preset が使えるようにする。

## Scope

### 1. フラット preset 構造への移行

現在の `src/docs/presets/{arch}/{fw}/` を `src/presets/{key}/` に移動する。

```
src/presets/
  cakephp2/
    preset.json           ← NEW: マニフェスト
    resolve.js            ← MOVED from src/docs/presets/webapp/cakephp2/resolver.js
    scan/                 ← NEW folder
      extras.js           ← MOVED from scanner.js (analyzeExtras のみ)
      controllers.js      ← MOVED from analyze-controllers.js
      models.js           ← MOVED from analyze-models.js
      routes.js           ← MOVED from analyze-routes.js
      shells.js           ← MOVED from analyze-shells.js
      shells-detail.js    ← MOVED from analyze-shells-detail.js
      config.js           ← MOVED from analyze-config.js
      views.js            ← MOVED from analyze-views.js
      assets.js           ← MOVED from analyze-assets.js
      base-classes.js     ← MOVED from analyze-base-classes.js
      business.js         ← MOVED from analyze-business.js
      notifications.js    ← MOVED from analyze-notifications.js
      security.js         ← MOVED from analyze-security.js
      testing.js          ← MOVED from analyze-testing.js
    templates/
      ja/                 ← MOVED from src/templates/locale/ja/webapp/cakephp2/
        02_stack_and_ops.md
        ...
  laravel/
    preset.json
    resolve.js
    scan/
      extras.js
      controllers.js
      models.js
      routes.js
      migrations.js
      config.js
    templates/
      ja/
        02_stack_and_ops.md
        ...
  symfony/
    preset.json
    resolve.js
    scan/
      extras.js
      controllers.js
      entities.js
      routes.js
      migrations.js
      config.js
    templates/
      ja/
        02_stack_and_ops.md
        ...
  node-cli/
    preset.json           ← NEW: scan 設定を宣言
    templates/
      ja/                 ← MOVED from src/templates/locale/ja/cli/node-cli/
        01_overview.md
        ...
```

### 2. preset.json マニフェスト

各 preset フォルダの直下に配置。`src/lib/presets.js` のハードコード配列を置き換える。

```json
{
  "arch": "webapp",
  "label": "CakePHP 2.x",
  "aliases": ["php-mvc"],
  "scan": {
    "controllers": { "dir": "app/Controller", "pattern": "*Controller.php", "exclude": ["AppController.php"], "lang": "php" },
    "models": { "dir": "app/Model", "pattern": "*.php", "exclude": ["AppModel.php"], "subDirs": true, "lang": "php" },
    "shells": { "dir": "app/Console/Command", "pattern": "*Shell.php", "exclude": ["AppShell.php"], "lang": "php" },
    "routes": { "file": "app/Config/routes.php", "lang": "php" }
  }
}
```

`scan` フィールドに宣言的にスキャン設定を持つ。`scanner.js` の `SCAN_DEFAULTS` export は廃止。

### 3. presets.js の自動検出化

`src/lib/presets.js` のハードコードされた `PRESETS` 配列を、`src/presets/` ディレクトリの走査に置き換える。

```js
function discoverPresets(presetsDir) {
  return fs.readdirSync(presetsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(presetsDir, d.name, "preset.json"), "utf8")
      );
      return { key: d.name, dir: path.join(presetsDir, d.name), ...manifest };
    });
}
```

既存 API（`presetByLeaf`, `presetsForArch`, `buildTypeAliases`）は互換維持。

### 4. scanner.js から SCAN_DEFAULTS を削除

`src/docs/lib/scanner.js` の `SCAN_DEFAULTS` 定数を削除する。
`genericScan` の `type` 引数を廃止し、`scanCfg` のみ受け取る形に変更する。

変更前: `genericScan(sourceRoot, type, scanOverrides)`
変更後: `genericScan(sourceRoot, scanCfg)`

呼び出し側の `scan.js` が `preset.json` の `scan` + `config.json` の `scan` をマージして渡す。

### 5. scan.js の preset 読み込み変更

現在: `import("../presets/${preset.type}/scanner.js")` で `SCAN_DEFAULTS` と `analyzeExtras` を取得。

変更後:
- スキャン設定は `preset.json` の `scan` フィールドから取得
- `analyzeExtras` は `${preset.dir}/scan/extras.js` から動的 import

### 6. resolver-factory.js の読み込みパス変更

現在: `import("../presets/${preset.type}/resolver.js")`
変更後: `import("${preset.dir}/resolve.js")`

### 7. テンプレート継承チェーンの変更

現在の `resolveChain(templatesRoot, "webapp/cakephp2")` は:
```
src/templates/locale/ja/base/
src/templates/locale/ja/webapp/
src/templates/locale/ja/webapp/cakephp2/   ← ここが移動する
```

変更後:
```
src/templates/locale/ja/base/              ← 共通: 変更なし
src/templates/locale/ja/webapp/            ← arch 共通: 変更なし
src/presets/cakephp2/templates/ja/         ← preset フォルダから取得
```

`resolveChain` に preset 情報を渡し、最後のセグメント（FW 固有）だけ preset フォルダを参照するよう変更する。

影響先: `init.js`, `readme.js`（ともに `resolveChain` を使用）

### 8. テストの移動・更新

- `tests/docs/presets/webapp/{fw}/` → `tests/presets/{fw}/`
- import パスを新しい構造に合わせて更新
- 自動検出のテスト追加

## Out of Scope
- scan interface（クラスベース、メソッド呼び出し）の導入（Phase 2）
- ディレクティブ構文の変更（Phase 2）
- resolver の廃止（Phase 2）
- scan ファイルのディレクティブ名一致リネーム（Phase 2）
- 新しい preset の追加
- `preset-install` コマンド

## Clarifications (Q&A)
- Q: preset.json に scan 設定がない preset（node-cli のようにスキャンロジックが不要な場合）は？
  - A: `scan` フィールドだけで完結する。`scan/` フォルダや `resolve.js` はオプション
- Q: 共有テンプレート（base, webapp, cli, library）は移動するか？
  - A: しない。`src/templates/locale/{lang}/` に残る。移動するのは FW 固有テンプレートのみ
- Q: `src/docs/presets/` ディレクトリはどうなるか？
  - A: 完全に削除する。全内容が `src/presets/` に移動する
- Q: analyze-extras.js（cakephp2 の巨大アグリゲータ）はどうなるか？
  - A: `scan/extras.js` に移動し、同フォルダ内の各モジュールを呼び出す形は維持

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-04
- Notes:

## Requirements
1. `src/presets/{key}/` のフラット構造に全 preset を移動する
2. 各 preset に `preset.json` マニフェストを配置する
3. `src/lib/presets.js` がファイルシステムから preset を自動検出する
4. `scanner.js` の `SCAN_DEFAULTS` 定数と `type` 引数を廃止する
5. テンプレート継承チェーンが preset フォルダの FW テンプレートを参照する
6. 全コマンド（scan, data, init, readme, forge, setup）が変更後も同じ出力を生成する
7. 既存テスト + 新規テストが全て通る

## Acceptance Criteria
- [ ] `src/presets/` に cakephp2, laravel, symfony, node-cli の4フォルダが存在する
- [ ] 各フォルダに `preset.json` がある
- [ ] `src/docs/presets/` が削除されている
- [ ] `src/lib/presets.js` がハードコード配列ではなくファイルシステム検出で動作する
- [ ] `scanner.js` に `SCAN_DEFAULTS` 定数がない
- [ ] `genericScan` が `type` 引数なしで動作する
- [ ] FW 固有テンプレートが `src/presets/{key}/templates/{lang}/` にある
- [ ] `src/templates/locale/{lang}/{arch}/{fw}/` が削除されている
- [ ] scan, init, readme が変更前と同じ出力を生成する
- [ ] 全テスト通過

## Open Questions
- (なし)
