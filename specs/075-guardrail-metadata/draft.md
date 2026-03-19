# Draft: Guardrail Metadata (I3)

## 決定事項

### メタデータ構文
```markdown
### Article Title
<!-- {%meta: {phase: [spec, impl, lint], scope: [*.css, *Controller.php], lint: /pattern/flags}%} -->
Article body text.
```
- `<!-- {%meta: {...}%} -->` 形式（Twig の制御構文 `{% %}` を参考）
- `<!-- {{...}} -->` は処理・出力、`<!-- {%...%} -->` は宣言・設定という区分

### メタデータフィールド（3つ）
| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| phase | 配列 | [spec] | 適用フェーズ: spec, impl, lint |
| scope | 配列 | なし（全対象） | glob パターンで対象ファイルを絞る |
| lint | 正規表現 | なし | 機械チェック用パターン（JS 正規表現構文） |

### phase の動作
- `spec`: gate の AI チェックで使用（既存）
- `impl`: system prompt に渡して実装時の制約とする（I1 scope、今回はパース + 抽出のみ）
- `lint`: `sdd-forge spec lint` コマンドで機械チェック

### severity は不要
- チェックは PASS/FAIL の2値。WARN のみの動作は導線がないため不採用。
- チェック対象外にしたければ phase から外す。免除は既存 Exemption 機構。

### 新コマンド: `sdd-forge spec lint`
- `--base <branch>`: diff のベースブランチ（必須）
- `--spec <path>`: spec.md のパス（scope フィルタ用、省略可）
- git diff で base branch との変更ファイル一覧を取得
- 変更ファイルの **全内容** に lint パターンを適用（差分行だけではない）
- `phase: [lint]` かつ `lint: /pattern/` がある記事のみ対象
- scope がある場合、変更ファイルを glob でフィルタ
- lint パターンがあるのに phase に lint がない記事は警告を出す

### lint パターンと phase の関係
- lint パターンがあっても phase: [lint] が明示されていなければ lint コマンドでスキップ
- ただし「lint パターンがあるのに phase: [lint] 未指定」の警告を出す

### 既存コード変更
- `parseGuardrailArticles()` を拡張: メタデータ行をパースして articles に含める
- `checkGuardrail()`: phase: [spec] の記事のみ AI に渡す（既存動作の改善）
- scope フィルタ: 既存の glob 実装を流用
- 正規表現: JS の `new RegExp()` をそのまま使用（`/pattern/flags` 構文）

### glob 実装
- 既存コードベースの glob 実装を流用（外部依存なし）

### デフォルト動作
- メタデータなしの記事 → `phase: [spec]`, scope なし, lint なし（既存動作と同じ）

## Open Questions
- なし

## Confirmation
- [x] User approved this draft (2026-03-19)
