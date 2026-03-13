# Draft: Guardrail Gate Check

## 合意事項

### テンプレート条項（base, EARS ベース, 可読性重視）

1. **Single Responsibility** — 1つの spec は1つの関心事を扱う
2. **Unambiguous Requirements** — 要件は曖昧な形容詞を避け、検証可能な条件で記述する
3. **Complete Context** — トリガー条件（When/If）と期待される振る舞い（shall）が対になっていること

### gate AI コンプライアンスチェック

- guardrail.md 存在 & agent 設定時に実行
- spec 本文 + guardrail 条項を AI に渡す
- 条項ごとに pass/fail + 理由（1行）
- 1つでも fail → gate FAIL
- agent 未設定時は警告のみ（静的チェックは実行）
- `--skip-guardrail` でスキップ可能

### 評価方法

- 正常 spec（3条項準拠）→ pass 確認
- 違反 spec（各条項に1つ違反、計3パターン）→ fail 確認
- テスト用 spec は `specs/046-guardrail-gate-check/` 内に配置
- 手動評価

- [x] User approved this draft (2026-03-13)
