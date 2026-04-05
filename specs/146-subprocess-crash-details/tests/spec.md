# Test Design

### Test Design

---

#### P1: `runCmd` — signal / killed フィールド追加

- **TC-1: runCmd 成功時に signal=null, killed=false を返す**
  - Type: unit
  - Input: 正常終了するコマンド（例: `echo hello`）
  - Expected: `{ ok: true, signal: null, killed: false, status: 0, ... }`

- **TC-2: runCmd 非ゼロ終了時に signal=null, killed=false を返す**
  - Type: unit
  - Input: `exit 1` で終了するコマンド
  - Expected: `{ ok: false, signal: null, killed: false, status: 1, ... }`

- **TC-3: runCmd シグナル終了時に signal 文字列と killed を返す**
  - Type: integration
  - Input: シグナルで kill されるコマンド（例: `execFileSync` が `SIGTERM` 例外を投げるケース）
  - Expected: `{ ok: false, signal: "SIGTERM", killed: true, ... }`

- **TC-4: runCmd 例外オブジェクトに signal がない場合は null**
  - Type: unit
  - Input: `execFileSync` が `status: 2, signal: undefined` の例外を投げるケース
  - Expected: `{ signal: null, killed: false, status: 2 }`

---

#### P1: `runCmdAsync` — signal / killed フィールド追加 + status 正規化

- **TC-5: runCmdAsync 成功時に signal=null, killed=false を返す**
  - Type: unit
  - Input: 正常終了するコマンド
  - Expected: `{ ok: true, signal: null, killed: false, status: 0 }`

- **TC-6: runCmdAsync 非ゼロ終了時に signal=null, killed=false, status=数値**
  - Type: unit
  - Input: `exit 2` で終了するコマンド
  - Expected: `{ ok: false, signal: null, killed: false, status: 2 }`

- **TC-7: runCmdAsync err.code が文字列 "ENOENT" の場合 status=1 にフォールバック**
  - Type: unit
  - Input: 存在しないコマンドを実行（`err.code === "ENOENT"`）
  - Expected: `{ ok: false, status: 1, signal: null, killed: false }`

- **TC-8: runCmdAsync err.code が "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" の場合 status=1**
  - Type: unit
  - Input: maxBuffer 超過エラー
  - Expected: `{ ok: false, status: 1 }`

- **TC-9: runCmdAsync err.killed=true かつ err.code=null の場合 status=1**
  - Type: unit
  - Input: タイムアウト等で Node.js がプロセスを kill（`err.killed: true, err.code: null`）
  - Expected: `{ ok: false, status: 1, signal: "SIGTERM", killed: true }`

- **TC-10: runCmdAsync err.killed=true かつ err.signal="SIGKILL" の場合**
  - Type: unit
  - Input: SIGKILL で kill されたプロセス（`err.killed: true, err.signal: "SIGKILL", err.code: null`）
  - Expected: `{ ok: false, status: 1, signal: "SIGKILL", killed: true }`

- **TC-11: runCmdAsync err.code が数値の場合はそのまま status に使用**
  - Type: unit
  - Input: `err.code: 130`（数値）
  - Expected: `{ status: 130 }`

- **TC-12: runCmdAsync シグナル終了（killed=false, signal あり）**
  - Type: unit
  - Input: 外部からシグナル送信（`err.killed: false, err.signal: "SIGTERM"`）
  - Expected: `{ ok: false, killed: false, signal: "SIGTERM" }`

---

#### P1: `formatError` 関数

- **TC-13: signal あり + killed + stderr あり**
  - Type: unit
  - Input: `{ signal: "SIGKILL", killed: true, status: 137, stderr: "oom killed" }`
  - Expected: `"signal=SIGKILL (killed) | exit=137 | oom killed"`

- **TC-14: signal あり + killed=false + stderr あり**
  - Type: unit
  - Input: `{ signal: "SIGTERM", killed: false, status: 143, stderr: "terminated" }`
  - Expected: `"signal=SIGTERM | exit=143 | terminated"`

- **TC-15: signal あり + killed + stderr 空**
  - Type: unit
  - Input: `{ signal: "SIGKILL", killed: true, status: 137, stderr: "" }`
  - Expected: `"signal=SIGKILL (killed) | exit=137"`

- **TC-16: signal なし + stderr あり**
  - Type: unit
  - Input: `{ signal: null, killed: false, status: 1, stderr: "command not found" }`
  - Expected: `"exit=1 | command not found"`

- **TC-17: signal なし + stderr 空**
  - Type: unit
  - Input: `{ signal: null, killed: false, status: 1, stderr: "" }`
  - Expected: `"exit=1"`

- **TC-18: signal なし + status=0（境界: ok=true でも呼べる）**
  - Type: unit
  - Input: `{ signal: null, killed: false, status: 0, stderr: "" }`
  - Expected: `"exit=0"`（呼び出し元の責務だが関数自体はフォーマットのみ）

- **TC-19: stderr に複数行が含まれる場合**
  - Type: unit
  - Input: `{ signal: null, killed: false, status: 1, stderr: "line1\nline2\nline3" }`
  - Expected: stderr 部分がそのまま含まれる `"exit=1 | line1\nline2\nline3"`（トリム方針は実装に委ねるが、パイプ区切り構造が壊れないこと）

- **TC-20: 呼び出し元との結合パターン**
  - Type: unit
  - Input: `"docs build failed: " + formatError({ signal: null, killed: false, status: 1, stderr: "parse error" })`
  - Expected: `"docs build failed: exit=1 | parse error"`

---

#### P2: 既存エラーメッセージ箇所の `formatError` 移行

- **TC-21: throw new Error 箇所が formatError 形式になっている**
  - Type: integration
  - Input: `runCmd` が失敗を返す状況でエラーをキャッチ
  - Expected: エラーメッセージが `"<context>: signal=... | exit=... | ..."` または `"<context>: exit=N | stderr"` 形式

- **TC-22: process.stderr.write 箇所が formatError 形式になっている**
  - Type: integration
  - Input: `runCmd` / `runCmdAsync` 失敗時に stderr 出力を検証
  - Expected: 出力が formatError のパイプ区切り形式を含む

- **TC-23: commitNote 等メタデータ記録箇所が formatError を使用**
  - Type: integration
  - Input: コマンド失敗時のログ/メタデータ記録
  - Expected: 記録されたメッセージが formatError 形式

- **TC-24: サイレント失敗パターン（return null 等）は変更されない**
  - Type: unit
  - Input: エラーメッセージを生成せず `return null` する箇所の失敗ケース
  - Expected: 従来通り `null` を返し、formatError を呼ばない

- **TC-25: フォールバック `|| "fallback"` が削除されている**
  - Type: unit（コードレビュー／静的検証）
  - Input: 移行後のエラーメッセージ構築コード
  - Expected: `formatError` は常に非空文字列を返すため、`|| "..."` フォールバックが不要になり削除されていること

---

#### P2: `runCmdWithRetry` — signal 検出ロジック置換

- **TC-26: signal フィールドでリトライ判定（signal あり → リトライ対象）**
  - Type: unit
  - Input: `runCmdAsync` が `{ ok: false, signal: "SIGKILL", killed: true }` を返す
  - Expected: リトライ対象として判定される（従来の `/killed|signal/i.test(stderr)` と同等の挙動）

- **TC-27: killed=true フィールドでリトライ判定**
  - Type: unit
  - Input: `{ ok: false, signal: null, killed: true }` （killed だが signal 情報なし ― エッジケース）
  - Expected: リトライ対象として判定される

- **TC-28: signal なし + killed=false → リトライ対象外**
  - Type: unit
  - Input: `{ ok: false, signal: null, killed: false, status: 1, stderr: "syntax error" }`
  - Expected: リトライ対象外（通常のエラー）

- **TC-29: stderr に "killed" 文字列を含むが signal/killed フィールドが false → リトライしない**
  - Type: unit
  - Input: `{ ok: false, signal: null, killed: false, stderr: "process was killed by OOM" }`
  - Expected: **リトライ対象外**（旧ロジックでは誤検知していたケースの修正確認）

- **TC-30: runCmdWithRetry の JSDoc / 型定義に signal・killed が含まれる**
  - Type: unit（静的検証）
  - Input: `runCmdWithRetry` の返り値型定義
  - Expected: `signal: string | null` と `killed: boolean` がドキュメントされている

---

#### 横断テスト

- **TC-31: runCmd → formatError のエンドツーエンド**
  - Type: acceptance
  - Input: 実際に存在しないコマンドを `runCmd` で実行し、結果を `formatError` に渡す
  - Expected: `"exit=1 | ..."` 形式の人間可読なエラー文字列が得られる

- **TC-32: runCmdAsync タイムアウト → formatError のエンドツーエンド**
  - Type: acceptance
  - Input: タイムアウトする長時間コマンドを `runCmdAsync` で実行（`timeout` オプション付き）
  - Expected: `signal` が設定され、`formatError` が `"signal=SIGTERM (killed) | exit=1"` 形式を返す

- **TC-33: runCmdWithRetry がシグナル終了後にリトライし最終的に成功**
  - Type: integration
  - Input: 1回目は signal 終了、2回目は成功するモック
  - Expected: リトライが発生し、最終的に `ok: true` の結果を返す

---

### テストバランスまとめ

| Type | 件数 | カバー範囲 |
|------|------|-----------|
| **Unit** | 22 | `formatError` の全分岐、`runCmd`/`runCmdAsync` 返り値構造、status 正規化、リトライ判定 |
| **Integration** | 8 | formatError 移行箇所の実呼び出し、runCmdWithRetry のリトライ動作 |
| **Acceptance** | 3 | 実コマンド実行 → formatError → エラーメッセージの一貫性 |

**重点ポイント**: TC-7〜TC-10（status 正規化の境界条件）と TC-29（旧 regex 誤検知の回帰防止）が最も価値の高いテストケース。
