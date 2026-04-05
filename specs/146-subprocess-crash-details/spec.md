# Feature Specification: 146-subprocess-crash-details

**Feature Branch**: `feature/146-subprocess-crash-details`
**Created**: 2026-04-04
**Status**: Draft
**Input**: GitHub Issue #95
**Goal:** サブプロセスがシグナルで kill された場合（OOM、タイムアウト等）に原因を特定できるよう、`runCmd` / `runCmdAsync` の返り値にクラッシュ詳細を追加し、エラーメッセージを統一的に改善する。
**Development type:** Enhancement

## Goal

Issue #83 で spec review サブプロセスが OOM で kill されたが、エラーメッセージには stderr のみが含まれ、クラッシュの根本原因（シグナル名、killed フラグ）が失われていた。本 spec では `runCmd` / `runCmdAsync` の返り値に `signal` / `killed` を追加し、全てのサブプロセス失敗時に原因を特定可能にする。

## Scope

### In Scope
1. `runCmd`（`src/lib/process.js`）の返り値に `signal` / `killed` フィールドを追加
2. `runCmdAsync`（`src/lib/process.js`）の返り値に `signal` / `killed` フィールドを追加
3. `formatError(res)` ヘルパー関数を `src/lib/process.js` に追加
4. `runCmd` / `runCmdAsync` の `ok === false` 時にエラーメッセージを出す全箇所で `formatError` を使用
5. `runCmdWithRetry`（`src/flow/lib/run-review.js`）のシグナル判定を `res.signal || res.killed` に置き換え

### Out of Scope
- `callAgent`（同期版、`src/lib/agent.js`）のエラーハンドリング改善
- `callAgentAsync` の変更（`spawn` で起動し `close` イベントで signal を取得しているため、既にシグナル情報をエラーに含めている）
- issue-log のスキーマ変更

## Out of Scope

- `callAgent`（同期版）の改善は別 spec で対応
- issue-log データ構造の変更は不要（エラーメッセージ改善で自然に反映される）

## Clarifications (Q&A)

- Q: `callAgent`（同期版）も対象に含めるか？
  - A: 含めない。今回は `runCmd` / `runCmdAsync` のみ。`callAgent` は `runCmd` を使用せず `execFileSync` を直接呼び出しているため、`runCmd` の返り値構造変更の影響を受けない。
- Q: `formatError` の出力スタイルは？
  - A: パイプ区切り。`callAgentAsync` と同じスタイルに統一する。
- Q: `formatError` を適用する範囲は？
  - A: `runCmd` / `runCmdAsync` で `ok === false` の結果に対し、`throw new Error(...)` や `process.stderr.write(...)` でエラーメッセージ文字列を組み立てている箇所。`return null`、`return []`、`return ""` 等のサイレント失敗パターン（エラーメッセージを生成せずに早期リターンする箇所）は対象外。ログ/メタデータに記録するがユーザーに直接表示しないエラーメッセージ構築パス（例: `run-finalize.js` の `commitNote`、`get-check.js` の `checks[].message`）も `formatError` の適用対象とする。これらはエラーメッセージ文字列を構築しているため、統一フォーマットの恩恵を受ける。
- Q: `formatError` と呼び出し元のコンテキスト文字列の組み合わせ方は？
  - A: 呼び出し元がコンテキスト文字列（例: `"docs build failed"`、`"git diff failed"`）を付加する場合、`formatError` の結果と結合する。推奨形式: `throw new Error("docs build failed: " + formatError(buildRes))`。コンテキスト文字列は呼び出し元の責務であり、`formatError` は `res` の内容（signal / exit code / stderr）のフォーマットのみを担当する。
- Q: `formatError` と呼び出し元のフォールバックメッセージの関係は？
  - A: `formatError` は stderr が空の場合にそのパートを省略するため、最低限 `exit=N` は常に含まれる。したがって、呼び出し元の `|| "git push failed"` のようなフォールバックメッセージは不要になる。移行後は `throw new Error(formatError(pushRes))` または `throw new Error("git push failed: " + formatError(pushRes))` の形式を使用する。
- Q: issue-log への対応は？
  - A: スコープ外。`formatError` で改善されたメッセージが `--reason` に自然に含まれる。
- Q: `formatError` は `res.stderr` の生の値を変更するか？
  - A: しない。`formatError` は新しいエラーメッセージ文字列を構築する際にのみ使用する。`res.stderr` フィールド自体は変更しない。これにより、`runCmdWithRetry` 等で `res.stderr` をパイプ区切りフォーマット（`verdict=`, `gaps=` 等）としてパースしている箇所に影響を与えない。

## Alternatives Considered

- 呼び出し元それぞれが `res.signal` / `res.killed` を個別にチェックする方法 → フォーマットがバラバラになるため却下。`formatError` ヘルパーで統一する。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-04-04
- Notes: Gate PASS + spec review applied 10 fixes. User approved.

## Requirements

1. **P1**: `runCmd` の返り値に `signal`（`string | null`）と `killed`（`boolean`）フィールドを追加する。成功時は `signal: null, killed: false`。失敗時は `execFileSync` の例外オブジェクトから取得する。
2. **P1**: `runCmdAsync` の返り値に `signal`（`string | null`）と `killed`（`boolean`）フィールドを追加する。成功時は `signal: null, killed: false`。失敗時はコールバックの `err` オブジェクトから取得する。`status` フィールドは常に数値を返すよう型を正規化する。`err.code` が文字列（`"ENOENT"`、`"ERR_CHILD_PROCESS_STDIO_MAXBUFFER"` 等）の場合は `1` にフォールバックする。`err.killed` が `true` のとき `err.code` が `null` になる（Node.js の仕様）ケースも `1` にフォールバックする。
3. **P1**: `formatError(res)` 関数を `src/lib/process.js` に export する。入力は `runCmd` / `runCmdAsync` の返り値オブジェクト。出力はパイプ区切りの文字列。
   - signal がある場合: `signal=SIGKILL (killed) | exit=137 | stderr内容` または `signal=SIGTERM | stderr内容`
   - signal がない場合: `exit=1 | stderr内容`
   - stderr が空の場合はそのパートを省略する
   - `formatError` は `res` の内容（signal / exit code / stderr）のフォーマットのみを担当する。コンテキスト文字列（例: `"docs build failed"`）の付加は呼び出し元の責務。推奨結合パターン: `throw new Error("docs build failed: " + formatError(res))`
   - `formatError` は最低限 `exit=N` または `signal=...` を常に含むため、呼び出し元の `|| "fallback message"` フォールバックは不要になる。移行後はフォールバックを削除し、必要なら `"context: " + formatError(res)` 形式に統一する。
4. **P2**: `runCmd` / `runCmdAsync` で `ok === false` のエラーメッセージを構築する全箇所で `formatError(res)` を使用する。対象は `throw new Error(...)` や `process.stderr.write(...)` でエラーメッセージ文字列を組み立てている箇所に限定する。ログ/メタデータにエラーメッセージを記録する箇所（例: `commitNote`、`checks[].message`）も対象に含める。`return null`、`return []`、`return ""` 等のサイレント失敗パターン（エラーメッセージを生成せず早期リターンする箇所）は対象外。
5. **P2**: `runCmdWithRetry`（`src/flow/lib/run-review.js`）の signal 検出ロジックを、stderr の正規表現パース（`/killed|signal/i.test(stderr)`）から `res.signal || res.killed` フィールド参照に置き換える。`runCmdWithRetry` の JSDoc / 返り値型定義を `signal`（`string | null`）・`killed`（`boolean`）を含む形に更新する。

## Acceptance Criteria

1. `runCmd` がシグナルで kill されたプロセスを実行した場合、返り値に `signal` と `killed` が含まれる
2. `runCmdAsync` がシグナルで kill されたプロセスを実行した場合、返り値に `signal` と `killed` が含まれる
3. `runCmd` が正常終了した場合、`signal: null, killed: false` が返る
4. `formatError` がシグナル情報を含む場合、パイプ区切りでシグナル名・終了コード・stderr を結合した文字列を返す
5. `formatError` がシグナル情報を含まない場合、終了コードと stderr のみの文字列を返す
6. 既存の `runCmd` / `runCmdAsync` 呼び出し元のエラーメッセージに `formatError` が使用されている
7. `runCmdWithRetry` のシグナル検出が `res.signal || res.killed` を使用している
8. `runCmdAsync` の `status` フィールドが常に数値型で返される（文字列 code やnull のケースでフォールバックが機能する）
9. 既存テストが全て PASS する

## Codebase Context

影響を受ける主要ファイル:

- `src/lib/process.js` — `runCmd` / `runCmdAsync` の実装。変更の中心。
- `src/flow/lib/run-review.js` — `runCmdWithRetry` のシグナル検出ロジック。`parseTestReviewOutput` / `parseSpecReviewOutput` は `res.stderr` をパイプ区切りフォーマットとしてパースしているため、`formatError` は `res.stderr` の生の値には適用しない（新規エラーメッセージ構築時のみ使用）。`RunReviewCommand.execute` の汎用エラーパス（`phase` が test/spec 以外の場合の `throw new Error(["review command failed", ...].join("\n"))`）は `formatError` の適用対象。
- `src/lib/cli.js` — `runCmd` 呼び出し元。エラーメッセージ構築箇所あり。
- `src/lib/git-helpers.js` — `runCmd` 呼び出し元。サイレント失敗パターンあり。
- `src/flow/lib/run-impl-confirm.js` — `runCmd` 呼び出し元。`getChangedFiles` は `!res.ok` で `return []` を返すサイレント失敗パターン。`formatError` の適用対象外。
- `src/flow/lib/get-check.js` — `runCmd` 呼び出し元。`checkDirty` は `!res.ok` で `{ pass: false, checks: [{ message: res.stderr }] }` を返すメタデータ記録パターン。エラーメッセージ文字列を構築しているため `formatError` の適用対象。`checks[].message` を `formatError(res)` に置き換える。
- `src/flow/lib/get-issue.js` — `runCmd` 呼び出し元。`throw new Error(res.stderr || "failed to fetch issue")` でエラーメッセージを構築しており、`formatError` の適用対象。
- `src/lib/flow-state.js` — `runCmd` で git コマンドを実行。返り値構造変更の影響を受ける。
- `src/lib/lint.js` — `runCmd` で git コマンドを実行。`getChangedFiles` は `!res.ok` で `throw new Error(\`git diff failed: ${res.stderr.trim()}\`)` を投げるエラーメッセージ構築パターン。`formatError` の適用対象。移行後: `throw new Error("git diff failed: " + formatError(res))`。
- `src/flow/commands/merge.js` — `runCmd` 呼び出し元。6箇所の `runCmd` 呼び出しで `res.stderr` を使ったエラーメッセージを構築しており、`formatError` の適用対象。一部は `pushRes.stderr || "git push failed"` のようにフォールバック文字列を持つが、`formatError` は最低限 `exit=N` を含むためフォールバックは不要になる。移行後: `throw new Error("git push failed: " + formatError(pushRes))` 形式に統一。`"Merge conflict detected"` のような `res.stderr` を使わないカスタムメッセージのみの箇所は適用対象外。
- `src/flow/commands/review.js` — `runCmd` 呼び出し元。git diff 操作で `res.ok && res.stdout.trim()` のサイレントフォールバックパターンを使用。`formatError` の適用対象外。
- `src/flow/lib/run-gate.js` — `runCmd` 呼び出し元。`throw new Error(\`failed to get git diff: ${diffRes.stderr}\`)` があり、`formatError` の適用対象。
- `src/flow/lib/run-sync.js` — `runCmd` 呼び出し元。build/commit/diff 操作で5箇所の `runCmd` 呼び出しあり。エラーメッセージ構築箇所は `formatError` の適用対象。docs build/review のエラーパスは `["docs build failed", stderr, stdout].join("\n")` のようにコンテキスト文字列を付加する形式であり、移行後は `throw new Error("docs build failed: " + formatError(buildRes))` に統一する。git diff の `diffRes.ok` チェック（失敗時 `changed = []`）はサイレント失敗パターンのため適用対象外。commit の `throw new Error(commitRes.stderr || commitRes.stdout)` は適用対象。
- `src/flow/lib/run-retro.js` — `runCmd` 呼び出し元。`getDiff` / `getDetailedDiff` の2箇所で `return res.ok ? res.stdout.trim() : ""` のサイレント失敗パターンを使用。`formatError` の適用対象外。
- `src/flow/lib/run-prepare-spec.js` — `runCmd` 呼び出し元。`runGit` ラッパー内で `throw new Error(\`git ${args.join(" ")} failed: ${(res.stderr || "").trim()}\`)` としてエラーメッセージを構築しており、`formatError` の適用対象。移行後: `throw new Error(\`git ${args.join(" ")} failed: \` + formatError(res))`。`detectBaseBranch` の `catch` でのサイレントフォールバック（`return "main"`）は適用対象外。
- `src/flow/lib/run-finalize.js` — `runCmd` 呼び出し元。`commitOrSkip` の `throw new Error(output || "commit failed")`（`res.stderr || res.stdout` からエラーメッセージ構築）および docs build 失敗パスの `throw new Error((buildRes.stderr || buildRes.stdout || "").trim())` は `formatError` の適用対象。`executeCommitPost` 内の retro/report コミット失敗パスでは throw せず `results.report.commitNote` にエラーメッセージ文字列を格納するメタデータ記録パターンであり、`formatError` の適用対象。移行後: `results.report.commitNote = "retro/report commit failed: " + formatError(commitRes)`。fire-and-forget パターン（cleanup 用 `runCmd` 呼び出し）は適用対象外。
- `src/docs/commands/forge.js` — `runCmdAsync` 呼び出し元。Requirement 2 で返り値に `signal` / `killed` フィールドが追加されるため、既存の呼び出しコードが拡張された返り値型と互換性があることを確認する。
- `src/lib/agent.js` — `callAgentAsync` は `spawn` 使用。本 spec の対象外。`callAgent`（同期版）は `runCmd` を使用せず `execFileSync` を直接呼び出しているため、`runCmd` の返り値構造変更（`signal` / `killed` フィールド追加）の影響を受けない。

## Test Strategy

- 既存テストファイル `tests/unit/lib/process.test.js` に以下のテストケースを追加する:
  - `runCmd` / `runCmdAsync` の返り値テスト: 正常終了・エラー終了・シグナル kill のケースを検証
  - `runCmdAsync` の ENOENT（存在しないコマンド）テスト: `signal: null, killed: false` が返ることを検証し、シグナル以外の失敗でのフォールスポジティブを防ぐ
  - `runCmdAsync` の `status` 型正規化テスト: `err.code` が文字列・`null` のケースで `status` が数値 `1` にフォールバックすることを検証
  - `formatError` のユニットテスト: 各パターン（signal あり/なし、killed あり/なし、stderr あり/なし）の出力を検証
- 既存テスト全体の回帰テスト

## Open Questions

- なし
