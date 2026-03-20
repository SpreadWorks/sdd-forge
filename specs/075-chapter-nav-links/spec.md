# Feature Specification: 075-chapter-nav-links

**Feature Branch**: `feature/075-chapter-nav-links`
**Created**: 2026-03-19
**Status**: Draft
**Input**: 章間ナビゲーションリンクの追加と、layout テンプレートの導入

## Goal
- 各章の末尾に前後の章へのナビゲーションリンクを自動生成する
- layout テンプレートを導入し、全章共通の要素（langSwitcher, nav）を一箇所で管理する
- `@extends: <name>` 構文で別名ファイルの継承をサポートする

## Scope
1. `@extends: <name>` 構文を directive-parser.js に追加
2. template-merger.js で別名ファイル解決をサポート
3. base preset に `layout.md` テンプレートを作成（en/ja）
4. `docs.nav` DataSource メソッドを DocsSource に追加
5. data.js の wrappedResolveFn に nav 用ファイルパス注入を追加
6. 既存テンプレートの langSwitcher ディレクティブを削除し `@extends: layout` に差し替え

## Out of Scope
- README.md のナビゲーション（README は章ではない）
- 翻訳言語ディレクトリ（docs/{lang}/）内のナビゲーション（translate で自動生成）
- layout.md に nav/langSwitcher 以外の共通要素を追加すること

## Clarifications (Q&A)
- Q: 出力形式は？
  - A: シンプルなテキストリンク `← 前の章 | 次の章 →`
- Q: 配置位置は？
  - A: 章の末尾のみ
- Q: 目次リンクは必要か？
  - A: 不要。前後リンクのみ
- Q: テンプレートへの配置方法は？
  - A: layout.md を導入し、全章テンプレートを `@extends: layout` で包む
- Q: layout の preset チェーンは？
  - A: 通常のテンプレートと同じ継承チェーン（base → arch → leaf）で解決
- Q: 最初/最後の章の扱いは？
  - A: リンクなしの部分は省略（最初の章は `次の章 →` のみ、最後は `← 前の章` のみ）

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-19
- Notes: ユーザーが「実装する」を選択

## Requirements

### R1: @extends: <name> 構文
- directive-parser.js の EXTENDS_RE を拡張し `<!-- @extends: <name> -->` をパースする
- parseBlocks() が `extends` フラグに加え `extendsTarget` プロパティを返す
- 引数なしの `<!-- @extends -->` は既存動作（同名ファイル継承）を維持

### R2: template-merger.js の別名ファイル解決
- resolveOneFile() で `extendsTarget` がある場合、同名ファイルではなく指定ファイルを親として解決する
- layout.md は通常テンプレートと同じレイヤーチェーン（project-local → leaf → arch → base）で探索する
- layout.md 自体も @extends で別の layout を継承可能（preset チェーン上書き）

### R3: layout.md テンプレート
- `src/presets/base/templates/{en,ja}/layout.md` を作成
- 内容: langSwitcher ディレクティブ + `@block: content` + nav ディレクティブ
- nav の前にセパレータ（`---`）を配置

### R4: docs.nav DataSource メソッド
- DocsSource クラスに `nav(analysis, labels)` メソッドを追加
- labels[0] にファイルパスが注入される（data.js の wrappedResolveFn 経由）
- chaptersOrder から現在ファイルの位置を特定し、前後の章へのリンクを生成
- 出力形式: `[← {前の章タイトル}]({前の章ファイル}) | [{次の章タイトル} →]({次の章ファイル})`
- 最初の章: 前リンクなし、最後の章: 次リンクなし
- 章タイトルは章ファイルの最初の `# ` 行から取得

### R5: data.js wrappedResolveFn 拡張
- `source === "docs" && method === "nav"` の場合、labels に `docsDirRel/file` を注入する
- lang.links, docs.langSwitcher と同じパターン

### R6: 既存テンプレートの移行
- 全 preset テンプレート（base, cli, node-cli, webapp, library 等）から langSwitcher ディレクティブを削除
- 各章テンプレートの先頭に `<!-- @extends: layout -->` を追加し、内容を `@block: content` で囲む
- 既に `@extends`（引数なし）を使用しているテンプレートは、同名親継承と layout 継承の両方が必要なため、mergeResolved の後に layout を適用する

## Acceptance Criteria
- [ ] `sdd-forge init` で生成された章ファイルの末尾にナビゲーションリンクが含まれる
- [ ] ナビゲーションリンクが chaptersOrder の順序に従っている
- [ ] 最初の章は「次の章 →」のみ、最後の章は「← 前の章」のみ表示される
- [ ] `sdd-forge data` で `docs.nav` ディレクティブが正しく解決される
- [ ] langSwitcher が layout.md 経由で各章の先頭に表示される（従来と同じ出力）
- [ ] 既存の `@extends`（引数なし）が引き続き動作する
- [ ] `sdd-forge review` がエラーなく通る
- [ ] 既存テストが全て通る

## Open Questions
（なし）
