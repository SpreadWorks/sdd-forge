# Draft: init 言語フォールバック・章選別テスト

## 要件整理

### テスト1: フォールバック動作 (e2e)

- **config**: `type: "webapp"`, `docs: { languages: ["en", "ja"], defaultLanguage: "en" }`
- **期待**: webapp の全10章が生成される
  - base/en テンプレートがある4章 → `action: "use"` → そのまま出力
  - webapp/ja テンプレートのみの6章 → `action: "translate"` → agent なしなので ja 内容がそのまま出力
- **検証**: `docs/` に10個の `NN_*.md` ファイルが生成されること
- **注意**: agent なしで実行（AI 章選別スキップ）、`--force` で上書き許可

### テスト2: 単一言語でテンプレなし (e2e)

- **config**: `type: "webapp"`, `docs: { languages: ["en"], defaultLanguage: "en" }`
- **期待**: base の en テンプレートのみ生成（4章）
  - webapp 固有章は en テンプレートが存在せず、フォールバック言語もないため生成されない
- **検証**: `docs/` に4個の `NN_*.md` ファイルが生成されること

### テスト3: config.chapters 明示指定 (e2e)

- **config**: `type: "cli/node-cli"`, `chapters: ["overview.md", "development.md"]`, agent 設定あり
- **期待**: AI 章選別がスキップされ、指定した2章のみ生成
- **検証**:
  - `docs/` に2個の `NN_*.md` ファイルが生成
  - AI agent が呼ばれないこと（prompt capture ファイルが作られない）

### テスト4: aiFilterChapters ユニットテスト

- `aiFilterChapters` 関数を直接テスト
- AI agent をモック（callAgent をスタブ）
- テストケース:
  1. AI が有効な JSON 配列を返す → フィルタリングされた章のみ返る
  2. AI が無効な JSON を返す → 全章がフォールバックで返る
  3. AI が空配列を返す → 全章がフォールバックで返る（0章ガード）
  4. AI 呼び出しが例外を投げる → 全章がフォールバックで返る
  5. purpose="user-guide" → プロンプトに除外ルールが含まれる

## 設計判断

- e2e テストは既存パターン（`createTmpDir` + `execFileSync`）に従う
- ユニットテストは `aiFilterChapters` を init.js から export して直接テスト
- `aiFilterChapters` のテストでは `callAgent` を mock.fn で差し替え

## 確認事項

- [x] User approved this draft
- Confirmed at:
- Notes:
