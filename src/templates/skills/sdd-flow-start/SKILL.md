---
name: sdd-flow-start
description: Run the SDD workflow for any feature or fix request. Use for spec creation, gate check, implementation, and finalization.
---

# SDD Flow Start

Run this workflow for any feature or fix request.

## Core Principle

**SDD フロー中のすべてのステップで、次の行動について必ずユーザーに確認する。**
AI が勝手に次のステップに進まない。

## Required Sequence

1. Choose approach.
   - Present EXACTLY these 2 options:

     | # | Label | Description |
     |---|---|---|
     | 1 | 要件を整理してから仕様書を作成する | 対話で方針を詰めてから spec を作成します |
     | 2 | 仕様書を作成する | 要件が明確な場合。従来通り spec から開始します |

   - If **1** → go to step 2 (draft phase).
   - If **2** → skip to step 3 (spec creation).

2. Draft phase (requirements definition).
   - Create `specs/NNN-xxx/draft.md` to record discussions.
   - AI presents choices/proposals → user selects with short answers.
   - Ask ONE question at a time (do not batch questions, do not self-answer).
   - If a question leads to digression:
     1. Try to resolve in ONE exchange.
     2. If unresolved, record in Open Questions and move on.
     3. Open Questions are resolved during spec creation or implementation.
   - When requirements are sufficiently defined, ask the user for approval.
   - Update draft.md with `- [x] User approved this draft` and confirmation date.
   - Transfer Q&A and decisions to spec (step 3).
   - Keep `draft.md` in `specs/` (do not delete).

3. Create or select spec.
   - If no spec exists, run `sdd-forge spec --title "<short-title>"` (with appropriate flags — see step 4).
   - If draft phase was completed, reflect draft Q&A and decisions in spec.md.
   - Use the resulting `specs/NNN-xxx/spec.md`.
   - The spec path is saved to `.sdd-forge/current-spec`.

4. Choose branching strategy.
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree): Present EXACTLY these 3 options:

     | # | Label | Description | Command |
     |---|---|---|---|
     | 1 | Branch（デフォルト） | `<current-branch>` から feature ブランチを作成して作業する | `sdd-forge spec --title "..." --base <current-branch>` |
     | 2 | Worktree | git worktree を作成して隔離環境で作業する（`.sdd-forge/worktree/` 配下に自動配置） | `sdd-forge spec --title "..." --base <current-branch> --worktree` |
     | 3 | Spec only | ブランチを作成せず spec ファイルのみ作成する | `sdd-forge spec --title "..." --no-branch` |

   - Ask the user: "現在のブランチ (`<current-branch>`) から分岐してよいですか？" (skip for spec-only mode)
     - If yes → use `--base <current-branch>`.
     - If no → ask which branch to use as base and use `--base <user-specified-branch>`.
   - The base branch is automatically recorded in `.sdd-forge/current-spec` by `sdd-forge spec`.

5. Draft spec before coding.
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - Include "why this approach" rationale (especially if draft phase was done).
   - Keep Open Questions only when clarification is still needed.

6. Get explicit user approval.
   - Summarize the spec and ask the user for confirmation.
   - Wait for approval before any implementation.
   - Present EXACTLY these options:

     | # | Label | Description |
     |---|---|---|
     | 1 | 実装する | 手順 7 へ進む |
     | 2 | 仕様書を修正する | フィードバックを受け取り spec.md を修正 → 再度手順 6 へ |
     | 3 | その他 | 自由入力を受け付ける |

   - Update `## User Confirmation` with:
     - `- [x] User approved this spec`
     - Confirmation date and short note.

7. Run gate.
   - `sdd-forge gate --spec specs/NNN-xxx/spec.md`
   - If FAIL, resolve issues one by one via Q&A with the user.
   - If you cannot resolve an issue yourself, ask the user directly.
   - Do not proceed until PASS.

8. Test phase (after gate PASS).
   - **Auto-detect test environment** from analysis.json:
     - Check `extras.packageDeps.devDependencies` for test frameworks (jest, mocha, vitest, phpunit, etc.)
     - Check `extras.packageScripts.test` for test command
     - Use `detectTestEnvironment()` from `src/docs/lib/test-env-detection.js`
   - **If test environment exists**:
     1. Ask user for test type:

        | # | Label |
        |---|---|
        | 1 | ユニットテスト |
        | 2 | E2Eテスト |
        | 3 | 両方 |
        | 4 | 任せる |

     2. Present test observations (medium granularity — what to verify, not how):
        ```
        以下のテストを実施します:
        1. <observation 1>
        2. <observation 2>
        3. <observation 3>

        よろしいですか？
        ```
     3. Wait for user approval. If user requests changes, iterate until approved.
     4. Write test code (tests should fail initially).
     5. Proceed to implementation (step 9).
   - **If no test environment**:
     - AI performs spec-implementation alignment check after coding.
     - Compare spec Requirements against actual code changes.
   - **If test environment needs to be set up**:
     - Treat as a separate spec (out of scope for current feature spec).

9. Implement changes.
   - Code only after gate PASS and test phase completion.
   - Aim to make tests pass.

10. Ask user about finalization.
    - Ask: "実装内容に問題がなければ終了処理を行いますか？"
    - If approved, run `/sdd-flow-close`.
    - If the user wants changes, continue implementation.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not finalize without asking the user.
- Do not skip test observation review when test environment exists.
- Do not proceed to next step without user confirmation.

## Clarification Rule

When requirements are ambiguous, ask concise Q&A before step 7.
Record clarifications in `spec.md` under `## Clarifications (Q&A)` and `## Open Questions`.

## Test Maintenance

- If new tests break existing tests, inform the user and ask how to proceed.
- Do not modify or delete existing tests without user approval.
- If past tests become irrelevant due to feature changes, flag them to the user.

## Commands

```bash
sdd-forge spec --title "<short-title>" --base <branch>
sdd-forge spec --title "<short-title>" --no-branch
sdd-forge spec --title "<short-title>" --base <branch> --worktree
sdd-forge gate --spec specs/NNN-xxx/spec.md
sdd-forge snapshot check
```
