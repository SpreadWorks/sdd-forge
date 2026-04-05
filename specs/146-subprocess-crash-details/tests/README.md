# Tests for spec 146-subprocess-crash-details

## What was tested

- `runCmd` / `runCmdAsync` の返り値に `signal` / `killed` フィールドが含まれること
- `formatError(res)` が各パターン（signal あり/なし、killed あり/なし、stderr あり/なし）で正しい文字列を返すこと
- タイムアウトで kill されたプロセスの signal/killed が正しく取得できること

## Test location

テストは公開 API のインターフェース契約テストのため `tests/unit/lib/process.test.js` に配置:
- `tests/unit/lib/process.test.js` — 既存テストに signal/killed/formatError のケースを追加

## How to run

```bash
node --test tests/unit/lib/process.test.js
```

## Expected results

- 全テストが PASS すること
- 実装前は `formatError` が未 export のため import エラーで FAIL する
