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
| ユーザー独自情報 | ユーザーからの情報 | ソースコードからで取得出来ない運用情報などをディレクティブ外に記述 |

#### 鮮度チェック

作業開始前に docs/ とソースコードの更新日時を比較すること。
ソースが新しい場合は `sdd-forge build` の実行をユーザーに提案すること。

### SDD フロー

機能追加・修正の指示を受けた場合、`/sdd-flow-start` スキルを実行すること。
スキルが利用できない環境では、以下を必ずこの順で実行すること。

**原則: 各ステップで次の行動を必ずユーザーに確認する。AI が勝手に次のステップに進まない。**

1. 進め方をユーザーに確認
2. ブランチ戦略をユーザーに確認
3. `sdd-forge spec --title "<機能名>"` で spec 作成（既存があればそれを使用）
4. （要件整理を選択した場合）draft フェーズ（→ AI 動作ルール参照）
5. 仕様要約を提示しユーザーに確認
6. 承認後、`spec.md` の `## User Confirmation` を更新
7. `sdd-forge gate --spec specs/NNN-xxx/spec.md`
8. gate FAIL 時は未解決事項を一問一答で解消
9. テストフェーズ（→ AI 動作ルール参照）
10. 実装
11. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`
12. `sdd-forge review`

**ユーザーに提示する選択肢:**

ステップ 1 — 進め方:
1. **要件整理**
2. **仕様書作成**

ステップ 2 — ブランチ戦略:
1. **Branch**
2. **Worktree**
3. **Spec only**

ステップ 5 — 仕様レビュー:
1. **実装する**
2. **仕様書を修正する**
3. **その他**

**AI 動作ルール:**

| ステップ | ルール |
|---|---|
| 2 | worktree 内は自動で `--no-branch`（ユーザー確認不要） |
| 4 | `specs/NNN-xxx/draft.md` に記録。1 問ずつ聞く（まとめない、自答しない）。脱線は 1 往復で解決、未解決は Open Questions へ。承認後に spec へ清書、draft.md は残す |
| 5 (修正) | フィードバック → spec.md 修正 → ステップ 5 に戻る |
| 8 | 一問一答で解消（実装禁止） |
| 9 | analysis.json からテスト環境を自動判定。あり: テスト観点提示 → ユーザー承認 → テストコード生成。なし: AI が spec と実装の照合チェック。構築が必要: 別 spec |

**失敗時ポリシー:**
- gate PASS まで実装禁止
- review PASS まで完了扱い禁止
- ユーザー未承認のまま実装禁止
- テスト観点のユーザーレビュー省略禁止（テスト環境ありの場合）

### 終了処理

実装完了後は `/sdd-flow-close` スキルを実行すること。
スキルが利用できない場合は以下の番号付き選択肢をユーザーに提示:

1. **ドキュメント更新+コミット+マージ+ブランチ削除**
2. **ドキュメント更新**
3. **コミット**
4. **コミット+マージ**
5. **コミット+マージ+ブランチ削除**

選択に応じて以下を実行する:

| 処理 | 対象の選択肢 | 手順 |
|---|---|---|
| docs 更新 | 1, 2 | `sdd-forge forge` → `sdd-forge review`（PASS まで繰り返す） |
| コミット | 1, 3, 4, 5 | `sdd-forge gate --phase post` → feature ブランチでコミット |
| マージ | 1, 4, 5 | base ブランチにマージ（`config.flow.merge`）→ `.sdd-forge/current-spec` 削除 |
| ブランチ削除 | 1, 5 | feature ブランチを削除 |

### sdd-forge コマンド

| コマンド | 説明 |
|---|---|
| `sdd-forge help` | コマンド一覧表示 |
| `sdd-forge setup` | プロジェクト登録 + 設定生成 |
| `sdd-forge build` | ドキュメント一括生成（scan → init → data → text → readme） |
| `sdd-forge scan` | ソースコード解析 → analysis.json |
| `sdd-forge init` | テンプレートから docs/ を初期化 |
| `sdd-forge data` | `{{data}}` ディレクティブを解析データで解決 |
| `sdd-forge text --agent <name>` | `{{text}}` ディレクティブを AI で解決 |
| `sdd-forge readme` | README.md 自動生成 |
| `sdd-forge forge --prompt "<内容>"` | docs 反復改善 |
| `sdd-forge review` | docs 品質チェック |
| `sdd-forge changelog` | specs/ から change_log.md を生成 |
| `sdd-forge agents` | AGENTS.md を更新 |
| `sdd-forge spec --title "<名前>"` | spec 初期化（feature ブランチ + spec.md） |
| `sdd-forge gate --spec <path>` | spec ゲートチェック（`--phase pre/post`） |
| `sdd-forge flow --request "<要望>"` | SDD フロー自動実行 |
| `sdd-forge snapshot <save\|check\|update>` | スナップショットテスト（リグレッション検出） |

### docs/ 編集ルール

- docs/ は原則としてソースコード解析から自動生成される
- `{{data}}` / `{{text}}` ディレクティブの内部は自動生成で上書きされる
- ディレクティブの外に記述した内容は上書きされない
- 章の並び順は `preset.json` の `chapters` 配列で定義される
- 実装・修正後は SDD フローに従い forge → review を実行すること
