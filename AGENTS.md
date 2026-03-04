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

1. ブランチ戦略を決定する（**spec 作成前に必ずユーザーに確認すること**）
   - worktree 内の場合は自動で `--no-branch` を付与（確認不要）
   - それ以外では以下の選択肢を提示すること:
     - **Branch**（デフォルト）: 現在のブランチから feature ブランチを作成 → `sdd-forge spec --title "..."`
     - **Worktree**: git worktree で隔離環境を作成 → `sdd-forge spec --title "..." --worktree <path>`
     - **Spec only**: ブランチを作成せず spec のみ → `sdd-forge spec --title "..." --no-branch`
2. `sdd-forge spec --title "<機能名>"` で spec を作成（既存 spec がある場合はそれを使用）
3. 仕様要約を提示し、ユーザーに「この仕様で実装して問題ないか」確認する
4. 承認後、`spec.md` の `## User Confirmation` を更新（`- [x] User approved this spec`）
5. `sdd-forge gate --spec specs/NNN-xxx/spec.md` でゲートチェック
6. gate が FAIL の場合、未解決事項を一問一答で解消する（この時点では実装禁止）
7. 実装
8. `sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md`
9. `sdd-forge review`

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

<!-- PROJECT:START — managed by sdd-forge. Do not edit manually. -->
## Project Context

- generated_at: 2026-03-03 01:33:42 UTC

### Technology Stack

- type: cli/node-cli
- Node.js: >=18.0.0

### Available Commands

| command | script |
| --- | --- |
| `npm run test` | find tests -name '*.test.js' \| xargs node --test |

<!-- PROJECT:END -->


## Project Guidelines

### Commits
- Write all commit messages in English.
- Do NOT append sign-off lines or co-authored-by trailers to commit messages.

### Code style
- Do NOT add excessive fallback or defensive code. Trust internal interfaces and only validate at system boundaries (user input, external APIs). If a function is always called with valid arguments, do not add redundant null checks or try-catch blocks "just in case."

### npm Publishing
- **リリース（`npm publish` / `npm dist-tag`）はユーザーが明示的に指示した場合のみ実行すること。自己判断でリリースしてはならない。**
- Pre-release は `npm publish --tag alpha` で公開する
- `--tag alpha` で公開すると `latest` タグは更新されない。npmjs.com のパッケージページは `latest` タグのバージョンを表示するため、ページを更新したい場合は `npm dist-tag add sdd-forge@<version> latest` を実行する
- npm は一度公開したバージョン番号の再利用を許可しない
- npm レジストリには publish のレート制限がある。短時間に連続で publish するとブロックされるため、不必要な publish を避けること
- 公開前に `npm pack --dry-run` で含まれるファイルを確認し、機密情報・固有情報がないことをチェックする
