# Feature Specification: 018-i18n-hardcoded-japanese

**Feature Branch**: `feature/018-i18n-hardcoded-japanese`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User request

## Goal
Move all hardcoded Japanese strings in src/ JS files to locale files (i18n).
After this change, all user-facing text is loaded via `createI18n()` / `t()`.

## Scope

### 1. Help text (--help handlers) — 10 files

All `if (cli.help)` blocks with hardcoded Japanese `console.log()`:

| File | Lines |
|---|---|
| `src/docs/commands/changelog.js` | 120-124 |
| `src/docs/commands/agents.js` | 230-236 |
| `src/docs/commands/review.js` | 29-30 |
| `src/docs/commands/text.js` | 710-715 |
| `src/docs/commands/data.js` | 133-135 |
| `src/docs/commands/forge.js` | 132-146 |
| `src/docs/commands/scan.js` | 33-35 |
| `src/docs/commands/init.js` | 141-147 |
| `src/flow.js` | 100-108 |
| `src/specs/commands/init.js` | 172-177 |

### 2. Markdown content in changelog.js

Hardcoded Japanese section headers and descriptions (lines 197-216):
- `"## 説明"`, `"## 内容"`, `"### 更新日時"`, `"### シリーズ最新インデックス"`, `"### 全spec一覧"` etc.

### 3. Spec template strings

| File | Line | String |
|---|---|---|
| `src/specs/commands/init.js` | 95 | `"この仕様で実装して問題ないですか？"` |
| `src/specs/commands/gate.js` | 53 | Regex containing `この仕様で実装して問題ない` |

### 4. Preamble pattern in setup.js

| File | Line | String |
|---|---|---|
| `src/docs/commands/setup.js` | 586 | `"^(Here is|以下に|Based on)"` — `以下に` is Japanese |

## Out of Scope
- JSDoc comments (not user-facing)
- Code comments
- Template files (handled in 017-multilang-output)
- `src/help.js` (already i18n-ized via ui.json)
- locale file content changes beyond adding new keys

## Clarifications (Q&A)
- Q: Where should help text keys go?
  - A: `src/locale/{ja,en}/ui.json` under a `help.<command>` namespace
- Q: Where should changelog markdown content keys go?
  - A: `src/locale/{ja,en}/messages.json` under `changelog.*`
- Q: How to handle the gate.js approval regex?
  - A: Load the approval pattern from locale file so it works for both languages

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-06
- Notes:

## Requirements

1. All hardcoded Japanese strings listed in Scope must be moved to locale files
2. Both `ja` and `en` locale entries must be provided
3. Help text must respect `uiLang` setting from config.json
4. Existing i18n pattern (`createI18n()` / `t()`) must be used — no new i18n mechanism
5. No behavioral changes — output content is the same, just loaded from locale files

## Acceptance Criteria

- [ ] No hardcoded Japanese strings remain in src/*.js (excluding comments)
- [ ] `uiLang: "en"` produces English help text for all commands
- [ ] `uiLang: "ja"` produces Japanese help text for all commands
- [ ] gate.js approval check works for both ja and en spec templates
- [ ] changelog.js section headers respect output language
- [ ] All existing tests pass

## Open Questions
- None
