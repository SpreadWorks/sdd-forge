<!-- SDD:START — managed by sdd-forge. Do not edit manually. -->
## SDD (Spec-Driven Development)

本プロジェクトは sdd-forge による Spec-Driven Development を採用している。

### docs/ について

`docs/` はプロジェクトの設計・構造・ビジネスロジックを体系的にまとめた知識ベースである。
実装・修正時は docs を読んでプロジェクトの全体像を理解した上で作業すること。

**docs とソースコードに矛盾がある場合はソースコードを正とする。**

docs の内容は以下の 3 種類で構成される:

| 種類 | 生成元 | 説明 |
|---|---|---|
| 解析データ | `@data` ディレクティブ | ソースコードから自動抽出された構造情報 |
| AI 生成テキスト | `@text` ディレクティブ | AI がソースと文脈から生成した説明文 |
| 手動記述 | `MANUAL` ブロック | 人間が記述した運用手順・業務背景・外部仕様 |

#### 鮮度チェック

作業開始前に docs/ 内のファイルとソースコードの更新日時を比較すること。
ソースコードの方が新しい場合、docs の情報が古い可能性がある。
必要に応じて `sdd-forge build` の実行をユーザーに提案すること。

### SDD フロー

機能追加・修正の指示を受けた場合、`/sdd-flow-start` スキルを実行すること。
スキルが利用できない環境では、以下を必ずこの順で実行すること。

1. `sdd-forge spec --title "<機能名>"` で spec を作成（既存 spec がある場合はそれを使用）
2. 仕様要約を提示し、ユーザーに「この仕様で実装して問題ないか」確認する
3. 承認後、`spec.md` の `## User Confirmation` を更新（`- [x] User approved this spec`）
4. `sdd-forge gate --spec specs/NNN-xxx/spec.md` でゲートチェック
5. gate が FAIL の場合、未解決事項を一問一答で解消する（この時点では実装禁止）
6. 実装
7. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`
8. `sdd-forge review`

**失敗時ポリシー:**
- gate が PASS するまで実装・編集を開始しない
- review が PASS するまで完了扱いにしない
- ユーザー確認が未承認のまま実装してはならない

### 終了処理

実装完了後は `/sdd-flow-close` スキルを実行すること。
スキルが利用できない環境では、以下を手動で実行すること。

1. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`（docs 更新）
2. `sdd-forge review`（品質チェック — PASS するまで繰り返す）
3. feature ブランチでコミット
4. base ブランチにマージ
5. `.sdd-forge/current-spec` を削除

### sdd-forge コマンド

| コマンド | 説明 |
|---|---|
| `sdd-forge help` | コマンド一覧表示 |
| `sdd-forge setup` | プロジェクト登録 + 設定生成 |
| `sdd-forge build` | ドキュメント一括生成（scan → init → data → text → readme） |
| `sdd-forge scan` | ソースコード解析 → analysis.json |
| `sdd-forge init` | テンプレートから docs/ を初期化 |
| `sdd-forge data` | @data ディレクティブを解析データで解決 |
| `sdd-forge text --agent <name>` | @text ディレクティブを AI で解決 |
| `sdd-forge readme` | README.md 自動生成 |
| `sdd-forge forge --prompt "<内容>"` | docs 反復改善 |
| `sdd-forge review` | docs 品質チェック |
| `sdd-forge changelog` | specs/ から change_log.md を生成 |
| `sdd-forge agents` | AGENTS.md の PROJECT セクションを更新 |
| `sdd-forge spec --title "<名前>"` | spec 初期化（feature ブランチ + spec.md） |
| `sdd-forge gate --spec <path>` | spec ゲートチェック |
| `sdd-forge flow --request "<要望>"` | SDD フロー自動実行 |

### docs/ 編集ルール

- docs/ の内容は原則としてソースコード解析から自動生成される
- 手動で情報を追加する場合は `<!-- MANUAL:START -->` 〜 `<!-- MANUAL:END -->` 内に記載すること
- MANUAL ブロック外は `sdd-forge init` / `sdd-forge forge` 実行時に上書きされる可能性がある
- docs/ のファイルは `NN_name.md` の連番で管理する
- 実装・修正後は SDD フローに従って forge → review を実行すること
<!-- SDD:END -->
