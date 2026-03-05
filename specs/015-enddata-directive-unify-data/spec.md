# Feature Specification: 015-enddata-directive-unify-data

**Feature Branch**: `feature/015-enddata-directive-unify-data`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User request

## Goal
- `@enddata` 閉じディレクティブを導入し、`@data` の境界を明示的にする
- `{{PLACEHOLDER}}` 変数を全廃し、全てを `@data` ディレクティブに統一する
- インライン形式（同一行に `@data` と `@enddata`）で改行なしの値置換に対応する

## Scope
1. **directive-parser.js**: `@enddata` パース対応。`@data` ディレクティブに `endLine` を追加
2. **data.js の processTemplate()**: ヒューリスティック境界検出を `@enddata` ベースに変更
3. **project DataSource 新設**: `name()`, `description()`, `version()` — package.json/config.json から値を取得
4. **docs DataSource 新設**: `chapters()` — docs/ のファイル一覧をテーブル形式で返す
5. **全テンプレートの `{{}}` → `@data` 移行**:
   - `{{PACKAGE_NAME}}` → `<!-- @data: project.name("") -->...<!-- @enddata -->`
   - `{{PROJECT_NAME}}` → 同上
   - `{{PROJECT_DESCRIPTION}}` → `<!-- @data: project.description("") -->...<!-- @enddata -->`
   - `{{CHAPTER_TABLE}}` → `<!-- @data: docs.chapters("章|概要") -->...<!-- @enddata -->`
6. **readme.js**: `generateReadme()` の `replace()` チェーンを廃止し、`processTemplate()` に統一
7. **resolver-factory.js**: `ctx` に `root` を追加（DataSource が動的にファイルを読めるように）

## Out of Scope
- `MANUAL_CONTENT` の移行（別途対応予定）
- `fix` コマンドの実装（ディレクティブ除去は別 spec）
- `@text` ディレクティブへの `@endtext` 導入（将来検討）
- specs テンプレートの `{{}}` 移行（spec.md/qa.md のプレースホルダーは spec 生成時の1回限りなので対象外）

## Clarifications (Q&A)
- Q: analysis.json に project 情報を入れるか、DataSource が動的に読むか？
  - A: DataSource の `init(ctx)` で root を受け取り、メソッド呼び出し時に動的に読む。analysis.json への追加は任意（scan 時に入れても良い）
- Q: インライン形式の検出方法は？
  - A: `<!-- @data: ... -->` と `<!-- @enddata -->` が同一行にある場合をインラインと判定。間のテキストを置換する
- Q: 既存 docs/ ファイルの `@data` に `@enddata` がない場合はどうするか？
  - A: `sdd-forge init` 再実行でテンプレートから再生成されるため、テンプレート側の対応で十分。既存ファイルへのマイグレーションは init で対応

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-05
- Notes: 議論を経て設計合意済み

## Requirements
1. `<!-- @enddata -->` を `@data` の閉じディレクティブとして認識すること
2. ブロック形式: `@data` 行と `@enddata` 行の間のコンテンツを置換する
3. インライン形式: 同一行内の `<!-- @data: ... -->` と `<!-- @enddata -->` の間を置換する
4. `project` DataSource は全 type で利用可能な共通 DataSource とする
5. `docs` DataSource は全 type で利用可能な共通 DataSource とする
6. `{{}}` プレースホルダーは全テンプレート（README.md, docs/ 章テンプレート）から除去する
7. readme.js は processTemplate() を使って @data を解決する（独自の replace ロジックを廃止）
8. 既存テスト（data.js, readme.js 関連）が通ること

## Acceptance Criteria
- `<!-- @data: project.name("") -->sdd-forge<!-- @enddata -->` がインラインで正しく置換される
- `<!-- @data: docs.chapters("章|概要") -->` がブロックで正しく置換される
- 全テンプレートから `{{}}` が除去されている
- `sdd-forge readme` が @data ベースで README.md を生成できる
- `sdd-forge data` が @enddata を認識して既存コンテンツを正しく置換する
- `npm run test` が通る

## Open Questions
- (なし)
